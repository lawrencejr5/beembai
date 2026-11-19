import { action } from "./_generated/server";
import { v } from "convex/values";

// Realistic fallback market rates (includes +3% card settlement buffer)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1373,
  GBP: 1834,
  EUR: 1541,
  CAD: 976,
  AUD: 961,
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
    if (hostname.includes("apple")) return "Apple";
    if (hostname.includes("samsung")) return "Samsung";
    if (hostname.includes("samsclub")) return "Sam's Club";
  } catch {
    /* no-op */
  }
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
  } catch {
    /* no-op */
  }
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
  if (extractedKg && extractedKg > 0)
    return Math.round(extractedKg * 100) / 100;
  for (const [re, kg] of DEFAULT_WEIGHT_RULES) if (re.test(title)) return kg;
  return 1;
}

export interface ScrapedOptionValue {
  label: string;
  price: number | null;
  priceDelta: number | null;
  inStock: boolean;
}

export interface ScrapedOptionGroup {
  name: string;
  values: ScrapedOptionValue[];
}

export interface ScrapedVariantPrice {
  attributes: { name: string; value: string }[];
  price: number;
  inStock: boolean;
}

function parseNumericPrice(val: unknown): number | null {
  if (typeof val === "number") {
    return Number.isFinite(val) && val > 0 ? Math.round(val * 100) / 100 : null;
  }
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.]/g, "");
    if (!cleaned) return null;
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) && parsed > 0
      ? Math.round(parsed * 100) / 100
      : null;
  }
  return null;
}

function parseNumericDelta(val: unknown): number | null {
  if (typeof val === "number") {
    return Number.isFinite(val) ? Math.round(val * 100) / 100 : null;
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    const match = trimmed.match(
      /^([+-])?\s*(?:US\$|CA\$|AU\$|[$£€])?\s*([\d,]+(?:\.\d+)?)$/,
    );
    if (!match) return null;
    const sign = match[1] === "-" ? -1 : 1;
    const num = parseFloat(match[2].replace(/,/g, ""));
    if (!Number.isFinite(num)) return null;
    return Math.round(sign * num * 100) / 100;
  }
  return null;
}

/**
 * Fallback parser used only when both explicit `price` and `priceDelta` are null.
 * Only triggers when an explicit currency symbol is present so bare numbers in
 * model names or sizes (e.g. "iPhone 16", "US 10", "256GB") are never stripped.
 */
function extractInlinePriceFromLabel(rawLabel: string): {
  label: string;
  price: number | null;
  priceDelta: number | null;
} {
  const trimmed = rawLabel.trim();
  if (!trimmed) {
    return { label: "", price: null, priceDelta: null };
  }

  // 1. Trailing parenthesized delta, e.g. "256GB (+$100)" or "Silver (+ $50.00)"
  const parenDeltaMatch = trimmed.match(
    /\s*\(\s*([+-])\s*(?:US\$|CA\$|AU\$|[$£€])\s*([\d,]+(?:\.\d+)?)\s*\)\s*$/i,
  );
  if (parenDeltaMatch) {
    const sign = parenDeltaMatch[1] === "-" ? -1 : 1;
    const num = parseFloat(parenDeltaMatch[2].replace(/,/g, ""));
    const cleaned = trimmed.slice(0, parenDeltaMatch.index).trim();
    if (Number.isFinite(num) && cleaned) {
      return {
        label: cleaned,
        price: null,
        priceDelta: Math.round(sign * num * 100) / 100,
      };
    }
  }

  // 2. Trailing unparenthesized delta, e.g. "256GB +$100" or "256GB - +$100"
  const inlineDeltaMatch = trimmed.match(
    /\s*(?:[-–—/,]\s*)?([+-])\s*(?:US\$|CA\$|AU\$|[$£€])\s*([\d,]+(?:\.\d+)?)\s*$/i,
  );
  if (inlineDeltaMatch) {
    const sign = inlineDeltaMatch[1] === "-" ? -1 : 1;
    const num = parseFloat(inlineDeltaMatch[2].replace(/,/g, ""));
    const cleaned = trimmed.slice(0, inlineDeltaMatch.index).trim();
    if (Number.isFinite(num) && cleaned) {
      return {
        label: cleaned,
        price: null,
        priceDelta: Math.round(sign * num * 100) / 100,
      };
    }
  }

  // 3. Trailing parenthesized price, e.g. "256GB ($899.99)"
  const parenPriceMatch = trimmed.match(
    /\s*\(\s*(?:US\$|CA\$|AU\$|[$£€])\s*([\d,]+(?:\.\d+)?)\s*\)\s*$/i,
  );
  if (parenPriceMatch) {
    const num = parseFloat(parenPriceMatch[1].replace(/,/g, ""));
    const cleaned = trimmed.slice(0, parenPriceMatch.index).trim();
    if (Number.isFinite(num) && num > 0 && cleaned) {
      return {
        label: cleaned,
        price: Math.round(num * 100) / 100,
        priceDelta: null,
      };
    }
  }

  // 4. Trailing unparenthesized price, e.g. "256GB - $899.99" or "256GB $899"
  const inlinePriceMatch = trimmed.match(
    /\s*(?:[-–—|,:]\s*|\s+)(?:US\$|CA\$|AU\$|[$£€])\s*([\d,]+(?:\.\d+)?)\s*$/i,
  );
  if (inlinePriceMatch) {
    const num = parseFloat(inlinePriceMatch[1].replace(/,/g, ""));
    const cleaned = trimmed.slice(0, inlinePriceMatch.index).trim();
    if (Number.isFinite(num) && num > 0 && cleaned) {
      return {
        label: cleaned,
        price: Math.round(num * 100) / 100,
        priceDelta: null,
      };
    }
  }

  return { label: trimmed, price: null, priceDelta: null };
}

