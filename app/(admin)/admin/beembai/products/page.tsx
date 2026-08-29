"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "../../admin.module.css";
import { Id } from "@/convex/_generated/dataModel";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Add/Edit Product Modal Component ──────────────────────────────────────────
function ProductModal({
  onClose,
  productToEdit,
}: {
  onClose: () => void;
  productToEdit?: any;
}) {
  const [step, setStep] = useState(1);

  // Step 1 Form fields
  const [title, setTitle] = useState(productToEdit?.title || "");
  const [categoryName, setCategoryName] = useState(productToEdit?.categoryName || "Phones & Tablets");
  const [price, setPrice] = useState(productToEdit?.price ? String(productToEdit.price) : "");
  const [originalPrice, setOriginalPrice] = useState(productToEdit?.originalPrice ? String(productToEdit.originalPrice) : "");
  const [description, setDescription] = useState(productToEdit?.description || "");
  const [condition, setCondition] = useState(productToEdit?.condition || "New");
  const [colors, setColors] = useState(productToEdit?.colors ? productToEdit.colors.join(", ") : "");
  const [stock, setStock] = useState(productToEdit?.stock ? String(productToEdit.stock) : "10");

  // Step 2 Upload fields
  const [uploadedImages, setUploadedImages] = useState<string[]>(productToEdit?.images || (productToEdit?.image ? [productToEdit.image] : []));
  const [mainImage, setMainImage] = useState<string>(productToEdit?.image || "");
  const [youtubeLink, setYoutubeLink] = useState(productToEdit?.youtubeLink || "");
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutations/Queries
  const generateUploadUrl = useMutation(api.store.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.products.resolveStorageUrl);
  const createProduct = useMutation(api.beembaiStore.adminCreateProduct);
  const updateProduct = useMutation(api.beembaiStore.adminUpdateProduct);
  const categories = useQuery(api.products.getCategories);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price.trim()) return;
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
      const colorsArr = colors
        ? colors.split(",").map((c: string) => c.trim()).filter((c: string) => c.length > 0)
        : [];

      if (productToEdit) {
        await updateProduct({
          productId: productToEdit._id,
          title,
          price: parseFloat(price),
          originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
          categoryName,
          description: description || undefined,
          condition: condition || undefined,
          colors: colorsArr,
          stock: parseInt(stock, 10),
          image: mainImage,
          images: uploadedImages,
          youtubeLink: youtubeLink || undefined,
        });
      } else {
        await createProduct({
          title,
          price: parseFloat(price),
          originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
          categoryName,
          description: description || undefined,
          condition: condition || undefined,
          colors: colorsArr,
          stock: parseInt(stock, 10),
          image: mainImage,
          images: uploadedImages,
          youtubeLink: youtubeLink || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: 600 }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {productToEdit ? "Edit Product Details" : "List New Product"}
          </h3>
          <button className={styles.modalClose} onClick={onClose} type="button">×</button>
        </div>
        <div className={styles.modalBody}>
          {step === 1 ? (
            <form onSubmit={handleNextStep} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Product Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Handmade Leather Chelsea Boots"
                  className={styles.formInput}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Price (₦) *</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    className={styles.formInput}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Product Category *</label>
                  <select
                    className={styles.formSelect}
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                  >
                    {categories?.map((c) => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    )) || (
                      <>
                        <option value="Phones & Tablets">Phones & Tablets</option>
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
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    <option value="New">Brand New</option>
                    <option value="Refurbished">Refurbished / Certified</option>
                    <option value="Used">Used / Vintage</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Stock Levels / Qty</label>
                  <input
                    type="number"
                    placeholder="10"
                    className={styles.formInput}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Available Colors (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Brown, Tan, Black"
                    className={styles.formInput}
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Product Description *</label>
                <textarea
                  required
                  placeholder="Describe your product specifications, sizing, and details..."
                  className={styles.formTextarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
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
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text-primary)", marginBottom: 4 }}>
                  Product Catalog Images *
                </p>
                <p style={{ fontSize: 12, color: "var(--admin-text-secondary)" }}>
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
                <p style={{ fontWeight: 700, fontSize: 13, color: "var(--admin-accent)", marginTop: 8 }}>
                  {isUploading ? "Uploading to storage..." : "Click to select product photos"}
                </p>
                <p style={{ fontSize: 11, color: "var(--admin-text-secondary)" }}>
                  Support JPG, PNG, or WEBP formats
                </p>
              </div>

              {uploadError && (
                <div style={{ color: "var(--admin-danger)", fontSize: 12, fontWeight: 700 }}>
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
                <div style={{ color: "var(--admin-danger)", fontSize: 12, fontWeight: 700 }}>
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

export default function BeembaiProductsPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);

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

  const handleDelete = async (productId: Id<"products">, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteProduct({ productId });
    } catch (e) {
      console.error(e);
      alert("Failed to delete product.");
    }
  };

  const filtered = useMemo(() => {
    const list = products ?? [];
    // Hide scraped products
    const beembaiLocal = list.filter((p) => p.categorySlug !== "foreign-import");
    
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
      {showModal && (
        <ProductModal
          onClose={() => {
            setShowModal(false);
            setEditProduct(null);
          }}
          productToEdit={editProduct}
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
                  <th>Stock</th>
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
                          <div style={{ fontWeight: 600, color: "#282600", fontSize: 13, maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {product.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: "#6b6540" }}>{product.categoryName}</span>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: 13 }}>
                      {formatCurrency(product.price)}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${(product.stock ?? 0) > 0 ? styles.approved : styles.rejected}`}>
                        {(product.stock ?? 0) > 0 ? `${product.stock} units` : "Out of Stock"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.flexRow}>
                        <button
                          className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                          onClick={() => {
                            setEditProduct(product);
                            setShowModal(true);
                          }}
                          type="button"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                          onClick={() => handleDelete(product._id, product.title)}
                          type="button"
                        >
                          ❌ Delete
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