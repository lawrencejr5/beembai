"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSellerStore } from "../layout";
import styles from "../seller.module.css";

export default function SellerSettingsPage() {
  const router = useRouter();
  const { stores, activeStoreId, setActiveStoreId } = useSellerStore();

  // Mutations
  const updateStoreMut = useMutation(api.store.updateStore);
  const deleteStoreMut = useMutation(api.store.sellerDeleteStore);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form Fields
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [bio, setBio] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");

  const activeStore = stores.find((s) => s._id === activeStoreId);

  // Pre-populate form when store context loads/changes
  useEffect(() => {
    if (activeStore) {
      setStoreName(activeStore.name || "");
      setStoreSlug(activeStore.slug || "");
      setCategory(activeStore.category || "All Categories");
      setBio(activeStore.description || "");
      setPhysicalAddress(activeStore.physicalAddress || "");
      setCity(activeStore.city || "");
      setStateName(activeStore.stateName || "");
      setCountry(activeStore.country || "");
      setEmail(activeStore.email || "");
      setPhone(activeStore.phone || "");
      setBankName(activeStore.bankName || "");
      setAccountName(activeStore.accountName || "");
      setAccountNumber(activeStore.accountNumber || "");
      setRoutingNumber(activeStore.routingNumber || "");
      setSuccessMsg("");
      setFormError("");
    }
  }, [activeStore]);

  // Handle Basic Info Submission
  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStoreId) return;

    if (!storeName.trim() || !bio.trim()) {
      setFormError("Store name and description are required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    setSuccessMsg("");

    try {
      await updateStoreMut({
        storeId: activeStoreId as Id<"stores">,
        name: storeName,
        slug: storeSlug,
        category,
        description: bio,
        physicalAddress,
        city,
        stateName,
        country,
        email,
        phone,
        bankName,
        accountName,
        accountNumber,
        routingNumber,
      });

      setSuccessMsg("Basic store profile updated successfully.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "An unexpected error occurred while updating basic info.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Location Details Submission
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStoreId) return;

    if (!physicalAddress.trim() || !city.trim() || !stateName.trim() || !country.trim() || !phone.trim()) {
      setFormError("All location fields and contact phone are required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    setSuccessMsg("");

    try {
      await updateStoreMut({
        storeId: activeStoreId as Id<"stores">,
        name: storeName,
        slug: storeSlug,
        category,
        description: bio,
        physicalAddress,
        city,
        stateName,
        country,
        email,
        phone,
        bankName,
        accountName,
        accountNumber,
        routingNumber,
      });

      setSuccessMsg("Physical location and contact details updated successfully.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "An unexpected error occurred while updating location.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Payout Bank Details Submission
  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStoreId) return;

    if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) {
      setFormError("Bank details (Name, Account Holder Name, Account Number) are required.");
      return;
    }

    if (routingNumber && routingNumber.length !== 9) {
      setFormError("Routing number must be exactly 9 digits.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    setSuccessMsg("");

    try {
      await updateStoreMut({
        storeId: activeStoreId as Id<"stores">,
        name: storeName,
        slug: storeSlug,
        category,
        description: bio,
        physicalAddress,
        city,
        stateName,
        country,
        email,
        phone,
        bankName,
        accountName,
        accountNumber,
        routingNumber,
      });

      setSuccessMsg("Payout bank credentials updated successfully.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "An unexpected error occurred while updating bank details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Deletion
  const handleDeleteStore = async () => {
    if (!activeStoreId || !activeStore) return;

    const confirmMsg1 = `Are you sure you want to permanently delete "${activeStore.name}"? This action cannot be undone.`;
    const confirmMsg2 = `WARNING: Deleting this store will permanently delete all ${activeStore.name} products currently listed in the catalog. Press OK to proceed.`;

    if (!confirm(confirmMsg1) || !confirm(confirmMsg2)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteStoreMut({ storeId: activeStoreId as Id<"stores"> });
      setActiveStoreId(null);
      router.push("/sell");
    } catch (err) {
      console.error(err);
      alert("Failed to delete storefront. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Case A: No active store context selected ──────────────────────────────

  if (activeStoreId === null) {
    return (
      <div className={styles.sellerContent}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Store Settings</h1>
            <p className={styles.pageSubtitle}>Select a specific store from the sidebar dropdown selector to manage its settings</p>
          </div>
        </div>
        <div className={styles.sellerCard}>
          <div className={styles.sellerCardBody} style={{ textAlign: "center", padding: "60px 20px" }}>
            <span style={{ fontSize: 40 }}>⚙️</span>
            <h3 style={{ marginTop: 16 }}>Select a storefront</h3>
            <p style={{ color: "var(--seller-text-secondary)", marginTop: 8, maxWidth: 420, marginInline: "auto" }}>
              Store-level configuration details, bank credentials, and deletion rules are managed contextually per store. Use the select dropdown in the left sidebar to choose a store.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Case B: Store selected, display form ──────────────────────────────────

  return (
    <div className={styles.sellerContent}>
      
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Store Settings</h1>
          <p className={styles.pageSubtitle}>Update contact information, physical location, payout bank routing, or close the storefront</p>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div style={{ padding: "12px 16px", background: "rgba(72, 92, 44, 0.08)", border: "1px solid rgba(72, 92, 44, 0.18)", borderRadius: 8, fontSize: 13, color: "var(--seller-success)", fontWeight: 600, marginBottom: 20 }}>
          ✓ {successMsg}
        </div>
      )}
      {formError && (
        <div style={{ padding: "12px 16px", background: "rgba(204, 96, 69, 0.08)", border: "1px solid rgba(204, 96, 69, 0.18)", borderRadius: 8, fontSize: 13, color: "var(--seller-danger)", fontWeight: 600, marginBottom: 20 }}>
          ⚠️ {formError}
        </div>
      )}

      {/* 1. Basic Information Form Card */}
      <div className={styles.sellerCard} style={{ marginBottom: 24 }}>
        <div className={styles.sellerCardHeader}>
          <h3 className={styles.sellerCardTitle}>Basic Information</h3>
        </div>
        <div className={styles.sellerCardBody}>
          <form onSubmit={handleSaveBasicInfo} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Store storefront Name *</label>
              <input
                type="text"
                required
                className={styles.formInput}
                value={storeName}
                onChange={(e) => {
                  const name = e.target.value;
                  setStoreName(name);
                  setStoreSlug(name.toLowerCase().trim().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                }}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Storefront URL Slug *</label>
              <input
                type="text"
                required
                className={styles.formInput}
                value={storeSlug}
                style={{ fontFamily: "monospace" }}
                onChange={(e) => {
                  setStoreSlug(e.target.value.toLowerCase().trim().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                }}
              />
              <span style={{ fontSize: 11.5, color: "var(--seller-text-secondary)", marginTop: 4 }}>
                Live link path: <strong>/stores/{storeSlug}</strong>
              </span>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Primary Category</label>
              <select
                className={styles.formSelect}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="All Categories">All Categories</option>
                <option value="Phone & Tablets">Phone & Tablets</option>
                <option value="Gadgets & Accessories">Gadgets & Accessories</option>
                <option value="Apparel & Fashion">Apparel & Fashion</option>
                <option value="Furniture & Living">Furniture & Living</option>
                <option value="Beauty & Care">Beauty & Care</option>
                <option value="Groceries">Groceries</option>
                <option value="Home Appliances">Home Appliances</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Store Biography / Description *</label>
              <textarea
                required
                className={styles.formTextarea}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--seller-content-bg)", paddingTop: 16 }}>
              <button type="submit" disabled={isSubmitting} className={`${styles.btn} ${styles.btnPrimary}`}>
                {isSubmitting ? "Saving..." : "Save Basic Info"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. Physical Location Form Card */}
      <div className={styles.sellerCard} style={{ marginBottom: 24 }}>
        <div className={styles.sellerCardHeader}>
          <h3 className={styles.sellerCardTitle}>Physical Location & Contact</h3>
        </div>
        <div className={styles.sellerCardBody}>
          <form onSubmit={handleSaveLocation} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Street Address *</label>
              <input
                type="text"
                required
                className={styles.formInput}
                value={physicalAddress}
                onChange={(e) => setPhysicalAddress(e.target.value)}
              />
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>City *</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>State / Province *</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Country *</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Contact Phone *</label>
                <input
                  type="tel"
                  required
                  className={styles.formInput}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--seller-content-bg)", paddingTop: 16 }}>
              <button type="submit" disabled={isSubmitting} className={`${styles.btn} ${styles.btnPrimary}`}>
                {isSubmitting ? "Saving..." : "Save Location Details"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. Payout Bank Details Form Card */}
      <div className={styles.sellerCard} style={{ marginBottom: 24 }}>
        <div className={styles.sellerCardHeader}>
          <h3 className={styles.sellerCardTitle}>Payout Bank Credentials</h3>
        </div>
        <div className={styles.sellerCardBody}>
          <form onSubmit={handleSaveBankDetails} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Receiving Bank Name *</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Routing Number (9 Digits) *</label>
                <input
                  type="text"
                  maxLength={9}
                  required
                  className={styles.formInput}
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Account Holder Name *</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Account Number *</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--seller-content-bg)", paddingTop: 16 }}>
              <button type="submit" disabled={isSubmitting} className={`${styles.btn} ${styles.btnPrimary}`}>
                {isSubmitting ? "Saving..." : "Save Bank Details"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Danger Zone Deletion Block */}
      <div className={styles.sellerCard} style={{ borderColor: "rgba(204, 96, 69, 0.4)", background: "rgba(204, 96, 69, 0.02)" }}>
        <div className={styles.sellerCardHeader} style={{ borderBottomColor: "rgba(204, 96, 69, 0.1)" }}>
          <h3 className={styles.sellerCardTitle} style={{ color: "var(--seller-danger)" }}>Danger Zone</h3>
        </div>
        <div className={styles.sellerCardBody}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h4 style={{ fontSize: 13.5, fontWeight: 700 }}>Delete this store storefront</h4>
              <p style={{ fontSize: 12.5, color: "var(--seller-text-secondary)", marginTop: 4 }}>
                Permanently close and delete <strong>{activeStore?.name || "this store"}</strong> from Beembai database. All listed products and catalog entries owned by this store will be permanently wiped.
              </p>
            </div>
            <button
              onClick={handleDeleteStore}
              disabled={isDeleting}
              className={`${styles.btn} ${styles.btnDanger}`}
            >
              {isDeleting ? "Deleting storefront..." : "Delete Storefront"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
