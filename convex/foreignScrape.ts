import { action } from "./_generated/server";
import { v } from "convex/values";

// Supported currencies and their approximate NGN exchange rates
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1600,
  GBP: 2020,
  EUR: 1750,
  CAD: 1180,
  AUD: 1040,
};

export { EXCHANGE_RATES };

function detectCurrencyFromSymbol(raw: string): string {
  if (raw.includes("£")) return "GBP";
  if (raw.includes("€")) return "EUR";
  if (raw === "CA$" || raw.includes("CAD")) return "CAD";
  if (raw.includes("AU$") || raw.includes("AUD")) return "AUD";
  return "USD";
}

/** Detect brand name from URL domain */
function detectBrandFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("amazon")) return "Amazon";
    if (hostname.includes("walmart")) return "Walmart";
    if (hostname.includes("zara")) return "Zara";
    if (hostname.includes("nike")) return "Nike";
    if (hostname.includes("adidas")) return "Adidas";
    if (hostname.includes("target")) return "Target";
    if (hostname.includes("louisvuitton")) return "Louis Vuitton";
    if (hostname.includes("calvinklein")) return "Calvin Klein";
    if (hostname.includes("fashionnova")) return "Fashion Nova";
    if (hostname.includes("backmarket")) return "Back Market";
    if (hostname.includes("invicta")) return "Invicta";
  } catch { /* no-op */ }
  return "International Store";
}

/** Infer the shipping origin country (ISO-2) from the store URL */
function detectOriginFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.endsWith(".co.uk") || host.endsWith(".uk")) return "GB";
    if (/aliexpress|temu|shein|alibaba|1688|taobao/.test(host)) return "CN";
    if (host.endsWith(".ca")) return "CA";
    if (host.endsWith(".com.au")) return "AU";
    if (/\.(de|fr|it|es|nl)$/.test(host)) return "EU";
  } catch { /* no-op */ }
  return "US";
}

/** Category-based default weights (kg) when the page doesn't list one */
const DEFAULT_WEIGHT_RULES: [RegExp, number][] = [
  [/laptop|macbook|notebook/i, 2.5],
  [/tv|television|monitor/i, 6],
  [/phone|iphone|galaxy|pixel|tablet|ipad/i, 0.7],
  [/headphone|earbud|airpod|speaker|watch/i, 0.5],
  [/shoe|sneaker|boot|trainer|jordan|slide/i, 1.2],
  [/jacket|hoodie|coat|jeans|sweater/i, 0.9],
  [/shirt|tee|t-shirt|dress|top|short|skirt/i, 0.4],
  [/bag|backpack|handbag|purse/i, 0.9],
];

function estimateWeightKg(title: string, extractedKg: number | null): number {
  if (extractedKg && extractedKg > 0) return Math.round(extractedKg * 100) / 100;
  for (const [re, kg] of DEFAULT_WEIGHT_RULES) if (re.test(title)) return kg;
  return 1;
}

/**
 * Scrape a product URL using Firecrawl's /v1/scrape endpoint with
 * structured JSON extraction. Returns a normalized product object.
 */
