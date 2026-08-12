"use client";

import React, { useState, useMemo, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./category.module.css";
import {
  getCategoryBySlug,
  getProductsByCategory,
  Product,
  formatPrice,
  formatNumber,
} from "@/app/data/data";
import { useCart } from "@/app/context/CartContext";
import ProductCard from "@/app/components/ProductCard";

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
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

const FilterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

interface CategoryPageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { addToCart } = useCart();
  // Unwrap params if promise
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const slug = resolvedParams?.slug;

  const category = getCategoryBySlug(slug);
  const rawProducts = useMemo(
    () => (category ? getProductsByCategory(category.slug) : []),
    [category],
  );

  // Extract min and max prices from category products
  const categoryPrices = useMemo(() => {
    if (!rawProducts.length) return { min: 0, max: 2000 };
    const prices = rawProducts.map((p) => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [rawProducts]);

  // Extract available brands and colors dynamically
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    rawProducts.forEach((p) => {
      if (p.brand) brandsSet.add(p.brand);
    });
    return Array.from(brandsSet).sort();
  }, [rawProducts]);

  const availableColors = useMemo(() => {
    const colorsSet = new Set<string>();
    rawProducts.forEach((p) => {
      if (p.colors && Array.isArray(p.colors)) {
        p.colors.forEach((c) => colorsSet.add(c));
      }
    });
    return Array.from(colorsSet).sort();
  }, [rawProducts]);

  const availableConditions: Array<"New" | "Refurbished" | "Like New"> = [
    "New",
    "Refurbished",
    "Like New",
  ];

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(
    categoryPrices.max,
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [discountedOnly, setDiscountedOnly] = useState<boolean>(false);

  // Mobile Bottom Modal Drawer Open State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Count Active Filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (maxPriceFilter < categoryPrices.max) count++;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (selectedConditions.length > 0) count += selectedConditions.length;
    if (selectedColors.length > 0) count += selectedColors.length;
    if (discountedOnly) count++;
    return count;
  }, [
    maxPriceFilter,
    categoryPrices.max,
    selectedBrands,
    selectedConditions,
    selectedColors,
    discountedOnly,
  ]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setMaxPriceFilter(categoryPrices.max);
    setSelectedBrands([]);
    setSelectedConditions([]);
    setSelectedColors([]);
    setDiscountedOnly(false);
  };

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand],
    );
  };

  const handleConditionToggle = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition],
    );
  };

  const handleColorToggle = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
  };

  // Filtered Products Logic
  const filteredProducts = useMemo(() => {
    return rawProducts.filter((product) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = product.title.toLowerCase().includes(query);
        const matchesDesc = product.description?.toLowerCase().includes(query);
        const matchesTag = product.tag?.toLowerCase().includes(query);
        const matchesBrand = product.brand?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesTag && !matchesBrand)
          return false;
      }

      // 2. Price Filter
      if (product.price > maxPriceFilter) return false;

      // 3. Brand Filter
      if (selectedBrands.length > 0) {
        if (!product.brand || !selectedBrands.includes(product.brand))
          return false;
      }

      // 4. Condition Filter
      if (selectedConditions.length > 0) {
        if (
          !product.condition ||
          !selectedConditions.includes(product.condition)
        )
          return false;
      }

      // 5. Colors Filter (Array match)
      if (selectedColors.length > 0) {
        if (
          !product.colors ||
          !product.colors.some((c) => selectedColors.includes(c))
        )
          return false;
      }

      // 6. Discounted Only Filter
      if (discountedOnly) {
        if (!product.originalPrice || product.originalPrice <= product.price)
          return false;
      }

      return true;
    });
  }, [
    rawProducts,
    searchQuery,
    maxPriceFilter,
    selectedBrands,
    selectedConditions,
    selectedColors,
    discountedOnly,
  ]);

  if (!category) {
    return notFound();
  }

  const handleAddToCart = () => {
    // Add to cart handler
  };

  // Filter Controls Component (Reused in Desktop Sidebar & Mobile Drawer)
  const FilterControlsContent = () => (
    <>
      {/* 1. Price Range Filter */}
      <div className={styles.filterGroup}>
        <span className={styles.filterGroupTitle}>Price Range</span>
        <div className={styles.priceRangeInputs}>
          <div className={styles.priceInputWrapper}>
            <span>$</span>
            <span>{formatPrice(categoryPrices.min)}</span>
          </div>
          <span
            style={{ fontSize: "0.8rem", color: "var(--color-olive-gray)" }}
          >
            to
          </span>
          <div className={styles.priceInputWrapper}>
            <span>$</span>
            <span>{formatPrice(maxPriceFilter)}</span>
          </div>
        </div>
        <input
          type="range"
          min={categoryPrices.min}
          max={categoryPrices.max}
          value={maxPriceFilter}
          onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
          className={styles.priceSlider}
        />
      </div>

      {/* 2. Brand Filter */}
      {availableBrands.length > 0 && (
        <div className={styles.filterGroup}>
          <span className={styles.filterGroupTitle}>Brand</span>
          <div className={styles.filterCheckboxList}>
            {availableBrands.map((brand) => (
              <label key={brand} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandToggle(brand)}
                />
                <span>{brand}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 3. Condition Filter */}
      <div className={styles.filterGroup}>
        <span className={styles.filterGroupTitle}>Condition</span>
        <div className={styles.filterCheckboxList}>
          {availableConditions.map((condition) => (
            <label key={condition} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedConditions.includes(condition)}
                onChange={() => handleConditionToggle(condition)}
              />
              <span>{condition}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 4. Color Options Filter */}
      {availableColors.length > 0 && (
        <div className={styles.filterGroup}>
          <span className={styles.filterGroupTitle}>Color Options</span>
          <div className={styles.colorChips}>
            {availableColors.map((color) => {
              const isSelected = selectedColors.includes(color);
              return (
                <button
                  type="button"
                  key={color}
                  onClick={() => handleColorToggle(color)}
                  className={`${styles.colorChip} ${isSelected ? styles.colorChipActive : ""}`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Discounted Only Filter */}
      <div className={styles.filterGroup}>
        <label className={styles.discountToggle}>
          <span>Discounted Items Only</span>
          <input
            type="checkbox"
            checked={discountedOnly}
            onChange={(e) => setDiscountedOnly(e.target.checked)}
          />
        </label>
      </div>
    </>
  );

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
      {/* Category Banner with Category Image Background & Bold Title */}
      <section
        className={styles.categoryBanner}
        style={{ backgroundImage: `url('${category.bannerImage}')` }}
      >
        <div className={styles.bannerOverlay} />

        <Link href="/#shop" className={styles.categoryBackButton}>
          <ArrowLeftIcon />
          <span>Back</span>
        </Link>

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

      {/* Category Main Layout (Amazon-Style Desktop Sidebar + Product Grid) */}
      <section className={styles.categoryLayout}>
        {/* Desktop Left Filter Sidebar */}
        <aside className={styles.desktopSidebar}>
          <div className={styles.filterHeader}>
            <h3 className={styles.filterTitle}>
              <FilterIcon />
              <span>Filters</span>
            </h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className={styles.clearFiltersBtn}
              >
                Clear All ({activeFiltersCount})
              </button>
            )}
          </div>

          <FilterControlsContent />
        </aside>

        {/* Main Content Product Area */}
        <div className={styles.mainContent}>
          <div className={styles.topControlsBar}>
            <Link href="/" className={styles.backToHomeLink}>
              <ArrowLeftIcon />
              <span>Back to Home</span>
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span className={styles.productsCountTag}>
                Showing {formatNumber(filteredProducts.length)} of{" "}
                {formatNumber(rawProducts.length)} Products
              </span>

              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className={styles.mobileFilterBtn}
              >
                <FilterIcon />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className={styles.filterBadge}>
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className={styles.productsGrid}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h3 className={styles.emptyTitle}>No matching products found</h3>
              <p className={styles.emptySubtitle}>
                We couldn't find any products matching your active filter
                criteria in {category.name}. Try adjusting or clearing your
                filters!
              </p>
              <button
                onClick={handleResetFilters}
                className={styles.applyFiltersBtn}
                style={{ maxWidth: "200px", marginTop: "0.5rem" }}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Mobile Filter Bottom Drawer / Modal */}
      {isMobileFilterOpen && (
        <div
          className={styles.drawerBackdrop}
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div
            className={styles.drawerSheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerHandleBar} />

            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>
                <FilterIcon />
                <span>Filter Products</span>
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className={styles.drawerCloseBtn}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>

            <div className={styles.drawerBody}>
              <FilterControlsContent />
            </div>

            <div className={styles.drawerFooter}>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className={styles.drawerClearBtn}
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className={styles.applyFiltersBtn}
              >
                Apply Filters ({filteredProducts.length} Products)
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
