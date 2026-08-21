"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "./addresses.module.css";

// ── Icons ─────────────────────────────────────────────────

const ArrowLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const Spinner = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

// ── Types ─────────────────────────────────────────────────

interface AddressFormState {
  fullName: string;
  phone: string;
  streetAddress: string;
  apartment: string;
  city: string;
  stateName: string;
  postalCode: string;
  country: string;
}

const initialFormState: AddressFormState = {
  fullName: "",
  phone: "",
  streetAddress: "",
  apartment: "",
  city: "",
  stateName: "",
  postalCode: "",
  country: "Nigeria",
};

// ── Main Page ──────────────────────────────────────────────

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const addresses = useQuery(
    api.addresses.getUserAddresses,
    isAuthenticated ? {} : "skip",
  );

  const addAddress = useMutation(api.addresses.addAddress);
  const updateAddress = useMutation(api.addresses.updateAddress);
  const deleteAddress = useMutation(api.addresses.deleteAddress);
  const setDefault = useMutation(api.addresses.setDefaultAddress);

  // UI States
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"addresses"> | null>(null);
  const [formData, setFormData] = useState<AddressFormState>(initialFormState);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if unauthenticated
  if (!authLoading && !isAuthenticated) {
    router.replace("/login");
    return null;
  }

  const handleEditClick = (addr: any) => {
    setEditingId(addr._id);
    setFormData({
      fullName: addr.fullName,
      phone: addr.phone,
      streetAddress: addr.streetAddress,
      apartment: addr.apartment ?? "",
      city: addr.city,
      stateName: addr.stateName,
      postalCode: addr.postalCode,
      country: addr.country,
    });
    setShowForm(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormState);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (editingId) {
        await updateAddress({
          id: editingId,
          ...formData,
        });
      } else {
        await addAddress(formData);
      }
      handleCancel();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save address";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"addresses">) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteAddress({ id });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete address";
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: Id<"addresses">) => {
    setSettingDefaultId(id);
    setError(null);
    try {
      await setDefault({ id });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set default address";
      setError(msg);
    } finally {
      setSettingDefaultId(null);
    }
  };

  const isLoadingData = authLoading || addresses === undefined;

  return (
    <div className={styles.container}>
      <main className={styles.main}>

        {/* ── Header ── */}
        <header className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            <ArrowLeftIcon />
            <span>Back</span>
          </button>
          <h1 className={styles.pageTitle}>Shipping Addresses</h1>
          <p className={styles.pageSubtitle}>
            Manage your delivery destinations. The default address will be selected automatically during checkout.
          </p>
        </header>

        {/* ── Error Banner ── */}
        {error && (
          <div className={styles.errorBanner}>
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} className={styles.errorClose}>✕</button>
          </div>
        )}

        {/* ── Add/Edit Address Form ── */}
        {showForm && (
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              {editingId ? "Edit Address" : "Add New Address"}
            </h2>
            <form onSubmit={handleSubmit} className={styles.addressForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="fullName" className={styles.formLabel}>Full Name *</label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={styles.formInput}
                    placeholder="John Doe"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.formLabel}>Phone Number *</label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={styles.formInput}
                    placeholder="+234..."
                  />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                  <label htmlFor="streetAddress" className={styles.formLabel}>Street Address *</label>
                  <input
                    id="streetAddress"
                    type="text"
                    required
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                    className={styles.formInput}
                    placeholder="123 Luxury Way"
                  />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                  <label htmlFor="apartment" className={styles.formLabel}>Apartment, suite, unit, etc. (optional)</label>
                  <input
                    id="apartment"
                    type="text"
                    value={formData.apartment}
                    onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                    className={styles.formInput}
                    placeholder="Penthouse A / Suite 402"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="city" className={styles.formLabel}>City *</label>
                  <input
                    id="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={styles.formInput}
                    placeholder="Lekki"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="stateName" className={styles.formLabel}>State / Region *</label>
                  <input
                    id="stateName"
                    type="text"
                    required
                    value={formData.stateName}
                    onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
                    className={styles.formInput}
                    placeholder="Lagos"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="postalCode" className={styles.formLabel}>ZIP / Postal Code *</label>
                  <input
                    id="postalCode"
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className={styles.formInput}
                    placeholder="105102"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="country" className={styles.formLabel}>Country *</label>
                  <input
                    id="country"
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={styles.saveBtn}
                >
                  {saving ? <Spinner /> : null}
                  <span>{saving ? "Saving..." : "Save Address"}</span>
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ── Addresses List Section ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Saved Addresses</h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className={styles.addAddressBtn}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Add Address</span>
              </button>
            )}
          </div>

          {isLoadingData ? (
            <div className={styles.addressList}>
              {[1, 2].map((i) => (
                <div key={i} className={styles.addressSkeleton}>
                  <div className={styles.skeletonLine} style={{ width: "40%", height: 18 }} />
                  <div className={styles.skeletonLine} style={{ width: "80%" }} />
                  <div className={styles.skeletonLine} style={{ width: "60%" }} />
                  <div className={styles.skeletonLine} style={{ width: "30%" }} />
                </div>
              ))}
            </div>
          ) : addresses && addresses.length > 0 ? (
            <div className={styles.addressList}>
              {addresses.map((addr: any) => (
                <div key={addr._id} className={`${styles.addressItem} ${addr.isDefault ? styles.addressItemDefault : ""}`}>
                  <div className={styles.addressInfo}>
                    <div className={styles.addressNameRow}>
                      <span className={styles.addressName}>{addr.fullName}</span>
                      {addr.isDefault && (
                        <span className={styles.defaultBadge}>
                          <StarIcon filled />
                          Default
                        </span>
                      )}
                    </div>
                    <p className={styles.addressText}>
                      {addr.streetAddress}
                      {addr.apartment ? `, ${addr.apartment}` : ""}
                    </p>
                    <p className={styles.addressText}>
                      {addr.city}, {addr.stateName} {addr.postalCode}
                    </p>
                    <p className={styles.addressText}>
                      {addr.country}
                    </p>
                    <p className={styles.addressPhone}>
                      📞 {addr.phone}
                    </p>
                  </div>

                  <div className={styles.addressActions}>
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr._id as Id<"addresses">)}
                        disabled={settingDefaultId === addr._id}
                        className={styles.setDefaultBtn}
                        title="Set as default address"
                      >
                        {settingDefaultId === addr._id ? <Spinner /> : <StarIcon filled={false} />}
                      </button>
                    )}
                    <button
                      onClick={() => handleEditClick(addr)}
                      className={styles.editBtn}
                      title="Edit address"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(addr._id as Id<"addresses">)}
                      disabled={deletingId === addr._id}
                      className={styles.deleteBtn}
                      title="Delete address"
                    >
                      {deletingId === addr._id ? <Spinner /> : <TrashIcon />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📍</div>
              <p className={styles.emptyTitle}>No saved addresses yet</p>
              <p className={styles.emptyDesc}>
                Add a delivery address to complete your checkouts smoothly.
              </p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
