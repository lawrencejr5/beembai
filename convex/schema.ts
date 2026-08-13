import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Extend the default users table to capture custom fields like phone
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
  }).index("email", ["email"]),

  cart: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    selectedColor: v.optional(v.string()),
    quantity: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_user_product", ["userId", "productId"]),

  categories: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    bannerImage: v.string(),
    filterValue: v.string(),
  }).index("by_slug", ["slug"]),

  products: defineTable({
    title: v.string(),
    categorySlug: v.string(),
    categoryName: v.string(),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    image: v.string(),
    tag: v.optional(v.string()),
    description: v.optional(v.string()),
    brand: v.optional(v.string()),
    condition: v.optional(v.string()),
    colors: v.optional(v.array(v.string())),
    productDetails: v.optional(v.array(v.string())),
    isFeatured: v.optional(v.boolean()),
    isNewArrival: v.optional(v.boolean()),
    isSponsored: v.optional(v.boolean()),
    stock: v.optional(v.number()),
    storeId: v.optional(v.id("stores")),
    images: v.optional(v.array(v.string())),
    youtubeLink: v.optional(v.string()),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"))),
  })
    .index("by_categorySlug", ["categorySlug"])
    .index("by_storeId", ["storeId"])
    .searchIndex("search_products", {
      searchField: "title",
      filterFields: ["categorySlug", "status"],
    }),

  stores: defineTable({
    name: v.string(),
    slug: v.string(),
    logo: v.string(),
    banner: v.string(),
    rating: v.number(),
    verified: v.boolean(),
    category: v.string(),
    description: v.string(),
    bannerMessage: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"))),
    physicalAddress: v.optional(v.string()),
    city: v.optional(v.string()),
    stateName: v.optional(v.string()),
    country: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    bankName: v.optional(v.string()),
    accountName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    routingNumber: v.optional(v.string()),
    verificationStatus: v.optional(v.union(v.literal("unverified"), v.literal("under_review"), v.literal("verified"))),
    businessRegistrationFile: v.optional(v.string()),
    taxId: v.optional(v.string()),
    corporateBankAccount: v.optional(v.string()),
    proofOfAddressFile: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_userId", ["userId"]),

  storeVerifications: defineTable({
    email: v.string(),
    code: v.string(),
    expiresAt: v.number(),
  }).index("by_email", ["email"]),
});
