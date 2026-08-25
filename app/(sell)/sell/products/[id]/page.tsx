"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSellerStore } from "../../layout";
import { AddProductModal } from "../page";
import styles from "../../seller.module.css";

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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function SellerProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const router = useRouter();
  const { stores } = useSellerStore();
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const deleteProductMut = useMutation(api.products.sellerDeleteProduct);

  const handleDeleteProduct = async () => {
    if (!confirm("Are you sure you want to permanently delete this product listing? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteProductMut({ productId: productId as Id<"products"> });
      router.push("/sell/products");
    } catch (err) {
      console.error(err);
      alert("Failed to delete product. Please try again.");
    }
  };

  const product = useQuery(api.products.getProductDetails, { productId });
  const reviews = useQuery(api.reviews.getProductReviews, { productId: productId as any });

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (product === undefined) {
    return (
      <div className={styles.sellerContent} style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
        <p style={{ color: "var(--seller-text-secondary)" }}>Loading product details...</p>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className={styles.sellerContent} style={{ textAlign: "center", padding: "100px 20px" }}>
        <h3>Product not found</h3>
        <p style={{ color: "var(--seller-text-secondary)", marginTop: 8 }}>
          The product listing you are looking for does not exist or has been deleted.
        </p>
        <Link href="/sell/products" className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: 16, display: "inline-block", textDecoration: "none" }}>
          Back to Catalog
        </Link>
      </div>
    );
  }

  const storefrontUrl = typeof window !== "undefined"
    ? `${window.location.origin}/product/${product._id}`
    : `/product/${product._id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storefrontUrl);
    setCopied(true);
  };

  const status = product.status || "approved";

  return (
    <div className={styles.sellerContent}>
      {/* Back Link */}
      <div style={{ marginBottom: "20px" }}>
        <Link href="/sell/products" style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "var(--seller-accent)", fontSize: "14px", fontWeight: 600 }}>
          <span>← Back to Catalog</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <span style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "1px", color: "var(--seller-text-secondary)" }}>
            Product Dashboard
          </span>
          <h1 className={styles.pageTitle} style={{ marginTop: "4px" }}>{product.title}</h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setShowEditModal(true)}
            className={`${styles.btn} ${styles.btnSuccess}`}
          >
            ✏️ Edit Details
          </button>
          <button
            onClick={handleDeleteProduct}
            className={`${styles.btn} ${styles.btnDanger}`}
          >
            🗑️ Delete Product
          </button>
        </div>
      </div>

      {/* Storefront Link Slim Card */}
      <div style={{
        background: "rgba(99, 109, 33, 0.06)",
        border: "1px solid rgba(99, 109, 33, 0.15)",
        borderRadius: "12px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        marginBottom: "24px",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexGrow: 1, minWidth: 0 }}>
          <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px", color: "var(--seller-accent)" }}>
            Storefront Listing Link
          </span>
          <span style={{ fontSize: "13.5px", color: "var(--seller-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {storefrontUrl}
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
          <button
            onClick={handleCopyLink}
            className={`${styles.btn} ${styles.btnGhost}`}
            style={{ padding: "8px 12px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            {copied ? "✓ Copied!" : "📋 Copy Link"}
          </button>
          <a
            href={`/product/${product._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ padding: "8px 16px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
          >
            <span>Go to Storefront</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Main product presentation */}
      <div className={styles.sellerCard} style={{ overflow: "hidden" }}>
        <div className={styles.sellerCardBody} style={{ padding: "30px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px" }}>
            
            {/* Image Preview Column */}
            <div>
              <div style={{ borderRadius: "12px", overflow: "hidden", background: "var(--seller-content-bg)", border: "1px solid var(--seller-card-border)", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={product.image} alt={product.title} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
              
              {product.images && product.images.length > 1 && (
                <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
                  {product.images.map((img: string, idx: number) => (
                    <div key={idx} style={{ width: "60px", height: "60px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--seller-card-border)", background: "var(--seller-content-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={img} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Meta details column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <span className={`${styles.badge} ${styles[status]}`} style={{ marginBottom: "8px", display: "inline-block" }}>
                  Listing Status: {status.replace("_", " ")}
                </span>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--seller-text-primary)" }}>{product.title}</h2>
                <p style={{ color: "var(--seller-text-secondary)", fontSize: "14px", marginTop: "4px" }}>
                  Category: <strong>{product.categoryName || "Uncategorized"}</strong>
                </p>
                {product.rating !== undefined && product.rating > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                    <StarRating rating={product.rating} size={14} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--seller-text-primary)" }}>
                      {product.rating.toFixed(1)} / 5.0
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--seller-text-secondary)" }}>
                      ({product.numReviews} {product.numReviews === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                )}
              </div>

              <div style={{ padding: "16px", background: "rgba(0,0,0,0.05)", borderRadius: "8px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ fontSize: "24px", fontWeight: 800, color: "var(--seller-text-primary)" }}>
                    {formatCurrency(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span style={{ fontSize: "16px", textDecoration: "line-through", color: "var(--seller-text-secondary)" }}>
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </div>
                
                <div style={{ marginTop: "12px", fontSize: "13.5px" }}>
                  <span>Stock levels: </span>
                  {product.stock !== undefined ? (
                    product.stock > 0 ? (
                      <strong style={{ color: "var(--seller-success)" }}>{product.stock} units</strong>
                    ) : (
                      <strong style={{ color: "var(--seller-danger)" }}>Out of stock</strong>
                    )
                  ) : (
                    <strong style={{ color: "var(--seller-text-secondary)" }}>—</strong>
                  )}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--seller-text-primary)", marginBottom: "6px" }}>Condition</h4>
                <p style={{ fontSize: "13.5px", color: "var(--seller-text-secondary)" }}>{product.condition || "New"}</p>
              </div>

              {product.colors && product.colors.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--seller-text-primary)", marginBottom: "6px" }}>Colors</h4>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {product.colors.map((color: string, idx: number) => (
                      <span key={idx} style={{ padding: "4px 10px", fontSize: "12px", background: "rgba(0,0,0,0.08)", borderRadius: "99px", color: "var(--seller-text-primary)" }}>
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.description && (
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--seller-text-primary)", marginBottom: "6px" }}>Product Description</h4>
                  <p style={{ fontSize: "13.5px", color: "var(--seller-text-secondary)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    {product.description}
                  </p>
                </div>
              )}

              {product.youtubeLink && (
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--seller-text-primary)", marginBottom: "6px" }}>YouTube Link</h4>
                  <a href={product.youtubeLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13.5px", color: "var(--seller-accent)", textDecoration: "underline", fontWeight: 600 }}>
                    📹 View video showcase
                  </a>
                </div>
              )}

            </div>

          </div>
        </div>
      </div>

      {/* Product Reviews Card for Seller */}
      <div className={styles.sellerCard} style={{ marginTop: "24px" }}>
        <div style={{ padding: "20px 30px", borderBottom: "1px solid var(--seller-card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--seller-text-primary)", margin: 0 }}>
            Customer Feedback & Reviews
          </h3>
          {product.rating !== undefined && product.rating > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <StarRating rating={product.rating} size={15} />
              <span style={{ fontSize: "14px", fontWeight: 750, color: "var(--seller-text-primary)" }}>
                {product.rating.toFixed(1)} ({product.numReviews} {product.numReviews === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>
        <div className={styles.sellerCardBody} style={{ padding: "30px" }}>
          {reviews && reviews.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {reviews.map((review: any) => (
                <div key={review._id} style={{ paddingBottom: "20px", borderBottom: "1px solid var(--seller-card-border)", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "50%", background: "var(--seller-accent)",
                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: "14px", overflow: "hidden"
                      }}>
                        {review.userImage ? (
                          <img src={review.userImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          review.userName ? review.userName[0].toUpperCase() : "A"
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--seller-text-primary)" }}>{review.userName}</div>
                        <span style={{ fontSize: "11px", color: "var(--seller-text-secondary)" }}>
                          {new Date(review._creationTime).toLocaleDateString("en-NG", {
                            year: "numeric", month: "long", day: "numeric"
                          })}
                        </span>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size={13} />
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--seller-text-secondary)", margin: 0, lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--seller-text-secondary)", fontSize: "13.5px" }}>
              💬 No reviews for this product yet.
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal Overlay */}
      {showEditModal && (
        <AddProductModal
          preSelectedStoreId={product.storeId || null}
          allowedStores={stores}
          productToEdit={product}
          onClose={() => {
            setShowEditModal(false);
          }}
        />
      )}

    </div>
  );
}
