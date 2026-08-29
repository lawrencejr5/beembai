"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import { useCart } from "@/app/context/CartContext";
import { formatPrice } from "@/app/data/data";
import { useMutation, useAction } from "convex/react";
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

// Exchange rate constants (currency → NGN)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1600,
  GBP: 2020,
  EUR: 1750,
  CAD: 1180,
  AUD: 1040,
};
const DEFAULT_EXCHANGE_RATE = 1600;

const CUSTOMS_TAX_RATE = 0.1; // 10% customs/clearing tax
const FLAT_SHIPPING_USD = 15; // $15 flat shipping fee
const SERVICE_FEE_RATE = 0.05; // 5% service fee

function getExchangeRate(currency: string): number {
  return EXCHANGE_RATES[currency?.toUpperCase()] ?? DEFAULT_EXCHANGE_RATE;
}

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

interface ScrapedProduct {
  title: string;
  price: number; // numeric price in the original currency
  currency: string; // e.g. "USD", "GBP", "EUR"
  image: string;
  description: string;
  brand: string;
  url: string;
  inStock: boolean;
  variants: string[];
  rating: number | null;
  reviewCount: number | null;
}

export default function BuyFromAbroad() {
  const { addToCart } = useCart();
  const saveForeignProductToDb = useMutation(api.products.createForeignProduct);
  const scrapeProductUrl = useAction(api.foreignScrape.scrapeProductUrl);

  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Scraping loading state
  const [isScraping, setIsScraping] = useState(false);

  const [scrapedProduct, setScrapedProduct] = useState<ScrapedProduct | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);

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
    setIsEditing(false);
    setIsScraping(true);

    try {
      const result = await scrapeProductUrl({ url: targetUrl });

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
        variants: result.variants,
        rating: result.rating,
        reviewCount: result.reviewCount,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to extract product data.";
      setError(msg);
    } finally {
      setIsScraping(false);
    }
  };

  // Pricing calculations (currency-aware)
  const exchangeRate = scrapedProduct
    ? getExchangeRate(scrapedProduct.currency)
    : DEFAULT_EXCHANGE_RATE;
  const productPriceNaira = scrapedProduct
    ? Math.round(scrapedProduct.price * exchangeRate)
    : 0;
  const customsTaxNaira = Math.round(productPriceNaira * CUSTOMS_TAX_RATE);
  const shippingNaira = Math.round(FLAT_SHIPPING_USD * DEFAULT_EXCHANGE_RATE);
  const serviceFeeNaira = Math.round(productPriceNaira * SERVICE_FEE_RATE);
  const totalNaira =
    productPriceNaira + customsTaxNaira + shippingNaira + serviceFeeNaira;

  // Handle local data updates if user overrides
  const handleUpdateField = (
    field: keyof ScrapedProduct,
    value: string | number | boolean,
  ) => {
    if (!scrapedProduct) return;
    setScrapedProduct({
      ...scrapedProduct,
      [field]: value,
    });
  };

  // Add scraped product to cart
  const handleAddToCart = async () => {
    if (!scrapedProduct) return;

    try {
      setIsAdding(true);

      // Save product to database to get a valid Convex Product ID
      const dbProductId = await saveForeignProductToDb({
        title: scrapedProduct.title,
        price: totalNaira,
        originalPrice: productPriceNaira,
        image: scrapedProduct.image,
        description: `${scrapedProduct.description} (Imported from ${scrapedProduct.brand}. Original Link: ${scrapedProduct.url})`,
        brand: scrapedProduct.brand,
        inStock: scrapedProduct.inStock,
        sourceUrl: scrapedProduct.url,
        variants: scrapedProduct.variants,
      });

      // Add to cart context (Convex or Guest)
      await addToCart(
        {
          id: dbProductId,
          title: scrapedProduct.title,
          categorySlug: "foreign-import",
          categoryName: "Foreign Import",
          price: totalNaira,
          originalPrice: productPriceNaira,
          image: scrapedProduct.image,
          description: scrapedProduct.description,
          brand: scrapedProduct.brand,
          stock: 999,
        },
        1,
      );

      setToastMessage(`"${scrapedProduct.title}" added to cart!`);
      setUrlInput("");
      setScrapedProduct(null);
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
                  {/* Variants */}
                  {scrapedProduct.variants.length > 0 && (
                    <div className={styles.variantChips}>
                      {scrapedProduct.variants.map((v) => (
                        <span key={v} className={styles.variantChip}>
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={styles.editToggleBtn}
                >
                  <EditIcon />
                  <span>
                    {isEditing
                      ? "Done Adjusting"
                      : "Incorrect details? Adjust manually"}
                  </span>
                </button>

                {/* Edit details form */}
                {isEditing && (
                  <div className={styles.manualForm}>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Product Name</label>
                        <input
                          type="text"
                          value={scrapedProduct.title}
                          onChange={(e) =>
                            handleUpdateField("title", e.target.value)
                          }
                          className={styles.formInput}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          Price ({scrapedProduct.currency})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={scrapedProduct.price}
                          onChange={(e) =>
                            handleUpdateField(
                              "price",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className={styles.formInput}
                        />
                      </div>
                    </div>

                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          Sourced Store
                        </label>
                        <select
                          value={scrapedProduct.brand}
                          onChange={(e) =>
                            handleUpdateField("brand", e.target.value)
                          }
                          className={styles.formSelect}
                        >
                          {SUPPORTED_STORES.map((store) => (
                            <option key={store.name} value={store.name}>
                              {store.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Image Link</label>
                        <input
                          type="text"
                          value={scrapedProduct.image}
                          onChange={(e) =>
                            handleUpdateField("image", e.target.value)
                          }
                          className={styles.formInput}
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                      {scrapedProduct.currency !== "USD"
                        ? scrapedProduct.currency
                        : "$"}
                      {scrapedProduct.price.toFixed(2)}
                      {" → ₦"}
                      {formatPrice(productPriceNaira)}
                    </span>
                  </div>

                  <div className={styles.pricingRow}>
                    <span className={styles.pricingLabel}>
                      Customs & Cleared Tax (10%):
                      <span title="Government duty tax to import goods into Nigeria">
                        <InfoIcon />
                      </span>
                    </span>
                    <span className={styles.priceValue}>
                      ₦{formatPrice(customsTaxNaira)}
                    </span>
                  </div>

                  <div className={styles.pricingRow}>
                    <span className={styles.pricingLabel}>
                      International Shipping:
                      <span title="Flat fee for air shipping logistics to Nigeria">
                        <InfoIcon />
                      </span>
                    </span>
                    <span className={styles.priceValue}>
                      ${FLAT_SHIPPING_USD}.00 → ₦{formatPrice(shippingNaira)}
                    </span>
                  </div>

                  <div className={styles.pricingRow}>
                    <span className={styles.pricingLabel}>
                      Beembai Import Service Fee (5%):
                      <span title="Procurement, inspection, and guarantee handling fee">
                        <InfoIcon />
                      </span>
                    </span>
                    <span className={styles.priceValue}>
                      ₦{formatPrice(serviceFeeNaira)}
                    </span>
                  </div>

                  <div className={styles.exchangeRateNote}>
                    Exchange Rate: 1 {scrapedProduct.currency} = ₦
                    {exchangeRate.toLocaleString()}
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
                    isAdding || totalNaira <= 0 || !scrapedProduct.inStock
                  }
                  className={styles.addToCartBtn}
                >
                  <CartPlusIcon />
                  <span>
                    {isAdding
                      ? "Preparing Import..."
                      : !scrapedProduct.inStock
                        ? "Out of Stock on Source Store"
                        : "Add to Cart"}
                  </span>
                </button>
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
