"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSellerStore } from "../layout";
import styles from "../seller.module.css";

// Formatter Helpers
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

// ─── Add Product Modal Component ──────────────────────────────────────────────

export function AddProductModal({
  onClose,
  preSelectedStoreId,
  allowedStores,
  productToEdit,
}: {
  onClose: () => void;
  preSelectedStoreId: string | null;
  allowedStores: any[];
  productToEdit?: any;
}) {
  const [step, setStep] = useState(1);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    productToEdit?.storeId || preSelectedStoreId || (allowedStores[0]?._id as string) || ""
  );

  // Step 1 Form fields
  const [productTitle, setProductTitle] = useState(productToEdit?.title || "");
  const [productCategory, setProductCategory] = useState(productToEdit?.categoryName || "Phone & Tablets");
  const [productPrice, setProductPrice] = useState(productToEdit?.price ? String(productToEdit.price) : "");
  const [originalPrice, setOriginalPrice] = useState(productToEdit?.originalPrice ? String(productToEdit.originalPrice) : "");
  const [productDesc, setProductDesc] = useState(productToEdit?.description || "");
  const [productCondition, setProductCondition] = useState(productToEdit?.condition || "New");
  const [productColors, setProductColors] = useState(productToEdit?.colors ? productToEdit.colors.join(", ") : "");
  const [productStock, setProductStock] = useState(productToEdit?.stock ? String(productToEdit.stock) : "");
  const [youtubeLink, setYoutubeLink] = useState(productToEdit?.youtubeLink || "");

  // Step 2 Upload fields
  const [uploadedImages, setUploadedImages] = useState<string[]>(productToEdit?.images || []);
  const [mainImage, setMainImage] = useState<string>(productToEdit?.image || "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const generateUploadUrl = useMutation(api.store.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.products.resolveStorageUrl);
  const createProductMut = useMutation(api.products.createProduct);
  const updateProductMut = useMutation(api.products.updateProduct);

  const categories = useQuery(api.products.getCategories);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productTitle.trim() || !productPrice.trim() || !selectedStoreId) return;
    setStep(2);
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 1. Generate Upload URL
        const uploadUrl = await generateUploadUrl();

        // 2. Fetch/POST upload URL
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload image to storage");
        const { storageId } = await uploadResponse.json();

        // 3. Resolve storage URL
        const publicUrl = await resolveStorageUrl({ storageId });
        if (publicUrl) urls.push(publicUrl);
      }

      setUploadedImages((prev) => {
        const next = [...prev, ...urls];
        if (!mainImage && next.length > 0) {
          setMainImage(next[0]);
        }
        return next;
      });
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = (urlToDelete: string) => {
    setUploadedImages((prev) => prev.filter((url) => url !== urlToDelete));
    if (mainImage === urlToDelete) {
      setMainImage(uploadedImages.find((url) => url !== urlToDelete) || "");
    }
  };

  const handleFinalSubmit = async () => {
    if (!mainImage) {
      setSubmitError("Please select a primary thumbnail image.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const colorsArr = productColors
        ? productColors.split(",").map((c: string) => c.trim()).filter((c: string) => c.length > 0)
        : [];

      if (productToEdit) {
        await updateProductMut({
          productId: productToEdit._id,
          title: productTitle,
          price: parseFloat(productPrice),
          originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
          categoryName: productCategory,
          description: productDesc || undefined,
          condition: productCondition || undefined,
          colors: colorsArr.length > 0 ? colorsArr : undefined,
          stock: productStock ? parseInt(productStock) : undefined,
          image: mainImage,
          images: uploadedImages,
          youtubeLink: youtubeLink || undefined,
        });
      } else {
        await createProductMut({
          title: productTitle,
          price: parseFloat(productPrice),
          originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
          categoryName: productCategory,
          description: productDesc || undefined,
          condition: productCondition || undefined,
          colors: colorsArr.length > 0 ? colorsArr : undefined,
          stock: productStock ? parseInt(productStock) : undefined,
          storeId: selectedStoreId as Id<"stores">,
          image: mainImage,
          images: uploadedImages,
          youtubeLink: youtubeLink || undefined,
        });
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to save product listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const approvedStores = allowedStores.filter(s => s.status === "approved");

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {productToEdit ? "Edit Product Details" : "List New Product"}
          </h3>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          {step === 1 ? (
            <form onSubmit={handleNextStep} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              {/* Store Selector */}
              {preSelectedStoreId === null && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Target Store storefront *</label>
                  <select
                    className={styles.formSelect}
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Store</option>
                    {approvedStores.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Product Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Handmade Leather Chelsea Boots"
                  className={styles.formInput}
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Price (₦) *</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    className={styles.formInput}
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Original Price (Compare at ₦)</label>
                  <input
                    type="number"
                    placeholder="35000"
                    className={styles.formInput}
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Product Category *</label>
                  <select
                    className={styles.formSelect}
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                  >
                    {categories?.map((c) => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    )) || (
                      <>
                        <option value="Phone & Tablets">Phone & Tablets</option>
                        <option value="Gadgets & Accessories">Gadgets & Accessories</option>
                        <option value="Apparel & Fashion">Apparel & Fashion</option>
                        <option value="Furniture & Living">Furniture & Living</option>
                        <option value="Beauty & Care">Beauty & Care</option>
                      </>
                    )}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Condition Status</label>
                  <select
                    className={styles.formSelect}
                    value={productCondition}
                    onChange={(e) => setProductCondition(e.target.value)}
                  >
                    <option value="New">Brand New</option>
                    <option value="Refurbished">Refurbished / Certified</option>
                    <option value="Used">Used / Vintage</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Stock Levels / Qty</label>
                  <input
                    type="number"
                    placeholder="10"
                    className={styles.formInput}
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Available Colors (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Brown, Tan, Black"
                    className={styles.formInput}
                    value={productColors}
                    onChange={(e) => setProductColors(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Product Description *</label>
                <textarea
                  required
                  placeholder="Describe your product specifications, sizing, and details..."
                  className={styles.formTextarea}
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                />
              </div>

              <div className={styles.modalFooter} style={{ padding: "16px 0 0" }}>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                  Next: Upload Images
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--seller-text-primary)", marginBottom: 4 }}>
                  Product Catalog Images *
                </p>
                <p style={{ fontSize: 12, color: "var(--seller-text-secondary)" }}>
                  Click an image thumbnail to set it as the **Primary Main/Thumbnail** image.
                </p>
              </div>

              <input
                type="file"
                multiple
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleImagesUpload}
              />

              <div
                className={styles.imageUploadZone}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <span style={{ fontSize: 24 }}>📁</span>
                <p style={{ fontWeight: 700, fontSize: 13, color: "var(--seller-accent)", marginTop: 8 }}>
                  {isUploading ? "Uploading to storage..." : "Click to select product photos"}
                </p>
                <p style={{ fontSize: 11, color: "var(--seller-text-secondary)" }}>
                  Support JPG, PNG, or WEBP formats
                </p>
              </div>

              {uploadError && (
                <div style={{ color: "var(--seller-danger)", fontSize: 12, fontWeight: 700 }}>
                  ⚠️ {uploadError}
                </div>
              )}

              {uploadedImages.length > 0 && (
                <div className={styles.imagePreviewGrid}>
                  {uploadedImages.map((url, idx) => {
                    const isMain = url === mainImage;
                    return (
                      <div
                        key={idx}
                        className={`${styles.imagePreviewWrapper} ${isMain ? styles.imagePreviewMainActive : ""}`}
                        onClick={() => setMainImage(url)}
                      >
                        <img src={url} alt="" />
                        {isMain && <span className={styles.mainImageBadgeTag}>Main</span>}
                        <button
                          type="button"
                          className={styles.deletePreviewBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(url);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>YouTube Video Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={styles.formInput}
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                />
              </div>

              {submitError && (
                <div style={{ color: "var(--seller-danger)", fontSize: 12, fontWeight: 700 }}>
                  ⚠️ {submitError}
                </div>
              )}

              <div className={styles.modalFooter} style={{ padding: "16px 0 0" }}>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setStep(1)} disabled={isSubmitting}>
                  Back
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting || isUploading || uploadedImages.length === 0}
                >
                  {isSubmitting ? "Saving..." : "Save & List"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Products View Page Component ────────────────────────────────────────

export default function SellerProductsPage() {
  const { stores, activeStoreId } = useSellerStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any>(null);

  const deleteProductMut = useMutation(api.products.sellerDeleteProduct);

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to permanently delete this product listing? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteProductMut({ productId: productId as Id<"products"> });
    } catch (err) {
      console.error(err);
      alert("Failed to delete product. Please try again.");
    }
  };

  // Fetch products conditionally
  const allStoresProducts = useQuery(
    api.store.getSellerProductsAllStores,
    activeStoreId === null ? {} : "skip"
  );

  const singleStoreProducts = useQuery(
    api.store.getProductsByStoreForOwner,
    activeStoreId !== null ? { storeId: activeStoreId as any } : "skip"
  );

  const rawProducts = activeStoreId === null ? allStoresProducts : singleStoreProducts;

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
        const matchesDesc = product.description?.toLowerCase().includes(query) || false;
        const matchesCategory = product.categoryName?.toLowerCase().includes(query) || false;
        return matchesTitle || matchesDesc || matchesCategory;
      }

      return true;
    });
  }, [rawProducts, statusFilter, searchQuery]);

  const hasApprovedStores = stores.some(s => s.status === "approved");

  return (
    <div className={styles.sellerContent}>
      
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Product Catalog</h1>
          <p className={styles.pageSubtitle}>Upload, view, and manage listing statuses of your product catalog</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={!hasApprovedStores}
          className={`${styles.btn} ${styles.btnPrimary}`}
          title={hasApprovedStores ? "Add product listing" : "You need an approved store first"}
        >
          + List Product
        </button>
      </div>

      {/* Filter / Search Actions */}
      <div className={styles.sellerCard} style={{ marginBottom: 20 }}>
        <div className={styles.sellerCardBody} style={{ padding: "16px 20px" }}>
          <div className={styles.filterRow}>
            <div className={styles.searchBox}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
          <div className={styles.sellerCardBody} style={{ textAlign: "center", padding: "60px 20px" }}>
            <span style={{ fontSize: 40 }}>📦</span>
            <p style={{ color: "var(--seller-text-secondary)", marginTop: 12 }}>
              {searchQuery || statusFilter !== "all" 
                ? "No products match your search query or filters"
                : "No products listed in your catalog yet. Click List Product to start selling!"
              }
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
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Link href={`/sell/products/${p._id}`} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}>
                            <img
                              src={p.image}
                              alt=""
                              style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", background: "var(--seller-content-bg)", cursor: "pointer" }}
                            />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 700, color: "var(--seller-text-primary)", display: "block", maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer" }}>
                                {p.title}
                              </span>
                              {activeStoreId === null && p.brand && (
                                <span style={{ fontSize: 11, color: "var(--seller-text-secondary)" }}>
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
                            <span style={{ color: "var(--seller-success)" }}>{p.stock} units</span>
                          ) : (
                            <span style={{ color: "var(--seller-danger)" }}>Out of stock</span>
                          )
                        ) : (
                          <span style={{ color: "var(--seller-text-secondary)" }}>—</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(p.price)}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[status]}`}>
                          {status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button
                            onClick={() => {
                              setProductToEdit(p);
                              setShowAddModal(true);
                            }}
                            className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`}
                            style={{ padding: "4px 8px" }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p._id)}
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                            style={{ padding: "4px 8px" }}
                          >
                            🗑️ Delete
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
    </div>
  );
}
