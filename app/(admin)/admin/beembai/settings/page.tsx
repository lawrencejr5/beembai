"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "../../admin.module.css";

export default function BeembaiSettingsPage() {
  const store = useQuery(api.beembaiStore.getBeembaiStore);
  const updateStore = useMutation(api.beembaiStore.updateBeembaiStore);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("");
  const [logo, setLogo] = useState("");
  const [bannerMessage, setBannerMessage] = useState("");

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Sync form state when query resolves
  useEffect(() => {
    if (store) {
      setName(store.name || "");
      setDescription(store.description || "");
      setEmail(store.email || "");
      setPhone(store.phone || "");
      setPhysicalAddress(store.physicalAddress || "");
      setCity(store.city || "");
      setStateName(store.stateName || "");
      setCountry(store.country || "");
      setLogo(store.logo || "");
      setBannerMessage(store.bannerMessage || "");
    }
  }, [store]);

  if (store === undefined) return <div className={styles.adminContent} style={{ color: "#6b6540" }}>Loading settings...</div>;
  if (!store) return <div className={styles.adminContent}><p>Beembai Official Store record not found in database.</p></div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      await updateStore({
        name,
        description,
        email,
        phone,
        physicalAddress,
        city,
        stateName,
        country,
        logo,
        bannerMessage,
      });
      setSuccessMsg("Settings updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to update store settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.adminContent}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Store Settings (Beembai) ⚙️</h1>
          <p className={styles.pageSubtitle}>Manage the public details of the Beembai Official Store</p>
        </div>
      </div>

      <div className={styles.adminCard} style={{ maxWidth: 700 }}>
        <div className={styles.adminCardHeader}>
          <h3 className={styles.adminCardTitle}>Profile Settings</h3>
        </div>
        <form className={styles.adminCardBody} onSubmit={handleSubmit}>
          {successMsg && (
            <div style={{ padding: "10px 16px", backgroundColor: "#ecfdf5", border: "1px solid #10b981", color: "#065f46", borderRadius: 8, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
              {successMsg}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label className={styles.formLabel}>Official Store Name</label>
              <input type="text" className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} required id="settings-name" />
            </div>

            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label className={styles.formLabel}>Tagline / Description</label>
              <textarea className={styles.formTextarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required id="settings-description" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Contact Email</label>
              <input type="email" className={styles.formInput} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@beembai.com" id="settings-email" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Contact Phone</label>
              <input type="text" className={styles.formInput} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 800..." id="settings-phone" />
            </div>

            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label className={styles.formLabel}>Logo URL / Path</label>
              <input type="text" className={styles.formInput} value={logo} onChange={(e) => setLogo(e.target.value)} id="settings-logo" />
            </div>

            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label className={styles.formLabel}>Banner Promotional Message (Optional)</label>
              <input type="text" className={styles.formInput} value={bannerMessage} onChange={(e) => setBannerMessage(e.target.value)} placeholder="e.g. Free shipping on all US orders above $150!" id="settings-banner-msg" />
            </div>

            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label className={styles.formLabel}>Physical Warehouse / Address</label>
              <input type="text" className={styles.formInput} value={physicalAddress} onChange={(e) => setPhysicalAddress(e.target.value)} placeholder="123 Beembai Way, Ikeja" id="settings-address" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>City</label>
              <input type="text" className={styles.formInput} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lagos" id="settings-city" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>State / Region</label>
              <input type="text" className={styles.formInput} value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="Lagos State" id="settings-state" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Country</label>
              <input type="text" className={styles.formInput} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Nigeria" id="settings-country" />
            </div>
          </div>

          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving} id="save-settings-btn">
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}