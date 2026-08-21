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
    isAdmin: v.optional(v.boolean()),
    isBanned: v.optional(v.boolean()),
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
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    rejectionReason: v.optional(v.string()),
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
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    rejectionReason: v.optional(v.string()),
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

  // Paystack-tokenized payment methods — raw card numbers are NEVER stored
  paymentMethods: defineTable({
    userId: v.id("users"),
    authorizationCode: v.string(),  // Paystack reusable token
    cardType: v.string(),           // "visa" | "mastercard" | "verve" etc.
    last4: v.string(),              // e.g. "4081"
    expMonth: v.string(),           // e.g. "12"
    expYear: v.string(),            // e.g. "2027"
    bank: v.string(),               // e.g. "GTBank"
    email: v.string(),              // customer email used with Paystack
    isDefault: v.boolean(),
  }).index("by_userId", ["userId"]),

  // Customer shipping addresses
  addresses: defineTable({
    userId: v.id("users"),
    fullName: v.string(),
    phone: v.string(),
    streetAddress: v.string(),
    apartment: v.optional(v.string()),
    city: v.string(),
    stateName: v.string(),
    postalCode: v.string(),
    country: v.string(),
    isDefault: v.boolean(),
  }).index("by_userId", ["userId"]),

  // Customer Orders
  orders: defineTable({
    userId: v.id("users"),
    items: v.array(
      v.object({
        productId: v.id("products"),
        storeId: v.optional(v.id("stores")),
        title: v.string(),
        price: v.number(),
        quantity: v.number(),
        color: v.optional(v.string()),
        image: v.string(),
      })
    ),
    address: v.object({
      fullName: v.string(),
      phone: v.string(),
      streetAddress: v.string(),
      apartment: v.optional(v.string()),
      city: v.string(),
      stateName: v.string(),
      postalCode: v.string(),
      country: v.string(),
    }),
    shippingMethod: v.string(),
    shippingFee: v.number(),
    totalAmount: v.number(),
    paymentStatus: v.union(v.literal("unpaid"), v.literal("paid"), v.literal("failed")),
    status: v.union(
      v.literal("placed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    statusHistory: v.array(
      v.object({
        status: v.string(),
        timestamp: v.number(),
        message: v.string(),
      })
    ),
    paystackReference: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
});
