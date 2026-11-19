"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import { useCart } from "@/app/context/CartContext";
import { formatPrice } from "@/app/data/data";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "./page.module.css";
// Supported Stores Data
const SUPPORTED_STORES = [
  {
    name: "Amazon",
    logo: "/images/logos/amazon.png",
    domain: "amazon.com",
    invertDark: false,
  },
  {
    name: "Walmart",
    logo: "/images/logos/walmart.jpeg",
    domain: "walmart.com",
    invertDark: false,
  },
  {
    name: "Apple",
    logo: "/images/logos/apple.svg",
    domain: "apple.com",
    invertDark: false,
  },
  {
    name: "Samsung",
    logo: "/images/logos/samsung.svg",
    domain: "samsung.com",
    invertDark: false,
  },
  {
    name: "Sam’s Club",
    logo: "/images/logos/samsclub.svg",
    domain: "samsclub.com",
    invertDark: false,
  },
  {
    name: "Zara",
    logo: "/images/logos/zara.png",
    domain: "zara.com",
    invertDark: true,
  },
  {
    name: "Nike",
    logo: "/images/logos/nike.png",
    domain: "nike.com",
    invertDark: true,
  },
  {
    name: "Adidas",
    logo: "/images/logos/adidas.png",
    domain: "adidas.com",
    invertDark: true,
  },
  {
    name: "Target",
    logo: "/images/logos/target.png",
    domain: "target.com",
    invertDark: false,
  },
  {
    name: "Louis Vuitton",
    logo: "/images/logos/louisvuitton.png",
    domain: "louisvuitton.com",
    invertDark: true,
  },
  {
    name: "Calvin Klein",
    logo: "/images/logos/calvinklein.png",
    domain: "calvinklein.com",
    invertDark: true,
  },
  {
    name: "Fashion Nova",
    logo: "/images/logos/fashionnova.png",
    domain: "fashionnova.com",
    invertDark: true,
  },
  {
    name: "Back Market",
    logo: "/images/logos/backmarket.jpeg",
    domain: "backmarket.com",
    invertDark: true,
  },
  {
    name: "Invicta",
    logo: "/images/logos/invicta.jpeg",
    domain: "invictastores.com",
    invertDark: true,
  },
];

// Fallback exchange rate constants (currency → NGN) if live feed is temporarily unavailable
const FALLBACK_EXCHANGE_RATES: Record<string, number> = {
  USD: 1373,
  GBP: 1834,
  EUR: 1541,
  CAD: 976,
  AUD: 961,
};
const DEFAULT_FALLBACK_RATE = 1373;

const SERVICE_FEE_RATE = 0.02; // 2% service fee

// Simple link validator
const isValidUrl = (urlString: string) => {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (e) {
    return false;
  }
};

// SVG Icons
const LinkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
    />
  </svg>
);

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);

const CartPlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
  </svg>
);

const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="3"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

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

interface ScrapedProduct {
  title: string;
  price: number; // numeric price in the original currency
  currency: string; // e.g. "USD", "GBP", "EUR"
  image: string;
  description: string;
  brand: string;
  url: string;
  inStock: boolean;
  options: ScrapedOptionGroup[];
  variantPrices: ScrapedVariantPrice[];
  variants: string[];
  rating: number | null;
  reviewCount: number | null;
  originCountry: string; // ISO-2, e.g. "US", "GB", "CN"
  weightKg: number;
}

function getCurrencySymbol(currency: string): string {
  const code = currency?.toUpperCase();
  if (code === "USD") return "$";
  if (code === "GBP") return "£";
  if (code === "EUR") return "€";
  if (code === "CAD") return "CA$";
  if (code === "AUD") return "AU$";
  return code ? `${code} ` : "$";
}

function formatSourcePrice(amount: number, currency: string): string {
  const isWhole = Math.abs(amount - Math.round(amount)) < 1e-9;
  const formattedNumber = isWhole
    ? Math.round(amount).toLocaleString()
    : amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return `${getCurrencySymbol(currency)}${formattedNumber}`;
}

