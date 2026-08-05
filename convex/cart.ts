import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get cart items for the logged-in user
export const getCart = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("cart")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Add item to cart or increase quantity
export const addToCart = mutation({
  args: {
    productId: v.string(),
    selectedColor: v.optional(v.string()),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("cart")
      .withIndex("by_user_product", (q) =>
        q.eq("userId", userId).eq("productId", args.productId)
      )
      .filter((q) => q.eq(q.field("selectedColor"), args.selectedColor))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + args.quantity,
      });
    } else {
      await ctx.db.insert("cart", {
        userId,
        productId: args.productId,
        selectedColor: args.selectedColor,
        quantity: args.quantity,
      });
    }
  },
});

// Remove item from cart
export const removeFromCart = mutation({
  args: {
    productId: v.string(),
    selectedColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("cart")
      .withIndex("by_user_product", (q) =>
        q.eq("userId", userId).eq("productId", args.productId)
      )
      .filter((q) => q.eq(q.field("selectedColor"), args.selectedColor))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

// Update item quantity
export const updateQuantity = mutation({
  args: {
    productId: v.string(),
    selectedColor: v.optional(v.string()),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("cart")
      .withIndex("by_user_product", (q) =>
        q.eq("userId", userId).eq("productId", args.productId)
      )
      .filter((q) => q.eq(q.field("selectedColor"), args.selectedColor))
      .first();

    if (existing) {
      if (args.quantity <= 0) {
        await ctx.db.delete(existing._id);
      } else {
        await ctx.db.patch(existing._id, {
          quantity: args.quantity,
        });
      }
    }
  },
});

// Clear all items in user's cart
export const clearCart = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const items = await ctx.db
      .query("cart")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }
  },
});

// Merge guest cart items from localStorage into database cart
export const mergeCart = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.string(),
        selectedColor: v.optional(v.string()),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    for (const item of args.items) {
      const existing = await ctx.db
        .query("cart")
        .withIndex("by_user_product", (q) =>
          q.eq("userId", userId).eq("productId", item.productId)
        )
        .filter((q) => q.eq(q.field("selectedColor"), item.selectedColor))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          quantity: existing.quantity + item.quantity,
        });
      } else {
        await ctx.db.insert("cart", {
          userId,
          productId: item.productId,
          selectedColor: item.selectedColor,
          quantity: item.quantity,
        });
      }
    }
  },
});
