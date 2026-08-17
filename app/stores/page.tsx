"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./stores.module.css";
import homeStyles from "@/app/page.module.css";
import { getAllStores, Store, formatNumber } from "@/app/data/data";
import { useCart } from "@/app/context/CartContext";
import Navbar from "@/app/components/Navbar";
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
    width="16"
    height="16"
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

const ArrowRightIcon = () => (
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
      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
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

export default function StoresPage() {
  const { totalItemsCount, cartBounce } = useCart();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [searchQuery, setSearchQuery] = useState("");

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

  const dbStores = useQuery(api.products.getStores);
  const stores = dbStores || [];
  const isLoading = dbStores === undefined;

  // Filter stores based on search query
  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return stores;
    const query = searchQuery.toLowerCase().trim();
    return stores.filter(
      (store) =>
        store.name.toLowerCase().includes(query) ||
        store.category.toLowerCase().includes(query) ||
        store.description.toLowerCase().includes(query),
    );
  }, [searchQuery, stores]);

  return (
    <div className={styles.container}>
      <Navbar />

      {/* Main Page Layout */}
      <main className={styles.mainContent}>
        {/* Sell Banner */}
        <section className={styles.heroBanner}>
          <div className={styles.heroContent}>
            <div className={styles.heroTag}>
              <span>Partner Program</span>
            </div>
            <h2 className={styles.heroTitle}>Sell very easily on Beembai</h2>
            <p className={`${styles.heroText} ${styles.desktopText}`}>
              Reach millions of buyers who appreciate high-quality curated
              design, premium electronics, and custom home products. Build your
              storefront in minutes.
            </p>
            <p className={`${styles.heroText} ${styles.mobileText}`}>
              Reach millions of buyers easily. Build your storefront in minutes
              and start selling.
            </p>
          </div>
          <Link href="/sell" className={styles.heroActionBtn}>
            Open Your Store
          </Link>
        </section>

        {/* Directory Header Area */}
        <section className={styles.directoryHeader}>
          <div className={styles.titleArea}>
            <h1 className={styles.pageTitle}>Brand Storefronts</h1>
            <p className={styles.pageSubtitle}>
              Explore verified brand stores, official distributors, and
              independent creators selling on Beembai.
            </p>
          </div>

          {/* Search Box */}
          <div className={styles.searchAndFilterBar}>
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search stores by brand name, category, products..."
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

        {/* Stores Directory Grid */}
        {isLoading ? (
          <section className={styles.storesGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={styles.storeCard}
                style={{ height: "350px", opacity: 0.6, pointerEvents: "none" }}
              >
                <div className={styles.cardBanner} style={{ backgroundColor: "var(--color-border)", height: "120px" }} />
                <div className={styles.cardBody} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1.5rem" }}>
                  <div style={{ width: "80px", height: "15px", backgroundColor: "var(--color-border)", borderRadius: 4 }} />
                  <div style={{ width: "160px", height: "24px", backgroundColor: "var(--color-border)", borderRadius: 4, marginTop: "0.5rem" }} />
                  <div style={{ width: "100%", height: "40px", backgroundColor: "var(--color-border)", borderRadius: 4, marginTop: "0.5rem" }} />
                </div>
              </div>
            ))}
          </section>
        ) : filteredStores.length > 0 ? (
          <section className={styles.storesGrid}>
            {filteredStores.map((store) => (
              <Link
                key={store._id}
                href={`/stores/${store.slug}`}
                className={`${styles.storeCard} ${
                  store.slug === "beembai-official" || store.slug === "beembai"
                    ? styles.officialStoreCard
                    : ""
                }`}
              >
                {/* Banner Header Image */}
                <div
                  className={styles.cardBanner}
                  style={{
                    backgroundImage: store.banner ? `url('${store.banner}')` : "none",
                    backgroundColor: "var(--color-sand)",
                  }}
                >
                  <div className={styles.cardBannerOverlay} />
                  {(store.slug === "beembai-official" || store.slug === "beembai") && (
                    <div className={styles.logoContainer}>
                      {store.logo ? (
                        <Image
                          src={store.logo}
                          alt={`${store.name} Logo`}
                          width={64}
                          height={64}
                          className={styles.logoImage}
                        />
                      ) : (
                        <span
                          className={styles.logoPlaceholder}
                          style={{ fontSize: "1.3rem" }}
                        >
                          {getStoreInitials(store.name)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Info Body */}
                <div className={styles.cardBody}>
                  {/* Floating Store Logo for other stores */}
                  {store.slug !== "beembai-official" && store.slug !== "beembai" && (
                    <div className={styles.logoContainer}>
                      {store.logo ? (
                        <Image
                          src={store.logo}
                          alt={`${store.name} Logo`}
                          width={64}
                          height={64}
                          className={styles.logoImage}
                        />
                      ) : (
                        <span
                          className={styles.logoPlaceholder}
                          style={{ fontSize: "1.3rem" }}
                        >
                          {getStoreInitials(store.name)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Badge & Category Row */}
                  <div className={styles.badgeRow}>
                    <span className={styles.categoryTag}>{store.category}</span>
                  </div>

                  {/* Store Name, Verified, Rating */}
                  <div className={styles.storeMeta}>
                    <div className={styles.storeNameGroup}>
                      <h3 className={styles.storeCardName}>{store.name}</h3>
                      {(store.verified || store.verificationStatus === "verified") && (
                        <span
                          className={`${styles.verifiedBadge} ${
                            store.slug === "beembai-official" || store.slug === "beembai"
                              ? styles.officialVerifiedBadge
                              : styles.otherVerifiedBadge
                          }`}
                          title="Verified Merchant"
                        >
                          <VerifiedIcon />
                        </span>
                      )}
                    </div>

                    <div
                      className={`${styles.ratingRow} ${
                        store.slug === "beembai-official" || store.slug === "beembai"
                          ? styles.officialStoreRating
                          : ""
                      }`}
                    >
                      <span className={styles.starIcon}>
                        <StarIcon />
                      </span>
                      <span className={styles.ratingText}>
                        {(store.rating || 5.0).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Short Bio */}
                  <p className={styles.storeCardDesc}>{store.description}</p>

                  {/* Card Bottom CTA */}
                  <div className={styles.cardFooter}>
                    <span className={styles.visitText}>
                      <span>
                        {store.slug === "beembai-official" || store.slug === "beembai"
                          ? "Visit Official Store"
                          : "Visit Store"}
                      </span>
                      <ArrowRightIcon />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <section className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>
              No stores found matching your search
            </h3>
            <p className={styles.emptySubtitle}>
              Try adjusting your query or category filters to locate your brand
              partner.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
