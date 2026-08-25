import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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

    return orders.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Get details of a guest order if ID and email match */
export const getGuestOrder = query({
  args: {
    orderId: v.id("orders"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    if (!order.email || order.email.toLowerCase() !== args.email.toLowerCase()) {
      return null;
    }
    return order;
  },
});

/** Internal query to fetch an order by ID (needed by actions) */
export const getOrderByIdInternal = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

// ── Mutations ─────────────────────────────────────────────

/** Create a new unpaid checkout order */
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
      stateName: v.string(),
      postalCode: v.string(),
      country: v.string(),
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

    // Look up and attach storeId for each product to link them correctly to their respective stores
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

    return await ctx.db.insert("orders", {
      userId: userId || undefined,
      email: orderEmail,
      items: itemsWithStoreId,
      address: args.address,
      shippingMethod: args.shippingMethod,
      shippingFee: args.shippingFee,
      totalAmount: args.totalAmount,
      paymentStatus: "unpaid",
      status: "placed",
      statusHistory: [
        {
          status: "placed",
          timestamp: now,
          message: "Order placed. Awaiting secure payment verification.",
        },
      ],
      createdAt: now,
    });
  },
});


/** Mark an order as paid successfully (internal only, secure) */
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

    const now = Date.now();

    const shortRef = args.paystackReference.length > 15
      ? args.paystackReference.slice(-12).toUpperCase()
      : args.paystackReference.toUpperCase();

    await ctx.db.patch(args.orderId, {
      paymentStatus: "paid",
      paystackReference: args.paystackReference,
      status: "processing", // Advance status to processing
      statusHistory: [
        ...order.statusHistory,
        {
          status: "paid",
          timestamp: now,
          message: `Payment authorized successfully. Ref: #${shortRef}`,
        },
        {
          status: "processing",
          timestamp: now + 1000,
          message: "Payment verified. Packaging and store verification in progress.",
        },
      ],
    });
  },
});

/** Mark an order payment as failed (internal only, secure) */
export const markOrderFailedInternal = internalMutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
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

    const allOrders = await ctx.db.query("orders").collect();

    const storeOrders = allOrders
      .filter((order) =>
        order.items.some((item) => item.storeId === args.storeId)
      )
      .map((order) => {
        // Filter items to show only this seller's products
        const sellerItems = order.items.filter((item) => item.storeId === args.storeId);
        
        // Calculate the subtotal for this seller's products
        const sellerSubtotal = sellerItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        return {
          _id: order._id,
          _creationTime: order._creationTime,
          userId: order.userId,
          items: sellerItems, // only return seller's items
          address: order.address,
          shippingMethod: order.shippingMethod,
          shippingFee: order.shippingFee,
          totalAmount: order.totalAmount, // full order total
          sellerSubtotal, // subtotal for this seller
          paymentStatus: order.paymentStatus,
          status: order.status,
          statusHistory: order.statusHistory,
          createdAt: order.createdAt,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    return storeOrders;
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

    const hasStoreItems = order.items.some((item) => item.storeId === args.storeId);
    if (!hasStoreItems) {
      throw new Error("Unauthorized: Order does not contain items from this store");
    }

    const now = Date.now();
    const defaultMessages = {
      processing: "Order is being packaged and prepared for shipping.",
      shipped: "Order has been dispatched and is on its way to you.",
      delivered: "Order has been delivered successfully.",
      cancelled: "Order has been cancelled by the store owner.",
    };

    const statusMsg = args.message || defaultMessages[args.status];

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

    // Fetch all orders
    const allOrders = await ctx.db.query("orders").collect();

    // Filter to orders containing items belonging to any of the user's stores
    const sellerOrders = allOrders
      .filter((order) =>
        order.items.some((item) => item.storeId && storeIds.has(item.storeId))
      )
      .map((order) => {
        // Filter items to show only this seller's products
        const sellerItems = order.items.filter(
          (item) => item.storeId && storeIds.has(item.storeId)
        );

        // Calculate subtotal for this seller
        const sellerSubtotal = sellerItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

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
          status: order.status,
          statusHistory: order.statusHistory,
          createdAt: order.createdAt,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    return sellerOrders;
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

    // Verify if this order contains items from the user's stores
    const sellerItems = order.items.filter(
      (item) => item.storeId && storeIds.has(item.storeId)
    );
    if (sellerItems.length === 0) return null;

    // Calculate subtotal for this seller
    const sellerSubtotal = sellerItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Find the first storeId in the seller's items to facilitate status updates
    const storeId = sellerItems[0].storeId;

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
      status: order.status,
      statusHistory: order.statusHistory,
      createdAt: order.createdAt,
      storeId,
    };
  },
});



