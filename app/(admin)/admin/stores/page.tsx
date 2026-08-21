"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "../admin.module.css";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function RejectModal({
  storeName,
  onConfirm,
  onClose,
}: {
  storeName: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Reject Seller</h3>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <p style={{ fontSize: 14, color: "#6b6540", marginBottom: 16 }}>
            You are about to reject <strong style={{ color: "#282600" }}>{storeName}</strong>. Please provide a reason so the seller knows what to fix.
          </p>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Rejection Reason</label>
            <textarea
              className={styles.formTextarea}
              placeholder="e.g. Missing business registration documents, incomplete bank details..."
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
            id="confirm-reject-store"
          >
            Reject Seller
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminStoresPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as StatusFilter) ?? "all";
  const [activeTab, setActiveTab] = useState<StatusFilter>(initialTab);
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState<{ id: Id<"stores">; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { results: stores, status, loadMore } = usePaginatedQuery(
    api.admin.getAllStores,
    { status: activeTab },
    { initialNumItems: 10 }
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "CanLoadMore") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore(10);
        }
      },
      { threshold: 0.1 }
    );
    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [status, loadMore]);

  const approveStore = useMutation(api.admin.approveStore);
  const rejectStore = useMutation(api.admin.rejectStore);

  const filtered = (stores ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.ownerEmail.toLowerCase().includes(search.toLowerCase())
  );

  const counts = useQuery(api.admin.getDashboardStats);

  const handleApprove = async (storeId: Id<"stores">) => {
    setActionLoading(storeId);
    try {
      await approveStore({ storeId });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    try {
      await rejectStore({ storeId: rejectTarget.id, reason });
    } finally {
      setRejectTarget(null);
      setActionLoading(null);
    }
  };

  type DashboardKey = "pendingStores" | "approvedStores" | "rejectedStores";
  const tabs: { label: string; value: StatusFilter; countKey?: DashboardKey }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending", countKey: "pendingStores" },
    { label: "Approved", value: "approved", countKey: "approvedStores" },
    { label: "Rejected", value: "rejected", countKey: "rejectedStores" },
  ];

  return (
    <div className={styles.adminContent}>
      {rejectTarget && (
        <RejectModal
          storeName={rejectTarget.name}
          onConfirm={handleReject}
          onClose={() => setRejectTarget(null)}
        />
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Sellers</h1>
          <p className={styles.pageSubtitle}>Review and approve seller applications</p>
        </div>
      </div>

      <div className={styles.adminCard}>
        <div className={styles.adminCardHeader}>
          {/* Tabs */}
          <div className={styles.tabBar}>
            {tabs.map((tab) => {
              const count = tab.countKey && counts ? counts[tab.countKey] : null;
              return (
                <button
                  key={tab.value}
                  className={`${styles.tabBtn} ${activeTab === tab.value ? styles.activeTab : ""}`}
                  onClick={() => setActiveTab(tab.value)}
                  id={`tab-stores-${tab.value}`}
                >
                  {tab.label}
                  {count !== null && count !== undefined && count > 0 && (
                    <span className={`${styles.tabCount} ${tab.value === "pending" ? styles.pending : ""}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className={styles.searchBox} style={{ maxWidth: 280 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search sellers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="stores-search"
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {status === "LoadingFirstPage" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 24px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div className={styles.skeleton} style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className={styles.skeleton} style={{ width: "30%", height: 14 }} />
                    <div className={styles.skeleton} style={{ width: "15%", height: 10 }} />
                  </div>
                  <div className={styles.skeleton} style={{ width: 80, height: 14 }} />
                  <div className={styles.skeleton} style={{ width: 40, height: 14 }} />
                  <div className={styles.skeleton} style={{ width: 80, height: 24, borderRadius: 100 }} />
                  <div className={styles.skeleton} style={{ width: 80, height: 24, borderRadius: 100 }} />
                  <div className={styles.skeleton} style={{ width: 100, height: 32, borderRadius: 8 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🏪</div>
              <h3 className={styles.emptyStateTitle}>No sellers found</h3>
              <p className={styles.emptyStateText}>
                {search ? "Try a different search term" : "No sellers in this category yet"}
              </p>
            </div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Owner</th>
                  <th>Category</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Verification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((store) => (
                  <tr key={store._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {store.logo ? (
                          <img src={store.logo} alt="" className={styles.storeLogoThumb} />
                        ) : (
                          <div className={styles.storeLogoThumb} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#636d21", fontSize: 14 }}>
                            {store.name[0]}
                          </div>
                        )}
                        <div>
                          <Link href={`/admin/stores/${store._id}`} style={{ fontWeight: 600, color: "#282600", fontSize: 14 }}>
                            {store.name}
                          </Link>
                          <div style={{ fontSize: 12, color: "#9e9970" }}>/{store.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{store.ownerName}</div>
                      <div style={{ fontSize: 12, color: "#6b6540" }}>{store.ownerEmail}</div>
                    </td>
                    <td><span className={styles.textMuted}>{store.category}</span></td>
                    <td style={{ fontWeight: 600 }}>{store.productCount}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[store.status ?? "approved"]}`}>
                        {store.status ?? "approved"}
                      </span>
                    </td>
                    <td>
                      {store.verificationStatus ? (
                        <span className={`${styles.badge} ${styles[store.verificationStatus]}`}>
                          {store.verificationStatus.replace("_", " ")}
                        </span>
                      ) : (
                        <span className={styles.textMuted}>—</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.flexRow}>
                        <Link
                          href={`/admin/stores/${store._id}`}
                          className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                        >
                          View
                        </Link>
                        {store.status === "pending" && (
                          <>
                            <button
                              className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`}
                              onClick={() => handleApprove(store._id)}
                              disabled={actionLoading === store._id}
                              id={`approve-store-${store._id}`}
                            >
                              {actionLoading === store._id ? "…" : "Approve"}
                            </button>
                            <button
                              className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                              onClick={() => setRejectTarget({ id: store._id, name: store.name })}
                              disabled={actionLoading === store._id}
                              id={`reject-store-${store._id}`}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {store.status === "rejected" && (
                          <button
                            className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`}
                            onClick={() => handleApprove(store._id)}
                            disabled={actionLoading === store._id}
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
          {/* Infinite Scroll Trigger */}
          {status === "CanLoadMore" && (
            <div ref={loadMoreRef} style={{ height: 20, margin: "16px 0" }} />
          )}
          {status === "LoadingMore" && (
            <div style={{ display: "flex", justifyContent: "center", padding: "16px", color: "#6b6540" }}>
              <div className={styles.skeleton} style={{ width: 120, height: 16, borderRadius: 4 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
