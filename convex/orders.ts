import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import {
  applyShipmentUpdate,
  buildStoreGroups,
  getShipmentView,
} from "./shipments";

// ── Queries ──────────────────────────────────────────────

/** Get all orders for the currently authenticated user */
export const getUserOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Fetch and sort by createdAt descending
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const sorted = orders.sort((a, b) => b.createdAt - a.createdAt);
    return await Promise.all(
      sorted.map(async (order) => ({
        ...order,
        groups: await buildStoreGroups(ctx, order),
      }))
    );
  },
});

/** Get details of a guest order if ID and email match */
export const getGuestOrder = query({
  args: {
    orderId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const parsedId = ctx.db.normalizeId("orders", args.orderId);
    if (!parsedId) return null;

    const order = await ctx.db.get(parsedId);
    if (!order) return null;
    if (!order.email || order.email.toLowerCase() !== args.email.toLowerCase()) {
      return null;
    }

    if (order.checkoutId) {
      // Find all sibling orders placed together in this checkout
      const linkedOrders = await ctx.db
        .query("orders")
        .withIndex("by_checkoutId", (q) => q.eq("checkoutId", order.checkoutId!))
        .collect();

      const allGroups = (
        await Promise.all(linkedOrders.map((o) => buildStoreGroups(ctx, o)))
      ).flat();

      return {
        ...order,
        totalAmount: order.totalCheckoutAmount ?? order.totalAmount,
        groups: allGroups,
      };
    }

    return { ...order, groups: await buildStoreGroups(ctx, order) };
  },
});

// ── Internal Queries ──────────────────────────────────────

/** Internal query to fetch an order by ID (needed by actions) */
export const getOrderByIdInternal = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

/** Internal query to fetch all orders for a given checkoutId */
export const getOrdersByCheckoutIdInternal = internalQuery({
  args: { checkoutId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_checkoutId", (q) => q.eq("checkoutId", args.checkoutId))
      .collect();
  },
});

// ── Mutations ─────────────────────────────────────────────

/**
 * Creates independent store orders grouped by storeId linked by a shared checkoutId.
 * This guarantees zero OCC lock contention, clean vendor isolation, and 1-to-1 logistics tracking.
 */