function normalizeJsonLdAttrName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (lower === "color" || lower === "colour") return "Color";
  if (lower === "size") return "Size";
  if (lower === "material") return "Material";
  if (lower === "pattern") return "Pattern";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function extractOfferPriceAndStock(offersRaw: unknown): {
  price: number | null;
  inStock: boolean;
} {
  const offerList = Array.isArray(offersRaw)
    ? offersRaw
    : offersRaw && typeof offersRaw === "object"
      ? [offersRaw]
      : [];

  let bestPrice: number | null = null;
  let inStock = true;
  let sawAvailability = false;
  let anyInStock = false;

  for (const item of offerList) {
    if (!item || typeof item !== "object") continue;
    const offer = item as Record<string, unknown>;
    const priceSpec = offer.priceSpecification as
      | Record<string, unknown>
      | undefined;
    const candidatePrice =
      parseNumericPrice(offer.price) ??
      parseNumericPrice(offer.lowPrice) ??
      parseNumericPrice(priceSpec?.price);

    if (candidatePrice !== null && bestPrice === null) {
      bestPrice = candidatePrice;
    }

    if (typeof offer.availability === "string") {
      sawAvailability = true;
      if (!offer.availability.toLowerCase().includes("outofstock")) {
        anyInStock = true;
      }
    }
  }

  if (sawAvailability) {
    inStock = anyInStock;
  }

  return { price: bestPrice, inStock };
}