function buildInitialSelectedOptions(
  options: ScrapedOptionGroup[],
): Record<string, string> {
  const initial: Record<string, string> = {};
  for (const group of options) {
    if (group.values.length === 1) {
      initial[group.name] = group.values[0].label;
    }
  }
  return initial;
}

function findVariantPriceForSelection(
  variantPrices: ScrapedVariantPrice[],
  selectedOptions: Record<string, string>,
): number | null {
  if (!variantPrices || variantPrices.length === 0) return null;

  const selectedMap = new Map<string, string>();
  for (const [k, v] of Object.entries(selectedOptions)) {
    const cleanKey = k.trim().toLowerCase();
    const cleanVal = v.trim().toLowerCase();
    if (cleanKey && cleanVal) {
      selectedMap.set(cleanKey, cleanVal);
    }
  }
  if (selectedMap.size === 0) return null;

  // 1. Exact attribute match (every attribute in variant entry matches selection, pick most specific)
  let bestMatch: ScrapedVariantPrice | null = null;
  for (const entry of variantPrices) {
    if (!entry.attributes || entry.attributes.length === 0 || entry.price <= 0)
      continue;
    const allMatch = entry.attributes.every(
      (a) =>
        selectedMap.get(a.name.trim().toLowerCase()) ===
        a.value.trim().toLowerCase(),
    );
    if (allMatch) {
      if (
        !bestMatch ||
        entry.attributes.length > bestMatch.attributes.length
      ) {
        bestMatch = entry;
      }
    }
  }
  if (bestMatch) return bestMatch.price;

  // 2. Partial consistent match: consistent with all selected attributes & all consistent entries agree on price
  const consistentEntries = variantPrices.filter((entry) => {
    if (!entry.attributes || entry.attributes.length === 0 || entry.price <= 0)
      return false;
    let matchedAtLeastOne = false;
    for (const [selName, selVal] of selectedMap.entries()) {
      const attr = entry.attributes.find(
        (a) => a.name.trim().toLowerCase() === selName,
      );
      if (attr) {
        if (attr.value.trim().toLowerCase() !== selVal) {
          return false;
        }
        matchedAtLeastOne = true;
      }
    }
    return matchedAtLeastOne;
  });

  if (consistentEntries.length > 0) {
    const firstPrice = consistentEntries[0].price;
    if (consistentEntries.every((e) => e.price === firstPrice)) {
      return firstPrice;
    }
  }

  return null;
}

function computeEffectivePrice(
  product: ScrapedProduct | null,
  selectedOptions: Record<string, string>,
  lastPricedGroup: string | null,
): number {
  if (!product) return 0;

  const variantMatch = findVariantPriceForSelection(
    product.variantPrices,
    selectedOptions,
  );
  if (variantMatch !== null) return variantMatch;

  const explicitPrices: { groupName: string; price: number }[] = [];
  const deltas: number[] = [];

  for (const group of product.options) {
    const selectedLabel = selectedOptions[group.name];
    if (!selectedLabel) continue;
    const matchedVal = group.values.find((v) => v.label === selectedLabel);
    if (!matchedVal) continue;

    if (matchedVal.price !== null && matchedVal.price > 0) {
      explicitPrices.push({ groupName: group.name, price: matchedVal.price });
    } else if (
      matchedVal.priceDelta !== null &&
      matchedVal.priceDelta !== 0
    ) {
      deltas.push(matchedVal.priceDelta);
    }
  }

  let base = product.price;
  if (explicitPrices.length === 1) {
    base = explicitPrices[0].price;
  } else if (explicitPrices.length > 1) {
    const fromLastGroup = lastPricedGroup
      ? explicitPrices.find((p) => p.groupName === lastPricedGroup)
      : undefined;
    const differingFromBase = explicitPrices.find(
      (p) => p.price !== product.price,
    );
    base =
      fromLastGroup?.price ??
      differingFromBase?.price ??
      explicitPrices[explicitPrices.length - 1].price;
  }

  const totalDelta = deltas.reduce((sum, d) => sum + d, 0);
  return Math.max(0, Math.round((base + totalDelta) * 100) / 100);
}

