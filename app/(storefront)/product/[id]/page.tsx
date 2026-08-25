"use client";

import React, { useState, useMemo, use, useEffect, useRef } from "react";
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
import Navbar from "@/app/components/Navbar";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// SVG Components
const SpinnerIcon = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    style={{ animation: "spin 1s linear infinite", marginRight: "0.4rem" }}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      style={{ opacity: 0.25 }}
    />
    <path
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
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

const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div style={{ display: "inline-flex", gap: "2px", alignItems: "center" }}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg key={`full-${i}`} width={size} height={size} viewBox="0 0 24 24" fill="#FBBF24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
      {hasHalfStar && (
        <div style={{ width: size, height: size, position: "relative" }}>
          <svg width={size} height={size} viewBox="0 0 24 24" fill="#E5E7EB" style={{ position: "absolute", top: 0, left: 0 }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          <svg width={size} height={size} viewBox="0 0 24 24" fill="#FBBF24" style={{ position: "absolute", top: 0, left: 0, clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </div>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg key={`empty-${i}`} width={size} height={size} viewBox="0 0 24 24" fill="#E5E7EB">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
};

interface ProductPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function ProductPage({ params }: ProductPageProps) {
  const router = useRouter();
  const { cart, addToCart, updateQuantity } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [updatingAction, setUpdatingAction] = useState<"increase" | "decrease" | null>(null);
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

  // Check store to determine if the currently logged-in user is the owner
  const store = useQuery(
    api.store.getStoreById,
    product?.storeId ? { storeId: product.storeId } : "skip"
  );
  const isOwner = !!store;

  // Query reviews for product
  const productReviews = useQuery(
    api.reviews.getProductReviews,
    !mockProduct && product?.id ? { productId: product.id } : "skip"
  );

  const updateProductMut = useMutation(api.products.updateProduct);

  // Selected thumbnail/main image state
  const [selectedImage, setSelectedImage] = useState<string>("");
  const activeImage = selectedImage || product?.image || "";

  const [selectedColor, setSelectedColor] = useState<string>("");

  // Edit Product Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editOriginalPrice, setEditOriginalPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editColors, setEditColors] = useState("");
  const [editCondition, setEditCondition] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editYoutubeLink, setEditYoutubeLink] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState("");

  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.store.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.products.resolveStorageUrl);

  // Sync default color selection when product loads
  useEffect(() => {
    if (product?.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
    if (product) {
      setEditTitle(product.title || "");
      setEditPrice(product.price ? product.price.toString() : "");
      setEditOriginalPrice(
        product.originalPrice ? product.originalPrice.toString() : "",
      );
      setEditDescription(product.description || "");
      setEditStock(product.stock ? product.stock.toString() : "");
      setEditColors(product.colors ? product.colors.join(", ") : "");
      setEditCondition(product.condition || "New");
      setEditCategoryName(product.categoryName || "Phone & Tablets");
      setEditYoutubeLink(product.youtubeLink || "");
      setUploadedImages(product.images || (product.image ? [product.image] : []));
      setMainImage(product.image || "");
    }
  }, [product]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError("");
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadUrl = await generateUploadUrl();

        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) throw new Error(`Failed to upload file ${file.name}`);

        const { storageId } = await result.json();
        const publicUrl = await resolveStorageUrl({ storageId });
        if (publicUrl) {
          newUrls.push(publicUrl);
        }
      }

      setUploadedImages((prev) => {
        const updated = [...prev, ...newUrls];
        if (!mainImage && updated.length > 0) {
          setMainImage(updated[0]);
        }
        return updated;
      });
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setUploadError(err.message || "Failed to upload one or more images.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = (urlToDelete: string) => {
    setUploadedImages((prev) => {
      const updated = prev.filter((url) => url !== urlToDelete);
      if (mainImage === urlToDelete) {
        setMainImage(updated.length > 0 ? updated[0] : "");
      }
      return updated;
    });
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    const newIndex = direction === "left" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= uploadedImages.length) return;

    setUploadedImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[newIndex];
      copy[newIndex] = temp;
      return copy;
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editPrice.trim()) {
      setUpdateError("Title and price are required.");
      return;
    }
    if (uploadedImages.length === 0) {
      setUpdateError("Please upload at least one product image.");
      return;
    }
    setIsUpdating(true);
    setUpdateError("");

    try {
      const colorsArray = editColors
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      await updateProductMut({
        productId: product.id,
        title: editTitle,
        price: parseFloat(editPrice),
        originalPrice: editOriginalPrice ? parseFloat(editOriginalPrice) : undefined,
        description: editDescription || undefined,
        condition: editCondition || undefined,
        colors: colorsArray.length > 0 ? colorsArray : undefined,
        stock: editStock ? parseInt(editStock, 10) : undefined,
        image: mainImage || uploadedImages[0],
        images: uploadedImages,
        youtubeLink: editYoutubeLink || undefined,
        categoryName: editCategoryName,
      });

      setIsEditModalOpen(false);
    } catch (err: any) {
      setUpdateError(err.message || "Failed to update product details.");
    } finally {
      setIsUpdating(false);
    }
  };

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
    <div style={{ paddingTop: "110px" }}>
      <Navbar />
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
          <h1 className={styles.productTitle} style={{ flex: 1, margin: 0 }}>{product.title}</h1>
          {isOwner && product.status !== "pending" && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className={styles.editProductBtn}
            >
              ✏️ Edit Product
            </button>
          )}
        </div>

        {/* Rating summary */}
        {product.rating !== undefined && product.rating > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", marginTop: "-0.25rem" }}>
            <StarRating rating={product.rating} />
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-papyrus)" }}>
              {product.rating.toFixed(1)}
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--color-olive-gray)" }}>
              ({product.numReviews} {product.numReviews === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}

        {product.status === "pending" && (
          <div className={styles.pendingReviewBanner}>
            ⚠️ This product is pending review. Buy now and Add to cart are disabled until approval.
          </div>
        )}

        <div className={styles.priceRow}>
          <span className={styles.currentPrice}>
            ₦{formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className={styles.originalPrice}>
              ₦{formatPrice(product.originalPrice)}
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
          {product.status === "pending" ? (
            isOwner ? (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className={styles.pendingEditBtn}
              >
                ✏️ Edit Product Details
              </button>
            ) : null
          ) : (
            <div className={styles.buttonGroup}>
              {cartQty === 0 ? (
                <button
                  type="button"
                  onClick={async () => {
                    setIsAdding(true);
                    try {
                      await addToCart(product, 1, activeColor);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setIsAdding(false);
                    }
                  }}
                  disabled={isAdding}
                  className={styles.addToCartMainBtn}
                >
                  {isAdding ? <SpinnerIcon /> : <CartIcon />}
                  <span>{isAdding ? "Adding..." : "Add to Cart"}</span>
                </button>
              ) : (
                <div className={styles.inCartQuantityPill}>
                  <button
                    type="button"
                    onClick={async () => {
                      setUpdatingAction("decrease");
                      try {
                        await updateQuantity(product.id, cartQty - 1, activeColor);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setUpdatingAction(null);
                      }
                    }}
                    disabled={updatingAction !== null}
                    className={styles.pillQtyBtn}
                    aria-label="Decrease quantity in cart"
                  >
                    {updatingAction === "decrease" ? <SpinnerIcon /> : "-"}
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
                    onClick={async () => {
                      setUpdatingAction("increase");
                      try {
                        await updateQuantity(product.id, cartQty + 1, activeColor);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setUpdatingAction(null);
                      }
                    }}
                    disabled={updatingAction !== null || cartQty >= maxStock}
                    className={styles.pillQtyBtn}
                    aria-label="Increase quantity in cart"
                  >
                    {updatingAction === "increase" ? <SpinnerIcon /> : "+"}
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
          )}
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
              ₦{formatPrice(product.price)}
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

      {/* Customer Reviews Section */}
      <section className={styles.reviewsSection}>
        <div className={styles.reviewsHeader}>
          <span className={styles.sectionTag}>Feedback</span>
          <h2 className={styles.sectionTitle}>Customer Reviews</h2>
        </div>

        {productReviews && productReviews.length > 0 ? (
          (() => {
            // Calculate rating counts
            const counts = [0, 0, 0, 0, 0]; // 1 to 5 stars
            productReviews.forEach((r) => {
              const idx = Math.max(1, Math.min(5, Math.floor(r.rating))) - 1;
              counts[idx] += 1;
            });
            const total = productReviews.length;

            return (
              <div className={styles.reviewsGrid}>
                {/* Left Side: Rating summary card */}
                <div className={styles.ratingSummaryCard}>
                  <span className={styles.bigRatingNumber}>
                    {product.rating ? product.rating.toFixed(1) : "0.0"}
                  </span>
                  <StarRating rating={product.rating || 0} size={22} />
                  <span className={styles.ratingCountLabel}>
                    Based on {total} {total === 1 ? "review" : "reviews"}
                  </span>

                  {/* Distribution list */}
                  <div className={styles.distributionList}>
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = counts[stars - 1];
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={stars} className={styles.distributionRow}>
                          <span className={styles.starLabel}>{stars} Star</span>
                          <div className={styles.progressBarContainer}>
                            <div
                              className={styles.progressBarFill}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={styles.percentageLabel}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Reviews list */}
                <div className={styles.reviewsList}>
                  {productReviews.map((review: any) => (
                    <div key={review._id} className={styles.reviewCard}>
                      <div className={styles.reviewUserRow}>
                        <div className={styles.userInfoBlock}>
                          <div className={styles.userAvatar}>
                            {review.userImage ? (
                              <img
                                src={review.userImage}
                                alt={review.userName}
                                className={styles.avatarImage}
                              />
                            ) : (
                              review.userName[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className={styles.userNameText}>{review.userName}</div>
                            <span className={styles.reviewDate}>
                              {new Date(review._creationTime).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size={14} />
                      </div>
                      <p className={styles.reviewComment}>{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()
        ) : (
          <div className={styles.noReviewsCard}>
            <div className={styles.noReviewsIcon}>💬</div>
            <h3 className={styles.noReviewsTitle}>No reviews yet</h3>
            <p className={styles.noReviewsText}>
              There are no customer reviews for this product yet. Only customers who have purchased this product can leave a review.
            </p>
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
      {/* Edit Product Modal */}
      {isEditModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) =>
            e.target === e.currentTarget && setIsEditModalOpen(false)
          }
        >
          <div className={styles.productModal}>
            <div className={styles.productModalHeader}>
              <div>
                <h2 className={styles.productModalTitle}>Edit Product Details</h2>
                <p className={styles.productModalSubtitle}>
                  Update the catalog information for this item
                </p>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form className={styles.modalForm} onSubmit={handleEditSubmit}>
              {updateError && (
                <div
                  style={{
                    color: "#d93838",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    marginBottom: "1rem",
                  }}
                >
                  ⚠️ {updateError}
                </div>
              )}

              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>Product Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={styles.modalInputField}
                />
              </div>

              <div className={styles.modalFormRow}>
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalFormLabel}>Price (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className={styles.modalInputField}
                  />
                </div>
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalFormLabel}>Original Price (₦, Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editOriginalPrice}
                    onChange={(e) => setEditOriginalPrice(e.target.value)}
                    className={styles.modalInputField}
                  />
                </div>
              </div>

              <div className={styles.modalFormRow}>
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalFormLabel}>Category</label>
                  <select
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className={styles.modalInputField}
                    style={{ height: "46px" }}
                  >
                    <option value="Phone & Tablets">Phone &amp; Tablets</option>
                    <option value="Gadgets & Accessories">Gadgets &amp; Accessories</option>
                    <option value="Apparel & Fashion">Apparel &amp; Fashion</option>
                    <option value="Furniture & Living">Furniture &amp; Living</option>
                    <option value="Beauty & Care">Beauty &amp; Care</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Home Appliances">Home Appliances</option>
                  </select>
                </div>
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalFormLabel}>Condition</label>
                  <select
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value)}
                    className={styles.modalInputField}
                    style={{ height: "46px" }}
                  >
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Refurbished">Refurbished</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFormRow}>
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalFormLabel}>Stock Level</label>
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className={styles.modalInputField}
                  />
                </div>
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalFormLabel}>Available Colors (Comma separated)</label>
                  <input
                    type="text"
                    value={editColors}
                    onChange={(e) => setEditColors(e.target.value)}
                    placeholder="e.g. Black, White, Silver"
                    className={styles.modalInputField}
                  />
                </div>
              </div>

              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>Product Images</label>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={styles.cancelModalBtn}
                    style={{ margin: 0, padding: "0.6rem 1.2rem", height: "auto" }}
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Upload Images"}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                  <span style={{ fontSize: "0.82rem", color: "var(--color-olive-gray)" }}>
                    Click image to set main. Use arrows to reorder.
                  </span>
                </div>

                {uploadError && (
                  <div style={{ color: "#d93838", fontSize: "0.8rem", fontWeight: 700, marginTop: "0.5rem" }}>
                    ⚠️ {uploadError}
                  </div>
                )}

                {uploadedImages.length > 0 && (
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
                    {uploadedImages.map((url, idx) => {
                      const isMain = url === mainImage;
                      return (
                        <div
                          key={idx}
                          onClick={() => setMainImage(url)}
                          style={{
                            width: 80,
                            height: 80,
                            position: "relative",
                            borderRadius: 12,
                            overflow: "hidden",
                            border: isMain ? "2.5px solid var(--color-palm)" : "1.5px solid var(--color-border)",
                            cursor: "pointer",
                            backgroundColor: "var(--color-sand)",
                          }}
                        >
                          <Image src={url} alt={`Upload preview ${idx + 1}`} fill sizes="80px" style={{ objectFit: "cover" }} />
                          {isMain && (
                            <span style={{
                              position: "absolute", bottom: 2, right: 2, backgroundColor: "var(--color-palm)",
                              color: "#fff", fontSize: "0.55rem", padding: "0.1rem 0.3rem", borderRadius: 4, fontWeight: 800
                            }}>
                              Main
                            </span>
                          )}

                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveImage(idx, "left");
                              }}
                              style={{
                                position: "absolute", top: 2, left: 2, background: "rgba(0,0,0,0.6)", color: "#fff",
                                border: "none", borderRadius: 4, fontSize: "0.6rem", padding: "0.1rem 0.25rem", cursor: "pointer"
                              }}
                              title="Move left"
                            >
                              ◀
                            </button>
                          )}

                          {idx < uploadedImages.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveImage(idx, "right");
                              }}
                              style={{
                                position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", color: "#fff",
                                border: "none", borderRadius: 4, fontSize: "0.6rem", padding: "0.1rem 0.25rem", cursor: "pointer"
                              }}
                              title="Move right"
                            >
                              ▶
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(url);
                            }}
                            style={{
                              position: "absolute", bottom: 2, left: 2, background: "#d93838", color: "#fff",
                              border: "none", borderRadius: 4, fontSize: "0.65rem", width: 14, height: 14,
                              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: "bold"
                            }}
                            title="Delete image"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>YouTube Video Link (Optional)</label>
                <input
                  type="url"
                  value={editYoutubeLink}
                  onChange={(e) => setEditYoutubeLink(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                  className={styles.modalInputField}
                />
              </div>

              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>Product Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className={`${styles.modalInputField} ${styles.modalTextarea}`}
                  placeholder="Describe your product details..."
                />
              </div>

              <div className={styles.modalActionsRow}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className={styles.cancelModalBtn}
                  disabled={isUpdating || isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitModalBtn}
                  disabled={isUpdating || isUploading}
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
    </div>
  );
}
