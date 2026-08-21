"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "../admin.module.css";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function RejectModal({ productTitle, onConfirm, onClose }: {
  productTitle: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Reject Product</h3>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <p style={{ fontSize: 14, color: "#6b6540", marginBottom: 16 }}>
            Rejecting <strong style={{ color: "#282600" }}>{productTitle}</strong>. Provide a reason for the seller.
          </p>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Rejection Reason</label>
            <textarea
              className={styles.formTextarea}
              placeholder="e.g. Images are too low quality, misleading description..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>Cancel</button>
          <button
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            id="confirm-reject-product"
          >
            Reject Product
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as StatusFilter) ?? "all";
  const [activeTab, setActiveTab] = useState<StatusFilter>(initialTab);
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState<{ id: Id<"products">; title: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const products = useQuery(api.admin.getAllProducts, { status: activeTab });
  const counts = useQuery(api.admin.getDashboardStats);
  const approveProduct = useMutation(api.admin.approveProduct);
  const rejectProduct = useMutation(api.admin.rejectProduct);
  const setFeatured = useMutation(api.admin.setProductFeatured);
  const setSponsored = useMutation(api.admin.setProductSponsored);

  const filtered = (products ?? []).filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.storeName.toLowerCase().includes(search.toLowerCase()) ||
    p.categoryName.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { label: "All", value: "all" as StatusFilter },
    { label: "Pending", value: "pending" as StatusFilter },
    { label: "Approved", value: "approved" as StatusFilter },
    { label: "Rejected", value: "rejected" as StatusFilter },
  ];

  const handleApprove = async (productId: Id<"products">) => {
    setActionLoading(productId);
    await approveProduct({ productId });
    setActionLoading(null);
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    await rejectProduct({ productId: rejectTarget.id, reason });
    setRejectTarget(null);
    setActionLoading(null);
  };

  const handleToggle = async (
    productId: Id<"products">,
    field: "featured" | "sponsored",
    current: boolean
  ) => {
    setActionLoading(`${field}-${productId}`);
    if (field === "featured") await setFeatured({ productId, isFeatured: !current });
    else await setSponsored({ productId, isSponsored: !current });
    setActionLoading(null);
  };

  return (
    <div className={styles.adminContent}>
      {rejectTarget && (
        <RejectModal
          productTitle={rejectTarget.title}
          onConfirm={handleReject}
          onClose={() => setRejectTarget(null)}
        />
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Products</h1>
          <p className={styles.pageSubtitle}>Review, approve, and manage product listings</p>
        </div>
      </div>

      <div className={styles.adminCard}>
        <div className={styles.adminCardHeader}>
          <div className={styles.tabBar}>
            {tabs.map((tab) => {
              const count = tab.value === "pending" && counts ? counts.pendingProducts : null;
              return (
                <button
                  key={tab.value}
                  className={`${styles.tabBtn} ${activeTab === tab.value ? styles.activeTab : ""}`}
                  onClick={() => setActiveTab(tab.value)}
                  id={`tab-products-${tab.value}`}
                >
                  {tab.label}
                  {count !== null && count !== undefined && count > 0 && (
                    <span className={`${styles.tabCount} ${styles.pending}`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className={styles.searchBox} style={{ maxWidth: 280 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="products-search"
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {!products ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 24px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div className={styles.skeleton} style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className={styles.skeleton} style={{ width: "35%", height: 14 }} />
                    <div className={styles.skeleton} style={{ width: "15%", height: 10 }} />
                  </div>
                  <div className={styles.skeleton} style={{ width: 100, height: 14 }} />
                  <div className={styles.skeleton} style={{ width: 80, height: 14 }} />
                  <div className={styles.skeleton} style={{ width: 60, height: 14 }} />
                  <div className={styles.skeleton} style={{ width: 60, height: 20, borderRadius: 100 }} />
                  <div className={styles.skeleton} style={{ width: 60, height: 20, borderRadius: 100 }} />
                  <div className={styles.skeleton} style={{ width: 120, height: 32, borderRadius: 8 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📦</div>
              <h3 className={styles.emptyStateTitle}>No products found</h3>
              <p className={styles.emptyStateText}>
                {search ? "Try a different search term" : "No products in this category yet"}
              </p>
            </div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Store</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Sponsored</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img src={product.image} alt="" className={styles.productThumb} />
                        <div>
                          <Link href={`/admin/products/${product._id}`} style={{ fontWeight: 600, color: "#282600", fontSize: 13, display: "block", maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {product.title}
                          </Link>
                          {product.brand && <div style={{ fontSize: 11, color: "#9e9970" }}>{product.brand}</div>}
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.textMuted} style={{ fontSize: 13 }}>{product.storeName}</span></td>
                    <td><span className={styles.textMuted} style={{ fontSize: 13 }}>{product.categoryName}</span></td>
                    <td style={{ fontWeight: 700, fontSize: 13 }}>₦{product.price.toLocaleString()}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[product.status ?? "approved"]}`}>
                        {product.status ?? "active"}
                      </span>
                    </td>
                    <td>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={!!product.isFeatured}
                          onChange={() => handleToggle(product._id, "featured", !!product.isFeatured)}
                          disabled={actionLoading === `featured-${product._id}`}
                          id={`featured-toggle-${product._id}`}
                        />
                        <span className={styles.toggleSlider} />
                      </label>
                    </td>
                    <td>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={!!product.isSponsored}
                          onChange={() => handleToggle(product._id, "sponsored", !!product.isSponsored)}
                          disabled={actionLoading === `sponsored-${product._id}`}
                          id={`sponsored-toggle-${product._id}`}
                        />
                        <span className={styles.toggleSlider} />
                      </label>
                    </td>
                    <td>
                      <div className={styles.flexRow}>
                        <Link href={`/admin/products/${product._id}`} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}>View</Link>
                        {product.status === "pending" && (
                          <>
                            <button
                              className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`}
                              onClick={() => handleApprove(product._id)}
                              disabled={actionLoading === product._id}
                              id={`approve-product-${product._id}`}
                            >
                              {actionLoading === product._id ? "…" : "Approve"}
                            </button>
                            <button
                              className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                              onClick={() => setRejectTarget({ id: product._id, title: product.title })}
                              id={`reject-product-${product._id}`}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {product.status === "rejected" && (
                          <button
                            className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`}
                            onClick={() => handleApprove(product._id)}
                          >
                            Re-approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