function getGroupPillPrices(
  group: ScrapedOptionGroup,
  product: ScrapedProduct,
  selectedOptions: Record<string, string>,
): Map<string, string> {
  const candidates = group.values.map((val) => {
    const nextSelected = { ...selectedOptions, [group.name]: val.label };
    const vpPrice = findVariantPriceForSelection(
      product.variantPrices,
      nextSelected,
    );

    let candidatePrice: number | null = vpPrice;
    let candidateDelta: number | null = null;

    if (candidatePrice === null) {
      if (val.price !== null && val.price > 0) {
        candidatePrice = val.price;
      } else if (val.priceDelta !== null && val.priceDelta !== 0) {
        candidateDelta = val.priceDelta;
      }
    }

    return { label: val.label, price: candidatePrice, delta: candidateDelta };
  });

  const hasNonZeroDelta = candidates.some(
    (c) => c.delta !== null && c.delta !== 0,
  );
  const distinctPrices = new Set(
    candidates.filter((c) => c.price !== null).map((c) => c.price!),
  );
  const differsFromBase = candidates.some(
    (c) => c.price !== null && c.price !== product.price,
  );

  const result = new Map<string, string>();
  if (!hasNonZeroDelta && distinctPrices.size <= 1 && !differsFromBase) {
    return result;
  }

  for (const c of candidates) {
    if (c.price !== null) {
      result.set(c.label, formatSourcePrice(c.price, product.currency));
    } else if (c.delta !== null && c.delta !== 0) {
      const sign = c.delta > 0 ? "+" : "-";
      result.set(
        c.label,
        `${sign}${formatSourcePrice(Math.abs(c.delta), product.currency)}`,
      );
    }
  }

  return result;
}

