"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/app/data/data";
import styles from "./search.module.css";

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
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";

  const results = useQuery(
    api.products.searchProducts,
    query.trim() ? { query } : "skip",
  );

  const isLoading = results === undefined && query.trim() !== "";

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {/* Header Section with Back Button and Page Title */}
        <header className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            <ArrowLeftIcon />
            <span>Back</span>
          </button>
          
          <h1 className={styles.pageTitle}>
            Search results for &ldquo;{query}&rdquo;
          </h1>
        </header>

        {/* Results Section */}
        {query.trim() === "" ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h2 className={styles.emptyTitle}>Start searching</h2>
            <p className={styles.emptyDesc}>
              Type something in the search bar on the home page to find products.
            </p>
          </div>
        ) : isLoading ? (
          <div className={styles.resultsSection}>
            <div className={styles.productsGrid}>

              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonImg} />
                  <div className={styles.skeletonBody}>
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLineShort} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : results && results.length > 0 ? (
          <div className={styles.resultsSection}>
            <div className={styles.resultsHeader}>
              <h1 className={styles.resultsTitle}>
                <span className={styles.resultsCount}>{results.length}</span>
                {results.length === 1 ? " result" : " results"} for &ldquo;
                <span className={styles.queryHighlight}>{query}</span>&rdquo;
              </h1>
            </div>

            <div className={styles.productsGrid}>
              {results.map((product) => (
                <Link
                  key={product._id}
                  href={`/product/${product._id}`}
                  className={styles.productCard}
                >
                  <div className={styles.productImageWrapper}>
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className={styles.productImage}
                    />
                  </div>
                  <div className={styles.productInfo}>
                    {product.brand && (
                      <span className={styles.productBrand}>{product.brand}</span>
                    )}
                    <h2 className={styles.productTitle}>{product.title}</h2>
                    <div className={styles.productMeta}>
                      <span className={styles.productCategory}>
                        {product.categoryName}
                      </span>
                    </div>
                    <div className={styles.productPricing}>
                      <span className={styles.productPrice}>
                        ₦{formatPrice(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className={styles.productOriginalPrice}>
                          ₦{formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>😕</div>
            <h2 className={styles.emptyTitle}>No results found</h2>
            <p className={styles.emptyDesc}>
              We couldn&apos;t find anything matching &ldquo;{query}&rdquo;. Try
              different keywords or browse our categories.
            </p>
            <Link href="/categories" className={styles.browseBtn}>
              Browse Categories
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
