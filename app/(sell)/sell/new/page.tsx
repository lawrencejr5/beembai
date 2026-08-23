"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "../seller.module.css";

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

  // Wizard Steps
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

  // Step 2 — Location
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("");

  // Step 3 — Email OTP
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Step 4 — Phone
  const [phone, setPhone] = useState("");

  // Step 5 — Bank
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
      setCity(storeToEdit.city || "");
      setStateName(storeToEdit.stateName || "");
      setCountry(storeToEdit.country || "");
      setEmail(storeToEdit.email || "");
      setEmailVerified(true); // already verified once
      setPhone(storeToEdit.phone || "");
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
    currentStep, storeName, bio, physicalAddress, city, stateName, country,
    email, phone, bankName, accountName, accountNumber, routingNumber,
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

  const handleProceedToEmail = () => {
    if (!physicalAddress.trim()) { setFormError("Street address is required."); return; }
    if (!city.trim()) { setFormError("City is required."); return; }
    if (!stateName.trim()) { setFormError("State / Province is required."); return; }
    if (!country.trim()) { setFormError("Country is required."); return; }
    setCurrentStep(3);
  };

  const handleProceedToPhone = () => {
    if (!emailVerified) { setFormError("Please verify your business email before proceeding."); return; }
    setCurrentStep(4);
  };

  const handleProceedToBank = () => {
    if (!phone.trim()) { setFormError("Contact phone number is required."); return; }
    if (phone.trim().length < 7) { setFormError("Please enter a valid phone number."); return; }
    setCurrentStep(5);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) { setFormError("Bank name is required."); return; }
    if (!accountName.trim()) { setFormError("Account holder name is required."); return; }
    if (!accountNumber.trim()) { setFormError("Account number is required."); return; }
    if (routingNumber.length !== 9) { setFormError("Routing number must be exactly 9 digits."); return; }

    setIsSubmittingStore(true);
    setSubmitError("");
    setFormError("");
    try {
      if (isEditMode && storeToEdit) {
        await updateStoreMut({
          storeId: storeToEdit._id,
          name: storeName, category, description: bio,
          physicalAddress, city, stateName, country,
          email, phone, bankName, accountName, accountNumber, routingNumber,
        });
      } else {
        await createStoreMut({
          name: storeName, category, description: bio,
          physicalAddress, city, stateName, country,
          email, phone, bankName, accountName, accountNumber, routingNumber,
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
            : "Complete all 5 steps to list products on Beembai."
          }
        </p>
      </div>

      <div className={styles.sellerCard}>
        {/* Progress bar */}
        <div style={{ height: 4, background: "var(--seller-content-bg)", width: "100%" }}>
          <div style={{ height: "100%", background: "var(--seller-sidebar-active-border)", width: `${(currentStep / 5) * 100}%`, transition: "width 0.3s ease" }} />
        </div>

        {/* Step indicator header */}
        <div style={{ display: "flex", justifyContent: "space-around", padding: "16px 12px", borderBottom: "1px solid var(--seller-content-bg)", fontSize: 12, fontWeight: 700, color: "var(--seller-text-secondary)" }}>
          <span style={currentStep === 1 ? { color: "var(--seller-accent)" } : {}}>1. Store</span>
          <span style={currentStep === 2 ? { color: "var(--seller-accent)" } : {}}>2. Location</span>
          <span style={currentStep === 3 ? { color: "var(--seller-accent)" } : {}}>3. Verify</span>
          <span style={currentStep === 4 ? { color: "var(--seller-accent)" } : {}}>4. Contact</span>
          <span style={currentStep === 5 ? { color: "var(--seller-accent)" } : {}}>5. Bank</span>
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
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15 Ikoyi Road"
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
                    placeholder="Lagos"
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
                    placeholder="Lagos State"
                    className={styles.formInput}
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Country *</label>
                <input
                  type="text"
                  required
                  placeholder="Nigeria"
                  className={styles.formInput}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>

              {formError && <div style={{ color: "var(--seller-danger)", fontSize: 13, fontWeight: 700 }}>⚠️ {formError}</div>}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <button type="button" onClick={() => setCurrentStep(1)} className={`${styles.btn} ${styles.btnGhost}`}>
                  Back
                </button>
                <button type="button" onClick={handleProceedToEmail} className={`${styles.btn} ${styles.btnPrimary}`}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Verify OTP */}
          {currentStep === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Merchant Business Email *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="email"
                    required
                    disabled={emailVerified}
                    placeholder="merchant@domain.com"
                    className={styles.formInput}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={emailVerified || isSendingOtp || !email}
                    onClick={handleSendEmailCode}
                    className={`${styles.btn} ${styles.btnGhost}`}
                  >
                    {isSendingOtp ? "Sending..." : emailSent ? "Resend" : "Send OTP"}
                  </button>
                </div>
              </div>

              {emailSent && !emailVerified && (
                <div className={styles.formGroup} style={{ background: "#fbf7ee", padding: 12, borderRadius: 8, border: "1px solid var(--seller-card-border)" }}>
                  <label className={styles.formLabel}>Enter 6-Digit Code</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
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
                  ✓ Email Verification Successful
                </div>
              )}

              {otpError && <div style={{ color: "var(--seller-danger)", fontSize: 13, fontWeight: 700 }}>⚠️ {otpError}</div>}
              {formError && <div style={{ color: "var(--seller-danger)", fontSize: 13, fontWeight: 700 }}>⚠️ {formError}</div>}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <button type="button" onClick={() => setCurrentStep(2)} className={`${styles.btn} ${styles.btnGhost}`}>
                  Back
                </button>
                <button type="button" onClick={handleProceedToPhone} className={`${styles.btn} ${styles.btnPrimary}`}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Phone Contact */}
          {currentStep === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Merchant Contact Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+234 803 123 4567"
                  className={styles.formInput}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {formError && <div style={{ color: "var(--seller-danger)", fontSize: 13, fontWeight: 700 }}>⚠️ {formError}</div>}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <button type="button" onClick={() => setCurrentStep(3)} className={`${styles.btn} ${styles.btnGhost}`}>
                  Back
                </button>
                <button type="button" onClick={handleProceedToBank} className={`${styles.btn} ${styles.btnPrimary}`}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Bank Details */}
          {currentStep === 5 && (
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
                <button type="button" onClick={() => setCurrentStep(4)} className={`${styles.btn} ${styles.btnGhost}`} disabled={isSubmittingStore}>
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
