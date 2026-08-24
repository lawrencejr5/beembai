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
