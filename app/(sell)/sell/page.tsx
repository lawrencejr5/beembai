"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSellerStore } from "./layout";
import styles from "./seller.module.css";

// Formatter Helpers
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function SellerDashboardPage() {
  const router = useRouter();
  const { stores, activeStoreId, setActiveStoreId } = useSellerStore();

  const generateUploadUrl = useMutation(api.store.generateUploadUrl);
  const updateLogo = useMutation(api.store.updateStoreLogo);
  const updateBanner = useMutation(api.store.updateStoreBanner);

  const [updatingLogo, setUpdatingLogo] = useState(false);
  const [updatingBanner, setUpdatingBanner] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file || !activeStoreId) return;

    if (type === "logo") setUpdatingLogo(true);
    else setUpdatingBanner(true);

    try {
      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");
      const { storageId } = await uploadResponse.json();

      if (type === "logo") {
        await updateLogo({ storeId: activeStoreId as any, storageId });
      } else {
        await updateBanner({ storeId: activeStoreId as any, storageId });
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to update store ${type}.`);
    } finally {
      if (type === "logo") setUpdatingLogo(false);
      else setUpdatingBanner(false);
    }
  };

  // 1. Fetch Analytics based on active store context
  const allStoresAnalytics = useQuery(
    api.store.getSellerAnalyticsAllStores,
    activeStoreId === null ? {} : "skip"
  );
  
  const singleStoreAnalytics = useQuery(
    api.store.getStoreAnalyticsForOwner,
    activeStoreId !== null ? { storeId: activeStoreId as any } : "skip"
  );

  const stats = activeStoreId === null ? allStoresAnalytics : singleStoreAnalytics;

  // 2. Fetch Recent Orders based on active store context
  const allStoresOrders = useQuery(
    api.orders.getSellerOrdersAllStores,
    activeStoreId === null ? {} : "skip"
  );

  const singleStoreOrders = useQuery(
    api.orders.getOrdersForStore,
    activeStoreId !== null ? { storeId: activeStoreId as any } : "skip"
  );

  const recentOrders = (activeStoreId === null ? allStoresOrders : singleStoreOrders)?.slice(0, 5);

  // ─── Case A: Seller Has No Stores Yet (Onboarding) ──────────────────────────

  if (stores.length === 0) {
    return (
      <div className={styles.sellerContent}>
        <div className={styles.onboardingWrapper}>
          <span className={styles.onboardingIcon}>🏪</span>
          <h1 className={styles.onboardingTitle}>Welcome to Beembai Merchant Console</h1>
          <p className={styles.onboardingText}>
            Establish your digital storefront and start selling premium designer fashion,
            luxury electronics, and custom home decor to thousands of daily active shoppers.
          </p>
          <Link href="/sell/new" className={`${styles.btn}  ${styles.btnPrimary}`} style={{ marginTop: 8 }}>
            + Create Your First Store
          </Link>
        </div>
      </div>
    );
  }

  // ─── Case B: Dashboard Store List & Stats Overview ─────────────────────────

  const activeStoreName = activeStoreId
    ? stores.find((s) => s._id === activeStoreId)?.name || "Store"
    : "All Stores";

  return (
    <div className={styles.sellerContent}>
      
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{activeStoreName} Overview</h1>
          <p className={styles.pageSubtitle}>
            {activeStoreId 
              ? `Manage sales, catalog and orders for ${activeStoreName}`
              : "Unified merchant control panel across all your Beembai stores"
            }
          </p>
        </div>
        <Link href="/sell/new" className={`${styles.btn} ${styles.btnPrimary}`}>
          + New Store Application
        </Link>
      </div>

      {/* Store Banner and Profile Section */}
      {activeStoreId !== null && (() => {
        const activeStore = stores.find((s) => s._id === activeStoreId);
        if (!activeStore) return null;

        return (
          <div className={styles.storeCustomizationBannerSection} style={{ marginBottom: 28 }}>
            <input
              type="file"
              ref={bannerInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={(e) => handleUploadImage(e, "banner")}
            />
            <input
              type="file"
              ref={logoInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={(e) => handleUploadImage(e, "logo")}
            />
            
            {/* Banner block */}
            <div
              className={styles.storeCustomizationBanner}
              style={{
                height: 200,
                borderRadius: "var(--seller-radius)",
                background: activeStore.banner 
                  ? `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.45)), url(${activeStore.banner}) center/cover no-repeat` 
                  : "linear-gradient(135deg, #d6983a, #485c2c)",
                position: "relative",
                display: "flex",
                alignItems: "flex-end",
                padding: "20px 24px",
                boxShadow: "var(--seller-shadow)",
              }}
            >
              {/* Change Banner overlay/button */}
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "rgba(255, 255, 255, 0.85)",
                  backdropFilter: "blur(4px)",
                  border: "none",
                  fontSize: 12,
                  boxShadow: "var(--seller-shadow)",
                }}
                disabled={updatingBanner}
                onClick={() => bannerInputRef.current?.click()}
              >
                📷 {updatingBanner ? "Uploading..." : "Update Banner"}
              </button>

              {/* Logo / Profile picture overlap */}
              <div
                className={styles.storeCustomizationLogo}
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: "50%",
                  border: "4px solid #ffffff",
                  background: "#d6983a",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: "bold",
                  position: "absolute",
                  bottom: -32,
                  left: 24,
                  boxShadow: "var(--seller-shadow-md)",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
                onClick={() => !updatingLogo && logoInputRef.current?.click()}
              >
                {activeStore.logo ? (
                  <img src={activeStore.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  activeStore.name.charAt(0).toUpperCase()
                )}
                
                {/* Upload overlay on hover */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0,
                  transition: "opacity 0.2s ease",
                  fontSize: 10,
                  color: "#fff",
                }}
                className={styles.logoHoverOverlay}
                >
                  Edit
                </div>
              </div>
            </div>

            {/* Adjust space for overlapping profile image */}
            <div style={{ height: 44 }} />
          </div>
        );
      })()}

      {/* Analytics Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statCardTitle}>Total Sales Revenue</span>
          <span className={styles.statCardValue}>
            {stats ? formatCurrency(stats.totalSales) : "₦—"}
          </span>
          <span className={styles.statCardIcon}>💰</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCardTitle}>Paid Fulfillments</span>
          <span className={styles.statCardValue}>
            {stats ? `${stats.totalOrders} orders` : "—"}
          </span>
          <span className={styles.statCardIcon}>🛒</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCardTitle}>Products Listed</span>
          <span className={styles.statCardValue}>
            {stats ? `${stats.totalProducts} items` : "—"}
          </span>
          <span className={styles.statCardIcon}>📦</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCardTitle}>Merchant Rating</span>
          <span className={styles.statCardValue}>
            {stats ? `⭐ ${stats.averageRating.toFixed(1)}` : "⭐ —"}
          </span>
          <span className={styles.statCardIcon}>📈</span>
        </div>
      </div>

      {/* Main Overview Grid Layout */}
      <div className={styles.detailLayout}>
        <div className={styles.detailMain}>
          
          {/* Stores Grid (Only visible in unified All Stores view) */}
          {activeStoreId === null && (
            <div className={styles.sellerCard}>
              <div className={styles.sellerCardHeader}>
                <h3 className={styles.sellerCardTitle}>My Storefronts ({stores.length})</h3>
              </div>
              <div className={styles.sellerCardBody}>
                <div className={styles.storesGrid}>
                  {stores.map((store) => {
                    const isPending = store.status === "pending";
                    const isRejected = store.status === "rejected";
                    const statusText = isPending 
                      ? "Under Review" 
                      : isRejected 
                        ? "Rejected" 
                        : "Approved";
                    const statusClass = isPending 
                      ? "pending" 
                      : isRejected 
                        ? "rejected" 
                        : "approved";

                    return (
                      <div key={store._id} className={styles.storeCard}>
                        <div 
                          className={styles.storeCardBanner}
                          style={store.banner ? { backgroundImage: `url(${store.banner})` } : {}}
                        >
                          <div className={styles.storeCardLogoWrapper}>
                            {store.logo ? (
                              <img src={store.logo} alt="" />
                            ) : (
                              store.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className={styles.storeCardStatus}>
                            <span className={`${styles.badge} ${styles[statusClass]}`}>
                              {statusText}
                            </span>
                          </span>
                        </div>
                        <div className={styles.storeCardContent}>
                          <h4 className={styles.storeCardName}>{store.name}</h4>
                          <span className={styles.storeCardCategory}>{store.category}</span>
                          <p className={styles.storeCardDesc}>{store.description}</p>
                          
                          {isRejected && store.rejectionReason && (
                            <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(204, 96, 69, 0.05)", border: "1px solid rgba(204, 96, 69, 0.15)", borderRadius: 6, fontSize: 12, color: "#cc6045", textAlign: "left" }}>
                              <strong>Rejection reason:</strong> {store.rejectionReason}
                            </div>
                          )}

                          <div className={styles.storeCardFooter}>
                            <span className={styles.storeCardRating}>
                              ⭐ {store.rating ? store.rating.toFixed(1) : "5.0"}
                            </span>
                            {!isRejected && !isPending && (
                              <button 
                                onClick={() => setActiveStoreId(store._id)}
                                className={styles.enterStoreLink}
                                style={{ background: "none", border: "none", cursor: "pointer" }}
                              >
                                Enter Console →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Recent Orders List Card */}
          <div className={styles.sellerCard}>
            <div className={styles.sellerCardHeader}>
              <h3 className={styles.sellerCardTitle}>Recent Store Orders</h3>
              <Link href="/sell/orders" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}>
                View All
              </Link>
            </div>
            {recentOrders === undefined ? (
              <div className={styles.sellerCardBody}>
                <div className={styles.skeleton} style={{ height: 120 }} />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className={styles.sellerCardBody} style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ color: "var(--seller-text-secondary)" }}>No orders placed recently</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={`${styles.sellerTable} ${styles.smallTable}`}>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Items Count</th>
                      <th>Fulfillment Value</th>
                      <th>Fulfillment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                          <Link href={`/sell/orders/${order._id}`} style={{ color: "var(--seller-accent)", textDecoration: "none" }}>
                            #{order._id.slice(-8).toUpperCase()}
                          </Link>
                        </td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {formatCurrency(order.sellerSubtotal)}
                        </td>
                        <td>
                          <span className={`${styles.badge} ${styles[order.status || "placed"]}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Details (e.g. active store specific details) */}
        {activeStoreId !== null && (
          <div className={styles.detailSidebar}>
            {(() => {
              const activeStore = stores.find((s) => s._id === activeStoreId);
              if (!activeStore) return null;
              return (
                <div className={styles.sellerCard}>
                  <div className={styles.sellerCardHeader}>
                    <h3 className={styles.sellerCardTitle}>Store Context Details</h3>
                  </div>
                  <div className={styles.sellerCardBody} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {activeStore.logo && (
                      <div style={{ alignSelf: "center", width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--seller-card-border)", marginBottom: 8 }}>
                        <img src={activeStore.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                    <div className={styles.infoRow}>
                      <span className={styles.infoRowLabel}>Slug Identifier</span>
                      <span className={styles.infoRowValue} style={{ fontFamily: "monospace" }}>/{activeStore.slug}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoRowLabel}>Approval Status</span>
                      <span className={`${styles.badge} ${styles[activeStore.status || "approved"]}`}>
                        {activeStore.status || "approved"}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoRowLabel}>Category Scope</span>
                      <span className={styles.infoRowValue}>{activeStore.category}</span>
                    </div>
                    <button 
                      onClick={() => setActiveStoreId(null)}
                      className={`${styles.btn} ${styles.btnGhost}`}
                      style={{ width: "100%", marginTop: 12 }}
                    >
                      ← Back to All Stores
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