export const createCheckoutOrders = mutation({
  args: {
    email: v.optional(v.string()),
    items: v.array(
      v.object({
        productId: v.id("products"),
        storeId: v.optional(v.id("stores")),
        title: v.string(),
        price: v.number(),
        quantity: v.number(),
        color: v.optional(v.string()),
        image: v.string(),
      })
    ),
    address: v.object({
      fullName: v.string(),
      phone: v.string(),
      streetAddress: v.string(),
      apartment: v.optional(v.string()),
      city: v.string(),
      lga: v.optional(v.string()),
      stateName: v.string(),
      postalCode: v.string(),
      country: v.string(),
      pickupStationName: v.optional(v.string()),
      pickupStationAddress: v.optional(v.string()),
      pickupStationId: v.optional(v.number()),
    }),
    shippingMethod: v.string(),
    shippingFee: v.number(),
    totalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let orderEmail = args.email;

    if (userId) {
      const user = await ctx.db.get(userId);
      if (user && !orderEmail) {
        orderEmail = user.email;
      }
    } else {
      if (!orderEmail) {
        throw new Error("Email is required for guest checkout.");
      }
    }

    const now = Date.now();

    // 1. Look up and attach storeId for each product if missing
    const itemsWithStoreId = await Promise.all(
      args.items.map(async (item) => {
        if (item.storeId) return item;
        const product = await ctx.db.get(item.productId);
        return {
          ...item,
          storeId: product?.storeId,
        };
      })
    );

    // 2. Group items by storeId (undefined storeId represents Beembai official store)
    const storeMap = new Map<string, typeof itemsWithStoreId>();
    for (const item of itemsWithStoreId) {
      const key = item.storeId ? String(item.storeId) : "__beembai_official__";
      const existing = storeMap.get(key) || [];
      existing.push(item);
      storeMap.set(key, existing);
    }

    // 3. Generate a shared unique checkoutId
    const checkoutId = `chk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    // 4. Calculate total items subtotal to proportionally distribute shipping fee
    const grandSubtotal = itemsWithStoreId.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const storeEntries = Array.from(storeMap.entries());
    let allocatedShippingSum = 0;
    const orderIds: string[] = [];

    for (let i = 0; i < storeEntries.length; i++) {
      const [key, groupItems] = storeEntries[i];
      const isLast = i === storeEntries.length - 1;
      const groupStoreId = key === "__beembai_official__" ? undefined : (groupItems[0].storeId as any);

      const storeSubtotal = groupItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Proportionate shipping fee allocation (last group absorbs any rounding discrepancy)
      let storeShippingFee = 0;
      if (storeEntries.length === 1) {
        storeShippingFee = args.shippingFee;
      } else if (isLast) {
        storeShippingFee = Math.max(0, args.shippingFee - allocatedShippingSum);
      } else {
        const ratio = grandSubtotal > 0 ? storeSubtotal / grandSubtotal : 1 / storeEntries.length;
        storeShippingFee = Math.round(args.shippingFee * ratio);
        allocatedShippingSum += storeShippingFee;
      }

      const storeTotalAmount = storeSubtotal + storeShippingFee;

      // Check if this store package contains import products
      const isImportOrder = (
        await Promise.all(
          groupItems.map(async (item) => {
            const prod = await ctx.db.get(item.productId);
            return prod?.tag === "import";
          })
        )
      ).some(Boolean);

      const orderId = await ctx.db.insert("orders", {
        checkoutId,
        storeId: groupStoreId,
        userId: userId || undefined,
        email: orderEmail,
        items: groupItems,
        address: args.address,
        shippingMethod: args.shippingMethod,
        subtotal: storeSubtotal,
        shippingFee: storeShippingFee,
        totalAmount: storeTotalAmount,
        totalCheckoutAmount: args.totalAmount,
        paymentStatus: "unpaid",
        status: "placed",
        isImportOrder: isImportOrder || undefined,
        statusHistory: [
          {
            status: "placed",
            timestamp: now,
            message: isImportOrder
              ? "Import order placed. Beembai will source, inspect, and ship your item. Awaiting payment."
              : "Order placed. Awaiting secure payment verification.",
          },
        ],
        createdAt: now,
      });

      orderIds.push(orderId);
    }

    return {
      checkoutId,
      totalAmount: args.totalAmount,
      orderIds,
    };
  },
});

/** Create a new unpaid checkout order (legacy compatible wrapper) */
export const createUnpaidOrder = mutation({
  args: {
    email: v.optional(v.string()),
    items: v.array(
      v.object({
        productId: v.id("products"),
        storeId: v.optional(v.id("stores")),
        title: v.string(),
        price: v.number(),
        quantity: v.number(),
        color: v.optional(v.string()),
        image: v.string(),
      })
    ),
    address: v.object({
      fullName: v.string(),
      phone: v.string(),
      streetAddress: v.string(),
      apartment: v.optional(v.string()),
      city: v.string(),
      lga: v.optional(v.string()),
      stateName: v.string(),
      postalCode: v.string(),
      country: v.string(),
      pickupStationName: v.optional(v.string()),
      pickupStationAddress: v.optional(v.string()),
      pickupStationId: v.optional(v.number()),
    }),
    shippingMethod: v.string(),
    shippingFee: v.number(),
    totalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    // Delegates to multi-store order creation and returns primary orderId
    const res = await (createCheckoutOrders as any)._handler(ctx, args);
    return res.orderIds[0];
  },
});

/** Mark all orders under a checkoutId as paid successfully (internal only, secure) */
export const markCheckoutPaidInternal = internalMutation({
  args: {
    checkoutId: v.string(),
    paystackReference: v.string(),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_checkoutId", (q) => q.eq("checkoutId", args.checkoutId))
      .collect();

    if (orders.length === 0) {
      throw new Error(`No orders found for checkoutId: ${args.checkoutId}`);
    }

    const now = Date.now();
    const shortRef =
      args.paystackReference.length > 15
        ? args.paystackReference.slice(-12).toUpperCase()
        : args.paystackReference.toUpperCase();

    for (const order of orders) {
      await ctx.db.patch(order._id, {
        paymentStatus: "paid",
        paystackReference: args.paystackReference,
        status: "placed", // Retain placed status so the merchant is notified
        statusHistory: [
          ...order.statusHistory,
          {
            status: "paid",
            timestamp: now,
            message: `Payment authorized successfully. Ref: #${shortRef}`,
          },
        ],
      });

      // Credit store wallet balance (held in escrow until delivery)
      if (order.storeId) {
        const creditAmount = order.subtotal ?? (order.totalAmount - (order.shippingFee ?? 0));
        await (ctx as any).runMutation((internal as any).wallets.creditStoreWalletOnOrderInternal, {
          storeId: order.storeId,
          orderId: order._id,
          amount: creditAmount,
          checkoutId: args.checkoutId,
        });
      }
    }
  },
});

