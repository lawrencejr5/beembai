import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getProductReviews = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    // Return a bounded list of reviews (up to 100) to prevent performance issues
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .take(100);

    // Hydrate reviews with user name and image details
    const hydratedReviews = await Promise.all(
      reviews.map(async (review) => {
        const user = await ctx.db.get(review.userId);
        return {
          ...review,
          userName: user?.name || "Anonymous User",
          userImage: user?.image || "",
        };
      })
    );

    return hydratedReviews;
  },
});

export const getUserReviews = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    // Return bounded list of user's reviews
    return await ctx.db
      .query("reviews")
      .withIndex("by_userId_and_productId", (q) => q.eq("userId", userId))
      .take(100);
  },
});

export const canUserReviewProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { canReview: false, reason: "Please log in to review this product" };
    }

    // 1. Verify user has a delivered order for this product
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect(); // Orders per user is typically a small bounded list

    const hasDeliveredOrder = orders.some(
      (order) =>
        order.status === "delivered" &&
        order.items.some((item) => item.productId === args.productId)
    );

    if (!hasDeliveredOrder) {
      return {
        canReview: false,
        reason: "You can only review products that you have purchased and had delivered successfully.",
      };
    }

    // 2. Check if already reviewed
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_userId_and_productId", (q) =>
        q.eq("userId", userId).eq("productId", args.productId)
      )
      .first();

    return {
      canReview: true,
      alreadyReviewed: !!existingReview,
      existingReview: existingReview || null,
    };
  },
});

export const addOrUpdateReview = mutation({
  args: {
    productId: v.id("products"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5 stars");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    // Verify order is delivered
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const hasDeliveredOrder = orders.some(
      (order) =>
        order.status === "delivered" &&
        order.items.some((item) => item.productId === args.productId)
    );

    if (!hasDeliveredOrder) {
      throw new Error("You must purchase this product and have it delivered before reviewing.");
    }

    // Check if already reviewed
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_userId_and_productId", (q) =>
        q.eq("userId", userId).eq("productId", args.productId)
      )
      .first();

    const storeId = product.storeId;

    if (existingReview) {
      await ctx.db.patch(existingReview._id, {
        rating: args.rating,
        comment: args.comment,
      });
    } else {
      if (!storeId) {
        throw new Error("Cannot review a product that does not belong to a valid store.");
      }
      await ctx.db.insert("reviews", {
        userId,
        productId: args.productId,
        storeId,
        rating: args.rating,
        comment: args.comment,
      });
    }

    // Recalculate average rating and review count for the product
    const productReviews = await ctx.db
      .query("reviews")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();

    const productCount = productReviews.length;
    const productSum = productReviews.reduce((sum, r) => sum + r.rating, 0);
    const productAverage = productCount > 0 ? productSum / productCount : 0;

    await ctx.db.patch(args.productId, {
      rating: parseFloat(productAverage.toFixed(1)),
      numReviews: productCount,
    });

    // Recalculate average rating for the store (if the product is linked to a store)
    if (storeId) {
      const storeReviews = await ctx.db
        .query("reviews")
        .withIndex("by_storeId", (q) => q.eq("storeId", storeId))
        .collect();

      const storeCount = storeReviews.length;
      const storeSum = storeReviews.reduce((sum, r) => sum + r.rating, 0);
      const storeAverage = storeCount > 0 ? storeSum / storeCount : 5.0;

      await ctx.db.patch(storeId, {
        rating: parseFloat(storeAverage.toFixed(1)),
      });
    }

    return { success: true };
  },
});
