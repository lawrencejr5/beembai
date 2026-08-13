import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getProducts = query({
  args: {},
  handler: async (ctx) => {
    // Only return approved products to regular queries
    return await ctx.db
      .query("products")
      .filter((q) => q.or(
        q.eq(q.field("status"), "approved"),
        // Backwards compatibility with seeded products that don't have a status field yet
        q.eq(q.field("status"), undefined)
      ))
      .collect();
  },
});

export const getStores = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("stores").collect();
  },
});

// Create a new product for a store, setting it to pending
export const createProduct = mutation({
  args: {
    title: v.string(),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    categoryName: v.string(),
    description: v.optional(v.string()),
    condition: v.optional(v.string()),
    colors: v.optional(v.array(v.string())),
    stock: v.optional(v.number()),
    storeId: v.id("stores"),
    images: v.optional(v.array(v.string())),
    image: v.string(),
    youtubeLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify the user owns the store
    const store = await ctx.db.get(args.storeId);
    if (!store || store.userId !== userId) {
      throw new Error("Unauthorized or Store not found");
    }

    // Generate categorySlug automatically from categoryName
    const categorySlug = args.categoryName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const productId = await ctx.db.insert("products", {
      title: args.title,
      categorySlug,
      categoryName: args.categoryName,
      price: args.price,
      originalPrice: args.originalPrice,
      image: args.image, // main image URL
      tag: "new",
      description: args.description,
      brand: store.name,
      condition: args.condition,
      colors: args.colors,
      productDetails: [],
      isFeatured: false,
      isNewArrival: true,
      isSponsored: false,
      stock: args.stock,
      storeId: args.storeId,
      images: args.images,
      youtubeLink: args.youtubeLink,
      status: "pending", // Always pending upon creation
    });

    return productId;
  },
});

// Resolve a storage ID to a public URL
export const resolveStorageUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
});

// Fetch product details by ID with permission checks for pending products
export const getProductDetails = query({
  args: { productId: v.string() },
  handler: async (ctx, args) => {
    // Check if ID is a valid products ID
    let product;
    try {
      const parsedId = ctx.db.normalizeId("products", args.productId);
      if (!parsedId) return null;
      product = await ctx.db.get(parsedId);
    } catch {
      return null;
    }
    if (!product) return null;

    // If product is approved, anyone can see it
    if (product.status === "approved" || product.status === undefined) {
      return product;
    }

    // If pending, only the store owner can see it
    const userId = await getAuthUserId(ctx);
    if (!userId || !product.storeId) return null;

    const store = await ctx.db.get(product.storeId);
    if (store && store.userId === userId) {
      return product;
    }

    return null;
  },
});

// Full-text search for products by title
export const searchProducts = query({
  args: {
    query: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("products"),
      title: v.string(),
      price: v.number(),
      originalPrice: v.optional(v.number()),
      image: v.string(),
      categoryName: v.string(),
      categorySlug: v.string(),
      brand: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    const results = await ctx.db
      .query("products")
      .withSearchIndex("search_products", (q) =>
        q.search("title", args.query),
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "approved"),
          q.eq(q.field("status"), undefined),
        ),
      )
      .take(10);

    return results.map((p) => ({
      _id: p._id,
      title: p.title,
      price: p.price,
      originalPrice: p.originalPrice,
      image: p.image,
      categoryName: p.categoryName,
      categorySlug: p.categorySlug,
      brand: p.brand,
    }));
  },
});

// Get all categories for search suggestion dropdown
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").take(20);
  },
});
