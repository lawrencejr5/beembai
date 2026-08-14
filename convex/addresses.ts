import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Queries ──────────────────────────────────────────────

/** Get all shipping addresses for the logged-in user */
export const getUserAddresses = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("addresses")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

// ── Mutations ─────────────────────────────────────────────

/** Save a new shipping address */
export const addAddress = mutation({
  args: {
    fullName: v.string(),
    phone: v.string(),
    streetAddress: v.string(),
    apartment: v.optional(v.string()),
    city: v.string(),
    stateName: v.string(),
    postalCode: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Fetch existing addresses to see if this is the first one
    const existing = await ctx.db
      .query("addresses")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const isDefault = existing.length === 0;

    return await ctx.db.insert("addresses", {
      userId,
      fullName: args.fullName,
      phone: args.phone,
      streetAddress: args.streetAddress,
      apartment: args.apartment,
      city: args.city,
      stateName: args.stateName,
      postalCode: args.postalCode,
      country: args.country,
      isDefault,
    });
  },
});

/** Update an existing shipping address */
export const updateAddress = mutation({
  args: {
    id: v.id("addresses"),
    fullName: v.string(),
    phone: v.string(),
    streetAddress: v.string(),
    apartment: v.optional(v.string()),
    city: v.string(),
    stateName: v.string(),
    postalCode: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const address = await ctx.db.get(args.id);
    if (!address || address.userId !== userId) {
      throw new Error("Address not found");
    }

    await ctx.db.patch(args.id, {
      fullName: args.fullName,
      phone: args.phone,
      streetAddress: args.streetAddress,
      apartment: args.apartment,
      city: args.city,
      stateName: args.stateName,
      postalCode: args.postalCode,
      country: args.country,
    });
  },
});

/** Delete a shipping address */
export const deleteAddress = mutation({
  args: { id: v.id("addresses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const address = await ctx.db.get(args.id);
    if (!address || address.userId !== userId) {
      throw new Error("Address not found");
    }

    const wasDefault = address.isDefault;
    await ctx.db.delete(args.id);

    // Promote the next available address as default if the deleted one was default
    if (wasDefault) {
      const nextAddress = await ctx.db
        .query("addresses")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();

      if (nextAddress) {
        await ctx.db.patch(nextAddress._id, { isDefault: true });
      }
    }
  },
});

/** Set an address as the default shipping address */
export const setDefaultAddress = mutation({
  args: { id: v.id("addresses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const target = await ctx.db.get(args.id);
    if (!target || target.userId !== userId) {
      throw new Error("Address not found");
    }

    // Set all other addresses for this user to not default
    const all = await ctx.db
      .query("addresses")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const addr of all) {
      if (addr.isDefault) {
        await ctx.db.patch(addr._id, { isDefault: false });
      }
    }

    // Mark target as default
    await ctx.db.patch(args.id, { isDefault: true });
  },
});
