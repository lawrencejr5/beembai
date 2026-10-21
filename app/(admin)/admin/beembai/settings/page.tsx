"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "../../admin.module.css";
import { NIGERIA_LOCATIONS } from "@/app/data/nigeriaLocations";
import { US_LOCATIONS, US_STATE_NAMES } from "@/app/data/usLocations";

const NIGERIAN_STATE_NAMES = Object.keys(NIGERIA_LOCATIONS).sort();

export default function BeembaiSettingsPage() {
  const store = useQuery(api.beembaiStore.getBeembaiStore);
  const updateStore = useMutation(api.beembaiStore.updateBeembaiStore);

  // ── Profile Settings State ──
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [logo, setLogo] = useState("");
  const [bannerMessage, setBannerMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  // ── Nigeria Address State (Saved to default store address fields) ──
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [stateName, setStateName] = useState("Lagos");
  const [lga, setLga] = useState("Ikeja");
  const [city, setCity] = useState("Ikeja");
  const [nigeriaPhone, setNigeriaPhone] = useState("");
  const [savingNigeria, setSavingNigeria] = useState(false);
  const [nigeriaSuccessMsg, setNigeriaSuccessMsg] = useState("");

  // ── US Warehouse State ──
  const [usWarehouseAddress, setUsWarehouseAddress] = useState("");
  const [usWarehouseState, setUsWarehouseState] = useState("Delaware");
  const [usWarehouseCounty, setUsWarehouseCounty] = useState("New Castle County");
  const [usWarehouseCity, setUsWarehouseCity] = useState("Wilmington");
  const [usWarehouseZip, setUsWarehouseZip] = useState("");
  const [usWarehousePhone, setUsWarehousePhone] = useState("");
  const [usWarehouseContactName, setUsWarehouseContactName] = useState("");
  const [savingUs, setSavingUs] = useState(false);
  const [usSuccessMsg, setUsSuccessMsg] = useState("");

  // Sync form state when query resolves
  useEffect(() => {
    if (store) {
      setName(store.name || "");
      setDescription(store.description || "");
      setEmail(store.email || "");
      setPhone(store.phone || "");
      setLogo(store.logo || "");
      setBannerMessage(store.bannerMessage || "");

      // Nigerian Address (Default store address fields)
      const ngState = store.stateName || "Lagos";
      setStateName(ngState);
      const ngLoc = NIGERIA_LOCATIONS[ngState];
      setLga(store.lga || (ngLoc?.lgas?.[0] ?? "Ikeja"));
      setCity(store.city || (ngLoc?.cities?.[0] ?? "Ikeja"));
      setPhysicalAddress(store.physicalAddress || "");
      setNigeriaPhone(store.phone || "");

      // US Warehouse Address
      const uState = store.usWarehouseState || "Delaware";
      setUsWarehouseState(uState);
      const uLoc = US_LOCATIONS[uState];
      setUsWarehouseCounty(store.usWarehouseCounty || (uLoc?.counties?.[0] ?? "New Castle County"));
      setUsWarehouseCity(store.usWarehouseCity || (uLoc?.cities?.[0] ?? "Wilmington"));
      setUsWarehouseAddress(store.usWarehouseAddress || "");
      setUsWarehouseZip(store.usWarehouseZip || "");
      setUsWarehousePhone(store.usWarehousePhone || "");
      setUsWarehouseContactName(store.usWarehouseContactName || "");
    }
  }, [store]);

  if (store === undefined) {
    return (
      <div className={styles.adminContent} style={{ color: "#6b6540" }}>
        Loading settings...
      </div>
    );
  }
  if (!store) {
    return (
      <div className={styles.adminContent}>
        <p>Beembai Official Store record not found in database.</p>
      </div>
    );
  }

  // Handle Nigeria State change: dynamically update LGA and City
  const handleNigeriaStateChange = (newState: string) => {
    setStateName(newState);
    const loc = NIGERIA_LOCATIONS[newState];
    setLga(loc?.lgas?.[0] || "");
    setCity(loc?.cities?.[0] || "");
  };

  // Handle US State change: dynamically update County and City
  const handleUsStateChange = (newUsState: string) => {
    setUsWarehouseState(newUsState);
    const loc = US_LOCATIONS[newUsState];
    setUsWarehouseCounty(loc?.counties?.[0] || "");
    setUsWarehouseCity(loc?.cities?.[0] || "");
  };

  // 1. Save Profile Settings
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg("");
    try {
      await updateStore({
        name,
        description,
        email,
        phone,
        logo,
        bannerMessage,
      });
      setProfileSuccessMsg("Profile settings saved successfully!");
      setTimeout(() => setProfileSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update profile settings.");
    } finally {
      setSavingProfile(false);
    }
  };

  // 2. Save Nigeria Address (Saved on default store address fields)
  const handleSaveNigeriaAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNigeria(true);
    setNigeriaSuccessMsg("");
    try {
      await updateStore({
        physicalAddress,
        stateName,
        lga,
        city,
        country: "Nigeria",
        phone: nigeriaPhone || phone,
      });
      setNigeriaSuccessMsg("Nigeria address saved successfully! Ready for domestic dispatch.");
      setTimeout(() => setNigeriaSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update Nigeria address.");
    } finally {
      setSavingNigeria(false);
    }
  };

  // 3. Save US Warehouse Address
  const handleSaveUsWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUs(true);
    setUsSuccessMsg("");
    try {
      await updateStore({
        usWarehouseAddress,
        usWarehouseState,
        usWarehouseCounty,
        usWarehouseCity,
        usWarehouseZip,
        usWarehousePhone,
        usWarehouseContactName,
      });
      setUsSuccessMsg("US warehouse address saved successfully! Ready for foreign import dispatch.");
      setTimeout(() => setUsSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update US warehouse address.");
    } finally {
      setSavingUs(false);
    }
  };

  const availableLgas = NIGERIA_LOCATIONS[stateName]?.lgas || [lga];
  const availableNigeriaCities = NIGERIA_LOCATIONS[stateName]?.cities || [city];
  const availableUsCounties = US_LOCATIONS[usWarehouseState]?.counties || [usWarehouseCounty];
  const availableUsCities = US_LOCATIONS[usWarehouseState]?.cities || [usWarehouseCity];

  return (
    <div className={styles.adminContent}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Store Settings (Beembai) ⚙️</h1>
          <p className={styles.pageSubtitle}>
            Manage profile settings, default Nigerian address and US warehouse for foreign imports
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          maxWidth: 840,
        }}
      >
        {/* ── CARD 1: Store Profile Settings ── */}
        <div className={styles.adminCard}>
          <div className={styles.adminCardHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>🏪</span>
              <h3 className={styles.adminCardTitle}>
                Store Profile & Branding Settings
              </h3>
            </div>
          </div>
          <form className={styles.adminCardBody} onSubmit={handleSaveProfile}>
            {profileSuccessMsg && (
              <div
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #10b981",
                  color: "#065f46",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                ✅ {profileSuccessMsg}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div
                className={styles.formGroup}
                style={{ gridColumn: "span 2" }}
              >
                <label className={styles.formLabel}>Official Store Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  id="settings-name"
                />
              </div>

              <div
                className={styles.formGroup}
                style={{ gridColumn: "span 2" }}
              >
                <label className={styles.formLabel}>Tagline / Description</label>
                <textarea
                  className={styles.formTextarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                  id="settings-description"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Contact Email</label>
                <input
                  type="email"
                  className={styles.formInput}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@beembai.com"
                  id="settings-email"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Contact Phone</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800..."
                  id="settings-phone"
                />
              </div>

              <div
                className={styles.formGroup}
                style={{ gridColumn: "span 2" }}
              >
                <label className={styles.formLabel}>Logo URL / Path</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  id="settings-logo"
                />
              </div>

              <div
                className={styles.formGroup}
                style={{ gridColumn: "span 2" }}
              >
                <label className={styles.formLabel}>
                  Banner Promotional Message (Optional)
                </label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={bannerMessage}
                  onChange={(e) => setBannerMessage(e.target.value)}
                  placeholder="e.g. Authentic global quality with official Beembai warranty."
                  id="settings-banner-msg"
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="submit"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={savingProfile}
                id="save-profile-btn"
              >
                {savingProfile ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* ── CARD 2: Nigeria Address (Default Store Address) ── */}
        <div className={styles.adminCard}>
          <div className={styles.adminCardHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>🇳🇬</span>
              <div>
                <h3 className={styles.adminCardTitle}>
                  Nigerian Address (Store & Warehouse Pickup)
                </h3>
                <p
                  style={{
                    margin: "2px 0 0 0",
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  Saved directly to your official store address and used by GIG Logistics couriers for domestic pickups.
                </p>
              </div>
            </div>
          </div>
          <form
            className={styles.adminCardBody}
            onSubmit={handleSaveNigeriaAddress}
          >
            {nigeriaSuccessMsg && (
              <div
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #10b981",
                  color: "#065f46",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                ✅ {nigeriaSuccessMsg}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div
                className={styles.formGroup}
                style={{ gridColumn: "span 2" }}
              >
                <label className={styles.formLabel}>
                  Street Address
                </label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  placeholder="e.g. 15 Industrial Avenue, Ilupeju"
                  required
                  id="settings-ng-address"
                />
              </div>

              {/* State Dropdown */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  State
                </label>
                <select
                  className={styles.formSelect}
                  value={stateName}
                  onChange={(e) => handleNigeriaStateChange(e.target.value)}
                  id="settings-ng-state"
                  required
                >
                  {NIGERIAN_STATE_NAMES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* LGA Dropdown */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Local Government Area (LGA)</label>
                <select
                  className={styles.formSelect}
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  id="settings-ng-lga"
                  required
                >
                  {availableLgas.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Dropdown */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>City / Area</label>
                <select
                  className={styles.formSelect}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  id="settings-ng-city"
                  required
                >
                  {availableNigeriaCities.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Pickup Contact Phone
                </label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={nigeriaPhone}
                  onChange={(e) => setNigeriaPhone(e.target.value)}
                  placeholder="+234 803 123 4567"
                  id="settings-ng-phone"
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="submit"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={savingNigeria}
                id="save-ng-warehouse-btn"
              >
                {savingNigeria ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* ── CARD 3: US Inbound Warehouse ── */}
        <div className={styles.adminCard}>
          <div className={styles.adminCardHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>🇺🇸</span>
              <div>
                <h3 className={styles.adminCardTitle}>
                  US Fulfillment Warehouse (Foreign Imports)
                </h3>
                <p
                  style={{
                    margin: "2px 0 0 0",
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  Designated US receiving depot where Amazon & US purchases
                  arrive. GIG Logistics collects packages here for air cargo to
                  Nigeria.
                </p>
              </div>
            </div>
          </div>
          <form
            className={styles.adminCardBody}
            onSubmit={handleSaveUsWarehouse}
          >
            {usSuccessMsg && (
              <div
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #10b981",
                  color: "#065f46",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                ✅ {usSuccessMsg}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div
                className={styles.formGroup}
                style={{ gridColumn: "span 2" }}
              >
                <label className={styles.formLabel}>
                  US Warehouse Street Address
                </label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={usWarehouseAddress}
                  onChange={(e) => setUsWarehouseAddress(e.target.value)}
                  placeholder="e.g. 100 Logistics Blvd, Suite 400"
                  required
                  id="settings-us-address"
                />
              </div>

              {/* US State Dropdown */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>US State</label>
                <select
                  className={styles.formSelect}
                  value={usWarehouseState}
                  onChange={(e) => handleUsStateChange(e.target.value)}
                  id="settings-us-state"
                  required
                >
                  {US_STATE_NAMES.map((st) => (
                    <option key={st} value={st}>
                      {st} ({US_LOCATIONS[st].code})
                    </option>
                  ))}
                </select>
              </div>

              {/* US County Dropdown (US LGA equivalent) */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>County (Local Jurisdiction)</label>
                <select
                  className={styles.formSelect}
                  value={usWarehouseCounty}
                  onChange={(e) => setUsWarehouseCounty(e.target.value)}
                  id="settings-us-county"
                  required
                >
                  {availableUsCounties.map((cty) => (
                    <option key={cty} value={cty}>
                      {cty}
                    </option>
                  ))}
                </select>
              </div>

              {/* US City Dropdown */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>US City</label>
                <select
                  className={styles.formSelect}
                  value={usWarehouseCity}
                  onChange={(e) => setUsWarehouseCity(e.target.value)}
                  id="settings-us-city"
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
                  value={usWarehouseZip}
                  onChange={(e) => setUsWarehouseZip(e.target.value)}
                  placeholder="e.g. 19801"
                  id="settings-us-zip"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>US Contact Phone</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={usWarehousePhone}
                  onChange={(e) => setUsWarehousePhone(e.target.value)}
                  placeholder="+1 (302) 555-0199"
                  id="settings-us-phone"
                />
              </div>

              <div
                className={styles.formGroup}
                style={{ gridColumn: "span 2" }}
              >
                <label className={styles.formLabel}>
                  US Warehouse Contact / Receiver Name
                </label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={usWarehouseContactName}
                  onChange={(e) => setUsWarehouseContactName(e.target.value)}
                  placeholder="e.g. Beembai US Logistics Hub"
                  id="settings-us-contact"
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="submit"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={savingUs}
                id="save-us-warehouse-btn"
              >
                {savingUs ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
