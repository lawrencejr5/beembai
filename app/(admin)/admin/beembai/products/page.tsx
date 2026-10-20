"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "../../admin.module.css";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

import { AddProductModal } from "@/app/(sell)/sell/products/AddProductModal";
import { QuickUpdateWeightModal, ProductWeightBadge } from "@/app/(sell)/sell/products/ProductWeightComponents";

// ─── Add/Edit Product Modal Component ──────────────────────────────────────────
function ProductModal({
  onClose,
  productToEdit,
}: {
  onClose: () => void;
  productToEdit?: any;
}) {
  return <AddProductModal onClose={onClose} productToEdit={productToEdit} isAdmin={true} />;
}

export default function BeembaiProductsPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [weightModalProduct, setWeightModalProduct] = useState<any | null>(null);

  const deleteProduct = useMutation(api.beembaiStore.adminDeleteProduct);

  const { results: products, status, loadMore } = usePaginatedQuery(
    api.beembaiStore.getBeembaiStoreProducts,
    {},
    { initialNumItems: 15 }
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status !== "CanLoadMore") return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(15); },
      { threshold: 0.1 }
    );
    const el = loadMoreRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [status, loadMore]);

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: Id<"products">; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    const list = products ?? [];
    // Hide scraped foreign products
    const beembaiLocal = list.filter(
      (p: any) => p.categorySlug !== "foreign-import" && p.tag !== "import"
    );
    
    const term = search.toLowerCase().trim();
    if (!term) return beembaiLocal;
    return beembaiLocal.filter((p) =>
      p.title.toLowerCase().includes(term) ||
      (p.brand && p.brand.toLowerCase().includes(term)) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(term))
    );
  }, [products, search]);

  return (
    <div className={styles.adminContent}>
      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirmTarget(null)}>
          <div className={styles.modal} style={{ maxWidth: 440, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#fef2f2",
                border: "1px solid #fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "#dc2626"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1900", margin: "0 0 8px" }}>
                Delete Product Listing?
              </h3>
              <p style={{ fontSize: 13, color: "#6b6540", margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>"{deleteConfirmTarget.title}"</strong>? This action cannot be undone.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={isDeleting}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                disabled={isDeleting}
                style={{ flex: 1, backgroundColor: "#dc2626", color: "#ffffff", borderColor: "#dc2626" }}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteProduct({ productId: deleteConfirmTarget.id });
                    setDeleteConfirmTarget(null);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <ProductModal
          onClose={() => {
            setShowModal(false);
            setEditProduct(null);
          }}
          productToEdit={editProduct}
        />
      )}

      {weightModalProduct && (
        <QuickUpdateWeightModal
          product={weightModalProduct}
          onClose={() => setWeightModalProduct(null)}
        />
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Products (Beembai) 🛍️</h1>
          <p className={styles.pageSubtitle}>Manage products listed directly on the Beembai Official Store</p>
        </div>
        <div>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => {
              setEditProduct(null);
              setShowModal(true);
            }}
            id="add-beembai-product-btn"
          >
            + List Product
          </button>
        </div>
      </div>

      <div className={styles.adminCard}>
        <div className={styles.adminCardHeader}>
          <div className={styles.searchBox} style={{ maxWidth: 300 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by title or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="beembai-products-search"
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {status === "LoadingFirstPage" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 24px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div className={styles.skeleton} style={{ width: 44, height: 44, borderRadius: 8 }} />
                  <div style={{ flex: 1 }}><div className={styles.skeleton} style={{ width: "40%", height: 14 }} /></div>
                  <div className={styles.skeleton} style={{ width: 80, height: 14 }} />
                  <div className={styles.skeleton} style={{ width: 60, height: 20, borderRadius: 100 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🛍️</div>
              <h3 className={styles.emptyStateTitle}>No products listed</h3>
              <p className={styles.emptyStateText}>Click "+ List Product" to list a product on Beembai Store.</p>
            </div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Weight</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <Link
                        href={`/admin/beembai/products/${product._id}`}
                        style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}
                      >
                        <img src={product.image} alt="" className={styles.productThumb} />
                        <div>
                          <div style={{ fontWeight: 600, color: "#282600", fontSize: 13, maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer" }}>
                            {product.title}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: "#6b6540" }}>{product.categoryName}</span>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: 13 }}>
                      {formatCurrency(product.price)}
                    </td>
                    <td>
                      <ProductWeightBadge
                        weight={product.weight}
                        weightClass={product.weightClass}
                        onEditClick={() => setWeightModalProduct(product)}
                      />
                    </td>
                    <td>
                      <span className={`${styles.badge} ${(product.stock ?? 0) > 0 ? styles.approved : styles.rejected}`}>
                        {(product.stock ?? 0) > 0 ? `${product.stock} units` : "Out of Stock"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.flexRow}>
                        <button
                          onClick={() => {
                            setEditProduct(product);
                            setShowModal(true);
                          }}
                          type="button"
                          title="Edit Product"
                          style={{
                            background: "#eff6ff",
                            border: "1px solid #dbeafe",
                            borderRadius: 8,
                            padding: "6px 10px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmTarget({ id: product._id, title: product.title })}
                          type="button"
                          title="Delete Product"
                          style={{
                            background: "#fef2f2",
                            border: "1px solid #fee2e2",
                            borderRadius: 8,
                            padding: "6px 10px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {status === "CanLoadMore" && <div ref={loadMoreRef} style={{ height: 20, margin: "16px 0" }} />}
        </div>
      </div>
    </div>
  );
}