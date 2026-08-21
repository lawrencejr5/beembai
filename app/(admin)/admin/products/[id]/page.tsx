"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "../../admin.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const productId = params.id as Id<"products">;
  const router = useRouter();
  const product = useQuery(api.admin.getProductByIdAdmin, { productId });
  const approveProduct = useMutation(api.admin.approveProduct);
  const rejectProduct = useMutation(api.admin.rejectProduct);
  const setFeatured = useMutation(api.admin.setProductFeatured);
  const setSponsored = useMutation(api.admin.setProductSponsored);
  const setNewArrival = useMutation(api.admin.setProductNewArrival);
  const deleteProduct = useMutation(api.admin.deleteProduct);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  if (product === undefined) return <div className={styles.adminContent} style={{ color: "#6b6540" }}>Loading…</div>;
  if (!product) return <div className={styles.adminContent}><p>Product not found.</p></div>;

  const status = product.status ?? "approved";

  const handleApprove = async () => {
    setLoading(true);
    await approveProduct({ productId });
    setLoading(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setLoading(true);
    await rejectProduct({ productId, reason: rejectReason.trim() });
    setShowRejectModal(false);
    setLoading(false);
  };

  const handleToggle = async (field: "featured" | "sponsored" | "newArrival", current: boolean) => {
    setToggleLoading(field);
    if (field === "featured") await setFeatured({ productId, isFeatured: !current });
    else if (field === "sponsored") await setSponsored({ productId, isSponsored: !current });
    else await setNewArrival({ productId, isNewArrival: !current });
    setToggleLoading(null);
  };

  const handleDelete = async () => {
    setLoading(true);
    await deleteProduct({ productId });
    router.push("/admin/products");
  };

  const allImages = [product.image, ...(product.images ?? [])].filter(Boolean).slice(0, 5);

  return (
    <div className={styles.adminContent}>
      {showRejectModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Reject Product</h3>
              <button className={styles.modalClose} onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Rejection Reason</label>
                <textarea className={styles.formTextarea} placeholder="Explain what needs to be fixed..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleReject} disabled={!rejectReason.trim() || loading} id="confirm-reject-product">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Delete Product</h3>
              <button className={styles.modalClose} onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: 14, color: "#6b6540" }}>This will permanently delete <strong style={{ color: "#282600" }}>{product.title}</strong>. This action cannot be undone.</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleDelete} disabled={loading} id="confirm-delete-product">Delete Permanently</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.pageHeader}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <Link href="/admin/products" style={{ fontSize: 13, color: "#6b6540" }}>← Products</Link>
          </div>
          <h1 className={styles.pageTitle} style={{ fontSize: 22, maxWidth: 600 }}>{product.title}</h1>
          <p className={styles.pageSubtitle}>{product.categoryName} · {product.store?.name ?? "No store"}</p>
        </div>
        <div className={styles.flexRow}>
          {status === "pending" && (
            <>
              <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={handleApprove} disabled={loading} id="product-approve-btn">✓ Approve</button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => setShowRejectModal(true)} disabled={loading} id="product-reject-btn">✗ Reject</button>
            </>
          )}
          {status === "rejected" && (
            <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={handleApprove} disabled={loading}>Re-approve</button>
          )}
          {status === "approved" && (
            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => setShowRejectModal(true)} disabled={loading}>Revoke Approval</button>
          )}
        </div>
      </div>

      {product.rejectionReason && (
        <div style={{ background: "rgba(166, 62, 38, 0.06)", border: "1px solid rgba(166, 62, 38, 0.2)", borderRadius: 10, padding: "14px 18px", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#a63e26", marginBottom: 4 }}>Rejection Reason</div>
          <div style={{ fontSize: 13, color: "#6b6540" }}>{product.rejectionReason}</div>
        </div>
      )}

      <div className={styles.detailLayout}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Images */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Images</h3></div>
            <div className={styles.adminCardBody}>
              <div className={styles.detailImageGrid}>
                {allImages.map((img, i) => (
                  <div key={i} className={i === 0 ? styles.detailMainImage : styles.detailImage}>
                    <img src={img} alt={`Product image ${i + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Product Details</h3></div>
            <div className={styles.adminCardBody}>
              <div className={styles.infoRow}><span className={styles.infoRowLabel}>Price</span><span className={styles.infoRowValue} style={{ fontSize: 18, fontWeight: 800 }}>₦{product.price.toLocaleString()}</span></div>
              {product.originalPrice && <div className={styles.infoRow}><span className={styles.infoRowLabel}>Original Price</span><span className={styles.infoRowValue} style={{ textDecoration: "line-through", color: "#9e9970" }}>₦{product.originalPrice.toLocaleString()}</span></div>}
              <div className={styles.infoRow}><span className={styles.infoRowLabel}>Category</span><span className={styles.infoRowValue}>{product.categoryName}</span></div>
              {product.brand && <div className={styles.infoRow}><span className={styles.infoRowLabel}>Brand</span><span className={styles.infoRowValue}>{product.brand}</span></div>}
              {product.condition && <div className={styles.infoRow}><span className={styles.infoRowLabel}>Condition</span><span className={styles.infoRowValue}>{product.condition}</span></div>}
              {product.stock !== undefined && <div className={styles.infoRow}><span className={styles.infoRowLabel}>Stock</span><span className={styles.infoRowValue}>{product.stock} units</span></div>}
              {product.colors && product.colors.length > 0 && (
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Colors</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {product.colors.map((c) => (
                      <span key={c} style={{ display: "inline-block", width: 20, height: 20, borderRadius: "50%", background: c, border: "2px solid #e8e2d0" }} title={c} />
                    ))}
                  </div>
                </div>
              )}
              {product.description && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0ebe0" }}>
                  <div className={styles.infoRowLabel} style={{ marginBottom: 8 }}>Description</div>
                  <p style={{ fontSize: 13.5, color: "#282600", lineHeight: 1.6 }}>{product.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className={styles.dangerZone}>
            <div className={styles.dangerZoneTitle}>⚠️ Danger Zone</div>
            <div className={styles.dangerZoneText}>Permanently delete this product. This cannot be undone.</div>
            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => setShowDeleteConfirm(true)} id="delete-product-btn">
              Delete Product
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.detailSidebar}>
          {/* Status */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Status</h3></div>
            <div className={styles.adminCardBody}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <span className={styles.infoRowLabel}>Approval</span>
                  <div style={{ marginTop: 6 }}>
                    <span className={`${styles.badge} ${styles[status]}`}>{status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Merchandising Flags */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Merchandising</h3></div>
            <div className={styles.adminCardBody}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "⭐ Featured", field: "featured" as const, current: !!product.isFeatured },
                  { label: "📢 Sponsored", field: "sponsored" as const, current: !!product.isSponsored },
                  { label: "🆕 New Arrival", field: "newArrival" as const, current: !!product.isNewArrival },
                ].map(({ label, field, current }) => (
                  <div key={field} className={styles.toggleWrapper} style={{ justifyContent: "space-between" }}>
                    <span className={styles.toggleLabel}>{label}</span>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={current}
                        onChange={() => handleToggle(field, current)}
                        disabled={toggleLoading === field}
                        id={`toggle-${field}`}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Store Link */}
          {product.store && (
            <div className={styles.adminCard}>
              <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Seller</h3></div>
              <div className={styles.adminCardBody}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  {product.store.logo ? (
                    <img src={product.store.logo} alt="" className={styles.storeLogoThumb} />
                  ) : (
                    <div className={styles.storeLogoThumb} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#636d21" }}>
                      {product.store.name[0]}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#282600" }}>{product.store.name}</div>
                    <div style={{ fontSize: 12, color: "#6b6540" }}>{product.store.category}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link href={`/admin/stores/${product.store._id}`} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} style={{ flex: 1, justifyContent: "center" }}>
                    View Store →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
