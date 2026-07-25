"use client";

import React, { useState, useMemo, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./category.module.css";
import { getCategoryBySlug, getProductsByCategory } from "@/app/data/products";

// SVG Components
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

const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
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
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

interface CategoryPageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  // Unwrap params if promise
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const slug = resolvedParams?.slug;

  const category = getCategoryBySlug(slug);
  const rawProducts = useMemo(() => (category ? getProductsByCategory(category.slug) : []), [category]);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return rawProducts;
    const query = searchQuery.toLowerCase().trim();
    return rawProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tag?.toLowerCase().includes(query)
    );
  }, [rawProducts, searchQuery]);

  if (!category) {
    return notFound();
  }

  const handleAddToCart = () => {
    // Add to cart handler
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
      {/* Category Banner with Category Image Background & Bold Title */}
      <section
        className={styles.categoryBanner}
        style={{ backgroundImage: `url('${category.bannerImage}')` }}
      >
        <div className={styles.bannerOverlay} />

        <div className={styles.bannerContent}>
          <div className={styles.categoryTag}>
            <SparklesIcon />
            <span>Category Showcase</span>
          </div>

          <h1 className={styles.categoryTitle}>{category.name}</h1>

          <p className={styles.categoryDescription}>{category.description}</p>

          {/* Search Input within Category */}
          <div className={styles.categorySearchBox}>
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search within ${category.name}...`}
              className={styles.categorySearchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={styles.searchClearBtn}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category Products Display Section (Grid Layout Matching Homepage New Arrivals) */}
      <section className={styles.productsSection}>
        <div className={styles.productsHeader}>
          <Link href="/" className={styles.backToHomeLink}>
            <ArrowLeftIcon />
            <span>Back to Home</span>
          </Link>

          <span className={styles.productsCountTag}>
            Showing {filteredProducts.length} of {rawProducts.length} Products
          </span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.productImageWrapper}>
                  {product.tag && (
                    <span className={styles.cardTag}>{product.tag}</span>
                  )}
                  {product.originalPrice && (
                    <span className={styles.cardDiscountTag}>
                      -
                      {Math.round(
                        ((product.originalPrice - product.price) /
                          product.originalPrice) *
                          100
                      )}
                      %
                    </span>
                  )}
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className={styles.productImg}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                <div className={styles.productDetails}>
                  <span className={styles.productCategory}>
                    {product.categoryName}
                  </span>
                  <h3 className={styles.productTitle}>{product.title}</h3>

                  <div className={styles.cardFooter}>
                    <div className={styles.priceWrapper}>
                      {product.originalPrice && (
                        <span className={styles.originalPrice}>
                          ${product.originalPrice}
                        </span>
                      )}
                      <span className={styles.price}>${product.price}</span>
                    </div>
                    <button
                      onClick={handleAddToCart}
                      className={styles.addToCartBtn}
                      aria-label={`Add ${product.title} to cart`}
                    >
                      <CartIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>No matching products found</h3>
            <p className={styles.emptySubtitle}>
              We couldn't find any products matching "{searchQuery}" in {category.name}. Try a different search query!
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
