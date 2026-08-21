"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "../../admin.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StoreDetailPage({ params }: { params: { id: string } }) {
  const storeId = params.id as Id<"stores">;
  const router = useRouter();
  const store = useQuery(api.admin.getStoreByIdAdmin, { storeId });
  const approveStore = useMutation(api.admin.approveStore);
  const rejectStore = useMutation(api.admin.rejectStore);
  const setVerification = useMutation(api.admin.adminSetStoreVerification);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (store === undefined) {
    return <div className={styles.adminContent} style={{ color: "#6b6540" }}>Loading…</div>;
  }
  if (!store) {
    return <div className={styles.adminContent}><p>Store not found.</p></div>;
  }

  const handleApprove = async () => {
    setLoading(true);
    await approveStore({ storeId });
    setLoading(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setLoading(true);
    await rejectStore({ storeId, reason: rejectReason.trim() });
    setShowRejectModal(false);
    setLoading(false);
  };

  const handleVerify = async (status: "unverified" | "under_review" | "verified") => {
    setLoading(true);
    await setVerification({ storeId, verificationStatus: status });
    setLoading(false);
  };

  const status = store.status ?? "approved";

  return (
    <div className={styles.adminContent}>
      {showRejectModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Reject Seller</h3>
              <button className={styles.modalClose} onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Rejection Reason</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Explain what needs to be fixed..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={handleReject}
                disabled={!rejectReason.trim() || loading}
                id="confirm-reject-store"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.pageHeader}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Link href="/admin/stores" style={{ fontSize: 13, color: "#6b6540" }}>← Sellers</Link>
          </div>
          <h1 className={styles.pageTitle}>{store.name}</h1>
          <p className={styles.pageSubtitle}>{store.description}</p>
        </div>
        <div className={styles.flexRow}>
          {status === "pending" && (
            <>
              <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={handleApprove} disabled={loading} id="store-approve-btn">
                ✓ Approve Seller
              </button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => setShowRejectModal(true)} disabled={loading} id="store-reject-btn">
                ✗ Reject Seller
              </button>
            </>
          )}
          {status === "approved" && (
            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => setShowRejectModal(true)} disabled={loading}>
              Revoke Approval
            </button>
          )}
          {status === "rejected" && (
            <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={handleApprove} disabled={loading}>
              Re-approve
            </button>
          )}
        </div>
      </div>

      {store.rejectionReason && (
        <div style={{ background: "rgba(166, 62, 38, 0.06)", border: "1px solid rgba(166, 62, 38, 0.2)", borderRadius: 10, padding: "14px 18px", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#a63e26", marginBottom: 4 }}>Rejection Reason on Record</div>
          <div style={{ fontSize: 13, color: "#6b6540" }}>{store.rejectionReason}</div>
        </div>
      )}

      <div className={styles.detailLayout}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Store Info */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}>
              <h3 className={styles.adminCardTitle}>Store Information</h3>
              <span className={`${styles.badge} ${styles[status]}`}>{status}</span>
            </div>
            <div className={styles.adminCardBody}>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>Store Name</span>
                <span className={styles.infoRowValue}>{store.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>Slug</span>
                <span className={styles.infoRowValue} style={{ fontFamily: "monospace", fontSize: 13 }}>/{store.slug}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>Category</span>
                <span className={styles.infoRowValue}>{store.category}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>Rating</span>
                <span className={styles.infoRowValue}>⭐ {store.rating}</span>
              </div>
              {store.physicalAddress && (
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Address</span>
                  <span className={styles.infoRowValue}>{store.physicalAddress}, {store.city}, {store.stateName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}>
              <h3 className={styles.adminCardTitle}>Contact & Banking</h3>
            </div>
            <div className={styles.adminCardBody}>
              {store.email && <div className={styles.infoRow}><span className={styles.infoRowLabel}>Email</span><span className={styles.infoRowValue}>{store.email}</span></div>}
              {store.phone && <div className={styles.infoRow}><span className={styles.infoRowLabel}>Phone</span><span className={styles.infoRowValue}>{store.phone}</span></div>}
              {store.bankName && <div className={styles.infoRow}><span className={styles.infoRowLabel}>Bank</span><span className={styles.infoRowValue}>{store.bankName}</span></div>}
              {store.accountName && <div className={styles.infoRow}><span className={styles.infoRowLabel}>Account Name</span><span className={styles.infoRowValue}>{store.accountName}</span></div>}
              {store.accountNumber && <div className={styles.infoRow}><span className={styles.infoRowLabel}>Account No.</span><span className={styles.infoRowValue} style={{ fontFamily: "monospace" }}>{store.accountNumber}</span></div>}
            </div>
          </div>

          {/* Products */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}>
              <h3 className={styles.adminCardTitle}>Products ({store.products?.length ?? 0})</h3>
              <Link href={`/admin/products?store=${storeId}`} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}>View all</Link>
            </div>
            {(!store.products || store.products.length === 0) ? (
              <div className={styles.emptyState} style={{ padding: "32px 20px" }}>
                <p className={styles.textMuted}>No products yet</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {store.products.slice(0, 5).map((p) => (
                      <tr key={p._id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <img src={p.image} alt="" className={styles.productThumb} />
                            <Link href={`/admin/products/${p._id}`} style={{ fontWeight: 600, color: "#282600", fontSize: 13 }}>{p.title}</Link>
                          </div>
                        </td>
                        <td>₦{p.price.toLocaleString()}</td>
                        <td><span className={`${styles.badge} ${styles[p.status ?? "approved"]}`}>{p.status ?? "active"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.detailSidebar}>
          {/* Owner */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Owner</h3></div>
            <div className={styles.adminCardBody}>
              {store.owner ? (
                <>
                  <div className={styles.infoRow}><span className={styles.infoRowLabel}>Name</span><span className={styles.infoRowValue}>{store.owner.name ?? "—"}</span></div>
                  <div className={styles.infoRow}><span className={styles.infoRowLabel}>Email</span><span className={styles.infoRowValue} style={{ fontSize: 12 }}>{store.owner.email ?? "—"}</span></div>
                  {store.owner.isAdmin && <div className={styles.infoRow}><span className={styles.infoRowLabel}>Role</span><span className={`${styles.badge} ${styles.admin}`}>Admin</span></div>}
                </>
              ) : <p className={styles.textMuted}>No owner linked</p>}
            </div>
          </div>

          {/* Verification Control */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>KYC Verification</h3></div>
            <div className={styles.adminCardBody}>
              <div style={{ marginBottom: 14 }}>
                <span className={styles.infoRowLabel}>Current Status</span>
                <div style={{ marginTop: 8 }}>
                  {store.verificationStatus ? (
                    <span className={`${styles.badge} ${styles[store.verificationStatus]}`}>
                      {store.verificationStatus.replace("_", " ")}
                    </span>
                  ) : <span className={styles.textMuted}>Not submitted</span>}
                </div>
              </div>

              {store.businessRegistrationFile && (
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Biz Reg</span>
                  <a href={store.businessRegistrationFile} target="_blank" style={{ fontSize: 12, color: "#636d21" }}>View doc ↗</a>
                </div>
              )}
              {store.taxId && (
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Tax ID</span>
                  <span className={styles.infoRowValue} style={{ fontFamily: "monospace", fontSize: 12 }}>{store.taxId}</span>
                </div>
              )}
              {store.proofOfAddressFile && (
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Address Proof</span>
                  <a href={store.proofOfAddressFile} target="_blank" style={{ fontSize: 12, color: "#636d21" }}>View doc ↗</a>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                <button
                  className={`${styles.btn} ${styles.btnSuccess}`}
                  onClick={() => handleVerify("verified")}
                  disabled={loading || store.verificationStatus === "verified"}
                  id="verify-store-btn"
                >
                  ✓ Mark as Verified
                </button>
                <button
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={() => handleVerify("under_review")}
                  disabled={loading}
                >
                  Mark Under Review
                </button>
                <button
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={() => handleVerify("unverified")}
                  disabled={loading}
                >
                  Revoke Verification
                </button>
              </div>
            </div>
          </div>

          {/* Banner & Logo */}
          {(store.banner || store.logo) && (
            <div className={styles.adminCard}>
              <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Images</h3></div>
              <div className={styles.adminCardBody}>
                {store.banner && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#6b6540", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>Banner</div>
                    <img src={store.banner} alt="Banner" style={{ width: "100%", borderRadius: 8, aspectRatio: "16/5", objectFit: "cover" }} />
                  </div>
                )}
                {store.logo && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#6b6540", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>Logo</div>
                    <img src={store.logo} alt="Logo" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid #e8e2d0" }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
