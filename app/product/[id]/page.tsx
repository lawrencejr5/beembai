"use client";

import React, { useState, useMemo, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import styles from "./product.module.css";
import { getProductById, getProductsByCategory, getCategoryBySlug } from "@/app/data/products";

// SVG Components
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

const TruckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17h2"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const RotateCcwIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
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
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

interface ProductPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function ProductPage({ params }: ProductPageProps) {
  const router = useRouter();
  // Unwrap params if promise
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const productId = resolvedParams?.id;

  const product = getProductById(productId);
  const category = useMemo(() => (product ? getCategoryBySlug(product.categorySlug) : undefined), [product]);
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return getProductsByCategory(product.categorySlug)
      .filter((p) => p.id !== product.id)
      .slice(0, 4);
  }, [product]);

  const [selectedColor, setSelectedColor] = useState<string>(
    product?.colors && product.colors.length > 0 ? product.colors[0] : ""
  );
  const [quantity, setQuantity] = useState<number>(1);

  if (!product) {
    return notFound();
  }

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleDecreaseQuantity = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(category ? `/category/${category.slug}` : "/");
    }
  };

  return (
    <main className={styles.productPage}>
      {/* Top Back Navigation Bar */}
      <div className={styles.topBackHeader}>
        <button type="button" onClick={handleGoBack} className={styles.backButton}>
          <ArrowLeftIcon />
          <span>Back</span>
        </button>
      </div>

      {/* Breadcrumb Navigation Bar */}
      <nav className={styles.breadcrumbs} aria-label="Breadcrumbs">
        <Link href="/" className={styles.breadcrumbLink}>
          Home
        </Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        {category && (
          <>
            <Link href={`/category/${category.slug}`} className={styles.breadcrumbLink}>
              {category.name}
            </Link>
            <span className={styles.breadcrumbSeparator}>/</span>
          </>
        )}
        <span className={styles.breadcrumbCurrent}>{product.title}</span>
      </nav>

      {/* Main Hero Product Showcase Section */}
      <section className={styles.heroShowcase}>
        {/* Left Column: Image Frame */}
        <div className={styles.imageGalleryContainer}>
          {product.tag && <span className={styles.cardTag}>{product.tag}</span>}
          {product.originalPrice && (
            <span className={styles.cardDiscountTag}>-{discountPercent}% OFF</span>
          )}
          <Image
            src={product.image}
            alt={product.title}
            fill
            priority
            className={styles.mainProductImg}
            sizes="(max-width: 992px) 100vw, 50vw"
          />
        </div>

        {/* Right Column: Product Details & Purchase Actions */}
        <div className={styles.productInfoContainer}>
          <div className={styles.metaHeader}>
            {product.brand && <span className={styles.brandBadge}>{product.brand}</span>}
            <Link href={`/category/${product.categorySlug}`} className={styles.categoryLink}>
              {product.categoryName}
            </Link>
          </div>

          <h1 className={styles.productTitle}>{product.title}</h1>

          <div className={styles.priceRow}>
            <span className={styles.currentPrice}>${product.price}</span>
            {product.originalPrice && (
              <span className={styles.originalPrice}>${product.originalPrice}</span>
            )}
            {discountPercent > 0 && (
              <span className={styles.discountPill}>Save {discountPercent}%</span>
            )}
          </div>

          {product.description && (
            <p className={styles.shortDescription}>{product.description}</p>
          )}

          {/* Condition & Color Selection Options */}
          <div className={styles.optionsContainer}>
            {product.condition && (
              <div className={styles.optionGroup}>
                <span className={styles.optionLabel}>Condition</span>
                <span className={styles.conditionBadge}>✨ {product.condition}</span>
              </div>
            )}

            {product.colors && product.colors.length > 0 && (
              <div className={styles.optionGroup}>
                <span className={styles.optionLabel}>
                  Color: <strong>{selectedColor || product.colors[0]}</strong>
                </span>
                <div className={styles.colorList}>
                  {product.colors.map((color) => {
                    const isSelected = (selectedColor || product.colors![0]) === color;
                    return (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`${styles.colorOptionBtn} ${
                          isSelected ? styles.colorOptionActive : ""
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Purchase Actions & Quantity Selector */}
          <div className={styles.actionsContainer}>
            <div className={styles.quantityRow}>
              <span className={styles.optionLabel}>Quantity</span>
              <div className={styles.quantitySelector}>
                <button
                  type="button"
                  onClick={handleDecreaseQuantity}
                  className={styles.quantityBtn}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className={styles.quantityValue}>{quantity}</span>
                <button
                  type="button"
                  onClick={handleIncreaseQuantity}
                  className={styles.quantityBtn}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button type="button" className={styles.addToCartMainBtn}>
                <CartIcon />
                <span>Add to Cart</span>
              </button>
              <button type="button" className={styles.buyNowBtn}>
                <span>Buy Now</span>
              </button>
            </div>
          </div>

          {/* Trust Guarantee Badges */}
          <div className={styles.trustBadges}>
            <div className={styles.trustBadgeItem}>
              <span className={styles.trustIcon}><TruckIcon /></span>
              <span>Express Delivery</span>
            </div>
            <div className={styles.trustBadgeItem}>
              <span className={styles.trustIcon}><ShieldIcon /></span>
              <span>100% Authentic Guarantee</span>
            </div>
            <div className={styles.trustBadgeItem}>
              <span className={styles.trustIcon}><RotateCcwIcon /></span>
              <span>30-Day Easy Returns</span>
            </div>
          </div>
        </div>
      </section>

      {/* "About This Product" Section */}
      <section className={styles.aboutSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Specifications & Features</span>
          <h2 className={styles.sectionTitle}>About This Product</h2>
        </div>

        {product.productDetails && product.productDetails.length > 0 ? (
          <ul className={styles.detailsList}>
            {product.productDetails.map((detail, index) => (
              <li key={index} className={styles.detailBulletItem}>
                <div className={styles.bulletDot} />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.shortDescription}>
            {product.description || "Premium quality product crafted with attention to detail and long-lasting durability."}
          </p>
        )}

        {/* Technical Specifications Grid */}
        <div className={styles.specsGrid}>
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Category</span>
            <span className={styles.specValue}>{product.categoryName}</span>
          </div>
          {product.brand && (
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Brand</span>
              <span className={styles.specValue}>{product.brand}</span>
            </div>
          )}
          {product.condition && (
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Condition</span>
              <span className={styles.specValue}>{product.condition}</span>
            </div>
          )}
          {product.colors && product.colors.length > 0 && (
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Available Colors</span>
              <span className={styles.specValue}>{product.colors.join(", ")}</span>
            </div>
          )}
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Price</span>
            <span className={styles.specValue}>${product.price}</span>
          </div>
        </div>
      </section>

      {/* Related Products Showcase */}
      {relatedProducts.length > 0 && (
        <section className={styles.relatedSection}>
          <h2 className={styles.relatedTitle}>More from {product.categoryName}</h2>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((item) => (
              <Link key={item.id} href={`/product/${item.id}`} className={styles.productCard}>
                <div className={styles.productImageWrapper}>
                  {item.tag && <span className={styles.cardTagSmall}>{item.tag}</span>}
                  {item.originalPrice && (
                    <span className={styles.cardDiscountTagSmall}>
                      -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                    </span>
                  )}
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className={styles.productImg}
                    sizes="(max-width: 768px) 100vw, 320px"
                  />
                </div>

                <div className={styles.productDetails}>
                  <span className={styles.productCategory}>{item.categoryName}</span>
                  <h3 className={styles.cardTitle}>{item.title}</h3>

                  <div className={styles.cardFooter}>
                    <div className={styles.priceWrapper}>
                      {item.originalPrice && (
                        <span className={styles.cardOriginalPrice}>${item.originalPrice}</span>
                      )}
                      <span className={styles.cardPrice}>${item.price}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className={styles.addToCartBtn}
                      aria-label={`Add ${item.title} to cart`}
                    >
                      <CartIcon />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
