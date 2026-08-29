import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// ── Admin Guard Helper ────────────────────────────────────
async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized: not authenticated");
  const user = await ctx.db.get(userId);
  if (!user?.isAdmin) throw new Error("Forbidden: admin access required");
  return userId;
}

// ── Dashboard Stats ───────────────────────────────────────
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [users, stores, products, orders] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("stores").collect(),
      ctx.db.query("products").collect(),
      ctx.db.query("orders").collect(),
    ]);

    const totalRevenue = orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const beembaiStore = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", "beembai-official"))
      .unique();
    const beembaiStoreId = beembaiStore?._id;

    const beembaiOrders = orders.filter((o) => {
      if (o.status === "placed" && o.paymentStatus !== "paid") return false;
      return (
        o.isImportOrder === true ||
        (beembaiStoreId && o.items.some((item) => item.storeId === beembaiStoreId))
      );
    });

    const newBeembaiOrdersCount = beembaiOrders.filter(
      (o) => o.status === "placed"
    ).length;

    return {
      totalUsers: users.length,
      totalStores: stores.length,
      pendingStores: stores.filter((s) => s.status === "pending").length,
      approvedStores: stores.filter(
        (s) => s.status === "approved" || s.status === undefined
      ).length,
      rejectedStores: stores.filter((s) => s.status === "rejected").length,
      storesUnderVerification: stores.filter(
        (s) => s.verificationStatus === "under_review"
      ).length,
      totalProducts: products.length,
      pendingProducts: products.filter((p) => p.status === "pending").length,
      approvedProducts: products.filter(
        (p) => p.status === "approved" || p.status === undefined
      ).length,
      rejectedProducts: products.filter((p) => p.status === "rejected").length,
      featuredProducts: products.filter((p) => p.isFeatured).length,
      sponsoredProducts: products.filter((p) => p.isSponsored).length,
      totalOrders: orders.length,
      beembaiOrders: beembaiOrders.length,
      newBeembaiOrders: newBeembaiOrdersCount,
      paidOrders: orders.filter((o) => o.paymentStatus === "paid").length,
      pendingOrders: orders.filter((o) => (o.status === "placed" && o.paymentStatus === "paid") || o.status === "processing").length,
      totalRevenue,
    };
  },
});

// Get recent items for activity feed
export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [recentOrders, recentStores, recentProducts] = await Promise.all([
      ctx.db.query("orders").order("desc").take(5),
      ctx.db.query("stores").order("desc").take(5),
      ctx.db.query("products").order("desc").take(5),
    ]);

    return { recentOrders, recentStores, recentProducts };
  },
});

// ── Store Management ──────────────────────────────────────

export const getAllStores = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("all")
    )),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let query = ctx.db.query("stores");

    let baseQuery = query.order("desc");

    if (args.status && args.status !== "all") {
      baseQuery = baseQuery.filter((q) => q.eq(q.field("status"), args.status)) as any;
    }

    const results = await baseQuery.paginate(args.paginationOpts);

    // Resolve owner info
    const page = await Promise.all(
      results.page.map(async (store) => {
        const owner = store.userId ? await ctx.db.get(store.userId) : null;
        const productCount = await ctx.db
          .query("products")
          .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
          .collect();
        return {
          ...store,
          ownerName: owner?.name ?? "Unknown",
          ownerEmail: owner?.email ?? "Unknown",
          productCount: productCount.length,
        };
      })
    );

    return {
      ...results,
      page,
    };
  },
});

export const getStoreByIdAdmin = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const store = await ctx.db.get(args.storeId);
    if (!store) return null;
    const owner = store.userId ? await ctx.db.get(store.userId) : null;
    const products = await ctx.db
      .query("products")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
    return { ...store, owner, products };
  },
});

export const approveStore = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.storeId, {
      status: "approved",
      verified: true,
    });
  },
});

export const rejectStore = mutation({
  args: { storeId: v.id("stores"), reason: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.storeId, {
      status: "rejected",
      verified: false,
      rejectionReason: args.reason,
    });
  },
});

export const adminSetStoreVerification = mutation({
  args: {
    storeId: v.id("stores"),
    verificationStatus: v.union(
      v.literal("unverified"),
      v.literal("under_review"),
      v.literal("verified")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.storeId, {
      verificationStatus: args.verificationStatus,
      verified: args.verificationStatus === "verified",
    });
  },
});

// ── Product Management ────────────────────────────────────

export const getAllProducts = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("all")
    )),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let query = ctx.db.query("products").order("desc");

    if (args.status && args.status !== "all") {
      query = query.filter((q) => q.eq(q.field("status"), args.status)) as any;
    }

    const results = await query.paginate(args.paginationOpts);

    // Attach store name
    const page = await Promise.all(
      results.page.map(async (product) => {
        const store = product.storeId ? await ctx.db.get(product.storeId) : null;
        return {
          ...product,
          storeName: store?.name ?? "Direct (no store)",
        };
      })
    );

    return {
      ...results,
      page,
    };
  },
});

