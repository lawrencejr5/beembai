import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { CATEGORIES_DATA, PRODUCTS_DATA, STORES_DATA } from "../app/data/data";

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if database is already seeded by checking categories table
    const existingCategory = await ctx.db.query("categories").first();
    if (existingCategory) {
      return "Database already seeded";
    }

    // Seed Categories
    for (const category of CATEGORIES_DATA) {
      await ctx.db.insert("categories", {
        slug: category.slug,
        name: category.name,
        description: category.description,
        bannerImage: category.bannerImage,
        filterValue: category.filterValue,
      });
    }

    // Seed Stores & build dummy-to-Convex ID map
    const storeIdMap = new Map<string, Id<"stores">>();
    for (const store of STORES_DATA) {
      const storeId = await ctx.db.insert("stores", {
        name: store.name,
        slug: store.slug,
        logo: store.logo,
        banner: store.banner,
        rating: store.rating,
        verified: store.verified,
        category: store.category,
        description: store.description,
        bannerMessage: store.bannerMessage,
      });
      storeIdMap.set(store.id, storeId);
    }

    // Seed Products using correct store IDs
    for (const product of PRODUCTS_DATA) {
      const convexStoreId = product.storeId ? storeIdMap.get(product.storeId) : undefined;
      await ctx.db.insert("products", {
        title: product.title,
        categorySlug: product.categorySlug,
        categoryName: product.categoryName,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        tag: product.tag,
        description: product.description,
        brand: product.brand,
        condition: product.condition,
        colors: product.colors,
        productDetails: product.productDetails,
        isFeatured: product.isFeatured,
        isNewArrival: product.isNewArrival,
        isSponsored: product.isSponsored,
        stock: product.stock,
        storeId: convexStoreId,
      });
    }

    return "Database seeded successfully!";
  },
});

export const migrateDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Get all stores from the DB
    const dbStores = await ctx.db.query("stores").collect();
    const slugToStoreId = new Map<string, Id<"stores">>();
    for (const store of dbStores) {
      slugToStoreId.set(store.slug, store._id);
    }

    // Map: customStoreId -> Convex store _id
    const customStoreIdToConvexId = new Map<string, Id<"stores">>();
    for (const storeData of STORES_DATA) {
      const convexId = slugToStoreId.get(storeData.slug);
      if (convexId) {
        customStoreIdToConvexId.set(storeData.id, convexId);
      }
    }

    // 2. Get all products from the DB
    const dbProducts = await ctx.db.query("products").collect();
    const titleToProductId = new Map<string, Id<"products">>();
    for (const product of dbProducts) {
      titleToProductId.set(product.title, product._id);
    }

    // Map: customProductId -> Convex product _id
    const customProductIdToConvexId = new Map<string, Id<"products">>();
    for (const productData of PRODUCTS_DATA) {
      const convexId = titleToProductId.get(productData.title);
      if (convexId) {
        customProductIdToConvexId.set(productData.id, convexId);
      }
    }

    // 3. Migrate products table (update storeId)
    let migratedProductsCount = 0;
    for (const product of dbProducts) {
      if (product.storeId && typeof product.storeId === "string") {
        // If the storeId matches a custom ID in our map, update it to the Convex Id
        const convexStoreId = customStoreIdToConvexId.get(product.storeId);
        if (convexStoreId) {
          await ctx.db.patch(product._id, {
            storeId: convexStoreId,
          });
          migratedProductsCount++;
        }
      }
    }

    // 4. Migrate cart table (update productId)
    const dbCarts = await ctx.db.query("cart").collect();
    let migratedCartsCount = 0;
    for (const cartItem of dbCarts) {
      // In cart schema, productId is now typed as v.id("products").
      // Temporarily cast or check if the value in DB is one of our custom product IDs.
      const rawProductId = cartItem.productId as unknown as string;
      if (typeof rawProductId === "string") {
        const convexProductId = customProductIdToConvexId.get(rawProductId);
        if (convexProductId) {
          await ctx.db.patch(cartItem._id, {
            productId: convexProductId,
          });
          migratedCartsCount++;
        }
      }
    }

    return {
      message: "Migration completed successfully",
      migratedProducts: migratedProductsCount,
      migratedCarts: migratedCartsCount,
    };
  },
});