export const scrapeProductUrl = action({
  args: {
    url: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY is not configured in environment variables.");
    }

    const extractSchema = {
      type: "object",
      properties: {
        title: { type: "string", description: "Full product name/title" },
        price: { type: "number", description: "Numeric price value without currency symbol" },
        currency: { type: "string", description: "Currency code or symbol (USD, GBP, EUR, $, £, €, etc.)" },
        imageUrl: { type: "string", description: "Absolute URL of the main product image" },
        description: { type: "string", description: "Product description or short summary" },
        brand: { type: "string", description: "Brand or manufacturer name" },
        inStock: { type: "boolean", description: "Whether the product is currently available/in stock" },
        variants: {
          type: "array",
          items: { type: "string" },
          description: "Available sizes, colors, or other option values as an array of strings",
        },
        rating: { type: "number", description: "Star rating out of 5, if available" },
        reviewCount: { type: "number", description: "Total number of customer reviews, if available" },
        weightKg: { type: "number", description: "Item shipping weight converted to kilograms, if listed on the page" },
      },
      required: ["title", "price"],
    };

    const requestBody = {
      url: args.url,
      formats: ["extract"],
      extract: {
        schema: extractSchema,
        prompt:
          "Extract the product title, numeric price (no symbols), currency (3-letter code like USD/GBP/EUR or the symbol), the main product image absolute URL, a short description, the brand name, whether it is in stock (true/false), available variants like sizes or colors as string array, star rating, and review count. For price output only the number.",
      },
    };

    let rawResponse: Response;
    try {
      rawResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
    } catch {
      throw new Error("Network error: Could not reach Firecrawl. Please try again.");
    }

    if (!rawResponse.ok) {
      const errText = await rawResponse.text();
      if (rawResponse.status === 401) throw new Error("Firecrawl API key is invalid or expired.");
      if (rawResponse.status === 402) throw new Error("Firecrawl API credits exhausted.");
      if (rawResponse.status === 429) throw new Error("Too many requests. Please wait and try again.");
      throw new Error(`Firecrawl error (${rawResponse.status}): ${errText.slice(0, 200)}`);
    }

    const data = (await rawResponse.json()) as Record<string, unknown>;

    if (!data.success) {
      throw new Error(
        "Firecrawl could not access or parse that page. The store may be blocking scrapers."
      );
    }

    // Navigate into the response shape: { success, extract: {...} } or { success, data: { extract: {...} } }
    const extract =
      (data.extract as Record<string, unknown> | undefined) ??
      ((data.data as Record<string, unknown> | undefined)?.extract as Record<string, unknown> | undefined) ??
      {};

    const title =
      typeof extract.title === "string" && extract.title.trim()
        ? extract.title.trim()
        : null;

    if (!title) {
      throw new Error(
        "Could not extract product information. The URL may not point to a product page, or the store is blocking access. You can edit the details manually below."
      );
    }

    // Normalize price
    let price = 0;
    if (typeof extract.price === "number" && extract.price > 0) {
      price = extract.price;
    } else if (typeof extract.price === "string") {
      price = parseFloat((extract.price as string).replace(/[^0-9.]/g, "")) || 0;
    }

    // Normalize currency
    let currency = (typeof extract.currency === "string" ? extract.currency : "USD")
      .toUpperCase()
      .trim();
    if (currency === "$" || currency === "US$" || currency === "USD") currency = "USD";
    else if (currency === "£") currency = "GBP";
    else if (currency === "€") currency = "EUR";
    else if (currency.length !== 3) currency = detectCurrencyFromSymbol(currency);

    // Normalize image
    let imageUrl = typeof extract.imageUrl === "string" ? extract.imageUrl.trim() : "";
    try {
      if (imageUrl) new URL(imageUrl); // validate
    } catch {
      imageUrl = "";
    }

    const description =
      typeof extract.description === "string"
        ? extract.description.slice(0, 800).trim()
        : "Imported product from international store.";

    const brand =
      typeof extract.brand === "string" && extract.brand.trim()
        ? extract.brand.trim()
        : detectBrandFromUrl(args.url);

    const inStock =
      typeof extract.inStock === "boolean" ? extract.inStock : true;

    const variants: string[] = Array.isArray(extract.variants)
      ? (extract.variants as unknown[])
          .filter((item): item is string => typeof item === "string")
          .slice(0, 20)
      : [];

    const rating = typeof extract.rating === "number" ? extract.rating : null;
    const reviewCount = typeof extract.reviewCount === "number" ? extract.reviewCount : null;

    return {
      title,
      price,
      currency,
      imageUrl,
      description,
      brand,
      inStock,
      variants,
      rating,
      reviewCount,
      originCountry: detectOriginFromUrl(args.url),
      weightKg: estimateWeightKg(
        title,
        typeof extract.weightKg === "number" ? extract.weightKg : null,
      ),
      sourceUrl: args.url,
    };
  },
});
