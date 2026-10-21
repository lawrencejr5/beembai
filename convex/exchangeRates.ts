import { query, action, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * Fallback rates calculated based on realistic market cross-rates with a +3% card settlement buffer.
 * Used if the database has not been seeded yet or the external feed is temporarily unreachable.
 */
export const DEFAULT_FALLBACK_RATES: Record<string, number> = {
  USD: 1373,
  GBP: 1834,
  EUR: 1541,
  CAD: 976,
  AUD: 961,
};

export const DEFAULT_BUFFER_PERCENT = 3;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Returns active exchange rates from database cache.
 * Reactive query for real-time storefront UI updates.
 */
export const getExchangeRates = query({
  args: {},
  handler: async (ctx) => {
    const record = await ctx.db.query("exchangeRates").first();
    const now = Date.now();

    if (!record) {
      return {
        rates: DEFAULT_FALLBACK_RATES,
        baseCurrency: "USD",
        bufferPercent: DEFAULT_BUFFER_PERCENT,
        updatedAt: now,
        isStale: true,
      };
    }

    const isStale = now - record.updatedAt > CACHE_TTL_MS;

    return {
      rates: record.rates,
      baseCurrency: record.baseCurrency,
      bufferPercent: record.bufferPercent,
      updatedAt: record.updatedAt,
      isStale,
    };
  },
});

/**
 * Internal mutation to store fetched rates into the exchangeRates table.
 */
export const saveExchangeRates = internalMutation({
  args: {
    rates: v.record(v.string(), v.number()),
    baseCurrency: v.string(),
    bufferPercent: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("exchangeRates").first();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        rates: args.rates,
        baseCurrency: args.baseCurrency,
        bufferPercent: args.bufferPercent,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("exchangeRates", {
        rates: args.rates,
        baseCurrency: args.baseCurrency,
        bufferPercent: args.bufferPercent,
        updatedAt: now,
      });
    }
  },
});

/**
 * Helper to fetch live FX rates, compute cross rates with buffer, and persist in DB.
 */
async function executeSyncLiveRates(
  ctx: { runMutation: any },
  bufferPercent?: number
) {
  const buffer = bufferPercent ?? DEFAULT_BUFFER_PERCENT;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) {
      throw new Error(`FX API responded with status ${res.status}`);
    }
    const data = await res.json();
    if (!data?.rates || typeof data.rates.NGN !== "number") {
      throw new Error("Invalid FX response format");
    }

    const usdToNgn = data.rates.NGN;
    const bufferMultiplier = 1 + buffer / 100;

    const supportedCurrencies = ["USD", "GBP", "EUR", "CAD", "AUD"];
    const rates: Record<string, number> = {};

    for (const curr of supportedCurrencies) {
      if (curr === "USD") {
        rates.USD = Math.round(usdToNgn * bufferMultiplier);
      } else {
        const rateAgainstUsd = data.rates[curr];
        if (typeof rateAgainstUsd === "number" && rateAgainstUsd > 0) {
          rates[curr] = Math.round((usdToNgn / rateAgainstUsd) * bufferMultiplier);
        } else {
          rates[curr] = DEFAULT_FALLBACK_RATES[curr] ?? 1366;
        }
      }
    }

    await ctx.runMutation(internal.exchangeRates.saveExchangeRates, {
      rates,
      baseCurrency: "USD",
      bufferPercent: buffer,
    });

    return { success: true, rates, bufferPercent: buffer };
  } catch (err: unknown) {
    console.error("[exchangeRates] Failed to fetch live rates:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Internal action used by scheduled cron jobs to sync exchange rates.
 */
export const syncLiveRates = internalAction({
  args: {
    bufferPercent: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await executeSyncLiveRates(ctx, args.bufferPercent);
  },
});

/**
 * Public action allowing storefront or admin to trigger an on-demand FX sync.
 */
export const refreshLiveRates = action({
  args: {
    bufferPercent: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await executeSyncLiveRates(ctx, args.bufferPercent);
  },
});