function extractJsonLdVariants(rawHtml: string): {
  variantPrices: ScrapedVariantPrice[];
  optionGroups: ScrapedOptionGroup[];
  offerChoices: ScrapedOptionValue[];
} {
  const variantPrices: ScrapedVariantPrice[] = [];
  const optionGroups: ScrapedOptionGroup[] = [];
  const offerChoices: ScrapedOptionValue[] = [];

  if (!rawHtml) {
    return { variantPrices, optionGroups, offerChoices };
  }

  try {
    const scriptRegex =
      /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    const nodes: Record<string, unknown>[] = [];

    const collectNodes = (value: unknown) => {
      if (!value) return;
      if (Array.isArray(value)) {
        for (const item of value) collectNodes(item);
        return;
      }
      if (typeof value === "object") {
        const obj = value as Record<string, unknown>;
        nodes.push(obj);
        if (Array.isArray(obj["@graph"])) {
          collectNodes(obj["@graph"]);
        }
      }
    };

    let match: RegExpExecArray | null;
    while ((match = scriptRegex.exec(rawHtml)) !== null) {
      const jsonText = match[1]?.trim();
      if (!jsonText) continue;
      try {
        const parsed = JSON.parse(jsonText);
        collectNodes(parsed);
      } catch {
        // Ignore malformed JSON-LD blocks
      }
    }

    const attrGroupMap = new Map<
      string,
      { displayName: string; values: Map<string, ScrapedOptionValue> }
    >();

    const addOptionAttr = (
      attrName: string,
      attrValue: string,
      inStock: boolean,
    ) => {
      const cleanName = normalizeJsonLdAttrName(attrName);
      const cleanVal = attrValue.trim();
      if (!cleanName || !cleanVal) return;

      const groupKey = cleanName.toLowerCase();
      if (!attrGroupMap.has(groupKey)) {
        attrGroupMap.set(groupKey, {
          displayName: cleanName,
          values: new Map(),
        });
      }
      const groupEntry = attrGroupMap.get(groupKey)!;
      const valKey = cleanVal.toLowerCase();
      const existing = groupEntry.values.get(valKey);
      if (!existing) {
        groupEntry.values.set(valKey, {
          label: cleanVal,
          price: null,
          priceDelta: null,
          inStock,
        });
      } else if (inStock && !existing.inStock) {
        existing.inStock = true;
      }
    };

    for (const node of nodes) {
      const rawType = node["@type"];
      const types = Array.isArray(rawType)
        ? rawType.map((t) => String(t).toLowerCase())
        : typeof rawType === "string"
          ? [rawType.toLowerCase()]
          : [];

      const isProduct = types.some(
        (t) => t === "productgroup" || t === "product" || t.endsWith("/product") || t.endsWith("/productgroup"),
      );
      if (!isProduct) continue;

      if (Array.isArray(node.hasVariant)) {
        for (const variantRaw of node.hasVariant) {
          if (!variantRaw || typeof variantRaw !== "object") continue;
          const variant = variantRaw as Record<string, unknown>;
          const { price, inStock } = extractOfferPriceAndStock(variant.offers);

          const attrs: { name: string; value: string }[] = [];
          const pushAttr = (name: string, val: unknown) => {
            if (typeof val === "string" && val.trim()) {
              attrs.push({ name: normalizeJsonLdAttrName(name), value: val.trim() });
            } else if (
              val &&
              typeof val === "object" &&
              typeof (val as Record<string, unknown>).name === "string"
            ) {
              const nestedName = String(
                (val as Record<string, unknown>).name,
              ).trim();
              if (nestedName) {
                attrs.push({
                  name: normalizeJsonLdAttrName(name),
                  value: nestedName,
                });
              }
            }
          };

          pushAttr("Color", variant.color);
          pushAttr("Size", variant.size);
          pushAttr("Material", variant.material);
          pushAttr("Pattern", variant.pattern);

          if (Array.isArray(variant.additionalProperty)) {
            for (const propRaw of variant.additionalProperty) {
              if (!propRaw || typeof propRaw !== "object") continue;
              const prop = propRaw as Record<string, unknown>;
              const pName =
                typeof prop.name === "string"
                  ? prop.name
                  : typeof prop.propertyID === "string"
                    ? prop.propertyID
                    : "";
              const pVal = prop.value;
              if (pName && (typeof pVal === "string" || typeof pVal === "number")) {
                attrs.push({
                  name: normalizeJsonLdAttrName(pName),
                  value: String(pVal).trim(),
                });
              }
            }
          }

          for (const attr of attrs) {
            addOptionAttr(attr.name, attr.value, inStock);
          }

          if (attrs.length > 0 && price !== null && price > 0) {
            variantPrices.push({
              attributes: attrs,
              price,
              inStock,
            });
          }
        }
      } else if (Array.isArray(node.offers) && node.offers.length > 1) {
        const seenOfferNames = new Set<string>();
        for (const offerRaw of node.offers) {
          if (!offerRaw || typeof offerRaw !== "object") continue;
          const offer = offerRaw as Record<string, unknown>;
          const rawName = typeof offer.name === "string" ? offer.name.trim() : "";
          const { price, inStock } = extractOfferPriceAndStock(offer);
          if (rawName && price !== null && price > 0) {
            const key = rawName.toLowerCase();
            if (!seenOfferNames.has(key)) {
              seenOfferNames.add(key);
              offerChoices.push({
                label: rawName,
                price,
                priceDelta: null,
                inStock,
              });
            }
          }
        }
      }
    }

    for (const group of attrGroupMap.values()) {
      const values = Array.from(group.values.values()).slice(0, 40);
      if (values.length > 0) {
        optionGroups.push({
          name: group.displayName,
          values,
        });
      }
    }
  } catch {
    // Graceful fallback if rawHtml JSON-LD parsing encounters unexpected markup
  }

  return {
    variantPrices: variantPrices.slice(0, 150),
    optionGroups: optionGroups.slice(0, 10),
    offerChoices: offerChoices.slice(0, 40),
  };
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
      throw new Error(
        "FIRECRAWL_API_KEY is not configured in environment variables.",
      );
    }

    const extractSchema = {
      type: "object",
      properties: {
        title: { type: "string", description: "Full product name/title" },
        price: {
          type: "number",
          description:
            "Default or base numeric product price without currency symbol",
        },
        currency: {
          type: "string",
          description: "Currency code or symbol (USD, GBP, EUR, $, £, €, etc.)",
        },
        imageUrl: {
          type: "string",
          description: "Absolute URL of the main product image",
        },
        description: {
          type: "string",
          description: "Product description or short summary",
        },
        brand: { type: "string", description: "Brand or manufacturer name" },
        inStock: {
          type: "boolean",
          description: "Whether the product is currently available/in stock",
        },
        options: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description:
                  "Name of option group, e.g. Size, Color, Storage, Capacity, Style, Model, Edition, Pack Size",
              },
              values: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: {
                      type: "string",
                      description:
                        "Clean option label without price text, e.g. 'US 9', '256GB', 'Midnight Black'",
                    },
                    price: {
                      type: "number",
                      description:
                        "Exact numeric price for this option if shown on the page (no currency symbol)",
                    },
                    priceDelta: {
                      type: "number",
                      description:
                        "Signed numeric price difference relative to base price if shown like +$100 or -$20",
                    },
                    inStock: {
                      type: "boolean",
                      description:
                        "Set to false ONLY if explicitly marked Out of Stock, Sold Out, or Unavailable",
                    },
                  },
                  required: ["label"],
                },
                description:
                  "List of all selectable choices for this option group along with their specific prices if they vary",
              },
            },
            required: ["name", "values"],
          },
          description:
            "All selectable product options grouped by type (Size, Color, Storage, Capacity, Style, Model, Edition, Pack Size)",
        },
        variantPrices: {
          type: "array",
          items: {
            type: "object",
            properties: {
              attributes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    value: { type: "string" },
                  },
                  required: ["name", "value"],
                },
              },
              price: {
                type: "number",
                description: "Exact numeric price for this attribute combination",
              },
              inStock: {
                type: "boolean",
              },
            },
            required: ["attributes", "price"],
          },
          description:
            "Exact prices for specific multi-attribute variant combinations (e.g. Color + Size, Storage + Model) when listed on the page",
        },
        variants: {
          type: "array",
          items: { type: "string" },
          description:
            "Available sizes, colors, or other option values as a list of strings",
        },
        rating: {
          type: "number",
          description: "Star rating out of 5, if available",
        },
        reviewCount: {
          type: "number",
          description: "Total number of customer reviews, if available",
        },
        weightKg: {
          type: "number",
          description:
            "Item shipping weight converted to kilograms, if listed on the page",
        },
      },
      required: ["title", "price"],
    };

    const requestBody = {
      url: args.url,
      formats: ["extract", "rawHtml"],
      extract: {
        schema: extractSchema,
        prompt:
          "Extract the product title, base numeric price (no symbols), currency (3-letter code like USD/GBP/EUR or the symbol), the main product image absolute URL, a short description, the brand name, whether it is in stock (true/false), and ALL selectable product options grouped under options (such as Size, Color, Storage, Capacity, Style, Model, Edition, Pack Size). For each option value in options[].values, put the clean choice name in label (strip any price text out of label), put the exact numeric price for that choice in price when displayed (e.g. 1099), or put the signed numeric difference in priceDelta when shown as a relative upgrade (e.g. +100 for '+$100' or -20 for '-$20'), and only set inStock: false if the option is explicitly marked Out of Stock, Sold Out, or Unavailable. If the page lists exact prices for specific combinations of multiple options (like Color + Size or Storage + Model), also include them in variantPrices. Include general variants if needed, star rating, review count, and shipping/package weight converted to numeric kilograms (weightKg). Output only numbers for price, priceDelta, and weight.",
      },
      maxAge: 0,
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
      throw new Error(
        "Network error: Could not reach Firecrawl. Please try again.",
      );
    }

    if (!rawResponse.ok) {
      const errText = await rawResponse.text();
      if (rawResponse.status === 401)
        throw new Error("Firecrawl API key is invalid or expired.");
      if (rawResponse.status === 402)
        throw new Error("Firecrawl API credits exhausted.");
      if (rawResponse.status === 429)
        throw new Error("Too many requests. Please wait and try again.");
      throw new Error(
        `Firecrawl error (${rawResponse.status}): ${errText.slice(0, 200)}`,
      );
    }

    const data = (await rawResponse.json()) as Record<string, unknown>;

    if (!data.success) {
      throw new Error(
        "Firecrawl could not access or parse that page. The store may be blocking scrapers.",
      );
    }

    // Navigate into the response shape: { success, extract: {...} } or { success, data: { extract: {...} } }
    const dataObj = data.data as Record<string, unknown> | undefined;
    const extract =
      (data.extract as Record<string, unknown> | undefined) ??
      (dataObj?.extract as Record<string, unknown> | undefined) ??
      {};
    const rawHtml =
      typeof data.rawHtml === "string"
        ? data.rawHtml
        : typeof dataObj?.rawHtml === "string"
          ? dataObj.rawHtml
          : "";

    const title =
      typeof extract.title === "string" && extract.title.trim()
        ? extract.title.trim()
        : null;

    if (!title) {
      throw new Error(
        "Could not extract product information. The URL may not point to a product page, or the store is blocking access.",
      );
    }

    // Normalize price
    let price = parseNumericPrice(extract.price) ?? 0;

    // Normalize currency
    let currency = (
      typeof extract.currency === "string" ? extract.currency : "USD"
    )
      .toUpperCase()
      .trim();
    if (currency === "$" || currency === "US$" || currency === "USD")
      currency = "USD";
    else if (currency === "£") currency = "GBP";
    else if (currency === "€") currency = "EUR";
    else if (currency.length !== 3)
      currency = detectCurrencyFromSymbol(currency);

    // Normalize image
    let imageUrl =
      typeof extract.imageUrl === "string" ? extract.imageUrl.trim() : "";
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

    const rawVariants: string[] = Array.isArray(extract.variants)
      ? (extract.variants as unknown[])
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 30)
      : [];

    const normalizeOptionValue = (rawVal: unknown): ScrapedOptionValue | null => {
      if (typeof rawVal === "string") {
        const inline = extractInlinePriceFromLabel(rawVal);
        if (!inline.label) return null;
        return {
          label: inline.label,
          price: inline.price,
          priceDelta: inline.priceDelta,
          inStock: true,
        };
      }
      if (rawVal && typeof rawVal === "object") {
        const obj = rawVal as Record<string, unknown>;
        const rawLabel =
          typeof obj.label === "string"
            ? obj.label.trim()
            : typeof obj.value === "string"
              ? obj.value.trim()
              : typeof obj.name === "string"
                ? obj.name.trim()
                : "";
        if (!rawLabel) return null;

        let optPrice = parseNumericPrice(obj.price);
        let optDelta = parseNumericDelta(obj.priceDelta);
        let cleanLabel = rawLabel;

        if (optPrice === null && optDelta === null) {
          const inline = extractInlinePriceFromLabel(rawLabel);
          cleanLabel = inline.label || rawLabel;
          optPrice = inline.price;
          optDelta = inline.priceDelta;
        } else {
          // Even when price/delta are present, strip duplicate trailing currency info if safe
          const inline = extractInlinePriceFromLabel(rawLabel);
          if (inline.label) {
            cleanLabel = inline.label;
          }
        }

        const optInStock =
          typeof obj.inStock === "boolean" ? obj.inStock : true;

        return {
          label: cleanLabel,
          price: optPrice,
          priceDelta: optDelta,
          inStock: optInStock,
        };
      }
      return null;
    };

    const optionGroupMap = new Map<
      string,
      { displayName: string; values: Map<string, ScrapedOptionValue> }
    >();

    const upsertOptionGroupValue = (
      groupName: string,
      valueObj: ScrapedOptionValue,
    ) => {
      const cleanGroupName = groupName.trim();
      if (!cleanGroupName || !valueObj.label) return;
      const groupKey = cleanGroupName.toLowerCase();

      if (!optionGroupMap.has(groupKey)) {
        if (optionGroupMap.size >= 10) return;
        optionGroupMap.set(groupKey, {
          displayName: cleanGroupName,
          values: new Map(),
        });
      }

      const groupEntry = optionGroupMap.get(groupKey)!;
      const valKey = valueObj.label.toLowerCase();
      const existing = groupEntry.values.get(valKey);

      if (!existing) {
        if (groupEntry.values.size >= 40) return;
        groupEntry.values.set(valKey, valueObj);
      } else {
        const existingHasPrice =
          existing.price !== null || existing.priceDelta !== null;
        const incomingHasPrice =
          valueObj.price !== null || valueObj.priceDelta !== null;
        if (!existingHasPrice && incomingHasPrice) {
          groupEntry.values.set(valKey, {
            ...valueObj,
            inStock: existing.inStock || valueObj.inStock,
          });
        } else if (valueObj.inStock && !existing.inStock) {
          existing.inStock = true;
        }
      }
    };

    if (Array.isArray(extract.options)) {
      for (const opt of extract.options as Record<string, unknown>[]) {
        if (opt && typeof opt === "object") {
          const name = typeof opt.name === "string" ? opt.name.trim() : "";
          const rawValues = Array.isArray(opt.values) ? opt.values : [];
          if (!name || rawValues.length === 0) continue;
          for (const rawVal of rawValues) {
            const normalized = normalizeOptionValue(rawVal);
            if (normalized) {
              upsertOptionGroupValue(name, normalized);
            }
          }
        }
      }
    }

    // Fallback: If options array wasn't provided or empty, but variants exist, smartly group them
    if (optionGroupMap.size === 0 && rawVariants.length > 0) {
      const groupedByName = new Map<string, ScrapedOptionValue[]>();
      const standaloneVariants: ScrapedOptionValue[] = [];

      for (const v of rawVariants) {
        if (!v) continue;
        if (v.includes(":")) {
          const [prefix, ...rest] = v.split(":");
          const groupName = prefix.trim();
          const valRaw = rest.join(":").trim();
          if (groupName && valRaw) {
            const inline = extractInlinePriceFromLabel(valRaw);
            if (inline.label) {
              if (!groupedByName.has(groupName)) groupedByName.set(groupName, []);
              groupedByName.get(groupName)!.push({
                label: inline.label,
                price: inline.price,
                priceDelta: inline.priceDelta,
                inStock: true,
              });
              continue;
            }
          }
        }
        const inline = extractInlinePriceFromLabel(v);
        if (inline.label) {
          standaloneVariants.push({
            label: inline.label,
            price: inline.price,
            priceDelta: inline.priceDelta,
            inStock: true,
          });
        }
      }

      for (const [name, values] of groupedByName.entries()) {
        for (const val of values) {
          upsertOptionGroupValue(name, val);
        }
      }

      if (standaloneVariants.length > 0) {
        const isLikelySize = standaloneVariants.every((s) =>
          /^(\d+(\.\d+)?|xs|s|m|l|xl|xxl|xxxl|us\s*\d+|eu\s*\d+|uk\s*\d+)$/i.test(
            s.label.trim(),
          ),
        );
        const targetGroupName = isLikelySize ? "Size" : "Option";
        for (const val of standaloneVariants) {
          upsertOptionGroupValue(targetGroupName, val);
        }
      }
    }

    // Normalize variantPrices from extract
    const variantPriceMap = new Map<string, ScrapedVariantPrice>();
    const makeVariantKey = (attrs: { name: string; value: string }[]) =>
      attrs
        .map((a) => `${a.name.trim().toLowerCase()}=${a.value.trim().toLowerCase()}`)
        .sort()
        .join("|");

    const addVariantPrice = (entry: ScrapedVariantPrice) => {
      if (variantPriceMap.size >= 150) return;
      if (entry.attributes.length === 0 || entry.price <= 0) return;
      const key = makeVariantKey(entry.attributes);
      if (!variantPriceMap.has(key)) {
        variantPriceMap.set(key, entry);
      }
    };

    if (Array.isArray(extract.variantPrices)) {
      for (const rawVp of extract.variantPrices) {
        if (!rawVp || typeof rawVp !== "object") continue;
        const vp = rawVp as Record<string, unknown>;
        const vpPrice = parseNumericPrice(vp.price);
        if (vpPrice === null || vpPrice <= 0) continue;
        const rawAttrs = Array.isArray(vp.attributes) ? vp.attributes : [];
        const cleanAttrs: { name: string; value: string }[] = [];
        for (const aRaw of rawAttrs) {
          if (!aRaw || typeof aRaw !== "object") continue;
          const a = aRaw as Record<string, unknown>;
          const aName = typeof a.name === "string" ? a.name.trim() : "";
          const aValue = typeof a.value === "string" ? a.value.trim() : "";
          if (aName && aValue) {
            cleanAttrs.push({ name: aName, value: aValue });
          }
        }
        if (cleanAttrs.length > 0) {
          addVariantPrice({
            attributes: cleanAttrs,
            price: vpPrice,
            inStock: typeof vp.inStock === "boolean" ? vp.inStock : true,
          });
        }
      }
    }

    // Merge JSON-LD variants/offers from rawHtml
    const jsonLdData = extractJsonLdVariants(rawHtml);
    for (const vp of jsonLdData.variantPrices) {
      addVariantPrice(vp);
    }

    if (optionGroupMap.size === 0) {
      if (jsonLdData.optionGroups.length > 0) {
        for (const group of jsonLdData.optionGroups) {
          for (const val of group.values) {
            upsertOptionGroupValue(group.name, val);
          }
        }
      } else if (jsonLdData.offerChoices.length > 0) {
        for (const choice of jsonLdData.offerChoices) {
          upsertOptionGroupValue("Option", choice);
        }
      }
    } else {
      // Append additional values discovered via JSON-LD for existing option group names
      for (const group of jsonLdData.optionGroups) {
        const key = group.name.trim().toLowerCase();
        if (optionGroupMap.has(key)) {
          const existingGroupName = optionGroupMap.get(key)!.displayName;
          for (const val of group.values) {
            upsertOptionGroupValue(existingGroupName, val);
          }
        }
      }
    }

    const parsedOptions: ScrapedOptionGroup[] = Array.from(
      optionGroupMap.values(),
    ).map((entry) => ({
      name: entry.displayName,
      values: Array.from(entry.values.values()),
    }));

    const variantPrices: ScrapedVariantPrice[] = Array.from(
      variantPriceMap.values(),
    );

    // Fallback base price if top-level price was 0
    if (price === 0) {
      const candidatePrices: number[] = [];
      for (const vp of variantPrices) {
        if (vp.price > 0) candidatePrices.push(vp.price);
      }
      for (const group of parsedOptions) {
        for (const val of group.values) {
          if (val.price !== null && val.price > 0) {
            candidatePrices.push(val.price);
          }
        }
      }
      if (candidatePrices.length > 0) {
        price = Math.min(...candidatePrices);
      }
    }

    // Synthesize flat variants list if empty and parsedOptions exist
    const variants: string[] =
      rawVariants.length > 0
        ? rawVariants
        : parsedOptions
            .flatMap((group) =>
              group.values.map((val) => `${group.name}: ${val.label}`),
            )
            .slice(0, 30);

    const rating = typeof extract.rating === "number" ? extract.rating : null;
    const reviewCount =
      typeof extract.reviewCount === "number" ? extract.reviewCount : null;

    let extractedWeightKg: number | null = null;
    if (typeof extract.weightKg === "number" && extract.weightKg > 0) {
      extractedWeightKg = extract.weightKg;
    } else if (typeof extract.weightKg === "string") {
      const parsed = parseFloat(
        (extract.weightKg as string).replace(/[^0-9.]/g, ""),
      );
      if (!isNaN(parsed) && parsed > 0) {
        extractedWeightKg = parsed;
      }
    }

    return {
      title,
      price,
      currency,
      imageUrl,
      description,
      brand,
      inStock,
      options: parsedOptions,
      variantPrices,
      variants,
      rating,
      reviewCount,
      originCountry: detectOriginFromUrl(args.url),
      weightKg: estimateWeightKg(title, extractedWeightKg),
      sourceUrl: args.url,
    };
  },
});
