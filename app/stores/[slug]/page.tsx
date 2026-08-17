"use client";

import React, { useState, useMemo, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import styles from "./storeDetail.module.css";
import homeStyles from "@/app/page.module.css";
import { useCart } from "@/app/context/CartContext";
import ProductCard from "@/app/components/ProductCard";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Local SVG Icons
const SearchIcon = () => (
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
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const CartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2 2h2.5l2.6 12.4a2 2 0 002 1.6h9.8a2 2 0 002-1.6l1.7-8.4H5.5"
    />
    <circle cx="9" cy="20" r="1.5" fill="currentColor" />
    <circle cx="18" cy="20" r="1.5" fill="currentColor" />
  </svg>
);

const StarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const VerifiedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.454 1.358 4.49 4.49 0 011.358 3.454 4.49 4.49 0 011.549 3.397c0 1.357-.6 2.573-1.549 3.397a4.49 4.49 0 01-1.358 3.454 4.49 4.49 0 01-3.454 1.358A4.49 4.49 0 0112 21.75c-1.357 0-2.573-.6-3.397-1.549a4.49 4.49 0 01-3.454-1.358 4.49 4.49 0 01-1.358-3.454 4.49 4.49 0 01-1.549-3.397c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.358-3.454 4.49 4.49 0 013.454-1.358zM16.03 9.47a.75.75 0 00-1.06-1.06l-4.47 4.47-1.97-1.97a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.06 0l5-5z"
      clipRule="evenodd"
    />
  </svg>
);

const ArrowLeftIcon = () => (
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
      d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
    />
  </svg>
);

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.72-12.72l-1.41-1.41"
    />
  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const getStoreInitials = (name: string): string => {
  const cleanName = name.replace(/['’&]/g, "").trim();
  const words = cleanName.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function StoreDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { totalItemsCount, cartBounce } = useCart();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const store = useQuery(api.store.getStoreBySlug, { slug });
  const dbProducts = useQuery(
    api.store.getProductsByStore,
    store ? { storeId: store._id } : "skip"
  );

  // Sync theme
  useEffect(() => {
    const activeTheme =
      (document.documentElement.getAttribute("data-theme") as
        | "light"
        | "dark") || "light";
    setTheme(activeTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  if (store === undefined || dbProducts === undefined) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", background: "var(--background)" }}>
        <p style={{ color: "var(--color-olive-gray)", fontWeight: 600 }}>Loading brand storefront...</p>
      </div>
    );
  }

  if (store === null) {
    notFound();
  }

  // Get store inventory mapped with id for ProductCard compatibility
  const rawProducts = dbProducts.map((p) => ({
    id: p._id,
    ...p,
    condition: p.condition as any,
  }));

  // Filter store products
  const filteredProducts = rawProducts.filter(
    (product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (product.description &&
        product.description.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
      (product.tag && product.tag.toLowerCase().includes(searchQuery.toLowerCase().trim())),
  );

  // Get unique categories list from raw store catalog products
  const categoriesList = (() => {
    const catsMap: Record<string, string> = {};
    rawProducts.forEach((p) => {
      catsMap[p.categorySlug] = p.categoryName;
    });
    return Object.entries(catsMap).map(([slug, name]) => ({ slug, name }));
  })();

  // Filter products by selectedCategory tab
  const displayedProducts = (() => {
    if (selectedCategory === "all") return filteredProducts;
    return filteredProducts.filter((p) => p.categorySlug === selectedCategory);
  })();

  return (
    <div className={styles.container}>
      {/* Main Container */}
      <main className={styles.mainContent}>
        {/* Store Banner Hero */}
        <section
          className={styles.bannerHero}
          style={{
            backgroundImage: `url('${store.banner}')`,
            backgroundColor: "var(--color-sand)",
          }}
        >
          <div className={styles.bannerHeroOverlay} />
          <button onClick={() => router.back()} className={styles.backBtn}>
            <ArrowLeftIcon />
            <span>Go Back</span>
          </button>
        </section>

        {/* Store Title Bar Overlap */}
        <section className={styles.storeHeader}>
          {/* Circular Store Logo */}
          <div className={styles.logoContainer}>
            {store.logo ? (
              <Image
                src={store.logo}
                alt={store.name}
                width={120}
                height={120}
                className={styles.logoImage}
              />
            ) : (
              <span
                className={styles.logoPlaceholder}
                style={{ fontSize: "2.5rem" }}
              >
                {getStoreInitials(store.name)}
              </span>
            )}
          </div>

          {/* Metadata Block */}
          <div className={styles.storeMetaBlock}>
            <div className={styles.badgeRow}>
              <span className={styles.categoryTag}>{store.category}</span>
              {(store.verified || store.verificationStatus === "verified") && (
                <span className={styles.verifiedLabel}>
                  <VerifiedIcon />
                  <span>Verified Store</span>
                </span>
              )}
            </div>

            <div className={styles.storeNameGroup}>
              <h1 className={styles.storeTitleName}>{store.name}</h1>
            </div>

            <div className={styles.ratingRow}>
              <span className={styles.starIcon}>
                <StarIcon />
              </span>
              <span className={styles.ratingValue}>
                {store.rating.toFixed(1)} / 5.0 rating
              </span>
            </div>
          </div>
        </section>

        {/* About & Stats Section */}
        <section className={styles.storeBioSection}>
          <div className={styles.bioContent}>
            <h2 className={styles.sectionTitle}>About the Brand</h2>
            <p className={styles.bioText}>{store.description}</p>
            {store.bannerMessage && (
              <p
                className={styles.bioText}
                style={{
                  fontStyle: "italic",
                  borderLeft: "3px solid var(--color-palm)",
                  paddingLeft: "1rem",
                }}
              >
                "{store.bannerMessage}"
              </p>
            )}
          </div>

          <div className={styles.statsSidebar}>
            <h3 className={styles.sectionTitle} style={{ fontSize: "1.05rem" }}>
              Store Details
            </h3>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Products Listed</span>
              <span className={styles.statValue}>
                {rawProducts.length} items
              </span>
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Avg Shipping</span>
              <span className={styles.statValue}>1 - 3 Days</span>
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Response Rate</span>
              <span className={styles.statValue}>99% (Excellent)</span>
            </div>
          </div>
        </section>

        {/* Store Catalog Header & Search */}
        <section className={styles.inventoryHeader}>
          <h2 className={styles.sectionTitle}>
            Shop the Catalog ({filteredProducts.length})
          </h2>

          <div className={styles.inventorySearch}>
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder={`Search within ${store.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={styles.clearSearchBtn}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </section>

        {/* Category Pill Tabs */}
        {categoriesList.length > 0 && (
          <div className={styles.tabsContainer}>
            <button
              type="button"
              className={`${styles.tabBtn} ${selectedCategory === "all" ? styles.activeTabBtn : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              All Products ({filteredProducts.length})
            </button>
            {categoriesList.map((cat) => {
              // count matches in current filtered search
              const count = filteredProducts.filter(
                (p) => p.categorySlug === cat.slug,
              ).length;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  className={`${styles.tabBtn} ${selectedCategory === cat.slug ? styles.activeTabBtn : ""}`}
                  onClick={() => setSelectedCategory(cat.slug)}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Catalog Products Grid */}
        {displayedProducts.length > 0 ? (
          <section className={styles.productsGrid}>
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        ) : (
          <section className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>No matching products found</h3>
            <p className={styles.emptySubtitle}>
              Try adjusting your search query or selecting a different category
              tab.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