export default function BuyFromAbroad() {
  const { addToCart } = useCart();
  const liveRatesData = useQuery(api.exchangeRates.getExchangeRates);
  const refreshRates = useAction(api.exchangeRates.refreshLiveRates);
  const saveForeignProductToDb = useMutation(api.products.createForeignProduct);
  const scrapeProductUrl = useAction(api.foreignScrape.scrapeProductUrl);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh exchange rates in the background if stale or empty
  useEffect(() => {
    if (liveRatesData?.isStale) {
      refreshRates({}).catch((err) =>
        console.warn("Background FX refresh error:", err),
      );
    }
  }, [liveRatesData?.isStale, refreshRates]);

  // Scraping loading state
  const [isScraping, setIsScraping] = useState(false);

  const [scrapedProduct, setScrapedProduct] = useState<ScrapedProduct | null>(
    null,
  );
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    {},
  );
  const [lastPricedGroup, setLastPricedGroup] = useState<string | null>(null);
  const [extraNotes, setExtraNotes] = useState("");

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Auto-clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Real scraping handler using Firecrawl via Convex action
  const handleScrapeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUrl = urlInput.trim();

    if (!targetUrl) {
      setError("Please paste a product URL to proceed.");
      return;
    }
    if (!isValidUrl(targetUrl)) {
      setError("Please enter a valid HTTP/HTTPS product link.");
      return;
    }

    setError(null);
    setScrapedProduct(null);
    setSelectedOptions({});
    setLastPricedGroup(null);
    setExtraNotes("");
    setIsScraping(true);

    try {
      const result = await scrapeProductUrl({ url: targetUrl });
      const options = result.options ?? [];
      const variantPrices = result.variantPrices ?? [];
      const initialSelected = buildInitialSelectedOptions(options);

      setScrapedProduct({
        title: result.title,
        price: result.price,
        currency: result.currency,
        // Use scraped image, fall back to a generic placeholder
        image:
          result.imageUrl ||
          "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=600&auto=format&fit=crop",
        description: result.description,
        brand: result.brand,
        url: targetUrl,
        inStock: result.inStock,
        options,
        variantPrices,
        variants: result.variants,
        rating: result.rating,
        reviewCount: result.reviewCount,
        originCountry: result.originCountry,
        weightKg: result.weightKg,
      });
      setSelectedOptions(initialSelected);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to extract product data.";
      setError(msg);
    } finally {
      setIsScraping(false);
    }
  };

  // Option selection handler
  const handleSelectOption = (
    group: ScrapedOptionGroup,
    val: ScrapedOptionValue,
  ) => {
    const isUnavailable =
      val.inStock === false && group.values.some((v) => v.inStock !== false);
    if (isUnavailable) return;

    // Single-option groups remain auto-selected and cannot be toggled off
    setSelectedOptions((prev) => ({
      ...prev,
      [group.name]: val.label,
    }));

    if (val.price !== null && val.price > 0) {
      setLastPricedGroup(group.name);
    }
    setError(null);
  };

  const productOptions = scrapedProduct?.options || [];
  const hasOptions = productOptions.length > 0;
  const missingOptions = productOptions.filter(
    (g) => !selectedOptions[g.name],
  );
  const allOptionsSelected = missingOptions.length === 0;

  // Pricing calculations (currency-aware with live market rates + buffer)
  const getExchangeRate = (currency: string): number => {
    const code = currency?.toUpperCase();
    if (liveRatesData?.rates && typeof liveRatesData.rates[code] === "number") {
      return liveRatesData.rates[code];
    }
    return FALLBACK_EXCHANGE_RATES[code] ?? DEFAULT_FALLBACK_RATE;
  };

  const exchangeRate = scrapedProduct
    ? getExchangeRate(scrapedProduct.currency)
    : (liveRatesData?.rates?.USD ?? DEFAULT_FALLBACK_RATE);
  const effectivePrice = computeEffectivePrice(
    scrapedProduct,
    selectedOptions,
    lastPricedGroup,
  );
  const productPriceNaira = scrapedProduct
    ? Math.round(effectivePrice * exchangeRate)
    : 0;
  const serviceFeeNaira = Math.round(productPriceNaira * SERVICE_FEE_RATE);
  const totalNaira = productPriceNaira + serviceFeeNaira;

  // Add scraped product to cart
  const handleAddToCart = async () => {
    if (!scrapedProduct) return;

    if (hasOptions && !allOptionsSelected) {
      setError(
        `Please select an option for: ${missingOptions.map((g) => g.name).join(", ")}`,
      );
      return;
    }

    try {
      setIsAdding(true);

      const selectedOptionsSummary = productOptions
        .filter((g) => !!selectedOptions[g.name])
        .map((g) => `${g.name}: ${selectedOptions[g.name]}`)
        .join(", ");

      const trimmedNote = extraNotes.trim();

      const itemDisplayTitle = selectedOptionsSummary
        ? `${scrapedProduct.title} (${selectedOptionsSummary})`
        : scrapedProduct.title;

      // Save product to database to get a valid Convex Product ID
      const dbProductId = await saveForeignProductToDb({
        title: itemDisplayTitle,
        price: totalNaira,
        originalPrice: productPriceNaira,
        image: scrapedProduct.image,
        description: `${scrapedProduct.description} (Imported from ${scrapedProduct.brand}${
          selectedOptionsSummary
            ? `. Selected Options: ${selectedOptionsSummary}`
            : ""
        }${trimmedNote ? `. Buyer Note: ${trimmedNote}` : ""}. Original Link: ${scrapedProduct.url})`,
        brand: scrapedProduct.brand,
        inStock: scrapedProduct.inStock,
        sourceUrl: scrapedProduct.url,
        variants: scrapedProduct.variants,
        weightKg: scrapedProduct.weightKg,
        originCountry: scrapedProduct.originCountry,
        buyerNote: trimmedNote || undefined,
      });

      // Add to cart context (Convex or Guest)
      await addToCart(
        {
          id: dbProductId,
          title: itemDisplayTitle,
          categorySlug: "foreign-import",
          categoryName: "Foreign Import",
          price: totalNaira,
          originalPrice: productPriceNaira,
          image: scrapedProduct.image,
          description: scrapedProduct.description,
          brand: scrapedProduct.brand,
          stock: 999,
          weight: scrapedProduct.weightKg,
          originCountry: scrapedProduct.originCountry,
        },
        1,
        selectedOptionsSummary || undefined,
      );

      setToastMessage("Added item to cart!");
      setUrlInput("");
      setScrapedProduct(null);
      setSelectedOptions({});
      setLastPricedGroup(null);
      setExtraNotes("");
    } catch (err) {
      console.error(err);
      setError("Failed to add this product to cart. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={styles.container}>
      <Navbar />

      <main className={styles.mainContent}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroTag}>
              <SparklesIcon />
              <span>Beembai Global Reach</span>
            </div>
            <h1 className={styles.heroTitle}>Shop from Stores Abroad</h1>
            <p className={`${styles.heroSubtitle} ${styles.desktopText}`}>
              Copy and paste links from international retailers like Amazon,
              Zara, Walmart, and Nike. We calculate duty fees, conversion rates,
              and cargo shipping so you pay in Naira.
            </p>
            <p className={`${styles.heroSubtitle} ${styles.mobileText}`}>
              Copy links from international stores like Amazon, Zara, Walmart,
              and Nike. We handle customs, currency conversion, and shipping to
              Nigeria.
            </p>

            {/* Supported Store Logos */}
            <div className={styles.supportedStoresWrapper}>
              <div className={styles.supportedStoresGrid}>
                {SUPPORTED_STORES.map((store) => (
                  <a
                    key={store.name}
                    href={`https://www.${store.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.storeLogoLink}
                    title={`Visit ${store.name} official site`}
                  >
                    <div className={styles.storeLogoWrapper}>
                      <img
                        src={store.logo}
                        alt={store.name}
                        className={styles.storeHeroLogo}
                      />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Input Section */}
        <section className={`${styles.card} ${styles.inputSection}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <LinkIcon />
              <span>Paste Product URL</span>
            </h2>
            <p className={styles.sectionDesc}>
              Enter the link of the product you want to import. Make sure the
              store domain is supported.
            </p>
          </div>

          <form onSubmit={handleScrapeUrl} className={styles.urlForm}>
            <div
              className={`${styles.inputWrapper} ${urlInput ? styles.inputWrapperFocused : ""}`}
            >
              <span className={styles.linkIcon}>
                <LinkIcon />
              </span>
              <input
                type="text"
                placeholder="https://www.amazon.com/dp/B0CHWRSHL5/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={isScraping || isAdding}
                className={styles.urlInput}
              />
              <button
                type="submit"
                disabled={!urlInput.trim() || isScraping || isAdding}
                className={styles.submitBtn}
              >
                {isScraping ? "Extracting..." : "Get Product"}
              </button>
            </div>
            {error && <span className={styles.errorText}>{error}</span>}
          </form>

          {/* Loading Spinner */}
          {isScraping && (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner} />
              <div className={styles.loadingText}>
                Connecting to store and extracting product details...
              </div>
            </div>
          )}

          {/* Scraped product details and Naira price calculations */}
          {scrapedProduct && (
            <div className={styles.scrapedResultGrid}>
              {/* Product Preview Card */}
              <div className={`${styles.card} ${styles.productPreviewCard}`}>
                <div className={styles.productImageWrapper}>
                  <span className={styles.productBrandBadge}>
                    {scrapedProduct.brand}
                  </span>
                  {/* Stock badge */}
                  <span
                    className={`${styles.stockBadge} ${scrapedProduct.inStock ? styles.stockIn : styles.stockOut}`}
                  >
                    {scrapedProduct.inStock ? "✓ In Stock" : "✗ Out of Stock"}
                  </span>
                  {/* Using standard img to prevent Next.js hostname restriction for external user inputs */}
                  <img
                    src={scrapedProduct.image}
                    alt={scrapedProduct.title}
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </div>

                <div className={styles.productMainInfo}>
                  <h3 className={styles.productTitle}>
                    {scrapedProduct.title}
                  </h3>
                  {/* Rating row */}
                  {scrapedProduct.rating !== null && (
                    <div className={styles.ratingRow}>
                      <span className={styles.stars}>
                        {"★".repeat(Math.round(scrapedProduct.rating))}
                        {"☆".repeat(5 - Math.round(scrapedProduct.rating))}
                      </span>
                      <span className={styles.ratingText}>
                        {scrapedProduct.rating.toFixed(1)}
                        {scrapedProduct.reviewCount !== null &&
                          ` (${scrapedProduct.reviewCount.toLocaleString()} reviews)`}
                      </span>
                    </div>
                  )}
                  <p className={styles.productDescription}>
                    {scrapedProduct.description}
                  </p>
                  {/* Interactive Option Selectors (Sizes, Colors, Storage, etc.) */}
                  {productOptions.length > 0 && (
                    <div className={styles.optionsSection}>
                      <div className={styles.optionsSectionTitle}>
                        Select Product Options
                      </div>
                      {productOptions.map((group) => {
                        const currentSelected =
                          selectedOptions[group.name] || "";
                        const pillPrices = getGroupPillPrices(
                          group,
                          scrapedProduct,
                          selectedOptions,
                        );
                        const hasAnyInStock = group.values.some(
                          (v) => v.inStock !== false,
                        );

                        return (
                          <div key={group.name} className={styles.optionGroup}>
                            <div className={styles.optionHeader}>
                              <span>
                                {group.name}:{" "}
                                {currentSelected ? (
                                  <span className={styles.optionSelectedValue}>
                                    {currentSelected}
                                  </span>
                                ) : (
                                  <span className={styles.optionUnselectedNotice}>
                                    * Please choose
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className={styles.optionPillGrid}>
                              {group.values.map((val) => {
                                const isSelected =
                                  currentSelected === val.label;
                                const isUnavailable =
                                  val.inStock === false && hasAnyInStock;
                                const pillPriceText = pillPrices.get(val.label);

                                return (
                                  <button
                                    key={val.label}
                                    type="button"
                                    disabled={isUnavailable}
                                    onClick={() =>
                                      handleSelectOption(group, val)
                                    }
                                    className={`${styles.optionPill} ${
                                      isSelected ? styles.optionPillActive : ""
                                    } ${
                                      isUnavailable
                                        ? styles.optionPillUnavailable
                                        : ""
                                    }`}
                                    title={
                                      isUnavailable ? "Out of stock" : undefined
                                    }
                                  >
                                    <span>{val.label}</span>
                                    {pillPriceText && (
                                      <span className={styles.optionPillPrice}>
                                        {pillPriceText}
                                      </span>
                                    )}
                                    {isUnavailable && (
                                      <span className={styles.optionPillPrice}>
                                        (Out of stock)
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fallback Variants (if no options group detected, or additional raw tags) */}
                  {productOptions.length === 0 &&
                    scrapedProduct.variants.length > 0 && (
                      <div className={styles.variantChips}>
                        {scrapedProduct.variants.map((v) => (
                          <span key={v} className={styles.variantChip}>
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                </div>

                {/* Extra Notes for Beembai */}
                <div className={styles.extraNotesBox}>
                  <label
                    htmlFor="extra-notes-input"
                    className={styles.extraNotesLabel}
                  >
                    <EditIcon />
                    <span>Extra Notes for Beembai</span>
                    <span className={styles.optionalBadge}>Optional</span>
                  </label>
                  <textarea
                    id="extra-notes-input"
                    rows={3}
                    placeholder="Add any extra instructions for Beembai (e.g. preferred shade, gift packaging, bundle preference, or special sizing notes)..."
                    value={extraNotes}
                    onChange={(e) => setExtraNotes(e.target.value)}
                    disabled={isAdding}
                    className={styles.extraNotesTextarea}
                  />
                </div>
              </div>

              {/* Price Calculation Card */}
              <div className={`${styles.card} ${styles.pricingDetailsCard}`}>
                <div className={styles.pricingHeader}>
                  <h3 className={styles.pricingTitle}>Naira Price Breakdown</h3>
                </div>

                <div className={styles.pricingRows}>
                  <div className={styles.pricingRow}>
                    <span className={styles.pricingLabel}>
                      Base Item Value:
                    </span>
                    <span className={styles.priceValue}>
                      {getCurrencySymbol(scrapedProduct.currency)}
                      {effectivePrice.toFixed(2)}
                      {" → ₦"}
                      {formatPrice(productPriceNaira)}
                    </span>
                  </div>

                  <div className={styles.pricingRow}>
                    <span className={styles.pricingLabel}>
                      International Shipping:
                      <span title="International shipping via GIG Logistics is calculated at checkout based on weight and your delivery address">
                        <InfoIcon />
                      </span>
                    </span>
                    <span className={styles.priceValue}>
                      Calculated at checkout
                    </span>
                  </div>

                  <div className={styles.pricingRow}>
                    <span className={styles.pricingLabel}>
                      Beembai Import Service Fee (2%):
                      <span title="Procurement, inspection, and guarantee handling fee">
                        <InfoIcon />
                      </span>
                    </span>
                    <span className={styles.priceValue}>
                      ₦{formatPrice(serviceFeeNaira)}
                    </span>
                  </div>

                  <div className={styles.exchangeRateNote}>
                    <span className={styles.liveBadge}>
                      <span className={styles.liveDot} />
                      Live Market Rate
                    </span>
                    <span>
                      1 {scrapedProduct.currency} = ₦
                      {exchangeRate.toLocaleString()}
                    </span>
                    <span className={styles.bufferSubtext}>
                      (Real-time FX + {liveRatesData?.bufferPercent ?? 3}% bank
                      card buffer)
                    </span>
                  </div>

                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>
                      Total Estimated Price:
                    </span>
                    <span className={styles.totalValue}>
                      ₦{formatPrice(totalNaira)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={
                    isAdding ||
                    totalNaira <= 0 ||
                    !scrapedProduct.inStock ||
                    (hasOptions && !allOptionsSelected)
                  }
                  className={styles.addToCartBtn}
                >
                  <CartPlusIcon />
                  <span>
                    {isAdding
                      ? "Preparing Import..."
                      : !scrapedProduct.inStock
                        ? "Out of Stock on Source Store"
                        : hasOptions && !allOptionsSelected
                          ? "Select options first"
                          : "Add to Cart"}
                  </span>
                </button>

                {hasOptions && !allOptionsSelected && (
                  <div className={styles.optionsWarning}>
                    <InfoIcon />
                    <span>
                      Please select{" "}
                      <strong>
                        {missingOptions.map((g) => g.name).join(" and ")}
                      </strong>{" "}
                      above before adding this product to your cart.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Step-by-Step Instructions */}
        <section className={styles.instructionsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>How to Order from Abroad</h2>
            <p className={styles.sectionDesc}>
              Shopping from stores globally is simple on Beembai. Follow these
              steps:
            </p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={`${styles.card} ${styles.stepCard}`}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Find Your Product</h3>
              <p className={styles.stepDesc}>
                Visit your preferred international store (like Amazon, Zara, or
                AliExpress) and search for the item.
              </p>
            </div>

            <div className={`${styles.card} ${styles.stepCard}`}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Copy the URL</h3>
              <p className={styles.stepDesc}>
                Copy the browser URL of the product details page directly. Make
                sure it points to a specific item.
              </p>
            </div>

            <div className={`${styles.card} ${styles.stepCard}`}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Calculate Price</h3>
              <p className={styles.stepDesc}>
                Paste the copied URL in the input above. We'll convert the
                price, calculate logistics, and show the Naira total.
              </p>
            </div>

            <div className={`${styles.card} ${styles.stepCard}`}>
              <div className={styles.stepNumber}>4</div>
              <h3 className={styles.stepTitle}>Add to Cart</h3>
              <p className={styles.stepDesc}>
                Add the calculated item directly to your cart and pay in Naira.
                We source, inspect, ship, and deliver.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Success Toast */}
      {toastMessage && (
        <div className={styles.toast}>
          <CheckIcon />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
