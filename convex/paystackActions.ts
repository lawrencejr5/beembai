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

/**
 * Verify inline Paystack payment for a multi-store checkout (all child orders).
 */
export const verifyInlinePaymentForCheckout = action({
  args: {
    checkoutId: v.string(),
    reference: v.string(),
    saveCard: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
    // 1. Fetch all orders for this checkoutId
    const orders = await ctx.runQuery((internal as any).orders.getOrdersByCheckoutIdInternal, {
      checkoutId: args.checkoutId,
    });
    if (!orders || orders.length === 0) {
      throw new Error(`No orders found for checkout: ${args.checkoutId}`);
    }

    const allPaid = orders.every((o: any) => o.paymentStatus === "paid");
    if (allPaid) {
      return { success: true, message: "Checkout is already paid" };
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }

    // 2. Verify transaction with Paystack
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
      await ctx.runMutation((internal as any).orders.markCheckoutFailedInternal, {
        checkoutId: args.checkoutId,
      });
      return { success: false, message: "Transaction verification unsuccessful" };
    }

    // 3. Verify total checkout amount in kobo
    const expectedAmount =
      orders[0].totalCheckoutAmount ??
      orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
    const expectedAmountKobo = Math.round(expectedAmount * 100);

    if (Math.abs(data.data.amount - expectedAmountKobo) > 5) {
      throw new Error("Payment amount mismatch with checkout total amount");
    }

    // 4. Mark all orders as paid
    await ctx.runMutation((internal as any).orders.markCheckoutPaidInternal, {
      checkoutId: args.checkoutId,
      paystackReference: args.reference,
    });

    // 5. If requested and card authorization is reusable, save tokenized card
    if (args.saveCard && data.data?.authorization?.reusable) {
      const auth = data.data.authorization;
      const targetUserId = orders[0]?.userId ?? (await getAuthUserId(ctx));
      const customerEmail = data.data.customer?.email || orders[0]?.email || "";

      if (targetUserId && auth.authorization_code) {
        try {
          await ctx.runMutation((internal as any).billing.savePaymentMethodInternal, {
            userId: targetUserId,
            authorizationCode: auth.authorization_code,
            cardType: auth.card_type ?? "unknown",
            last4: auth.last4 ?? "****",
            expMonth: auth.exp_month ?? "",
            expYear: auth.exp_year ?? "",
            bank: auth.bank ?? "Unknown Bank",
            email: customerEmail,
          });
        } catch (saveErr) {
          console.error("Failed to save card payment method after checkout:", saveErr);
        }
      }
    }

    return { success: true, message: "Payment verified successfully" };
  },
});

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

    // If order has a checkoutId, verify all orders belonging to this checkout
    if (order.checkoutId) {
      const orders = await ctx.runQuery((internal as any).orders.getOrdersByCheckoutIdInternal, {
        checkoutId: order.checkoutId,
      });
      if (orders && orders.length > 0) {
        const allPaid = orders.every((o: any) => o.paymentStatus === "paid");
        if (allPaid) {
          return { success: true, message: "Order is already paid" };
        }

        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey) throw new Error("PAYSTACK_SECRET_KEY is not configured");

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
          await ctx.runMutation((internal as any).orders.markCheckoutFailedInternal, {
            checkoutId: order.checkoutId,
          });
          return { success: false, message: "Transaction verification unsuccessful" };
        }

        const expectedAmount =
          orders[0].totalCheckoutAmount ??
          orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
        const expectedAmountKobo = Math.round(expectedAmount * 100);

        if (Math.abs(data.data.amount - expectedAmountKobo) > 5) {
          throw new Error("Payment amount mismatch with checkout amount");
        }

        await ctx.runMutation((internal as any).orders.markCheckoutPaidInternal, {
          checkoutId: order.checkoutId,
          paystackReference: args.reference,
        });

        return { success: true, message: "Payment verified successfully" };
      }
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

/**
 * Server-side resolution and verification of a Nigerian bank account via Paystack API.
 */
export const resolveBankAccount = action({
  args: {
    accountNumber: v.string(),
    bankCode: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; accountName?: string; message?: string }> => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.log(`[Paystack Mock]: Resolving bank account ${args.accountNumber} for bank code ${args.bankCode}`);
      if (args.accountNumber.length === 10) {
        return {
          success: true,
          accountName: "VERIFIED ACCOUNT HOLDER",
          message: "Account verified (Development Mode)",
        };
      } else {
        return {
          success: false,
          message: "Invalid 10-digit account number.",
        };
      }
    }

    try {
      const response = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(
          args.accountNumber
        )}&bank_code=${encodeURIComponent(args.bankCode)}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.status) {
        return {
          success: false,
          message: data.message || "Could not resolve bank account details. Please check the account number and selected bank.",
        };
      }

      return {
        success: true,
        accountName: data.data.account_name,
        message: "Account resolved successfully",
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to reach Paystack verification service.",
      };
    }
  },
});
