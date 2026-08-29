"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "../../admin.module.css";
import { Id } from "@/convex/_generated/dataModel";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);
}

// ─── Add/Edit Product Modal Component ──────────────────────────────────────────
function ProductModal({
  onClose,
  productToEdit,
}: {
  onClose: () => void;
  productToEdit?: any;
}) {
  const [title, setTitle] = useState(productToEdit?.title || "");
  const [categoryName, setCategoryName] = useState(productToEdit?.categoryName || "Phones & Tablets");
  const [price, setPrice] = useState(productToEdit?.price ? String(productToEdit.price) : "");
  const [originalPrice, setOriginalPrice] = useState(productToEdit?.originalPrice ? String(productToEdit.originalPrice) : "");
  const [description, setDescription] = useState(productToEdit?.description || "");
  const [condition, setCondition] = useState(productToEdit?.condition || "New");
  const [colors, setColors] = useState(productToEdit?.colors ? productToEdit.colors.join(", ") : "");
  const [stock, setStock] = useState(productToEdit?.stock ? String(productToEdit.stock) : "10");
  const [youtubeLink, setYoutubeLink] = useState(productToEdit?.youtubeLink || "");
  const [image, setImage] = useState(productToEdit?.image || "");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutations/Queries
  const generateUploadUrl = useMutation(api.store.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.products.resolveStorageUrl);
  const createProduct = useMutation(api.beembaiStore.adminCreateProduct);
  const updateProduct = useMutation(api.beembaiStore.adminUpdateProduct);
  const categories = useQuery(api.products.getCategories);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) throw new Error("Upload failed");
      const { storageId } = await response.json();

      const publicUrl = await resolveStorageUrl({ storageId });
      if (publicUrl) {
        setImage(publicUrl);
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price.trim() || !image.trim()) {
      alert("Please fill in all required fields (Title, Price, Image).");
      return;
    }

    setIsSubmitting(true);
    const colorsArr = colors
      ? colors.split(",").map((c: string) => c.trim()).filter((c: string) => c.length > 0)
      : [];

    try {
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
          image,
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
          image,
          youtubeLink: youtubeLink || undefined,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: 600 }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{productToEdit ? "Edit Product" : "Add Product to Beembai Store"}</h3>
          <button className={styles.modalClose} onClick={onClose} type="button">×</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalBody} style={{ maxHeight: "75vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Product Title *</label>
            <input type="text" className={styles.formInput} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. iPhone 15 Pro Max" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Category</label>
              <select className={styles.formSelect} value={categoryName} onChange={(e) => setCategoryName(e.target.value)}>
                {categories?.map((cat) => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Condition</label>
              <select className={styles.formSelect} value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Refurbished">Refurbished</option>
                <option value="Used">Used</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Price (NGN) *</label>
              <input type="number" className={styles.formInput} value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="150000" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Original Price (Optional)</label>
              <input type="number" className={styles.formInput} value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="180000" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Stock Qty</label>
              <input type="number" className={styles.formInput} value={stock} onChange={(e) => setStock(e.target.value)} required placeholder="10" />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Available Colors (comma separated)</label>
            <input type="text" className={styles.formInput} value={colors} onChange={(e) => setColors(e.target.value)} placeholder="Space Gray, Silver, Gold" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>YouTube Video Link (Optional)</label>
            <input type="text" className={styles.formInput} value={youtubeLink} onChange={(e) => setYoutubeLink(e.target.value)} placeholder="https://youtube.com/..." />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Product Description</label>
            <textarea className={styles.formTextarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Detailed product specifications..." />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Product Main Image *</label>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6 }}>
              <input
                type="text"
                className={styles.formInput}
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="Image URL or upload below"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "📁 Upload"}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            {uploadError && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{uploadError}</p>}
            {image && (
              <div style={{ marginTop: 12 }}>
                <img src={image} alt="Preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--color-border)" }} />
              </div>
            )}
          </div>

          <div className={styles.modalFooter} style={{ padding: "16px 0 0 0", marginTop: 12 }}>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isSubmitting || isUploading}>
              {isSubmitting ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BeembaiProductsPage() {
  const [search, setSearch] = useState("");
  const [backfilling, setBackfilling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);

  const runBackfill = useMutation(api.beembaiStore.runBackfillForeignProducts);
  const deleteProduct = useMutation(api.beembaiStore.adminDeleteProduct);

  const { results: products, status, loadMore } = usePaginatedQuery(
    api.beembaiStore.getBeembaiStoreProducts,
    {},
    { initialNumItems: 10 }
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status !== "CanLoadMore") return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(10); },
      { threshold: 0.1 }
    );
    const el = loadMoreRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [status, loadMore]);

  const handleBackfill = async () => {
    setBackfilling(true);
    try {
      const res = await runBackfill();
      alert(`Backfill complete! Patched ${res.patched} products.`);
    } catch (e) {
      console.error(e);
      alert("Failed to run backfill.");
    } finally {
      setBackfilling(false);
    }
  };

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
    const term = search.toLowerCase().trim();
    if (!term) return products ?? [];
    return (products ?? []).filter((p) =>
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
          <p className={styles.pageSubtitle}>Manage items sold directly by Beembai Store and imports</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => {
              setEditProduct(null);
              setShowModal(true);
            }}
            id="add-beembai-product-btn"
          >
            ➕ Add Product
          </button>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={handleBackfill}
            disabled={backfilling}
            title="Link old foreign import products to Beembai Official Store in database"
          >
            {backfilling ? "Syncing..." : "🔄 Sync Old Products"}
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
              placeholder="Search by title, category, store..."
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
              <p className={styles.emptyStateText}>Click "Add Product" to list a product on Beembai Store.</p>
            </div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Source / Brand</th>
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
                          <span style={{ fontSize: 11, color: "#9e9970" }}>Code: {product._id.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: "#6b6540" }}>{product.categoryName}</span>
                    </td>
                    <td>
                      <span className={styles.textMuted} style={{ fontSize: 13, fontWeight: 600 }}>
                        {product.categorySlug === "foreign-import" ? `🇺🇸 Import (${product.brand})` : "Beembai Local"}
                      </span>
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
                        {product.sourceUrl && (
                          <a
                            href={product.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                            style={{ textDecoration: "none" }}
                          >
                            🔗 Source
                          </a>
                        )}
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