export const getProductByIdAdmin = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    const store = product.storeId ? await ctx.db.get(product.storeId) : null;
    return { ...product, store };
  },
});

export const approveProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.productId, {
      status: "approved",
    });
  },
});

export const rejectProduct = mutation({
  args: { productId: v.id("products"), reason: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.productId, {
      status: "rejected",
      rejectionReason: args.reason,
    });
  },
});

export const setProductFeatured = mutation({
  args: { productId: v.id("products"), isFeatured: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.productId, { isFeatured: args.isFeatured });
  },
});

export const setProductSponsored = mutation({
  args: { productId: v.id("products"), isSponsored: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.productId, { isSponsored: args.isSponsored });
  },
});

export const setProductNewArrival = mutation({
  args: { productId: v.id("products"), isNewArrival: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.productId, { isNewArrival: args.isNewArrival });
  },
});

export const deleteProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.productId);
  },
});

// ── Category Management ───────────────────────────────────

export const getAllCategoriesAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("categories").collect();
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    bannerImage: v.string(),
    filterValue: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // Check slug uniqueness
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) throw new Error("A category with this slug already exists");
    return await ctx.db.insert("categories", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      bannerImage: args.bannerImage,
      filterValue: args.filterValue,
    });
  },
});

export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    bannerImage: v.string(),
    filterValue: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { categoryId, ...fields } = args;
    await ctx.db.patch(categoryId, fields);
    return categoryId;
  },
});

export const deleteCategory = mutation({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.categoryId);
  },
});

export const getCategoryByIdAdmin = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.categoryId);
  },
});

// ── Order Management ──────────────────────────────────────

export const getAllOrdersAdmin = query({
  args: {
    status: v.optional(v.union(
      v.literal("placed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("all")
    )),
    paymentStatus: v.optional(v.union(
      v.literal("paid"),
      v.literal("unpaid"),
      v.literal("failed"),
      v.literal("all")
    )),
    orderType: v.optional(v.union(
      v.literal("all"),
      v.literal("regular"),
      v.literal("import")
    )),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let query = ctx.db.query("orders").order("desc");

    // Exclude placed but unpaid orders
    query = query.filter((q) =>
      q.or(
        q.neq(q.field("status"), "placed"),
        q.eq(q.field("paymentStatus"), "paid")
      )
    ) as any;

    if (args.status && args.status !== "all") {
      query = query.filter((q) => q.eq(q.field("status"), args.status)) as any;
    }
    if (args.paymentStatus && args.paymentStatus !== "all") {
      query = query.filter((q) => q.eq(q.field("paymentStatus"), args.paymentStatus)) as any;
    }
    if (args.orderType === "import") {
      query = query.filter((q) => q.eq(q.field("isImportOrder"), true)) as any;
    } else if (args.orderType === "regular") {
      query = query.filter((q) => q.neq(q.field("isImportOrder"), true)) as any;
    }

    const results = await query.paginate(args.paginationOpts);

    // Attach buyer info
    const page = await Promise.all(
      results.page.map(async (order) => {
        const buyer = order.userId ? await ctx.db.get(order.userId) : null;
        return {
          ...order,
          buyerName: buyer?.name ?? order.address.fullName ?? "Guest",
          buyerEmail: buyer?.email ?? order.email ?? "Guest",
        };
      })
    );

    return {
      ...results,
      page,
    };
  },
});

export const getOrderByIdAdmin = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    const buyer = order.userId ? await ctx.db.get(order.userId) : null;
    return { ...order, buyer };
  },
});

export const adminUpdateOrderStatus = mutation({
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

    const defaultMessages: Record<string, string> = {
      placed: "Order placed successfully.",
      processing: "Order is being processed by the admin.",
      shipped: "Order has been shipped.",
      delivered: "Order has been delivered.",
      cancelled: "Order has been cancelled by admin.",
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
  },
});

// ── User Management ───────────────────────────────────────

export const getAllUsers = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const results = await ctx.db.query("users").order("desc").paginate(args.paginationOpts);

    const page = await Promise.all(
      results.page.map(async (user) => {
        const store = await ctx.db
          .query("stores")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .first();
        const orderCount = (
          await ctx.db
            .query("orders")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect()
        ).length;
        return {
          ...user,
          hasStore: !!store,
          storeName: store?.name,
          storeStatus: store?.status,
          orderCount,
        };
      })
    );

    return {
      ...results,
      page,
    };
  },
});

export const setUserAdminRole = mutation({
  args: { userId: v.id("users"), isAdmin: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { isAdmin: args.isAdmin });
  },
});

export const setUserBanned = mutation({
  args: { userId: v.id("users"), isBanned: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { isBanned: args.isBanned });
  },
});
