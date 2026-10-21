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
    sizes: v.optional(v.array(v.string())),
    gender: v.optional(v.string()),
    material: v.optional(v.string()),
    warranty: v.optional(v.string()),
    weight: v.optional(v.string()),
    weightClass: v.optional(v.string()),
    ram: v.optional(v.string()),
    storage: v.optional(v.string()),
    batteryCapacity: v.optional(v.string()),
    screenSize: v.optional(v.string()),
    displayType: v.optional(v.string()),
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
    rating: v.optional(v.number()),
    numReviews: v.optional(v.number()),
    inStock: v.optional(v.boolean()),
    sourceUrl: v.optional(v.string()),
    variants: v.optional(v.array(v.string())),
    originCountry: v.optional(v.string()),
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
    addressLine2: v.optional(v.string()),
    city: v.optional(v.string()),
    lga: v.optional(v.string()),
    stateName: v.optional(v.string()),
    country: v.optional(v.string()),
    // US Fulfillment Warehouse (Foreign Imports)
    usWarehouseAddress: v.optional(v.string()),
    usWarehouseCity: v.optional(v.string()),
    usWarehouseCounty: v.optional(v.string()),
    usWarehouseState: v.optional(v.string()),
    usWarehouseZip: v.optional(v.string()),
    usWarehousePhone: v.optional(v.string()),
    usWarehouseContactName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    bankName: v.optional(v.string()),
    bankCode: v.optional(v.string()),
    accountName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    routingNumber: v.optional(v.string()),
    recipientCode: v.optional(v.string()), // Paystack transfer recipient code
    verificationStatus: v.optional(v.union(v.literal("unverified"), v.literal("under_review"), v.literal("verified"))),
    businessRegistrationFile: v.optional(v.string()),
    taxId: v.optional(v.string()),
    corporateBankAccount: v.optional(v.string()),
    proofOfAddressFile: v.optional(v.string()),
    faceVerificationImage: v.optional(v.string()),
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
    lga: v.optional(v.string()),
    stateName: v.string(),
    postalCode: v.string(),
    country: v.string(),
    isDefault: v.boolean(),
  }).index("by_userId", ["userId"]),

  // Customer Orders
  orders: defineTable({
    userId: v.optional(v.id("users")),
    email: v.optional(v.string()),
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
      lga: v.optional(v.string()),
      stateName: v.string(),
      postalCode: v.string(),
      country: v.string(),
      pickupStationName: v.optional(v.string()),
      pickupStationAddress: v.optional(v.string()),
      pickupStationId: v.optional(v.number()),
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
    isImportOrder: v.optional(v.boolean()),
    waybillNumber: v.optional(v.string()),
    giglStatus: v.optional(v.string()),
    giglShipmentDetails: v.optional(v.any()),
    vendorWaybills: v.optional(
      v.array(
        v.object({
          storeId: v.id("stores"),
          waybillNumber: v.string(),
          status: v.string(),
        })
      )
    ),
    shipments: v.optional(
      v.array(
        v.object({
          storeId: v.optional(v.id("stores")),
          status: v.string(),
          statusHistory: v.array(
            v.object({
              status: v.string(),
              timestamp: v.number(),
              message: v.string(),
              source: v.optional(v.string()),
            })
          ),
          waybillNumber: v.optional(v.string()),
          giglStatus: v.optional(v.string()),
          dispatchedAt: v.optional(v.number()),
        })
      )
    ),
    checkoutId: v.optional(v.string()),
    storeId: v.optional(v.id("stores")),
    subtotal: v.optional(v.number()),
    totalCheckoutAmount: v.optional(v.number()),
    isWalletCredited: v.optional(v.boolean()),
    isFundsReleased: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"])
    .index("by_waybillNumber", ["waybillNumber"])
    .index("by_storeId", ["storeId"])
    .index("by_checkoutId", ["checkoutId"])
    .index("by_storeId_and_status", ["storeId", "status"]),

  reviews: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    storeId: v.id("stores"),
    rating: v.number(),
    comment: v.string(),
  })
    .index("by_productId", ["productId"])
    .index("by_storeId", ["storeId"])
    .index("by_userId_and_productId", ["userId", "productId"]),

  exchangeRates: defineTable({
    rates: v.record(v.string(), v.number()),
    baseCurrency: v.string(),
    bufferPercent: v.number(),
    updatedAt: v.number(),
  }),

  storeWallets: defineTable({
    storeId: v.id("stores"),
    balance: v.number(),             // Total ledger balance in NGN (escrow + available)
    availableBalance: v.number(),    // Cleared balance in NGN ready for immediate withdrawal
    recipientCode: v.optional(v.string()), // Paystack transfer recipient code (RCP_xxxx)
    currency: v.string(),            // "NGN"
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_storeId", ["storeId"]),

  walletTransactions: defineTable({
    walletId: v.id("storeWallets"),
    storeId: v.id("stores"),
    amount: v.number(),              // In NGN
    type: v.union(
      v.literal("order_credit"),     // Credit on customer order placement (escrow)
      v.literal("withdrawal"),       // Debit on payout to merchant bank account
      v.literal("refund"),           // Debit if order was cancelled/refunded
      v.literal("adjustment")        // Admin correction
    ),
    status: v.union(
      v.literal("pending"),          // Held in escrow (undelivered) or payout processing
      v.literal("completed"),        // Funds cleared (delivered) or payout successful
      v.literal("failed"),           // Transfer rejected / failed (funds restored)
      v.literal("reversed")          // Refunded
    ),
    orderId: v.optional(v.id("orders")),
    description: v.string(),
    paystackTransferCode: v.optional(v.string()), // e.g. "TRF_xxx"
    paystackReference: v.optional(v.string()),
    fee: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_walletId", ["walletId"])
    .index("by_storeId", ["storeId"])
    .index("by_orderId", ["orderId"])
    .index("by_storeId_and_type", ["storeId", "type"]),
});

