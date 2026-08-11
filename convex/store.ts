import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Get user's store
export const getStoreByOwner = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

// Get ALL stores owned by the current user (supports multiple stores)
export const getStoresByOwner = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Get all products belonging to a specific store
export const getProductsByStore = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
  },
});

// Get a store by its slug, only if owned by the current user
export const getStoreBySlugForOwner = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!store || store.userId !== userId) return null;
    return store;
  },
});

// Get a store by its ID, only if owned by the current user (for edit pre-populate)
export const getStoreById = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const store = await ctx.db.get(args.storeId);
    if (!store || store.userId !== userId) return null;
    return store;
  },
});



// Helper slug generator
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Create a new store application
export const createStore = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    description: v.string(),
    physicalAddress: v.string(),
    city: v.string(),
    stateName: v.string(),
    country: v.string(),
    email: v.string(),
    phone: v.string(),
    bankName: v.string(),
    accountName: v.string(),
    accountNumber: v.string(),
    routingNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check if store already exists
    const existing = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      throw new Error("Store application already exists for this user");
    }

    let slug = generateSlug(args.name);
    // Ensure slug is unique
    let slugExists = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (slugExists) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const storeId = await ctx.db.insert("stores", {
      name: args.name,
      slug,
      logo: "",
      banner: "",
      rating: 5.0,
      verified: false,
      category: args.category,
      description: args.description,
      userId,
      status: "pending",
      physicalAddress: args.physicalAddress,
      city: args.city,
      stateName: args.stateName,
      country: args.country,
      email: args.email,
      phone: args.phone,
      bankName: args.bankName,
      accountName: args.accountName,
      accountNumber: args.accountNumber,
      routingNumber: args.routingNumber,
    });

    return storeId;
  },
});

// Update store details
export const updateStore = mutation({
  args: {
    storeId: v.id("stores"),
    name: v.string(),
    category: v.string(),
    description: v.string(),
    physicalAddress: v.string(),
    city: v.string(),
    stateName: v.string(),
    country: v.string(),
    email: v.string(),
    phone: v.string(),
    bankName: v.string(),
    accountName: v.string(),
    accountNumber: v.string(),
    routingNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const store = await ctx.db.get(args.storeId);
    if (!store || store.userId !== userId) {
      throw new Error("Unauthorized or Store not found");
    }

    // Update the store
    await ctx.db.patch(args.storeId, {
      name: args.name,
      category: args.category,
      description: args.description,
      physicalAddress: args.physicalAddress,
      city: args.city,
      stateName: args.stateName,
      country: args.country,
      email: args.email,
      phone: args.phone,
      bankName: args.bankName,
      accountName: args.accountName,
      accountNumber: args.accountNumber,
      routingNumber: args.routingNumber,
      status: "pending", // Reset status back to pending upon edit
    });

    return args.storeId;
  },
});

// Generate an upload URL for files (images)
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

// Update store logo image
export const updateStoreLogo = mutation({
  args: {
    storeId: v.id("stores"),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const store = await ctx.db.get(args.storeId);
    if (!store || store.userId !== userId) {
      throw new Error("Unauthorized or Store not found");
    }

    const logoUrl = await ctx.storage.getUrl(args.storageId);
    if (!logoUrl) {
      throw new Error("File not found");
    }

    await ctx.db.patch(args.storeId, { logo: logoUrl });
    return logoUrl;
  },
});

// Update store banner image
export const updateStoreBanner = mutation({
  args: {
    storeId: v.id("stores"),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const store = await ctx.db.get(args.storeId);
    if (!store || store.userId !== userId) {
      throw new Error("Unauthorized or Store not found");
    }

    const bannerUrl = await ctx.storage.getUrl(args.storageId);
    if (!bannerUrl) {
      throw new Error("File not found");
    }

    await ctx.db.patch(args.storeId, { banner: bannerUrl });
    return bannerUrl;
  },
});

// Update general store details (name, category, description, and location) from dashboard without resetting status
export const updateStoreDetails = mutation({
  args: {
    storeId: v.id("stores"),
    name: v.string(),
    category: v.string(),
    description: v.string(),
    physicalAddress: v.optional(v.string()),
    city: v.optional(v.string()),
    stateName: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const store = await ctx.db.get(args.storeId);
    if (!store || store.userId !== userId) {
      throw new Error("Unauthorized or Store not found");
    }

    await ctx.db.patch(args.storeId, {
      name: args.name,
      category: args.category,
      description: args.description,
      physicalAddress: args.physicalAddress,
      city: args.city,
      stateName: args.stateName,
      country: args.country,
    });

    return args.storeId;
  },
});


// Mutation to save the generated OTP
export const saveOTP = mutation({
  args: {
    email: v.string(),
    code: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Delete any old OTPs for this email
    const existing = await ctx.db
      .query("storeVerifications")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();

    for (const record of existing) {
      await ctx.db.delete(record._id);
    }

    await ctx.db.insert("storeVerifications", {
      email: args.email,
      code: args.code,
      expiresAt: args.expiresAt,
    });
  },
});

// Mutation to verify the OTP code
export const verifyEmailOTP = mutation({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("storeVerifications")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!record) {
      return false;
    }

    if (record.code !== args.code) {
      return false;
    }

    if (record.expiresAt < Date.now()) {
      return false;
    }

    // Clean up used OTP code
    await ctx.db.delete(record._id);
    return true;
  },
});

// Action to send OTP email
export const sendEmailOTP = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate 6 digit code
    const digits = "0123456789";
    let token = "";
    for (let i = 0; i < 6; i++) {
      token += digits[Math.floor(Math.random() * 10)];
    }

    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // Save token to database via mutation
    await ctx.runMutation(api.store.saveOTP, {
      email: args.email,
      code: token,
      expiresAt,
    });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not configured. Mocking email delivery.");
      return { success: true, mocked: true, token }; // return token for developer ease if mock
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Beembai <auth@resend.lawjun.ng>",
          to: [args.email],
          subject: "Verify your email for your Beembai Store",
          text: `Your verification code is ${token}`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API failed: ${errorText}`);
      }

      return { success: true, mocked: false };
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw new Error("Could not send verification email");
    }
  },
});

// Submit verification documents for a store
export const submitStoreVerification = mutation({
  args: {
    storeId: v.id("stores"),
    businessRegistrationFile: v.string(),
    taxId: v.string(),
    proofOfAddressFile: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const store = await ctx.db.get(args.storeId);
    if (!store || store.userId !== userId) {
      throw new Error("Unauthorized or Store not found");
    }

    await ctx.db.patch(args.storeId, {
      verificationStatus: "under_review",
      businessRegistrationFile: args.businessRegistrationFile,
      taxId: args.taxId,
      proofOfAddressFile: args.proofOfAddressFile,
    });

    return args.storeId;
  },
});

