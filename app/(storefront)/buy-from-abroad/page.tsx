"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { useCart } from "@/app/context/CartContext";
import { formatPrice } from "@/app/data/data";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "./page.module.css";

// Supported Stores Data
const SUPPORTED_STORES = [
  { name: "Amazon", logo: "📦", domain: "amazon.com", color: "#FF9900" },
  { name: "eBay", logo: "🏷️", domain: "ebay.com", color: "#E53238" },
  { name: "AliExpress", logo: "🛍️", domain: "aliexpress.com", color: "#E62E04" },
  { name: "Zara", logo: "👗", domain: "zara.com", color: "#000000" },
  { name: "ASOS", logo: "👟", domain: "asos.com", color: "#000000" },
];

// Exchange rates & fees constants
const EXCHANGE_RATE = 1600; // 1 USD = 1600 Naira
const CUSTOMS_TAX_RATE = 0.10; // 10% customs/clearing tax
const FLAT_SHIPPING_USD = 15; // $15 flat shipping fee
const SERVICE_FEE_RATE = 0.05; // 5% service fee

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
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const CartPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

interface ScrapedProduct {
  title: string;
  priceUsd: number;
  image: string;
  description: string;
  brand: string;
  url: string;
}

export default function BuyFromAbroad() {
  const { addToCart } = useCart();
  const saveForeignProductToDb = useMutation(api.products.createForeignProduct);

  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Loading simulation states
  const [isValidating, setIsValidating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");

  const [scrapedProduct, setScrapedProduct] = useState<ScrapedProduct | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Auto-clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Loading steps animation simulation
  const loadingSteps = [
    "Locating product source...",
    "Connecting securely to foreign servers...",
    "Extracting item specs and price details...",
    "Simulating Naira logistics & pricing math...",
  ];

  const handleSimulateScraping = (e: React.FormEvent) => {
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
    setIsValidating(true);
    setLoadingStep(0);
    setIsEditing(false);

    // Run through mock loading messages
    let currentStep = 0;
    setLoadingMessage(loadingSteps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < loadingSteps.length) {
        setLoadingStep(currentStep);
        setLoadingMessage(loadingSteps[currentStep]);
      } else {
        clearInterval(interval);
        generateMockProduct(targetUrl);
      }
    }, 700);
  };

  // Generate simulated product details based on URL keywords
  const generateMockProduct = (url: string) => {
    const urlLower = url.toLowerCase();
    let title = "Premium Import Item";
    let priceUsd = 49.99;
    let image = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=600&auto=format&fit=crop";
    let description = "Direct import from global warehouse. Fully handled shipping, customs clearance, and local logistics.";
    let brand = "Amazon";

    // Deduce store
    if (urlLower.includes("ebay")) brand = "eBay";
    else if (urlLower.includes("aliexpress")) brand = "AliExpress";
    else if (urlLower.includes("zara")) brand = "Zara";
    else if (urlLower.includes("asos")) brand = "ASOS";

    // Deduce item content
    if (urlLower.includes("keyboard") || urlLower.includes("keychron")) {
      title = "Keychron K6 Wireless Mechanical Keyboard (65% Hot-Swappable Layout)";
      priceUsd = 89.99;
      image = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=600&auto=format&fit=crop";
      description = "Mechanical keyboard with compact 65% form factor, RGB backlighting, Gateron G Pro switches, and Bluetooth connectivity for multi-device pairing.";
    } else if (urlLower.includes("phone") || urlLower.includes("iphone")) {
      title = "Apple iPhone 15 Pro Max (256GB, Natural Titanium)";
      priceUsd = 1199.99;
      image = "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=600&auto=format&fit=crop";
      description = "Flagship titanium build, advanced 48MP camera setup, A17 Pro chip, Action button, USB-C compatibility, and industry-leading performance.";
    } else if (urlLower.includes("shoes") || urlLower.includes("nike") || urlLower.includes("sneakers")) {
      title = "Nike Air Max Pulse Lifestyle Sneakers";
      priceUsd = 150.00;
      image = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop";
      description = "Responsive point-loaded cushioning, athletic profile with breathable textiles, leather accents, and lightweight comfort for daily wear.";
    } else if (urlLower.includes("watch") || urlLower.includes("apple-watch") || urlLower.includes("samsung")) {
      title = "Samsung Galaxy Watch 6 Classic (47mm LTE, Silver)";
      priceUsd = 299.99;
      image = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop";
      description = "Classic watch design with rotating navigation bezel, comprehensive body fitness trackers, smart notifications, and battery life to match.";
    }

    setScrapedProduct({
      title,
      priceUsd,
      image,
      description,
      brand,
      url,
    });
    setIsValidating(false);
  };

  // Pricing calculations
  const productPriceNaira = scrapedProduct ? Math.round(scrapedProduct.priceUsd * EXCHANGE_RATE) : 0;
  const customsTaxNaira = Math.round(productPriceNaira * CUSTOMS_TAX_RATE);
  const shippingNaira = Math.round(FLAT_SHIPPING_USD * EXCHANGE_RATE);
  const serviceFeeNaira = Math.round(productPriceNaira * SERVICE_FEE_RATE);
  const totalNaira = productPriceNaira + customsTaxNaira + shippingNaira + serviceFeeNaira;

  // Handle local data updates if user overrides
  const handleUpdateField = (field: keyof ScrapedProduct, value: string | number) => {
    if (!scrapedProduct) return;
    setScrapedProduct({
      ...scrapedProduct,
      [field]: value,
    });
  };

  // Add simulated product to cart
  const handleAddToCart = async () => {
    if (!scrapedProduct) return;

    try {
      setIsAdding(true);
      
      // Save product to database dynamically to obtain a valid Convex Product ID
      const dbProductId = await saveForeignProductToDb({
        title: scrapedProduct.title,
        price: totalNaira, // Full calculated price in Naira is the checkout price
        originalPrice: Math.round(scrapedProduct.priceUsd * EXCHANGE_RATE),
        image: scrapedProduct.image,
        description: `${scrapedProduct.description} (Imported from ${scrapedProduct.brand}. Original Link: ${scrapedProduct.url})`,
        brand: scrapedProduct.brand,
      });

      // Call context addToCart to put it in user's cart (Convex or Guest)
      await addToCart(
        {
          id: dbProductId,
          title: scrapedProduct.title,
          categorySlug: "foreign-import",
          categoryName: "Foreign Import",
          price: totalNaira,
          originalPrice: Math.round(scrapedProduct.priceUsd * EXCHANGE_RATE),
          image: scrapedProduct.image,
          description: scrapedProduct.description,
          brand: scrapedProduct.brand,
          stock: 999,
        },
        1
      );

      setToastMessage(`"${scrapedProduct.title}" added to cart successfully!`);
      
      // Clear input and state
      setUrlInput("");
      setScrapedProduct(null);
    } catch (err) {
      console.error(err);
      setError("Failed to add foreign product to cart. Please try again.");
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
              Copy and paste links from international retailers like Amazon, eBay, and Zara. 
              We calculate duty fees, conversion rates, and cargo shipping so you pay in Naira.
            </p>
            <p className={`${styles.heroSubtitle} ${styles.mobileText}`}>
              Copy links from international stores like Amazon, eBay, and Zara. 
              We handle customs, currency conversion, and shipping to Nigeria.
            </p>
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
              Enter the link of the product you want to import. Make sure the store domain is supported.
            </p>
          </div>

          <form onSubmit={handleSimulateScraping} className={styles.urlForm}>
            <div className={`${styles.inputWrapper} ${urlInput ? styles.inputWrapperFocused : ""}`}>
              <span className={styles.linkIcon}><LinkIcon /></span>
              <input
                type="text"
                placeholder="https://www.amazon.com/dp/B0CHWRSHL5/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={isValidating || isAdding}
                className={styles.urlInput}
              />
              <button
                type="submit"
                disabled={!urlInput.trim() || isValidating || isAdding}
                className={styles.submitBtn}
              >
                {isValidating ? "Scraping..." : "Sourcing Detail"}
              </button>
            </div>
            {error && <span className={styles.errorText}>{error}</span>}
          </form>

          {/* Loading Animation Simulation */}
          {isValidating && (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner} />
              <div className={styles.loadingText}>
                {loadingMessage}
              </div>
            </div>
          )}

          {/* Scraped product details and Naira price calculations */}
          {scrapedProduct && (
            <div className={styles.scrapedResultGrid}>
              
              {/* Product Preview Card */}
              <div className={`${styles.card} ${styles.productPreviewCard}`}>
                <div className={styles.productImageWrapper}>
                  <span className={styles.productBrandBadge}>{scrapedProduct.brand}</span>
                  {/* Using standard img element to prevent Next.js dynamic image hostname errors for custom user inputs */}
                  <img
                    src={scrapedProduct.image}
                    alt={scrapedProduct.title}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                </div>

                <div className={styles.productMainInfo}>
                  <h3 className={styles.productTitle}>{scrapedProduct.title}</h3>
                  <p className={styles.productDescription}>{scrapedProduct.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={styles.editToggleBtn}
                >
                  <EditIcon />
                  <span>{isEditing ? "Done Adjusting" : "Incorrect details? Adjust manually"}</span>
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
                          onChange={(e) => handleUpdateField("title", e.target.value)}
                          className={styles.formInput}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Price (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={scrapedProduct.priceUsd}
                          onChange={(e) => handleUpdateField("priceUsd", parseFloat(e.target.value) || 0)}
                          className={styles.formInput}
                        />
                      </div>
                    </div>

                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Sourced Store</label>
                        <select
                          value={scrapedProduct.brand}
                          onChange={(e) => handleUpdateField("brand", e.target.value)}
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
                          onChange={(e) => handleUpdateField("image", e.target.value)}
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
                    <span className={styles.pricingLabel}>Base Item Value:</span>
                    <span className={styles.priceValue}>
                      ${scrapedProduct.priceUsd.toFixed(2)} → ₦{formatPrice(productPriceNaira)}
                    </span>
                  </div>

                  <div className={styles.pricingRow}>
                    <span className={styles.pricingLabel}>
                      Customs & Cleared Tax (10%):
                      <span title="Government duty tax to import goods into Nigeria"><InfoIcon /></span>
                    </span>
                    <span className={styles.priceValue}>₦{formatPrice(customsTaxNaira)}</span>
                  </div>

                  <div className={styles.pricingRow}>
                    <span className={styles.pricingLabel}>
                      International Shipping:
                      <span title="Flat fee for air shipping logistics to Nigeria"><InfoIcon /></span>
                    </span>
                    <span className={styles.priceValue}>
                      ${FLAT_SHIPPING_USD}.00 → ₦{formatPrice(shippingNaira)}
                    </span>
                  </div>

                  <div className={styles.pricingRow}>
                    <span className={styles.pricingLabel}>
                      Beembai Import Service Fee (5%):
                      <span title="Procurement, inspection, and guarantee handling fee"><InfoIcon /></span>
                    </span>
                    <span className={styles.priceValue}>₦{formatPrice(serviceFeeNaira)}</span>
                  </div>

                  <div className={styles.exchangeRateNote}>
                    Standard Import Exchange Rate: $1.00 = ₦{EXCHANGE_RATE.toLocaleString()}
                  </div>

                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Total Estimated Price:</span>
                    <span className={styles.totalValue}>₦{formatPrice(totalNaira)}</span>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || totalNaira <= 0}
                  className={styles.addToCartBtn}
                >
                  <CartPlusIcon />
                  <span>{isAdding ? "Preparing Import..." : "Add to Cart"}</span>
                </button>
              </div>

            </div>
          )}
        </section>

        {/* Step-by-Step Instructions */}
        <section className={styles.instructionsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>How to Order from Abroad</h2>
            <p className={styles.sectionDesc}>Shopping from stores globally is simple on Beembai. Follow these steps:</p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={`${styles.card} ${styles.stepCard}`}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Find Your Product</h3>
              <p className={styles.stepDesc}>
                Visit your preferred international store (like Amazon, Zara, or AliExpress) and search for the item.
              </p>
            </div>

            <div className={`${styles.card} ${styles.stepCard}`}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Copy the URL</h3>
              <p className={styles.stepDesc}>
                Copy the browser URL of the product details page directly. Make sure it points to a specific item.
              </p>
            </div>

            <div className={`${styles.card} ${styles.stepCard}`}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Calculate Price</h3>
              <p className={styles.stepDesc}>
                Paste the copied URL in the input above. We'll convert the price, calculate logistics, and show the Naira total.
              </p>
            </div>

            <div className={`${styles.card} ${styles.stepCard}`}>
              <div className={styles.stepNumber}>4</div>
              <h3 className={styles.stepTitle}>Add to Cart</h3>
              <p className={styles.stepDesc}>
                Add the calculated item directly to your cart and pay in Naira. We source, inspect, ship, and deliver.
              </p>
            </div>
          </div>
        </section>

        {/* Supported Stores Grid */}
        <section className={styles.storesSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Supported International Stores</h2>
            <p className={styles.sectionDesc}>We currently accept product URLs from these global platforms:</p>
          </div>

          <div className={styles.storesWrapper}>
            {SUPPORTED_STORES.map((store) => (
              <div key={store.name} className={styles.storeLogoCard}>
                <span className={styles.storeLogoIcon}>{store.logo}</span>
                <span>{store.name}</span>
                <span className={styles.storeLinkBadge}>{store.domain}</span>
              </div>
            ))}
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
