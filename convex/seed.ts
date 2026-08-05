import { mutation } from "./_generated/server";
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

    // Seed Stores
    for (const store of STORES_DATA) {
      await ctx.db.insert("stores", {
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
    }

    // Seed Products
    for (const product of PRODUCTS_DATA) {
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
        storeId: product.storeId,
      });
    }

    return "Database seeded successfully!";
  },
});
