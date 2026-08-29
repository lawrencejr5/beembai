import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";

const BEEMBAI_STORE_SLUG = "beembai-official";

// ── Admin guard helper ─────────────────────────────────────
async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized: not authenticated");
  const user = await ctx.db.get(userId);
  if (!user?.isAdmin) throw new Error("Forbidden: admin access required");
  return userId;
}

// ── Internal: Get or create the Beembai Official Store ────
// Called from createForeignProduct so every import product has a storeId.
export const getOrCreateBeembaiStoreInternal = internalMutation({
  args: {},
  handler: async (ctx): Promise<string> => {
    const existing = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", BEEMBAI_STORE_SLUG))
      .unique();
    if (existing) return existing._id;

    const id = await ctx.db.insert("stores", {
      name: "Beembai Official",
      slug: BEEMBAI_STORE_SLUG,
      logo: "/images/logos/beembai-official.png",
      banner: "",
      rating: 5,
      verified: true,
      category: "Import & Fulfilment",
      description:
        "Beembai's official import fulfilment store. We source, inspect, and deliver products from international retailers directly to your door in Nigeria.",
      status: "approved",
      verificationStatus: "verified",
    });
    return id;
  },
});

// ── Public: Ensure store exists (called from admin layout on mount) ──
export const ensureBeembaiStore = mutation({
  args: {},
  handler: async (ctx): Promise<string> => {
    await requireAdmin(ctx);
    const id: string = await ctx.runMutation(
      internal.beembaiStore.getOrCreateBeembaiStoreInternal,
      {}
    );
    return id;
  },
});

// ── Query: Get the Beembai Official Store record ──────────
export const getBeembaiStore = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", BEEMBAI_STORE_SLUG))
      .unique();
  },
});

// ── Mutation: Update Beembai Official Store settings ──────
export const updateBeembaiStore = mutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    banner: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    physicalAddress: v.optional(v.string()),
    city: v.optional(v.string()),
    stateName: v.optional(v.string()),
    country: v.optional(v.string()),
    bannerMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", BEEMBAI_STORE_SLUG))
      .unique();
    if (!store) throw new Error("Beembai Official Store not found");

    // Build patch object with only defined fields
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined) patch[k] = v;
    }
    await ctx.db.patch(store._id, patch);
    return store._id;
  },
});

// ── Query: Paginated orders (isImportOrder === true OR contains Beembai products) ──
export const getBeembaiStoreOrders = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(
        v.literal("placed"),
        v.literal("processing"),
        v.literal("shipped"),
        v.literal("delivered"),
        v.literal("cancelled"),
        v.literal("all")
      )
    ),
    paymentStatus: v.optional(
      v.union(
        v.literal("paid"),
        v.literal("unpaid"),
        v.literal("failed"),
        v.literal("all")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", BEEMBAI_STORE_SLUG))
      .unique();
    const beembaiStoreId = store?._id;

    // Collect all orders to filter correctly by item storeId (Convex filter query doesn't scan nested arrays)
    const allOrders = await ctx.db.query("orders").collect();

    const filteredOrders = allOrders
      .filter((order) =>
        order.isImportOrder === true ||
        (beembaiStoreId && order.items.some((item) => item.storeId === beembaiStoreId))
      )
      .sort((a, b) => b.createdAt - a.createdAt);

    // Apply status and payment filters in JS
    let finalOrders = filteredOrders;
    if (args.status && args.status !== "all") {
      finalOrders = finalOrders.filter((o) => o.status === args.status);
    }
    if (args.paymentStatus && args.paymentStatus !== "all") {
      finalOrders = finalOrders.filter((o) => o.paymentStatus === args.paymentStatus);
    }

    // Manual pagination
    const cursor = args.paginationOpts.cursor;
    const numItems = args.paginationOpts.numItems;
    let startIndex = 0;
    if (cursor) {
      const decoded = parseInt(cursor, 10);
      if (!isNaN(decoded)) {
        startIndex = decoded;
      }
    }

    const page = finalOrders.slice(startIndex, startIndex + numItems);
    const hasMore = startIndex + numItems < finalOrders.length;
    const continueCursor = hasMore ? String(startIndex + numItems) : null;

    const pageWithBuyer = await Promise.all(
      page.map(async (order) => {
        const buyer = order.userId ? await ctx.db.get(order.userId) : null;
        return {
          ...order,
          buyerName: buyer?.name ?? order.address.fullName ?? "Guest",
          buyerEmail: buyer?.email ?? order.email ?? "Guest",
        };
      })
    );

    return {
      page: pageWithBuyer,
      isDone: !hasMore,
      continueCursor: continueCursor || "",
    };
  },
});

