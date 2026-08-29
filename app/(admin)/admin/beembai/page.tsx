"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "../admin.module.css";

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

export default function BeembaiOverviewPage() {
  const store = useQuery(api.beembaiStore.getBeembaiStore);
  const analytics = useQuery(api.beembaiStore.getBeembaiStoreAnalytics);
  
  const { results: ordersList } = usePaginatedQuery(
    api.beembaiStore.getBeembaiStoreOrders,
    { status: "all", paymentStatus: "all" },
    { initialNumItems: 5 }
  );

  const generateUploadUrl = useMutation(api.store.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.products.resolveStorageUrl);
  const updateStore = useMutation(api.beembaiStore.updateBeembaiStore);

  const [updatingLogo, setUpdatingLogo] = useState(false);
  const [updatingBanner, setUpdatingBanner] = useState(false);
  const [copied, setCopied] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleCopyLink = (slug: string) => {
    if (typeof window !== "undefined") {
      const fullUrl = `${window.location.origin}/stores/${slug}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      const publicUrl = await resolveStorageUrl({ storageId });
      if (!publicUrl) throw new Error("Failed to resolve URL");

      if (type === "logo") {
        await updateStore({ logo: publicUrl });
      } else {
        await updateStore({ banner: publicUrl });
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to update store ${type}.`);
    } finally {
      if (type === "logo") setUpdatingLogo(false);
      else setUpdatingBanner(false);
    }
  };

  if (store === undefined || analytics === undefined || ordersList === undefined) {
    return (
      <div className={styles.adminContent}>
        <div className={styles.beembaiStatsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.beembaiStatCard} style={{ height: 110 }}>
              <div className={styles.skeleton} style={{ width: 100, height: 12, marginBottom: 12 }} />
              <div className={styles.skeleton} style={{ width: 70, height: 28 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className={styles.adminContent}>
        <p>Beembai Official Store has not been bootstrapped. Please refresh the page or visit the admin portal first.</p>
      </div>
    );
  }

  const recentOrders = ordersList;

  // Row status background colors matching the order status
  const STATUS_ROW_BG: Record<string, string> = {
    placed: "rgba(234, 179, 8, 0.06)",
    processing: "rgba(59, 130, 246, 0.05)",
    shipped: "rgba(99, 102, 241, 0.05)",
    delivered: "rgba(34, 197, 94, 0.06)",
    cancelled: "rgba(239, 68, 68, 0.05)",
  };

  return (
    <div className={styles.adminContent}>
      
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{store.name} Overview</h1>
          <p className={styles.pageSubtitle}>
            Manage sales, catalog and orders for {store.name}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/admin/beembai/settings" className={`${styles.btn} ${styles.btnGhost}`}>
            ⚙️ Settings
          </Link>
          <Link href="/admin/beembai/products" className={`${styles.btn} ${styles.btnPrimary}`}>
            🛍️ Manage Products
          </Link>
        </div>
      </div>

      {/* Store Banner and Profile Section */}
      <div style={{ marginBottom: 28, position: "relative" }}>
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
          style={{
            height: 200,
            borderRadius: "var(--admin-radius)",
            background: store.banner 
              ? `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.45)), url(${store.banner}) center/cover no-repeat` 
              : "linear-gradient(135deg, #c8b840, #8a9a22)",
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            padding: "20px 24px",
            boxShadow: "var(--admin-shadow)",
          }}
        >
          {/* Change Banner button */}
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
              boxShadow: "var(--admin-shadow)",
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
              background: "#c8b840",
              color: "#1a1900",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: "bold",
              position: "absolute",
              bottom: -32,
              left: 24,
              boxShadow: "var(--admin-shadow-md)",
              overflow: "hidden",
              cursor: "pointer",
            }}
            onClick={() => !updatingLogo && logoInputRef.current?.click()}
          >
            {store.logo ? (
              <img src={store.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              store.name.charAt(0).toUpperCase()
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

      {/* Storefront Link Card */}
      <div
        className={styles.adminCard}
        style={{
          marginBottom: 28,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🔗</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--admin-text-secondary)", letterSpacing: 0.5 }}>
              Storefront Live Link
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--admin-accent)", fontFamily: "monospace", wordBreak: "break-all" }}>
              {typeof window !== "undefined" ? `${window.location.origin}/stores/${store.slug}` : `/stores/${store.slug}`}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => handleCopyLink(store.slug)}
            className={`${styles.btn} ${styles.btnGhost}`}
            style={{ padding: "8px 12px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {copied ? "✓ Copied!" : "📋 Copy Link"}
          </button>
          <a
            href={`/stores/${store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
          >
            <span>Visit Storefront</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Analytics Cards — visually matching the seller dashboard grid styles */}
      <div className={styles.beembaiStatsGrid}>
        <div className={styles.beembaiStatCard}>
          <span className={styles.beembaiStatCardTitle}>Total Sales Revenue</span>
          <span className={styles.beembaiStatCardValue}>
            {formatCurrency(analytics.totalRevenue)}
          </span>
          <span className={styles.beembaiStatCardIcon}>💰</span>
        </div>

        <Link href="/admin/beembai/products" className={styles.beembaiStatCard}>
          <span className={styles.beembaiStatCardTitle}>Products Listed</span>
          <span className={styles.beembaiStatCardValue}>
            {analytics.activeProductsCount} items
          </span>
          <span className={styles.beembaiStatCardIcon}>📦</span>
        </Link>

        <Link href="/admin/beembai/orders?tab=placed" className={styles.beembaiStatCard}>
          <span className={styles.beembaiStatCardTitle}>Orders Fulfilling</span>
          <span className={styles.beembaiStatCardValue}>
            {analytics.activeOrdersCount} orders
          </span>
          <span className={styles.beembaiStatCardIcon}>🛒</span>
        </Link>

        <Link href="/admin/beembai/orders" className={styles.beembaiStatCard}>
          <span className={styles.beembaiStatCardTitle}>Total Orders</span>
          <span className={styles.beembaiStatCardValue}>
            {analytics.totalOrdersCount} orders
          </span>
          <span className={styles.beembaiStatCardIcon}>📈</span>
        </Link>
      </div>

      {/* Responsive Splitted Layout Grid */}
      <div className={styles.detailLayout}>
        <div className={styles.detailMain}>
          
          {/* Recent Orders List Card */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className={styles.adminCardTitle}>Recent Store Orders</h3>
              <Link href="/admin/beembai/orders" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} style={{ textDecoration: "none" }}>
                View All
              </Link>
            </div>
            <div className={styles.tableWrapper}>
              {!recentOrders || recentOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--admin-text-secondary)" }}>
                  <p>No recent orders found.</p>
                </div>
              ) : (
                <table className={styles.adminTable}>
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
                    {recentOrders.map((order) => {
                      const rowBg = STATUS_ROW_BG[order.status] ?? "transparent";
                      return (
                        <tr key={order._id} style={{ backgroundColor: rowBg }}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Link href={`/admin/beembai/orders/${order._id}`} style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "var(--admin-accent)", textDecoration: "none" }}>
                                #{order._id.slice(-8).toUpperCase()}
                              </Link>
                              {order.isImportOrder && (
                                <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: "#e0f2fe", color: "#0369a1", padding: "2px 4px", borderRadius: 4 }}>
                                  🇺🇸
                                </span>
                              )}
                            </div>
                          </td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td style={{ fontSize: 13 }}>
                            {order.items.reduce((s: number, i: any) => s + i.quantity, 0)} items
                          </td>
                          <td style={{ fontSize: 13, fontWeight: 700 }}>
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td>
                            <span className={`${styles.badge} ${styles[order.status]}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info Card */}
        <div className={styles.detailSidebar}>
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}>
              <h3 className={styles.adminCardTitle}>Store Context Details</h3>
            </div>
            <div className={styles.adminCardBody} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {store.logo && (
                <div style={{ alignSelf: "center", width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--admin-card-border)", marginBottom: 8 }}>
                  <img src={store.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f0ebe0", paddingBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text-secondary)" }}>Slug Identifier</span>
                <span style={{ fontSize: 13, fontFamily: "monospace", color: "var(--admin-text-primary)" }}>/{store.slug}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f0ebe0", paddingBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text-secondary)" }}>Approval Status</span>
                <span className={`${styles.badge} ${styles.approved}`}>
                  approved
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f0ebe0", paddingBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text-secondary)" }}>Category Scope</span>
                <span style={{ fontSize: 13, color: "var(--admin-text-primary)" }}>{store.category || "General Store"}</span>
              </div>

              <Link href="/admin/beembai/settings" className={`${styles.btn} ${styles.btnGhost}`} style={{ width: "100%", marginTop: 12, textDecoration: "none", textAlign: "center" }}>
                Edit settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
