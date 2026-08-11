"use client";

import React, { useState, useMemo, use, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import styles from "./product.module.css";
import {
  getProductById,
  getProductsByCategory,
  getCategoryBySlug,
  formatPrice,
} from "@/app/data/data";
import { useCart } from "@/app/context/CartContext";
import ProductCard from "@/app/components/ProductCard";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

interface ProductPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function ProductPage({ params }: ProductPageProps) {
  const router = useRouter();
  const { cart, addToCart, updateQuantity } = useCart();
  // Unwrap params if promise
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const productId = resolvedParams?.id;

  // 1. Try mock data first
  const mockProduct = getProductById(productId);

  // 2. Fetch from Convex if not mock
  const dbProduct = useQuery(
    api.products.getProductDetails,
    !mockProduct && productId ? { productId } : "skip"
  );

  const product: any = useMemo(() => {
    if (mockProduct) return mockProduct;
    if (dbProduct) {
      return {
        id: dbProduct._id,
        title: dbProduct.title,
        price: dbProduct.price,
        originalPrice: dbProduct.originalPrice,
        image: dbProduct.image,
        categorySlug: dbProduct.categorySlug,
        categoryName: dbProduct.categoryName,
        colors: dbProduct.colors,
        description: dbProduct.description,
        tag: dbProduct.tag,
        stock: dbProduct.stock,
        storeId: dbProduct.storeId,
        images: dbProduct.images,
        youtubeLink: dbProduct.youtubeLink,
        status: dbProduct.status,
        brand: dbProduct.brand,
      };
    }
    return undefined;
  }, [mockProduct, dbProduct]);

  // Loading state
  const isLoading = !mockProduct && dbProduct === undefined;

  const category = useMemo(
    () => (product ? getCategoryBySlug(product.categorySlug) : undefined),
    [product],
  );

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return getProductsByCategory(product.categorySlug)
      .filter((p) => p.id !== product.id)
      .slice(0, 4);
  }, [product]);

  // Selected thumbnail/main image state
  const [selectedImage, setSelectedImage] = useState<string>("");
  const activeImage = selectedImage || product?.image || "";

  const [selectedColor, setSelectedColor] = useState<string>("");

  // Sync default color selection when product loads
  useEffect(() => {
    if (product?.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
  }, [product]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", background: "var(--background)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--color-olive-gray)", fontWeight: 600, fontSize: "1rem" }}>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return notFound();
  }

  const activeColor =
    selectedColor ||
    (product.colors && product.colors.length > 0
      ? product.colors[0]
      : undefined);
  const currentCartItem = cart.find(
    (item) =>
      item.product.id === product.id && item.selectedColor === activeColor,
  );
  const cartQty = currentCartItem?.quantity || 0;
  const maxStock = product.stock ?? 15;

  const discountPercent = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

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
        <button
          type="button"
          onClick={handleGoBack}
          className={styles.backButton}
        >
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
            <Link
              href={`/category/${category.slug}`}
              className={styles.breadcrumbLink}
            >
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
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
          <div className={styles.imageGalleryContainer}>
            {product.tag && <span className={styles.cardTag}>{product.tag}</span>}
            {product.originalPrice && (
              <span className={styles.cardDiscountTag}>
                -{discountPercent}% OFF
              </span>
            )}
            <Image
              src={activeImage}
              alt={product.title}
              fill
              priority
              className={styles.mainProductImg}
              sizes="(max-width: 992px) 100vw, 50vw"
            />
          </div>
          {/* Multiple thumbnails rendering */}
          {product.images && product.images.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {product.images.map((imgUrl: string, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(imgUrl)}
                  style={{
                    width: 70, height: 70, position: "relative", borderRadius: 10, overflow: "hidden",
                    border: activeImage === imgUrl ? "2px solid var(--color-palm)" : "1.5px solid var(--color-border)",
                    cursor: "pointer", transition: "all 0.2s ease", backgroundColor: "var(--color-sand)"
                  }}
                >
                  <Image src={imgUrl} alt={`Thumbnail ${idx + 1}`} fill sizes="70px" style={{ objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Details & Purchase Actions */}
        <div className={styles.productInfoContainer}>
          <div className={styles.metaHeader}>
            {product.brand && (
              <span className={styles.brandBadge}>{product.brand}</span>
            )}
            <Link
              href={`/category/${product.categorySlug}`}
              className={styles.categoryLink}
            >
              {product.categoryName}
            </Link>
          </div>

          <h1 className={styles.productTitle}>{product.title}</h1>

          <div className={styles.priceRow}>
            <span className={styles.currentPrice}>
              ${formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className={styles.originalPrice}>
                ${formatPrice(product.originalPrice)}
              </span>
            )}
            {discountPercent > 0 && (
              <span className={styles.discountPill}>
                Save {discountPercent}%
              </span>
            )}
          </div>

          {product.description && (
            <p className={styles.shortDescription}>{product.description}</p>
          )}

          {/* Condition, Color & Stock Availability Options */}
          <div className={styles.optionsContainer}>
            <div className={styles.optionGroup}>
              <span className={styles.optionLabel}>Stock Status</span>
              <span
                className={
                  maxStock <= 5
                    ? `${styles.stockBadge} ${styles.lowStockBadge}`
                    : styles.stockBadge
                }
              >
                {maxStock <= 5
                  ? `🔥 Only ${maxStock} left in stock!`
                  : `✓ In Stock (${maxStock} available)`}
              </span>
            </div>

            {product.condition && (
              <div className={styles.optionGroup}>
                <span className={styles.optionLabel}>Condition</span>
                <span className={styles.conditionBadge}>
                  ✨ {product.condition}
                </span>
              </div>
            )}

            {product.colors && product.colors.length > 0 && (
              <div className={styles.optionGroup}>
                <span className={styles.optionLabel}>
                  Color: <strong>{selectedColor || product.colors[0]}</strong>
                </span>
                <div className={styles.colorList}>
                  {product.colors.map((color: string) => {
                    const isSelected =
                      (selectedColor || product.colors![0]) === color;
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

          {/* Dynamic Purchase Actions & Inline Quantity Control */}
          <div className={styles.actionsContainer}>
            <div className={styles.buttonGroup}>
              {cartQty === 0 ? (
                <button
                  type="button"
                  onClick={() => addToCart(product, 1, activeColor)}
                  className={styles.addToCartMainBtn}
                >
                  <CartIcon />
                  <span>Add to Cart</span>
                </button>
              ) : (
                <div className={styles.inCartQuantityPill}>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(product.id, cartQty - 1, activeColor)
                    }
                    className={styles.pillQtyBtn}
                    aria-label="Decrease quantity in cart"
                  >
                    -
                  </button>
                  <span className={styles.pillQtyValue}>
                    <span>{cartQty}</span>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        opacity: 0.8,
                        fontWeight: 700,
                      }}
                    >
                      in Cart
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(product.id, cartQty + 1, activeColor)
                    }
                    disabled={cartQty >= maxStock}
                    className={styles.pillQtyBtn}
                    aria-label="Increase quantity in cart"
                  >
                    +
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (cartQty === 0) {
                    addToCart(product, 1, activeColor);
                  }
                  router.push("/cart");
                }}
                className={styles.buyNowBtn}
              >
                <span>Buy Now</span>
              </button>
            </div>
          </div>

          {/* Trust Guarantee Badges */}
          <div className={styles.trustBadges}>
            <div className={styles.trustBadgeItem}>
              <span className={styles.trustIcon}>
                <TruckIcon />
              </span>
              <span>Express Delivery</span>
            </div>
            <div className={styles.trustBadgeItem}>
              <span className={styles.trustIcon}>
                <ShieldIcon />
              </span>
              <span>100% Authentic Guarantee</span>
            </div>
            <div className={styles.trustBadgeItem}>
              <span className={styles.trustIcon}>
                <RotateCcwIcon />
              </span>
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
            {product.productDetails.map((detail: string, index: number) => (
              <li key={index} className={styles.detailBulletItem}>
                <div className={styles.bulletDot} />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.shortDescription}>
            {product.description ||
              "Premium quality product crafted with attention to detail and long-lasting durability."}
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
              <span className={styles.specValue}>
                {product.colors.join(", ")}
              </span>
            </div>
          )}
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Price</span>
            <span className={styles.specValue}>
              ${formatPrice(product.price)}
            </span>
          </div>
        </div>

        {/* YouTube Video Section */}
        {product.youtubeLink && (
          <div style={{ marginTop: "2.5rem", borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-papyrus)", marginBottom: "1rem" }}>
              Product Video Demonstration
            </h3>
            {(() => {
              const youtubeId = (() => {
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                const match = product.youtubeLink?.match(regExp);
                return match && match[2].length === 11 ? match[2] : null;
              })();
              
              if (youtubeId) {
                return (
                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 16, border: "1.5px solid var(--color-border)" }}>
                    <iframe
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                );
              }
              return (
                <p style={{ fontSize: "0.85rem", color: "var(--color-olive-gray)" }}>
                  Watch video: <a href={product.youtubeLink} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-palm)", fontWeight: 700 }}>{product.youtubeLink}</a>
                </p>
              );
            })()}
          </div>
        )}
      </section>

      {/* Related Products Showcase */}
      {relatedProducts.length > 0 && (
        <section className={styles.relatedSection}>
          <h2 className={styles.relatedTitle}>
            More from {product.categoryName}
          </h2>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                imageSizes="(max-width: 768px) 100vw, 320px"
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
