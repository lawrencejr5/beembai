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

    return await ctx.db.insert("orders", {
      userId,
      items: args.items,
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
