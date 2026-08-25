import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Server-side verification of a Paystack transaction.
 *
 * Why this exists: The frontend cannot be trusted to send us an
 * authorization_code directly. We must verify the transaction reference
 * server-side from Paystack before saving any card data to the database.
 *
 * Flow:
 *   1. User completes Paystack popup → frontend receives { reference }
 *   2. Frontend calls this action with { reference, email }
 *   3. We call Paystack's Verify API with our secret key
 *   4. On success, we extract authorization_code + card metadata
 *   5. We call the savePaymentMethod mutation to persist to Convex
 */
export const verifyAndSaveCard = action({
  args: {
    reference: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; id: any }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }

    // Verify the transaction with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(args.reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Paystack verification failed: ${text}`);
    }

    const data = await response.json();

    if (!data.status || data.data.status !== "success") {
      throw new Error("Transaction was not successful");
    }

    const authorization = data.data.authorization;
    if (!authorization || !authorization.reusable) {
      throw new Error("Card is not reusable — cannot be saved");
    }

    // Save the tokenized card to Convex (never stores raw card data)
    // Cast api to any to bypass TS7022 circular type dependency loop
    const id = await ctx.runMutation((api as any).billing.savePaymentMethod, {
      authorizationCode: authorization.authorization_code,
      cardType: authorization.card_type ?? "unknown",
      last4: authorization.last4 ?? "****",
      expMonth: authorization.exp_month ?? "",
      expYear: authorization.exp_year ?? "",
      bank: authorization.bank ?? "Unknown Bank",
      email: args.email,
    });

    return { success: true, id };
  },
});

/**
 * Server-side verification of a standard/inline Paystack payment.
 *
 * Flow:
 *   1. Frontend creates an unpaid order.
 *   2. Frontend invokes Paystack Inline popup with order amount and guest/user email.
 *   3. Paystack returns { reference }.
 *   4. Frontend calls this action with { orderId, reference }.
 *   5. We call Paystack's Verify API with our secret key.
 *   6. We verify the transaction was successful and the amount matches.
 *   7. We mark the order as paid using internal mutations.
 */
export const verifyInlinePaymentForOrder = action({
  args: {
    orderId: v.id("orders"),
    reference: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
    // 1. Fetch order details using internal query
    const order = await ctx.runQuery((internal as any).orders.getOrderByIdInternal, {
      orderId: args.orderId,
    });
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.paymentStatus === "paid") {
      return { success: true, message: "Order is already paid" };
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }

    // 2. Verify the transaction with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(args.reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Paystack verification failed: ${text}`);
    }

    const data = await response.json();

    if (!data.status || data.data.status !== "success") {
      // Mark as failed in database
      await ctx.runMutation((internal as any).orders.markOrderFailedInternal, {
        orderId: args.orderId,
      });
      return { success: false, message: "Transaction verification unsuccessful" };
    }

    // Verify amount matches order amount (convert order.totalAmount to kobo)
    const expectedAmountKobo = Math.round(order.totalAmount * 100);
    // Paystack returns amount in kobo
    if (Math.abs(data.data.amount - expectedAmountKobo) > 5) {
      throw new Error("Payment amount mismatch with order amount");
    }

    // 3. Payment succeeded! Mark order as paid
    await ctx.runMutation((internal as any).orders.markOrderPaidInternal, {
      orderId: args.orderId,
      paystackReference: args.reference,
    });

    return { success: true, message: "Payment verified successfully" };
  },
});