/** Mark all orders under a checkoutId as failed (internal only, secure) */
export const markCheckoutFailedInternal = internalMutation({
  args: {
    checkoutId: v.string(),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_checkoutId", (q) => q.eq("checkoutId", args.checkoutId))
      .collect();

    const now = Date.now();
    for (const order of orders) {
      await ctx.db.patch(order._id, {
        paymentStatus: "failed",
        statusHistory: [
          ...order.statusHistory,
          {
            status: "failed",
            timestamp: now,
            message: "Payment charge attempt failed. Please check card details or update billing profile.",
          },
        ],
      });
    }
  },
});

/** Mark an individual order as paid successfully (legacy compatible) */
export const markOrderPaidInternal = internalMutation({
  args: {
    orderId: v.id("orders"),
    paystackReference: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // If order has checkoutId, mark all linked orders
    if (order.checkoutId) {
      await (markCheckoutPaidInternal as any)._handler(ctx, {
        checkoutId: order.checkoutId,
        paystackReference: args.paystackReference,
      });
      return;
    }

    const now = Date.now();
    const shortRef =
      args.paystackReference.length > 15
        ? args.paystackReference.slice(-12).toUpperCase()
        : args.paystackReference.toUpperCase();

    await ctx.db.patch(args.orderId, {
      paymentStatus: "paid",
      paystackReference: args.paystackReference,
      status: "placed",
      statusHistory: [
        ...order.statusHistory,
        {
          status: "paid",
          timestamp: now,
          message: `Payment authorized successfully. Ref: #${shortRef}`,
        },
      ],
    });

    // Credit store wallet balance (held in escrow until delivery)
    if (order.storeId) {
      const creditAmount = order.subtotal ?? (order.totalAmount - (order.shippingFee ?? 0));
      await (ctx as any).runMutation((internal as any).wallets.creditStoreWalletOnOrderInternal, {
        storeId: order.storeId,
        orderId: args.orderId,
        amount: creditAmount,
      });
    }
  },
});

/** Mark an individual order payment as failed (legacy compatible) */
export const markOrderFailedInternal = internalMutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.checkoutId) {
      await (markCheckoutFailedInternal as any)._handler(ctx, {
        checkoutId: order.checkoutId,
      });
      return;
    }

    await ctx.db.patch(args.orderId, {
      paymentStatus: "failed",
      statusHistory: [
        ...order.statusHistory,
        {
          status: "failed",
          timestamp: Date.now(),
          message: "Payment charge attempt failed. Please check card details or update billing profile.",
        },
      ],
    });
  },
});

