"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "../admin.module.css";
import { useRouter } from "next/navigation";
import { NIGERIA_LOCATIONS } from "@/app/data/nigeriaLocations";
import { US_LOCATIONS, US_STATE_NAMES } from "@/app/data/usLocations";

const NIGERIAN_STATE_NAMES = Object.keys(NIGERIA_LOCATIONS).sort();

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
  const router = useRouter();
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

  // Warehouse address state
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [savingNgWarehouse, setSavingNgWarehouse] = useState(false);
  const [ngWarehouseSuccess, setNgWarehouseSuccess] = useState<string | null>(null);
  const [savingUsWarehouse, setSavingUsWarehouse] = useState(false);
  const [usWarehouseSuccess, setUsWarehouseSuccess] = useState<string | null>(null);

  // Nigeria warehouse inputs (Saved to default store address fields)
  const [ngAddress, setNgAddress] = useState("");
  const [ngState, setNgState] = useState("Lagos");
  const [ngLga, setNgLga] = useState("Ikeja");
  const [ngCity, setNgCity] = useState("Ikeja");
  const [ngPhone, setNgPhone] = useState("");

  // US warehouse inputs
  const [usAddress, setUsAddress] = useState("");
  const [usState, setUsState] = useState("Delaware");
  const [usCounty, setUsCounty] = useState("New Castle County");
  const [usCity, setUsCity] = useState("Wilmington");
  const [usZip, setUsZip] = useState("");
  const [usPhone, setUsPhone] = useState("");
  const [usContactName, setUsContactName] = useState("");

  // Sync warehouse inputs whenever store resolves
  useEffect(() => {
    if (store) {
      const initialNgState = store.stateName || "Lagos";
      setNgState(initialNgState);
      const ngLoc = NIGERIA_LOCATIONS[initialNgState];
      setNgLga(store.lga || (ngLoc?.lgas?.[0] ?? "Ikeja"));
      setNgCity(store.city || (ngLoc?.cities?.[0] ?? "Ikeja"));
      setNgAddress(store.physicalAddress || "");
      setNgPhone(store.phone || "");

      const initialUsState = store.usWarehouseState || "Delaware";
      setUsState(initialUsState);
      const uLoc = US_LOCATIONS[initialUsState];
      setUsCounty(store.usWarehouseCounty || (uLoc?.counties?.[0] ?? "New Castle County"));
      setUsCity(store.usWarehouseCity || (uLoc?.cities?.[0] ?? "Wilmington"));
      setUsAddress(store.usWarehouseAddress || "");
      setUsZip(store.usWarehouseZip || "");
      setUsPhone(store.usWarehousePhone || "");
      setUsContactName(store.usWarehouseContactName || "");
    }
  }, [store]);

  const handleNigeriaStateChange = (newState: string) => {
    setNgState(newState);
    const loc = NIGERIA_LOCATIONS[newState];
    setNgLga(loc?.lgas?.[0] || "");
    setNgCity(loc?.cities?.[0] || "");
  };

  const handleUsStateChange = (newUsState: string) => {
    setUsState(newUsState);
    const loc = US_LOCATIONS[newUsState];
    setUsCounty(loc?.counties?.[0] || "");
    setUsCity(loc?.cities?.[0] || "");
  };

  const handleSaveNigeriaAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNgWarehouse(true);
    setNgWarehouseSuccess(null);
    try {
      await updateStore({
        physicalAddress: ngAddress,
        stateName: ngState,
        lga: ngLga,
        city: ngCity,
        country: "Nigeria",
        phone: ngPhone,
      });
      setNgWarehouseSuccess("Nigeria address saved successfully! Domestic GIGL dispatch is active.");
      setTimeout(() => setNgWarehouseSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update Nigeria address.");
    } finally {
      setSavingNgWarehouse(false);
    }
  };

  const handleSaveUsWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUsWarehouse(true);
    setUsWarehouseSuccess(null);
    try {
      await updateStore({
        usWarehouseAddress: usAddress,
        usWarehouseState: usState,
        usWarehouseCounty: usCounty,
        usWarehouseCity: usCity,
        usWarehouseZip: usZip,
        usWarehousePhone: usPhone,
        usWarehouseContactName: usContactName,
      });
      setUsWarehouseSuccess("US warehouse address saved successfully! Foreign import GIGL dispatch is active.");
      setTimeout(() => setUsWarehouseSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update US warehouse address.");
    } finally {
      setSavingUsWarehouse(false);
    }
  };

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

  const recentOrders = ordersList;
  const newOrdersCount = ordersList ? ordersList.filter((o) => o.status === "placed").length : 0;

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



  // Row status background colors matching the order status
  const STATUS_ROW_BG: Record<string, string> = {
    placed: "rgba(234, 179, 8, 0.06)",
    processing: "rgba(59, 130, 246, 0.05)",
    shipped: "rgba(99, 102, 241, 0.05)",
    delivered: "rgba(34, 197, 94, 0.06)",
    cancelled: "rgba(239, 68, 68, 0.05)",
  };

  const availableNgLgas = NIGERIA_LOCATIONS[ngState]?.lgas || [ngLga];
  const availableNgCities = NIGERIA_LOCATIONS[ngState]?.cities || [ngCity];
  const availableUsCounties = US_LOCATIONS[usState]?.counties || [usCounty];
  const availableUsCities = US_LOCATIONS[usState]?.cities || [usCity];

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

      {/* New Orders Banner Alert */}
      {newOrdersCount > 0 && (
        <div 
          className={styles.newOrdersBanner}
          onClick={() => router.push("/admin/beembai/orders")}
          style={{ marginBottom: 28 }}
        >
          <span className={styles.newOrdersBannerIcon}>🔔</span>
          <div style={{ flex: 1 }}>
            <strong className={styles.newOrdersBannerTitle}>
              You have {newOrdersCount} new order{newOrdersCount === 1 ? "" : "s"}!
            </strong>
            <p className={styles.newOrdersBannerText}>
              Customers are waiting for their items to be packed and shipped. Click here to fulfill them now.
            </p>
          </div>
          <span className={styles.newOrdersBannerArrow}>→</span>
        </div>
      )}

      {/* Fulfillment Warehouse Addresses Management */}
      {(() => {
        const hasNgWarehouse = Boolean(
          store.physicalAddress && store.stateName
        );
        const hasUsWarehouse = Boolean(
          store.usWarehouseAddress &&
          store.usWarehouseCity &&
          store.usWarehouseState
        );

        return (
          <div
            className={styles.adminCard}
            id="warehouses"
            style={{
              marginBottom: 28,
              padding: "20px 24px",
              background: "#ffffff",
              border: "1.5px solid #e2e8f0",
              borderRadius: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 20,
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: 16,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>🏢</span>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1e293b" }}>
                    Fulfillment Warehouse Addresses
                  </h3>
                </div>
                <p style={{ margin: "4px 0 0 34px", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                  Required for GIG Logistics dispatch. GIGL couriers pick up orders directly from these designated addresses.
                </p>
              </div>

              <button
                onClick={() => setShowWarehouseModal(true)}
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#282600",
                }}
                id="configure-warehouses-btn"
              >
                <span>⚙️ Configure Warehouses</span>
              </button>
            </div>

            {/* 2-Column Warehouse Overview Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
              {/* 🇳🇬 Nigeria Warehouse Card */}
              <div
                style={{
                  border: `1.5px solid ${hasNgWarehouse ? "#86efac" : "#fde68a"}`,
                  backgroundColor: hasNgWarehouse ? "#f0fdf4" : "#fffbeb",
                  borderRadius: 12,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>🇳🇬</span>
                      <strong style={{ fontSize: 14, color: "#1e293b" }}>Nigerian Address (Domestic Pickup)</strong>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: 99,
                        backgroundColor: hasNgWarehouse ? "#dcfce7" : "#fef3c7",
                        color: hasNgWarehouse ? "#166534" : "#92400e",
                        border: `1px solid ${hasNgWarehouse ? "#bbf7d0" : "#fde68a"}`,
                      }}
                    >
                      {hasNgWarehouse ? "READY FOR GIGL" : "SETUP REQUIRED"}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: "#334155", display: "flex", flexDirection: "column", gap: 5 }}>
                    <div>
                      <span style={{ color: "#64748b", fontSize: 12 }}>Address: </span>
                      <strong>{store.physicalAddress || "Not configured yet"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", fontSize: 12 }}>City, LGA & State: </span>
                      <span>{(store.city || "—") + (store.lga ? ` (${store.lga} LGA)` : "") + ", " + (store.stateName || "—")}</span>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", fontSize: 12 }}>Phone: </span>
                      <span>{store.phone || "—"}</span>
                    </div>
                  </div>
                </div>

                <p style={{ margin: "14px 0 0 0", fontSize: 11.5, color: hasNgWarehouse ? "#15803d" : "#b45309", fontWeight: 600 }}>
                  {hasNgWarehouse
                    ? "✓ Configured for dispatching domestic store orders."
                    : "⚠️ You cannot dispatch domestic orders until this address is set."}
                </p>
              </div>

              {/* 🇺🇸 US Warehouse Card */}
              <div
                style={{
                  border: `1.5px solid ${hasUsWarehouse ? "#93c5fd" : "#fca5a5"}`,
                  backgroundColor: hasUsWarehouse ? "#eff6ff" : "#fef2f2",
                  borderRadius: 12,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>🇺🇸</span>
                      <strong style={{ fontSize: 14, color: "#1e293b" }}>US Warehouse (Foreign Imports)</strong>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: 99,
                        backgroundColor: hasUsWarehouse ? "#dbeafe" : "#fee2e2",
                        color: hasUsWarehouse ? "#1e40af" : "#991b1b",
                        border: `1px solid ${hasUsWarehouse ? "#bfdbfe" : "#fecaca"}`,
                      }}
                    >
                      {hasUsWarehouse ? "READY FOR GIGL" : "SETUP REQUIRED"}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: "#334155", display: "flex", flexDirection: "column", gap: 5 }}>
                    <div>
                      <span style={{ color: "#64748b", fontSize: 12 }}>US Address: </span>
                      <strong>{store.usWarehouseAddress || "Not configured yet"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", fontSize: 12 }}>City, County, State & Zip: </span>
                      <span>{(store.usWarehouseCity || "—") + (store.usWarehouseCounty ? ` (${store.usWarehouseCounty})` : "") + ", " + (store.usWarehouseState || "—") + " " + (store.usWarehouseZip || "")}</span>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", fontSize: 12 }}>Contact: </span>
                      <span>{store.usWarehouseContactName || "Beembai Logistics"} ({store.usWarehousePhone || "—"})</span>
                    </div>
                  </div>
                </div>

                <p style={{ margin: "14px 0 0 0", fontSize: 11.5, color: hasUsWarehouse ? "#1d4ed8" : "#dc2626", fontWeight: 600 }}>
                  {hasUsWarehouse
                    ? "✓ GIG Logistics picks up Amazon & US purchases here for Nigeria delivery."
                    : "⚠️ You cannot dispatch foreign import orders until this address is set."}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Warehouse Configuration Modal */}
      {showWarehouseModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowWarehouseModal(false);
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 16,
              maxWidth: 720,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              padding: "24px 28px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22 }}>🏢</span>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>
                  Set Up Fulfillment Warehouses
                </h3>
              </div>
              <button
                onClick={() => setShowWarehouseModal(false)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {/* 🇳🇬 Nigeria Warehouse Section */}
            <form onSubmit={handleSaveNigeriaAddress} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🇳🇬</span>
                  <strong style={{ fontSize: 15, color: "#1e293b" }}>Nigerian Address (Store & Domestic Pickup)</strong>
                </div>
              </div>

              {ngWarehouseSuccess && (
                <div style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#065f46", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                  ✅ {ngWarehouseSuccess}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                  <label className={styles.formLabel}>Street Address</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={ngAddress}
                    onChange={(e) => setNgAddress(e.target.value)}
                    placeholder="e.g. 15 Industrial Avenue, Ilupeju"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>State (for GIGL routing)</label>
                  <select
                    className={styles.formSelect}
                    value={ngState}
                    onChange={(e) => handleNigeriaStateChange(e.target.value)}
                    required
                  >
                    {NIGERIAN_STATE_NAMES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Local Government Area (LGA)</label>
                  <select
                    className={styles.formSelect}
                    value={ngLga}
                    onChange={(e) => setNgLga(e.target.value)}
                    required
                  >
                    {availableNgLgas.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>City / Area</label>
                  <select
                    className={styles.formSelect}
                    value={ngCity}
                    onChange={(e) => setNgCity(e.target.value)}
                    required
                  >
                    {availableNgCities.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Contact Phone</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={ngPhone}
                    onChange={(e) => setNgPhone(e.target.value)}
                    placeholder="+234 80..."
                  />
                </div>
              </div>

              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={savingNgWarehouse}
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ padding: "8px 18px", fontSize: 13, fontWeight: 700, background: "#16a34a" }}
                  id="save-ng-warehouse-modal-btn"
                >
                  {savingNgWarehouse ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>

            {/* 🇺🇸 US Warehouse Section */}
            <form onSubmit={handleSaveUsWarehouse} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🇺🇸</span>
                  <strong style={{ fontSize: 15, color: "#1e293b" }}>US Warehouse Address (Foreign Imports from Amazon/US)</strong>
                </div>
              </div>

              {usWarehouseSuccess && (
                <div style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#065f46", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                  ✅ {usWarehouseSuccess}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                  <label className={styles.formLabel}>US Street Address</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={usAddress}
                    onChange={(e) => setUsAddress(e.target.value)}
                    placeholder="e.g. 100 Logistics Blvd, Suite 400"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>US State</label>
                  <select
                    className={styles.formSelect}
                    value={usState}
                    onChange={(e) => handleUsStateChange(e.target.value)}
                    required
                  >
                    {US_STATE_NAMES.map((st) => (
                      <option key={st} value={st}>
                        {st} ({US_LOCATIONS[st].code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>County (Local Jurisdiction)</label>
                  <select
                    className={styles.formSelect}
                    value={usCounty}
                    onChange={(e) => setUsCounty(e.target.value)}
                    required
                  >
                    {availableUsCounties.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>US City</label>
                  <select
                    className={styles.formSelect}
                    value={usCity}
                    onChange={(e) => setUsCity(e.target.value)}
                    required
                  >
                    {availableUsCities.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>US Zip / Postal Code</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={usZip}
                    onChange={(e) => setUsZip(e.target.value)}
                    placeholder="e.g. 19801"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>US Contact Phone</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={usPhone}
                    onChange={(e) => setUsPhone(e.target.value)}
                    placeholder="+1 (555)..."
                  />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                  <label className={styles.formLabel}>Contact / Receiver Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={usContactName}
                    onChange={(e) => setUsContactName(e.target.value)}
                    placeholder="e.g. Beembai US Logistics Hub"
                  />
                </div>
              </div>

              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={savingUsWarehouse}
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ padding: "8px 18px", fontSize: 13, fontWeight: 700, background: "#2563eb" }}
                  id="save-us-warehouse-modal-btn"
                >
                  {savingUsWarehouse ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setShowWarehouseModal(false)}
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ padding: "9px 18px", fontSize: 13.5 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                            {formatCurrency(order.beembaiSubtotal ?? order.totalAmount)}
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
