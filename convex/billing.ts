import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Queries ──────────────────────────────────────────────

/** Fetch all saved payment methods for the logged-in user */
export const getUserPaymentMethods = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("paymentMethods")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

// ── Mutations ─────────────────────────────────────────────

/** Save a new payment method after Paystack verification */
export const savePaymentMethod = mutation({
  args: {
    authorizationCode: v.string(),
    cardType: v.string(),
    last4: v.string(),
    expMonth: v.string(),
    expYear: v.string(),
    bank: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if this card is already saved (same last4 + expiry + bank)
    const existing = await ctx.db
      .query("paymentMethods")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const duplicate = existing.find(
      (m) =>
        m.last4 === args.last4 &&
        m.expMonth === args.expMonth &&
        m.expYear === args.expYear &&
        m.bank === args.bank,
    );

    if (duplicate) {
      // Update authorization code to latest (card may have been re-authorised)
      await ctx.db.patch(duplicate._id, {
        authorizationCode: args.authorizationCode,
      });
      return duplicate._id;
    }

    // First card becomes the default automatically
    const isDefault = existing.length === 0;

    return await ctx.db.insert("paymentMethods", {
      userId,
      authorizationCode: args.authorizationCode,
      cardType: args.cardType,
      last4: args.last4,
      expMonth: args.expMonth,
      expYear: args.expYear,
      bank: args.bank,
      email: args.email,
      isDefault,
    });
  },
});

/** Delete a saved payment method */
export const deletePaymentMethod = mutation({
  args: { id: v.id("paymentMethods") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const method = await ctx.db.get(args.id);
    if (!method || method.userId !== userId) {
      throw new Error("Payment method not found");
    }

    const wasDefault = method.isDefault;
    await ctx.db.delete(args.id);

    // If we deleted the default card, promote the next one
    if (wasDefault) {
      const remaining = await ctx.db
        .query("paymentMethods")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      if (remaining) {
        await ctx.db.patch(remaining._id, { isDefault: true });
      }
    }
  },
});

/** Set a payment method as the default */
export const setDefaultPaymentMethod = mutation({
  args: { id: v.id("paymentMethods") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const target = await ctx.db.get(args.id);
    if (!target || target.userId !== userId) {
      throw new Error("Payment method not found");
    }

    // Un-set all existing defaults for this user
    const all = await ctx.db
      .query("paymentMethods")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const m of all) {
      if (m.isDefault) {
        await ctx.db.patch(m._id, { isDefault: false });
      }
    }

    await ctx.db.patch(args.id, { isDefault: true });
  },
});