// ── Query: Single Beembai order detail ─────────────────────
export const getBeembaiOrderById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", BEEMBAI_STORE_SLUG))
      .unique();
    const beembaiStoreId = store?._id;

    const isBeembaiOrder =
      order.isImportOrder === true ||
      (beembaiStoreId && order.items.some((item) => item.storeId === beembaiStoreId));

    if (!isBeembaiOrder) return null;

    const buyer = order.userId ? await ctx.db.get(order.userId) : null;

    // Attach sourceUrl from products table for each item
    const itemsWithSource = await Promise.all(
      order.items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return {
          ...item,
          sourceUrl: product?.sourceUrl ?? null,
          brand: product?.brand ?? null,
        };
      })
    );

    return {
      ...order,
      buyerName: buyer?.name ?? order.address.fullName ?? "Guest",
      buyerEmail: buyer?.email ?? order.email ?? "Guest",
      items: itemsWithSource,
    };
  },
});

// ── Mutation: Update Beembai/import order status ───────────
export const updateBeembaiOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("placed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", BEEMBAI_STORE_SLUG))
      .unique();
    const beembaiStoreId = store?._id;

    const isBeembaiOrder =
      order.isImportOrder === true ||
      (beembaiStoreId && order.items.some((item) => item.storeId === beembaiStoreId));

    if (!isBeembaiOrder) throw new Error("Unauthorized access to this order");

    const defaultMessages: Record<string, string> = {
      placed: "Order placed and awaiting processing.",
      processing: "Order is being packaged and prepared for shipping.",
      shipped: "Order has been dispatched and is on its way to you.",
      delivered: "Order has been delivered successfully.",
      cancelled: "Order has been cancelled.",
    };

    await ctx.db.patch(args.orderId, {
      status: args.status,
      statusHistory: [
        ...order.statusHistory,
        {
          status: args.status,
          timestamp: Date.now(),
          message: args.message ?? defaultMessages[args.status],
        },
      ],
    });
    return { success: true };
  },
});

// ── Query: All products belonging to Beembai (including imports) ──
export const getBeembaiStoreProducts = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", BEEMBAI_STORE_SLUG))
      .unique();
    if (!store) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    return await ctx.db
      .query("products")
      .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// ── Mutation: Create product on Beembai Official Store ──
export const adminCreateProduct = mutation({
  args: {
    title: v.string(),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    categoryName: v.string(),
    description: v.optional(v.string()),
    condition: v.optional(v.string()),
    colors: v.optional(v.array(v.string())),
    stock: v.optional(v.number()),
    image: v.string(),
    images: v.optional(v.array(v.string())),
    youtubeLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", BEEMBAI_STORE_SLUG))
      .unique();
    if (!store) throw new Error("Beembai Official Store not found");

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
      image: args.image,
      tag: "new",
      description: args.description,
      brand: store.name,
      condition: args.condition || "New",
      colors: args.colors || [],
      productDetails: [],
      isFeatured: false,
      isNewArrival: true,
      isSponsored: false,
      stock: args.stock ?? 10,
      storeId: store._id,
      images: args.images || [args.image],
      youtubeLink: args.youtubeLink,
      status: "approved", // Admin products are auto-approved
    });

    return productId;
  },
});