/** Get all orders that contain products from a given store */
export const getOrdersForStore = query({
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const store = await ctx.db.get(args.storeId);
    if (!store || store.userId !== userId) {
      throw new Error("Unauthorized access to store orders");
    }

    // 1. Fast indexed query for modern decoupled store orders
    const directOrders = await ctx.db
      .query("orders")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    // 2. Query legacy unassigned orders without top-level storeId
    const legacyOrders = await ctx.db
      .query("orders")
      .withIndex("by_storeId", (q) => q.eq("storeId", undefined))
      .collect();

    const directMapped = directOrders
      .filter((order) => {
        if (order.status === "placed" && order.paymentStatus !== "paid") return false;
        return true;
      })
      .map((order) => {
        const sellerSubtotal =
          order.subtotal ??
          order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return {
          _id: order._id,
          _creationTime: order._creationTime,
          userId: order.userId,
          items: order.items,
          address: order.address,
          shippingMethod: order.shippingMethod,
          shippingFee: order.shippingFee,
          totalAmount: order.totalAmount,
          sellerSubtotal,
          paymentStatus: order.paymentStatus,
          status: order.status,
          statusHistory: order.statusHistory,
          waybillNumber: order.waybillNumber,
          giglStatus: order.giglStatus,
          createdAt: order.createdAt,
        };
      });

    const legacyMapped = legacyOrders
      .filter((order) => {
        if (order.status === "placed" && order.paymentStatus !== "paid") return false;
        return order.items.some((item) => item.storeId === args.storeId);
      })
      .map((order) => {
        const sellerItems = order.items.filter((item) => item.storeId === args.storeId);
        const sellerSubtotal = sellerItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const view = getShipmentView(order, args.storeId);

        return {
          _id: order._id,
          _creationTime: order._creationTime,
          userId: order.userId,
          items: sellerItems,
          address: order.address,
          shippingMethod: order.shippingMethod,
          shippingFee: order.shippingFee,
          totalAmount: order.totalAmount,
          sellerSubtotal,
          paymentStatus: order.paymentStatus,
          status: view.status as typeof order.status,
          statusHistory: view.statusHistory,
          waybillNumber: view.waybillNumber,
          giglStatus: view.giglStatus,
          createdAt: order.createdAt,
        };
      });

    return [...directMapped, ...legacyMapped].sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Update shipping status of a customer order (seller operation) */
export const updateOrderShippingStatus = mutation({
  args: {
    orderId: v.id("orders"),
    storeId: v.id("stores"),
    status: v.union(
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const store = await ctx.db.get(args.storeId);
    if (!store || store.userId !== userId) {
      throw new Error("Unauthorized access to store operations");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const defaultMessages = {
      processing: "Order is being packaged and prepared for shipping.",
      shipped: "Order has been dispatched and is on its way to you.",
      delivered: "Order has been delivered successfully.",
      cancelled: "Order has been cancelled by the store owner.",
    };
    const statusMsg = args.message || defaultMessages[args.status];
    const now = Date.now();

    // 1. Direct store order: single-document update without array collisions
    if (order.storeId === args.storeId) {
      await ctx.db.patch(args.orderId, {
        status: args.status,
        statusHistory: [
          ...order.statusHistory,
          {
            status: args.status,
            timestamp: now,
            message: statusMsg,
          },
        ],
      });

      if (args.status === "delivered" && order.paymentStatus === "paid") {
        const releaseAmount = order.subtotal ?? (order.totalAmount - (order.shippingFee ?? 0));
        await (ctx as any).runMutation((internal as any).wallets.releaseOrderFundsInternal, {
          storeId: args.storeId,
          orderId: args.orderId,
          amount: releaseAmount,
        });
      }

      return { success: true };
    }

    // 2. Legacy fallback for multi-store single-document orders
    const hasStoreItems = order.items.some((item) => item.storeId === args.storeId);
    if (!hasStoreItems) {
      throw new Error("Unauthorized: Order does not contain items from this store");
    }

    const patch = applyShipmentUpdate(order, args.storeId, {
      status: args.status,
      message: statusMsg,
      storeLabel: store.name,
    });
    await ctx.db.patch(args.orderId, patch);

    if (args.status === "delivered" && order.paymentStatus === "paid") {
      const storeItems = order.items.filter((item) => item.storeId === args.storeId);
      const storeItemSum = storeItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
      await (ctx as any).runMutation((internal as any).wallets.releaseOrderFundsInternal, {
        storeId: args.storeId,
        orderId: args.orderId,
        amount: storeItemSum,
      });
    }

    return { success: true };
  },
});

/** Get all orders across all stores owned by the currently authenticated seller */
export const getSellerOrdersAllStores = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Fetch user's stores
    const stores = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    if (stores.length === 0) return [];
    const storeIds = new Set(stores.map((s) => s._id));

    // 1. Direct indexed queries for each store owned by seller
    const directStoreOrders = (
      await Promise.all(
        stores.map((store) =>
          ctx.db
            .query("orders")
            .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
            .collect()
        )
      )
    ).flat();

    // 2. Legacy unassigned orders
    const legacyOrders = await ctx.db
      .query("orders")
      .withIndex("by_storeId", (q) => q.eq("storeId", undefined))
      .collect();

    const directMapped = directStoreOrders
      .filter((order) => {
        if (order.status === "placed" && order.paymentStatus !== "paid") return false;
        return true;
      })
      .map((order) => {
        const sellerSubtotal =
          order.subtotal ??
          order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return {
          _id: order._id,
          _creationTime: order._creationTime,
          userId: order.userId,
          items: order.items,
          address: order.address,
          shippingMethod: order.shippingMethod,
          shippingFee: order.shippingFee,
          totalAmount: order.totalAmount,
          sellerSubtotal,
          paymentStatus: order.paymentStatus,
          status: order.status,
          statusHistory: order.statusHistory,
          waybillNumber: order.waybillNumber,
          giglStatus: order.giglStatus,
          createdAt: order.createdAt,
        };
      });

    const legacyMapped = legacyOrders
      .filter((order) => {
        if (order.status === "placed" && order.paymentStatus !== "paid") return false;
        return order.items.some((item) => item.storeId && storeIds.has(item.storeId));
      })
      .map((order) => {
        const sellerItems = order.items.filter(
          (item) => item.storeId && storeIds.has(item.storeId)
        );
        const sellerSubtotal = sellerItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const view = getShipmentView(order, sellerItems[0]?.storeId);

        return {
          _id: order._id,
          _creationTime: order._creationTime,
          userId: order.userId,
          items: sellerItems,
          address: order.address,
          shippingMethod: order.shippingMethod,
          shippingFee: order.shippingFee,
          totalAmount: order.totalAmount,
          sellerSubtotal,
          paymentStatus: order.paymentStatus,
          status: view.status as typeof order.status,
          statusHistory: view.statusHistory,
          waybillNumber: view.waybillNumber,
          giglStatus: view.giglStatus,
          createdAt: order.createdAt,
        };
      });

    return [...directMapped, ...legacyMapped].sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Get a single order detail if it contains items belonging to any stores owned by the seller */
export const getSellerOrderById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    // Fetch user's stores
    const stores = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    if (stores.length === 0) return null;
    const storeIds = new Set(stores.map((s) => s._id));

    // Fetch buyer info
    const buyer = order.userId ? await ctx.db.get(order.userId) : null;
    const buyerEmail = buyer?.email ?? order.email ?? "Guest";
    const buyerName = buyer?.name ?? order.address.fullName;

    // 1. Direct store order check
    if (order.storeId && storeIds.has(order.storeId)) {
      const sellerSubtotal =
        order.subtotal ??
        order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      return {
        _id: order._id,
        _creationTime: order._creationTime,
        userId: order.userId,
        buyerEmail,
        buyerName,
        items: order.items,
        address: order.address,
        shippingMethod: order.shippingMethod,
        shippingFee: order.shippingFee,
        totalAmount: order.totalAmount,
        sellerSubtotal,
        paymentStatus: order.paymentStatus,
        status: order.status,
        statusHistory: order.statusHistory,
        waybillNumber: order.waybillNumber,
        giglStatus: order.giglStatus,
        giglShipmentDetails: order.giglShipmentDetails,
        createdAt: order.createdAt,
        storeId: order.storeId,
      };
    }

    // 2. Legacy fallback for multi-store orders without top-level storeId
    const sellerItems = order.items.filter(
      (item) => item.storeId && storeIds.has(item.storeId)
    );
    if (sellerItems.length === 0) return null;

    const sellerSubtotal = sellerItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const storeId = sellerItems[0].storeId;
    const view = getShipmentView(order, storeId);

    return {
      _id: order._id,
      _creationTime: order._creationTime,
      userId: order.userId,
      buyerEmail,
      buyerName,
      items: sellerItems,
      address: order.address,
      shippingMethod: order.shippingMethod,
      shippingFee: order.shippingFee,
      totalAmount: order.totalAmount,
      sellerSubtotal,
      paymentStatus: order.paymentStatus,
      status: view.status as typeof order.status,
      statusHistory: view.statusHistory,
      waybillNumber: view.waybillNumber,
      giglStatus: view.giglStatus,
      giglShipmentDetails: order.giglShipmentDetails,
      createdAt: order.createdAt,
      storeId,
    };
  },
});



