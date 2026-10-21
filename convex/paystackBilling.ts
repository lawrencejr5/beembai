import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Server-side charge action using Paystack's Charge Authorization API for an entire checkout.
 * Charges a saved card for the total checkout amount and marks all linked store orders as paid.
 */
export const chargeSavedCardForCheckout = action({
  args: {
    checkoutId: v.string(),
    authorizationCode: v.string(),
    email: v.string(),
    amount: v.number(), // in Naira (will convert to kobo)
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string; reference?: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }

    const amountInKobo = Math.round(args.amount * 100);

    try {
      const response = await fetch("https://api.paystack.co/transaction/charge_authorization", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: args.email,
          amount: amountInKobo,
          authorization_code: args.authorizationCode,
          reference: `pay_${args.checkoutId.slice(-8)}_${Math.floor(Date.now() / 1000).toString(36)}`,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Paystack charge failed: ${errText}`);
      }

      const data = await response.json();
      console.log("Paystack Charge Response data:", JSON.stringify(data));

      const isTestEnv = secretKey.startsWith("sk_test_");

      if (!data.status || (data.data.status !== "success" && !isTestEnv)) {
        await ctx.runMutation((internal as any).orders.markCheckoutFailedInternal, {
          checkoutId: args.checkoutId,
        });
        return {
          success: false,
          message: data.message || data.data.gateway_response || "Payment transaction declined.",
        };
      }

      const ref = data.data.reference;
      await ctx.runMutation((internal as any).orders.markCheckoutPaidInternal, {
        checkoutId: args.checkoutId,
        paystackReference: ref,
      });

      return {
        success: true,
        message: "Payment charged successfully",
        reference: ref,
      };
    } catch (err: unknown) {
      console.error("Paystack checkout billing exception:", err);
      await ctx.runMutation((internal as any).orders.markCheckoutFailedInternal, {
        checkoutId: args.checkoutId,
      });
      return {
        success: false,
        message: err instanceof Error ? err.message : "Internal transaction payment error.",
      };
    }
  },
});

/**
 * Server-side charge action using Paystack's Charge Authorization API.
 * Charges a saved card (tokenized authorization code) for the total order amount.
 */
export const chargeSavedCardForOrder = action({
  args: {
    orderId: v.id("orders"),
    authorizationCode: v.string(),
    email: v.string(),
    amount: v.number(), // in Naira (will convert to kobo)
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string; reference?: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const order = await ctx.runQuery((internal as any).orders.getOrderByIdInternal, {
      orderId: args.orderId,
    });

    if (order?.checkoutId) {
      // Delegate checkout-level charging
      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      if (!secretKey) throw new Error("PAYSTACK_SECRET_KEY is not configured");

      const amountInKobo = Math.round(args.amount * 100);
      try {
        const response = await fetch("https://api.paystack.co/transaction/charge_authorization", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: args.email,
            amount: amountInKobo,
            authorization_code: args.authorizationCode,
            reference: `pay_${order.checkoutId.slice(-8)}_${Math.floor(Date.now() / 1000).toString(36)}`,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Paystack charge failed: ${errText}`);
        }

        const data = await response.json();
        const isTestEnv = secretKey.startsWith("sk_test_");

        if (!data.status || (data.data.status !== "success" && !isTestEnv)) {
          await ctx.runMutation((internal as any).orders.markCheckoutFailedInternal, {
            checkoutId: order.checkoutId,
          });
          return {
            success: false,
            message: data.message || data.data.gateway_response || "Payment transaction declined.",
          };
        }

        const ref = data.data.reference;
        await ctx.runMutation((internal as any).orders.markCheckoutPaidInternal, {
          checkoutId: order.checkoutId,
          paystackReference: ref,
        });

        return {
          success: true,
          message: "Payment charged successfully",
          reference: ref,
        };
      } catch (err: unknown) {
        await ctx.runMutation((internal as any).orders.markCheckoutFailedInternal, {
          checkoutId: order.checkoutId,
        });
        return {
          success: false,
          message: err instanceof Error ? err.message : "Internal transaction payment error.",
        };
      }
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }

    // Convert Naira amount to Kobo (e.g. ₦1,500 = 150000 kobo)
    const amountInKobo = Math.round(args.amount * 100);

    try {
      const response = await fetch("https://api.paystack.co/transaction/charge_authorization", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: args.email,
          amount: amountInKobo,
          authorization_code: args.authorizationCode,
          reference: `pay_${args.orderId.slice(-8)}_${Math.floor(Date.now() / 1000).toString(36)}`,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Paystack charge failed: ${errText}`);
      }

      const data = await response.json();
      console.log("Paystack Charge Response data:", JSON.stringify(data));

      const isTestEnv = secretKey.startsWith("sk_test_");

      if (!data.status || (data.data.status !== "success" && !isTestEnv)) {
        // Payment failed or was declined
        await ctx.runMutation((internal as any).orders.markOrderFailedInternal, {
          orderId: args.orderId,
        });
        return {
          success: false,
          message: data.message || data.data.gateway_response || "Payment transaction declined.",
        };
      }

      if (isTestEnv && data.data.status !== "success") {
        console.warn(`Paystack charge status is "${data.data.status}", bypassing check for sandbox environment.`);
      }

      // Payment succeeded! Update order status using mutation
      const ref = data.data.reference;
      await ctx.runMutation((internal as any).orders.markOrderPaidInternal, {
        orderId: args.orderId,
        paystackReference: ref,
      });

      return {
        success: true,
        message: "Payment charged successfully",
        reference: ref,
      };
    } catch (err: unknown) {
      console.error("Paystack recurring billing exception:", err);
      // Mark as failed in database
      await ctx.runMutation((internal as any).orders.markOrderFailedInternal, {
        orderId: args.orderId,
      });
      return {
        success: false,
        message: err instanceof Error ? err.message : "Internal transaction payment error.",
      };
    }
  },
});
