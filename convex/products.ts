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
    return await ctx.db
      .query("stores")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "approved"),
          q.eq(q.field("status"), undefined)
        )
      )
      .collect();
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

// Update an existing product
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    title: v.string(),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    description: v.optional(v.string()),
    condition: v.optional(v.string()),
    colors: v.optional(v.array(v.string())),
    stock: v.optional(v.number()),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    youtubeLink: v.optional(v.string()),
    categoryName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Verify user owns the store that sells the product
    if (product.storeId) {
      const store = await ctx.db.get(product.storeId);
      if (!store || store.userId !== userId) {
        throw new Error("Unauthorized");
      }
    } else {
      throw new Error("Unauthorized");
    }

    const patch: any = {
      title: args.title,
      price: args.price,
      originalPrice: args.originalPrice,
      description: args.description,
      condition: args.condition,
      colors: args.colors,
      stock: args.stock,
    };

    if (args.image !== undefined) patch.image = args.image;
    if (args.images !== undefined) patch.images = args.images;
    if (args.youtubeLink !== undefined) patch.youtubeLink = args.youtubeLink;

    if (args.categoryName !== undefined) {
      patch.categoryName = args.categoryName;
      patch.categorySlug = args.categoryName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    await ctx.db.patch(args.productId, patch);
    return args.productId;
  },
});

// Fetch a single category by its slug
export const getCategoryBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

// Fetch all approved products for a specific category slug
export const getProductsByCategorySlug = query({
  args: { categorySlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_categorySlug", (q) => q.eq("categorySlug", args.categorySlug))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "approved"),
          q.eq(q.field("status"), undefined)
        )
      )
      .collect();
  },
});

// Delete an existing product owned by the current user
export const sellerDeleteProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Verify user owns the store that sells this product
    if (product.storeId) {
      const store = await ctx.db.get(product.storeId);
      if (!store || store.userId !== userId) {
        throw new Error("Unauthorized");
      }
    } else {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.productId);
    return { success: true };
  },
});

// Create a new foreign product in the database so that it has a valid Convex ID for the cart
export const createForeignProduct = mutation({
  args: {
    title: v.string(),
    price: v.number(),
    image: v.string(),
    description: v.optional(v.string()),
    brand: v.optional(v.string()),
    originalPrice: v.optional(v.number()),
    inStock: v.optional(v.boolean()),
    sourceUrl: v.optional(v.string()),
    variants: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const productId = await ctx.db.insert("products", {
      title: args.title,
      categorySlug: "foreign-import",
      categoryName: "Foreign Import",
      price: args.price,
      originalPrice: args.originalPrice,
      image: args.image,
      tag: "import",
      description: args.description,
      brand: args.brand || "International Store",
      condition: "New",
      colors: [],
      productDetails: [],
      isFeatured: false,
      isNewArrival: false,
      isSponsored: false,
      stock: 999,
      status: "approved", // Auto-approved for foreign imports
      inStock: args.inStock ?? true,
      sourceUrl: args.sourceUrl,
      variants: args.variants,
    });
    return productId;
  },
});




