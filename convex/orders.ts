import { query, mutation } from "./_generated/server";
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

// ── Mutations ─────────────────────────────────────────────

/** Create a new unpaid checkout order */
export const createUnpaidOrder = mutation({
  args: {
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
    if (!userId) throw new Error("Not authenticated");

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
      userId,
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


/** Mark an order as paid successfully */
export const markOrderPaid = mutation({
  args: {
    orderId: v.id("orders"),
    paystackReference: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== userId) {
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

/** Mark an order payment as failed */
export const markOrderFailed = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== userId) {
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

