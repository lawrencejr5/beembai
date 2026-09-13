"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "../seller.module.css";
import {
  NIGERIA_STATES_LIST,
  getLgasByState,
  getCitiesByState,
} from "@/app/data/nigeriaLocations";

// ─── Helpers ─────────────────────────────────────────────────

function formatFullNigerianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  let localDigits = digits;
  if (localDigits.startsWith("234")) {
    localDigits = localDigits.slice(3);
  }
  if (localDigits.startsWith("0")) {
    localDigits = localDigits.slice(1);
  }
  return `+234${localDigits}`;
}

function extractRawPhoneForInput(fullPhone: string): string {
  if (!fullPhone) return "";
  let digits = fullPhone.replace(/\D/g, "");
  if (digits.startsWith("234")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits;
}

// ─── Icons ───────────────────────────────────────────────────

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

// ─── Inner Wizard Form ────────────────────────────────────────

function CreateStoreForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editStoreId = searchParams.get("edit") as Id<"stores"> | null;

  const user = useQuery(api.users.viewer);
  const storeToEdit = useQuery(
    api.store.getStoreById,
    editStoreId ? { storeId: editStoreId } : "skip"
  );
  
  // Actions/Mutations
  const sendEmailOTP = useAction(api.store.sendEmailOTP);
  const verifyEmailOTP = useMutation(api.store.verifyEmailOTP);
  const createStoreMut = useMutation(api.store.createStore);
  const updateStoreMut = useMutation(api.store.updateStore);

  // Wizard Steps (Now 4 Steps: 1. Store, 2. Location, 3. Contact, 4. Bank)
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);

  // States
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [formError, setFormError] = useState("");

  // Step 1 — Store Setup
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [bio, setBio] = useState("");

  // Step 2 — Location (Cascading Nigeria fields)
  const country = "Nigeria"; // Fixed preset
  const [stateName, setStateName] = useState("");
  const [lga, setLga] = useState("");
  const [city, setCity] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [addressLine2, setAddressLine2] = useState("");

  const availableLgas = getLgasByState(stateName);
  const availableCities = getCitiesByState(stateName);

  const handleStateChange = (newState: string) => {
    setStateName(newState);
    setLga("");
    setCity("");
    setCustomCity("");
  };

  // Step 3 — Contact (Email OTP & Phone)
  const [email, setEmail] = useState("");
  const [useSignedInEmail, setUseSignedInEmail] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [phoneRaw, setPhoneRaw] = useState("");

  // Step 4 — Bank
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);

  // Pre-populate form when editing an existing store
  useEffect(() => {
    if (storeToEdit) {
      setIsEditMode(true);
      setStoreName(storeToEdit.name);
      setCategory(storeToEdit.category);
      setBio(storeToEdit.description);
      setPhysicalAddress(storeToEdit.physicalAddress || "");
      setAddressLine2((storeToEdit as any).addressLine2 || "");
      setStateName(storeToEdit.stateName || "");
      setLga((storeToEdit as any).lga || "");
      const editCity = storeToEdit.city || "";
      const presetCities = getCitiesByState(storeToEdit.stateName || "");
      if (editCity && presetCities.length > 0 && !presetCities.includes(editCity)) {
        setCity("__other__");
        setCustomCity(editCity);
      } else {
        setCity(editCity);
      }
      setEmail(storeToEdit.email || "");
      setEmailVerified(true); // already verified once
      setPhoneRaw(extractRawPhoneForInput(storeToEdit.phone || ""));
      setBankName(storeToEdit.bankName || "");
      setAccountName(storeToEdit.accountName || "");
      setAccountNumber(storeToEdit.accountNumber || "");
      setRoutingNumber(storeToEdit.routingNumber || "");
    }
  }, [storeToEdit]);

  // Clear validation error on change
  useEffect(() => {
    setFormError("");
  }, [
    currentStep, storeName, bio, physicalAddress, addressLine2, city, customCity, lga, stateName, country,
    email, phoneRaw, bankName, accountName, accountNumber, routingNumber,
  ]);

  // OTP handlers
  const handleSendEmailCode = async () => {
    if (!email) return;
    setIsSendingOtp(true);
    setOtpError("");
    try {
      const res = await sendEmailOTP({ email });
      setEmailSent(true);
      if (res.mocked) {
        console.log(`[Developer OTP Mock]: Use code ${res.token} to verify.`);
      }
    } catch (err: any) {
      setOtpError(err.message || "Failed to send verification email.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    if (emailOtp.length !== 6) return;
    setIsVerifyingOtp(true);
    setOtpError("");
    try {
      const isValid = await verifyEmailOTP({ email, code: emailOtp });
      if (isValid) {
        setEmailVerified(true);
      } else {
        setOtpError("Invalid or expired verification code.");
      }
    } catch (err: any) {
      setOtpError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step navigation
  const handleProceedToLocation = () => {
    if (!storeName.trim()) { setFormError("Store name is required."); return; }
    if (!bio.trim()) { setFormError("Store biography is required."); return; }
    setCurrentStep(2);
  };

  const handleProceedToContact = () => {
    if (!stateName) { setFormError("Please select a State."); return; }
    if (!lga) { setFormError("Please select a Local Government Area (LGA)."); return; }
    const finalCity = city === "__other__" ? customCity.trim() : city;
    if (!finalCity) { setFormError("Please select or specify a City / Town."); return; }
    if (!physicalAddress.trim()) { setFormError("Address Line 1 (Street Address) is required."); return; }
    setCurrentStep(3);
  };

  const handleProceedToBank = () => {
    if (!emailVerified && !useSignedInEmail) { setFormError("Please verify your business email before proceeding."); return; }
    const cleanDigits = phoneRaw.replace(/\D/g, "");
    if (!cleanDigits) { setFormError("Contact phone number is required."); return; }
    if (cleanDigits.length < 10) { setFormError("Please enter a valid 10-digit Nigerian phone number."); return; }
    setCurrentStep(4);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) { setFormError("Bank name is required."); return; }
    if (!accountName.trim()) { setFormError("Account holder name is required."); return; }
    if (!accountNumber.trim()) { setFormError("Account number is required."); return; }
    if (routingNumber.length !== 9) { setFormError("Routing number must be exactly 9 digits."); return; }

    const finalCity = city === "__other__" ? customCity.trim() : city;
    const finalPhone = formatFullNigerianPhone(phoneRaw);

    setIsSubmittingStore(true);
    setSubmitError("");
    setFormError("");
    try {
      if (isEditMode && storeToEdit) {
        await updateStoreMut({
          storeId: storeToEdit._id,
          name: storeName, category, description: bio,
          physicalAddress, addressLine2, city: finalCity, lga, stateName, country: "Nigeria",
          email, phone: finalPhone, bankName, accountName, accountNumber, routingNumber,
        });
      } else {
        await createStoreMut({
          name: storeName, category, description: bio,
          physicalAddress, addressLine2, city: finalCity, lga, stateName, country: "Nigeria",
          email, phone: finalPhone, bankName, accountName, accountNumber, routingNumber,
        });
      }
      setShowSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred during submission.");
    } finally {
      setIsSubmittingStore(false);
    }
  };

  if (showSuccess) {
    return (
      <div className={styles.sellerContent} style={{ maxWidth: 600, margin: "0 auto" }}>
        <div className={styles.onboardingWrapper}>
          <span className={styles.onboardingIcon} style={{ color: "var(--seller-success)" }}>
            <CheckCircleIcon />
          </span>
          <h2 className={styles.onboardingTitle}>Application Submitted!</h2>
          <p className={styles.onboardingText}>
            Your store setup for <strong>{storeName}</strong> is complete. Our partner team is
            reviewing your banking credentials and physical location. This check is usually finalized
            within 24 hours.
          </p>
          <button onClick={() => router.push("/sell")} className={`${styles.btn} ${styles.btnPrimary}`}>
            Go to Overview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sellerContent} style={{ maxWidth: 640, margin: "0 auto" }}>
      
      {/* Back button */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => router.push("/sell")}
          style={{ background: "none", border: "none", color: "var(--seller-text-secondary)", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <ArrowLeftIcon /> Back to Overview
        </button>
      </div>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 className={styles.pageTitle}>
          {isEditMode ? "Edit Store Application" : "Create Your Store"}
        </h1>
        <p className={styles.pageSubtitle}>
          {isEditMode 
            ? "Update your merchant profile. Changes go through a quick review." 
            : "Complete all 4 steps to list products on Beembai."
          }
        </p>
      </div>

      <div className={styles.sellerCard}>
        {/* Progress bar */}
        <div style={{ height: 4, background: "var(--seller-content-bg)", width: "100%" }}>
          <div style={{ height: "100%", background: "var(--seller-sidebar-active-border)", width: `${(currentStep / 4) * 100}%`, transition: "width 0.3s ease" }} />
        </div>

        {/* Step indicator header */}
        <div style={{ display: "flex", justifyContent: "space-around", padding: "16px 12px", borderBottom: "1px solid var(--seller-content-bg)", fontSize: 12, fontWeight: 700, color: "var(--seller-text-secondary)" }}>
          <span style={currentStep === 1 ? { color: "var(--seller-accent)" } : {}}>1. Store</span>
          <span style={currentStep === 2 ? { color: "var(--seller-accent)" } : {}}>2. Location</span>
          <span style={currentStep === 3 ? { color: "var(--seller-accent)" } : {}}>3. Contact</span>
          <span style={currentStep === 4 ? { color: "var(--seller-accent)" } : {}}>4. Bank</span>
        </div>

        <div className={styles.sellerCardBody}>
          {/* Step 1: Store Bio */}
          {currentStep === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Store storefront Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lawrence Leather Goods"
                  className={styles.formInput}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Primary Catalog Category</label>
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
                  placeholder="Tell buyers about your brand, values, and what makes your curated catalog unique..."
                  className={styles.formTextarea}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              {formError && <div style={{ color: "var(--seller-danger)", fontSize: 13, fontWeight: 700 }}>⚠️ {formError}</div>}
              
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={handleProceedToLocation} className={`${styles.btn} ${styles.btnPrimary}`}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Country Locked */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Country</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  className={styles.formInput}
                  value="Nigeria"
                  style={{ opacity: 0.8, cursor: "not-allowed" }}
                />
                <span style={{ fontSize: 11, color: "var(--seller-text-secondary)", marginTop: 2 }}>
                  Beembai currently operates exclusively in Nigeria.
                </span>
              </div>

              {/* State Dropdown */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>State *</label>
                <select
                  className={styles.formSelect}
                  value={stateName}
                  onChange={(e) => handleStateChange(e.target.value)}
                >
                  <option value="">-- Select State --</option>
                  {NIGERIA_STATES_LIST.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* LGA Dropdown */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Local Government Area (LGA) *</label>
                <select
                  className={styles.formSelect}
                  disabled={!stateName}
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  style={!stateName ? { cursor: "not-allowed", opacity: 0.6 } : {}}
                >
                  <option value="">
                    {stateName ? "-- Select LGA --" : "Select a State first"}
                  </option>
                  {availableLgas.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* City / Town Dropdown */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>City / Town *</label>
                <select
                  className={styles.formSelect}
                  disabled={!stateName}
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (e.target.value !== "__other__") setCustomCity("");
                  }}
                  style={!stateName ? { cursor: "not-allowed", opacity: 0.6 } : {}}
                >
                  <option value="">
                    {stateName ? "-- Select City / Town --" : "Select a State first"}
                  </option>
                  {availableCities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                  {stateName && <option value="__other__">+ Other (Type custom city)</option>}
                </select>
              </div>

              {city === "__other__" && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Specify Custom City / Town *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Warri Town"
                    className={styles.formInput}
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                  />
                </div>
              )}

              {/* Address Line 1 */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Address Line 1 (Street Address) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15 Ikoyi Road, Flat 4"
                  className={styles.formInput}
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                />
              </div>

              {/* Address Line 2 */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Address Line 2 (Building, Suite, Landmark - Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Opposite Central Mosque / Near Toll Gate"
                  className={styles.formInput}
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
              </div>

              {formError && <div style={{ color: "var(--seller-danger)", fontSize: 13, fontWeight: 700 }}>⚠️ {formError}</div>}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <button type="button" onClick={() => setCurrentStep(1)} className={`${styles.btn} ${styles.btnGhost}`}>
                  Back
                </button>
                <button type="button" onClick={handleProceedToContact} className={`${styles.btn} ${styles.btnPrimary}`}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Contact (Email Verification & Phone Details) */}
          {currentStep === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Email Verification Section */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label className={styles.formLabel}>Merchant Business Email *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="email"
                    required
                    disabled={emailVerified || useSignedInEmail}
                    placeholder="merchant@domain.com"
                    className={styles.formInput}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={emailVerified || useSignedInEmail || isSendingOtp || !email}
                    onClick={handleSendEmailCode}
                    className={`${styles.btn} ${styles.btnGhost}`}
                  >
                    {isSendingOtp ? "Sending..." : emailSent ? "Resend OTP" : "Send OTP"}
                  </button>
                </div>

                {user?.email && (
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", color: "var(--seller-text-secondary)", fontWeight: 500, marginTop: 2 }}>
                    <input
                      type="checkbox"
                      checked={useSignedInEmail}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setUseSignedInEmail(checked);
                        if (checked && user.email) {
                          setEmail(user.email);
                          setEmailVerified(true);
                        } else if (!checked) {
                          setEmailVerified(false);
                        }
                      }}
                    />
                    <span>use {user.email}</span>
                  </label>
                )}

                {emailSent && !emailVerified && (
                  <div className={styles.formGroup} style={{ background: "#fbf7ee", padding: 12, borderRadius: 8, border: "1px solid var(--seller-card-border)", marginTop: 4 }}>
                    <label className={styles.formLabel}>Enter 6-Digit Verification Code</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        className={styles.formInput}
                        style={{ letterSpacing: "0.2em", fontSize: 16, textAlign: "center", fontWeight: 700 }}
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                      />
                      <button
                        type="button"
                        disabled={isVerifyingOtp || emailOtp.length !== 6}
                        onClick={handleVerifyEmailCode}
                        className={`${styles.btn} ${styles.btnPrimary}`}
                      >
                        {isVerifyingOtp ? "Verifying..." : "Verify Code"}
                      </button>
                    </div>
                  </div>
                )}

                {emailVerified && (
                  <div style={{ padding: "8px 12px", background: "rgba(72, 92, 44, 0.08)", border: "1px solid rgba(72, 92, 44, 0.18)", borderRadius: 6, fontSize: 13, color: "var(--seller-success)", fontWeight: 600 }}>
                    ✓ Business Email Verified Successfully
                  </div>
                )}

                {otpError && <div style={{ color: "var(--seller-danger)", fontSize: 13, fontWeight: 700 }}>⚠️ {otpError}</div>}
              </div>

              {/* Phone Collection Section */}
              <div style={{ borderTop: "1px dashed var(--seller-card-border)", paddingTop: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Merchant Contact Phone *</label>
                  <div className={styles.phoneInputGroup}>
                    <span className={styles.phonePrefixBadge}>+234</span>
                    <input
                      type="tel"
                      required
                      placeholder="803 123 4567"
                      className={styles.phoneInput}
                      value={phoneRaw}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d\s-]/g, "");
                        setPhoneRaw(val);
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--seller-text-secondary)", marginTop: 4 }}>
                    Enter your 10-digit mobile phone number (without leading 0).
                  </span>
                </div>
              </div>

              {formError && <div style={{ color: "var(--seller-danger)", fontSize: 13, fontWeight: 700 }}>⚠️ {formError}</div>}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <button type="button" onClick={() => setCurrentStep(2)} className={`${styles.btn} ${styles.btnGhost}`}>
                  Back
                </button>
                <button type="button" onClick={handleProceedToBank} className={`${styles.btn} ${styles.btnPrimary}`}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Bank Details */}
          {currentStep === 4 && (
            <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Receiving Bank Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zenith Bank"
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
                    placeholder="123456789"
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
                    placeholder="e.g. Lawrence Jr."
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
                    placeholder="e.g. 1012345678"
                    className={styles.formInput}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
              </div>

              {submitError && <div style={{ color: "var(--seller-danger)", fontSize: 13, fontWeight: 700 }}>⚠️ {submitError}</div>}
              {formError && <div style={{ color: "var(--seller-danger)", fontSize: 13, fontWeight: 700 }}>⚠️ {formError}</div>}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <button type="button" onClick={() => setCurrentStep(3)} className={`${styles.btn} ${styles.btnGhost}`} disabled={isSubmittingStore}>
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStore}
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  {isSubmittingStore ? "Submitting Application..." : "Submit Registration"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrapper with Suspense for SearchParams loading
export default function NewStoreOnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--seller-text-secondary)" }}>Loading registration wizard...</p>
      </div>
    }>
      <CreateStoreForm />
    </Suspense>
  );
}
