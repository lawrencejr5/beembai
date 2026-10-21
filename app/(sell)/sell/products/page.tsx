"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSellerStore } from "../SellerStoreContext";
import styles from "../seller.module.css";
import {
  QuickUpdateWeightModal,
  ProductWeightBadge,
} from "./ProductWeightComponents";
import { AddProductModal } from "./AddProductModal";

// Formatter Helpers
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

// ─── Main Products View Page Component ────────────────────────────────────────

export default function SellerProductsPage() {
  const { stores, activeStoreId } = useSellerStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "approved" | "pending" | "rejected"
  >("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any>(null);
  const [weightModalProduct, setWeightModalProduct] = useState<any | null>(null);

  const deleteProductMut = useMutation(api.products.sellerDeleteProduct);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: Id<"products">; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch products conditionally
  const allStoresProducts = useQuery(
    api.store.getSellerProductsAllStores,
    activeStoreId === null ? {} : "skip",
  );

  const singleStoreProducts = useQuery(
    api.store.getProductsByStoreForOwner,
    activeStoreId !== null ? { storeId: activeStoreId as any } : "skip",
  );

  const rawProducts =
    activeStoreId === null ? allStoresProducts : singleStoreProducts;

  const filteredProducts = useMemo(() => {
    if (!rawProducts) return [];

    return rawProducts.filter((product) => {
      // 1. Filter by Status
      if (statusFilter !== "all") {
        const prodStatus = product.status || "approved"; // back-compat
        if (prodStatus !== statusFilter) return false;
      }

      // 2. Filter by Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = product.title.toLowerCase().includes(query);
        const matchesDesc =
          product.description?.toLowerCase().includes(query) || false;
        const matchesCategory =
          product.categoryName?.toLowerCase().includes(query) || false;
        return matchesTitle || matchesDesc || matchesCategory;
      }

      return true;
    });
  }, [rawProducts, statusFilter, searchQuery]);

  const hasApprovedStores = stores.some((s) => s.status === "approved");

  return (
    <div className={styles.sellerContent}>
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
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--seller-text-primary, #1f211d)", margin: "0 0 8px" }}>
                Delete Product Listing?
              </h3>
              <p style={{ fontSize: 13, color: "var(--seller-text-secondary, #6b7280)", margin: 0, lineHeight: 1.5 }}>
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
                    await deleteProductMut({ productId: deleteConfirmTarget.id });
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

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Product Catalog</h1>
          <p className={styles.pageSubtitle}>
            Upload, view, and manage listing statuses of your product catalog
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={!hasApprovedStores}
          className={`${styles.btn} ${styles.btnPrimary}`}
          title={
            hasApprovedStores
              ? "Add product listing"
              : "You need an approved store first"
          }
        >
          + List Product
        </button>
      </div>

      {/* Filter / Search Actions */}
      <div className={styles.sellerCard} style={{ marginBottom: 20 }}>
        <div className={styles.sellerCardBody} style={{ padding: "16px 20px" }}>
          <div className={styles.filterRow}>
            <div className={styles.searchBox}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search catalog by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.formGroup} style={{ minWidth: 160 }}>
              <select
                className={styles.selectFilter}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">🌐 All Listing Statuses</option>
                <option value="approved">✓ Approved / Active</option>
                <option value="pending">⏳ Pending Review</option>
                <option value="rejected">✗ Rejected / Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table Card */}
      <div className={styles.sellerCard}>
        {rawProducts === undefined ? (
          <div className={styles.sellerCardBody}>
            <div className={styles.skeleton} style={{ height: 160 }} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            className={styles.sellerCardBody}
            style={{ textAlign: "center", padding: "60px 20px" }}
          >
            <span style={{ fontSize: 40 }}>📦</span>
            <p style={{ color: "var(--seller-text-secondary)", marginTop: 12 }}>
              {searchQuery || statusFilter !== "all"
                ? "No products match your search query or filters"
                : "No products listed in your catalog yet. Click List Product to start selling!"}
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.sellerTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Condition</th>
                  <th>Stock Levels</th>
                  <th>Weight</th>
                  <th>Unit Price</th>
                  <th>Listing Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const status = p.status || "approved";
                  return (
                    <tr key={p._id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <Link
                            href={`/sell/products/${p._id}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              textDecoration: "none",
                              color: "inherit",
                            }}
                          >
                            <img
                              src={p.image}
                              alt=""
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 6,
                                objectFit: "cover",
                                background: "var(--seller-content-bg)",
                                cursor: "pointer",
                              }}
                            />
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: "var(--seller-text-primary)",
                                  display: "block",
                                  maxWidth: 280,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  cursor: "pointer",
                                }}
                              >
                                {p.title}
                              </span>
                              {activeStoreId === null && p.brand && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "var(--seller-text-secondary)",
                                  }}
                                >
                                  Store: {p.brand}
                                </span>
                              )}
                            </div>
                          </Link>
                        </div>
                      </td>
                      <td>{p.categoryName}</td>
                      <td>
                        <span style={{ fontSize: 12.5, fontWeight: 500 }}>
                          {p.condition || "New"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {p.stock !== undefined ? (
                          p.stock > 0 ? (
                            <span style={{ color: "var(--seller-success)" }}>
                              {p.stock} units
                            </span>
                          ) : (
                            <span style={{ color: "var(--seller-danger)" }}>
                              Out of stock
                            </span>
                          )
                        ) : (
                          <span
                            style={{ color: "var(--seller-text-secondary)" }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <ProductWeightBadge
                          weight={p.weight}
                          weightClass={p.weightClass}
                          onEditClick={() => setWeightModalProduct(p)}
                        />
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {formatCurrency(p.price)}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[status]}`}>
                          {status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                          }}
                        >
                          <button
                            onClick={() => {
                              setProductToEdit(p);
                              setShowAddModal(true);
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
                            onClick={() => setDeleteConfirmTarget({ id: p._id as any, title: p.title })}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal Overlay */}
      {showAddModal && (
        <AddProductModal
          preSelectedStoreId={activeStoreId}
          allowedStores={stores}
          productToEdit={productToEdit}
          onClose={() => {
            setShowAddModal(false);
            setProductToEdit(null);
          }}
        />
      )}

      {/* Quick Update Weight Modal Overlay */}
      {weightModalProduct && (
        <QuickUpdateWeightModal
          product={weightModalProduct}
          onClose={() => setWeightModalProduct(null)}
        />
      )}
    </div>
  );
}