// ── Mutation: Update a product on Beembai Official Store ──
export const adminUpdateProduct = mutation({
  args: {
    productId: v.id("products"),
    title: v.optional(v.string()),
    price: v.optional(v.number()),
    originalPrice: v.optional(v.number()),
    categoryName: v.optional(v.string()),
    description: v.optional(v.string()),
    condition: v.optional(v.string()),
    colors: v.optional(v.array(v.string())),
    stock: v.optional(v.number()),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    youtubeLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", BEEMBAI_STORE_SLUG))
      .unique();
    if (!store || product.storeId !== store._id) {
      throw new Error("Unauthorized or Product does not belong to Beembai");
    }

    const patch: Record<string, any> = {};
    if (args.title !== undefined) patch.title = args.title;
    if (args.price !== undefined) patch.price = args.price;
    if (args.originalPrice !== undefined) patch.originalPrice = args.originalPrice;
    if (args.categoryName !== undefined) {
      patch.categoryName = args.categoryName;
      patch.categorySlug = args.categoryName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (args.description !== undefined) patch.description = args.description;
    if (args.condition !== undefined) patch.condition = args.condition;
    if (args.colors !== undefined) patch.colors = args.colors;
    if (args.stock !== undefined) patch.stock = args.stock;
    if (args.image !== undefined) patch.image = args.image;
    if (args.images !== undefined) patch.images = args.images;
    if (args.youtubeLink !== undefined) patch.youtubeLink = args.youtubeLink;

    await ctx.db.patch(args.productId, patch);
    return product._id;
  },
});

// ── Mutation: Delete a product ──
export const adminDeleteProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", BEEMBAI_STORE_SLUG))
      .unique();
    if (!store || product.storeId !== store._id) {
      throw new Error("Unauthorized or Product does not belong to Beembai");
    }

    await ctx.db.delete(args.productId);
    return { success: true };
  },
});

// ── Internal Mutation: Backfill existing foreign-import products ──
export const backfillForeignProductStoreIds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const storeId: string = await ctx.runMutation(
      internal.beembaiStore.getOrCreateBeembaiStoreInternal,
      {}
    );

    const products = await ctx.db
      .query("products")
      .withIndex("by_categorySlug", (q) =>
        q.eq("categorySlug", "foreign-import")
      )
      .collect();

    let patched = 0;
    for (const product of products) {
      if (!product.storeId) {
        await ctx.db.patch(product._id, { storeId: storeId as any });
        patched++;
      }
    }
    return { patched };
  },
});

// ── Public Mutation: Trigger backfill (admin only) ────────
export const runBackfillForeignProducts = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const result: { patched: number } = await ctx.runMutation(
      internal.beembaiStore.backfillForeignProductStoreIds,
      {}
    );
    return result;
  },
});

// ── Query: Analytics for Beembai store (admin only) ──
export const getBeembaiStoreAnalytics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", BEEMBAI_STORE_SLUG))
      .unique();
    if (!store) {
      return {
        totalRevenue: 0,
        activeProductsCount: 0,
        activeOrdersCount: 0,
        totalOrdersCount: 0,
      };
    }

    const products = await ctx.db
      .query("products")
      .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
      .collect();

    // Only count local products (excluding foreign imports)
    const localProducts = products.filter((p) => p.categorySlug !== "foreign-import");

    const allOrders = await ctx.db.query("orders").collect();
    const beembaiOrders = allOrders.filter(
      (o) =>
        o.isImportOrder === true ||
        o.items.some((item) => item.storeId === store._id)
    );

    const totalRevenue = beembaiOrders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const activeOrdersCount = beembaiOrders.filter(
      (o) => o.status === "placed" || o.status === "processing"
    ).length;

    return {
      totalRevenue,
      activeProductsCount: localProducts.length,
      activeOrdersCount,
      totalOrdersCount: beembaiOrders.length,
    };
  },
});


