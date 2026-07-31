"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./sell.module.css";
import homeStyles from "@/app/page.module.css";
import { formatNumber } from "@/app/data/products";
import { useCart } from "@/app/context/CartContext";

// Local SVG Icons
const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 2h2.5l2.6 12.4a2 2 0 002 1.6h9.8a2 2 0 002-1.6l1.7-8.4H5.5" />
    <circle cx="9" cy="20" r="1.5" fill="currentColor" />
    <circle cx="18" cy="20" r="1.5" fill="currentColor" />
  </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.72-12.72l-1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default function SellPage() {
  const { totalItemsCount, cartBounce } = useCart();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Step state
  const [currentStep, setCurrentStep] = useState(0); // 0 = Intro, 1 = Store Form, 2 = Location Form, 3 = Verify Email, 4 = Verify Phone, 5 = Bank Details

  // Form States
  // Step 1: Store Setup
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [bio, setBio] = useState("");

  // Step 2: Location
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("");

  // Step 3: Email Verification
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Step 4: Phone Verification
  const [phone, setPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);

  // Step 5: Bank Details
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);
  const [showCategoryInfo, setShowCategoryInfo] = useState(false);

  // Sync theme
  useEffect(() => {
    const activeTheme = document.documentElement.getAttribute("data-theme") as "light" | "dark" || "light";
    setTheme(activeTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const handleSendEmailCode = () => {
    if (email) {
      setEmailSent(true);
    }
  };

  const handleVerifyEmailCode = () => {
    if (emailOtp.length === 6) {
      setEmailVerified(true);
    }
  };

  const handleSendPhoneCode = () => {
    if (phone) {
      setPhoneSent(true);
    }
  };

  const handleVerifyPhoneCode = () => {
    if (phoneOtp.length === 6) {
      setPhoneVerified(true);
    }
  };

  const handleProceedToLocation = () => {
    if (storeName.trim()) {
      setCurrentStep(2);
    }
  };

  const handleProceedToEmail = () => {
    if (physicalAddress.trim() && city.trim() && stateName.trim() && country.trim()) {
      setCurrentStep(3);
    }
  };

  const handleProceedToPhone = () => {
    if (emailVerified) {
      setCurrentStep(4);
    }
  };

  const handleProceedToBank = () => {
    if (phoneVerified) {
      setCurrentStep(5);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (storeName && emailVerified && phoneVerified && bankName && accountNumber && accountName) {
      setShowSuccess(true);
    }
  };

  const handleResetForm = () => {
    setStoreName("");
    setCategory("All Categories");
    setBio("");
    setPhysicalAddress("");
    setCity("");
    setStateName("");
    setCountry("");
    setEmail("");
    setEmailOtp("");
    setEmailVerified(false);
    setEmailSent(false);
    setPhone("");
    setPhoneOtp("");
    setPhoneVerified(false);
    setPhoneSent(false);
    setBankName("");
    setAccountName("");
    setAccountNumber("");
    setRoutingNumber("");
    setCurrentStep(0);
    setShowSuccess(false);
    setShowCategoryInfo(false);
  };

  return (
    <div className={styles.container}>
      {/* Fixed Header Navbar */}
      <header className={homeStyles.navbar}>
        <Link href="/" className={homeStyles.logo}>
          <span>beembai</span>
          <span className={homeStyles.logoDot} />
        </Link>

        <nav className={homeStyles.navLinks}>
          <Link href="/#featured" className={homeStyles.navLink}>
            Featured
          </Link>
          <Link href="/#shop" className={homeStyles.navLink}>
            New Arrivals
          </Link>
          <Link href="/stores" className={homeStyles.navLink}>
            Stores
          </Link>
          <Link href="/sell" className={`${homeStyles.navLink} ${homeStyles.activeNavLink}`}>
            Sell
          </Link>
        </nav>

        <div className={homeStyles.navActions}>
          <Link href="/login" className={homeStyles.authBtn}>
            Login / Register
          </Link>
          <button
            onClick={toggleTheme}
            className={homeStyles.themeToggleBtn}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>

          <Link
            href="/cart"
            className={`${homeStyles.cartIconBtn} ${cartBounce ? homeStyles.cartBounce : ""}`}
            aria-label="Shopping Cart"
          >
            <CartIcon />
            {totalItemsCount > 0 && (
              <span className={`${homeStyles.cartBadge} ${cartBounce ? homeStyles.badgePop : ""}`}>
                {formatNumber(totalItemsCount)}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Main Page Layout */}
      <main className={styles.mainContent}>
        {/* Sell Hero Header - only visible on Step 0 */}
        {currentStep === 0 && (
          <>
            <section className={styles.heroBanner}>
              <div className={styles.heroTag}>
                <span>Merchant Portal</span>
              </div>
              <h1 className={styles.heroTitle}>Grow your business. Start selling on Beembai.</h1>
              <p className={styles.heroSubtitle}>
                List your curated products in front of thousands of daily active buyers searching for luxury electronics, designer fashion, and custom homeware.
              </p>
            </section>

            {/* Step-by-Step Selling Information */}
            <section style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Selling is Simple</h2>
                <p className={styles.sectionSubtitle}>Follow our 3-step merchant integration path to list your catalog.</p>
              </div>

              <div className={styles.stepsGrid}>
                {/* Step 1 */}
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>1</div>
                  <h3 className={styles.stepCardTitle}>Create Store</h3>
                  <p className={styles.stepCardText}>
                    Fill out the store details application form to set up your verified digital storefront on Beembai.
                  </p>
                </div>

                {/* Step 2 */}
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>2</div>
                  <h3 className={styles.stepCardTitle}>List Catalog</h3>
                  <p className={styles.stepCardText}>
                    Upload product photos, set inventory levels, colors, specifications, and manage product details in one portal.
                  </p>
                </div>

                {/* Step 3 */}
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>3</div>
                  <h3 className={styles.stepCardTitle}>Receive Payouts</h3>
                  <p className={styles.stepCardText}>
                    Enjoy low commission rates, zero listing fees, and secure bank payouts processed immediately within 24 hours of delivery.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={styles.proceedIntroBtn}
              >
                Proceed to Store Setup
              </button>
            </section>
          </>
        )}

        {/* Step-by-Step Onboarding Form */}
        {currentStep > 0 && (
          <section className={styles.formSection}>
            {/* Step Progress Indicators */}
            <div className={styles.progressBarWrapper}>
              <div
                className={styles.progressBar}
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>

            <div className={styles.stepProgressHeader}>
              {[
                { step: 1, label: "Store Info" },
                { step: 2, label: "Location" },
                { step: 3, label: "Verify Email" },
                { step: 4, label: "Verify Phone" },
                { step: 5, label: "Bank Details" }
              ].map((item) => {
                let stepClass = styles.stepDot;
                if (currentStep === item.step) {
                  stepClass += ` ${styles.stepDotActive}`;
                } else if (currentStep > item.step) {
                  stepClass += ` ${styles.stepDotCompleted}`;
                }
                return (
                  <div key={item.step} className={styles.stepIndicatorItem}>
                    <div className={stepClass}>
                      {currentStep > item.step ? "✓" : item.step}
                    </div>
                    <span className={styles.stepLabel}>{item.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Step 1: Store Setup Form */}
            {currentStep === 1 && (
              <div className={styles.applicationForm}>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Store Setup</h2>
                  <p className={styles.formSubtitle}>Provide initial details for your storefront.</p>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Store Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vintage Co."
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>

                  <div className={styles.formGroup} style={{ position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <label className={styles.formLabel}>Primary Category (Optional)</label>
                      <button
                        type="button"
                        onClick={() => setShowCategoryInfo(!showCategoryInfo)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--color-palm)",
                          cursor: "pointer",
                          fontSize: "1rem",
                          fontWeight: "800",
                          padding: "0 0.25rem",
                          display: "flex",
                          alignItems: "center"
                        }}
                        title="Category Info"
                      >
                        ⓘ
                      </button>
                    </div>
                    {showCategoryInfo && (
                      <div style={{
                        backgroundColor: "var(--color-sand)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "10px",
                        padding: "0.6rem 0.8rem",
                        fontSize: "0.78rem",
                        lineHeight: "1.4",
                        color: "var(--color-olive-gray)",
                        fontWeight: "600",
                        marginBottom: "0.4rem"
                      }}>
                        💡 Selecting a primary category helps us feature your shop, but you can sell products across <strong>any</strong> category at any time!
                      </div>
                    )}
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={styles.selectField}
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
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Brand Biography / Description</label>
                  <textarea
                    placeholder="Share a short summary about your brand, what you sell, and your design values..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className={styles.textAreaField}
                  />
                </div>

                <div className={styles.btnGroup}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(0)}
                    className={styles.backBtn}
                  >
                    Back to Intro
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToLocation}
                    disabled={!storeName.trim()}
                    className={styles.submitBtn}
                    style={{ marginTop: 0 }}
                  >
                    Proceed to Location
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Location Setup Form */}
            {currentStep === 2 && (
              <div className={styles.applicationForm}>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Address & Location</h2>
                  <p className={styles.formSubtitle}>Provide the physical location details for your business.</p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Street Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123 Design Way"
                    value={physicalAddress}
                    onChange={(e) => setPhysicalAddress(e.target.value)}
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. New York"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>State / Province *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NY"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Country *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.btnGroup}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className={styles.backBtn}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToEmail}
                    disabled={!physicalAddress.trim() || !city.trim() || !stateName.trim() || !country.trim()}
                    className={styles.submitBtn}
                    style={{ marginTop: 0 }}
                  >
                    Proceed to Email Verification
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Email Verification */}
            {currentStep === 3 && (
              <div className={styles.applicationForm}>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Verify Your Email</h2>
                  <p className={styles.formSubtitle}>We need a confirmed business email to process storefront creation.</p>
                </div>

                <div className={styles.verificationContainer}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Business Email Address *</label>
                    <div className={styles.verificationActionRow}>
                      <input
                        type="email"
                        required
                        disabled={emailVerified}
                        placeholder="e.g. partner@store.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.inputField}
                      />
                      {!emailVerified && (
                        <button
                          type="button"
                          onClick={handleSendEmailCode}
                          disabled={!email || emailSent}
                          className={styles.sendCodeBtn}
                        >
                          {emailSent ? "Resend OTP" : "Send Code"}
                        </button>
                      )}
                    </div>
                  </div>

                  {emailSent && !emailVerified && (
                    <div className={styles.otpInputWrapper}>
                      <label className={styles.formLabel}>Enter 6-Digit OTP *</label>
                      <div className={styles.verificationActionRow}>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                          className={styles.inputField}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmailCode}
                          disabled={emailOtp.length !== 6}
                          className={styles.sendCodeBtn}
                        >
                          Confirm
                        </button>
                      </div>
                      <span className={styles.verificationText}>
                        💡 Enter any 6 digits (e.g. 123456) to mock a successful validation.
                      </span>
                    </div>
                  )}

                  {emailVerified && (
                    <div className={styles.verifiedBadge}>
                      ✓ Email Address Verified Successfully
                    </div>
                  )}
                </div>

                <div className={styles.btnGroup}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className={styles.backBtn}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToPhone}
                    disabled={!emailVerified}
                    className={styles.submitBtn}
                    style={{ marginTop: 0 }}
                  >
                    Proceed to Phone Verification
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Phone Verification */}
            {currentStep === 4 && (
              <div className={styles.applicationForm}>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Verify Your Phone Number</h2>
                  <p className={styles.formSubtitle}>Verify your phone contact to prevent fraudulent account activations.</p>
                </div>

                <div className={styles.verificationContainer}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Contact Phone Number *</label>
                    <div className={styles.verificationActionRow}>
                      <input
                        type="tel"
                        required
                        disabled={phoneVerified}
                        placeholder="e.g. +1 (555) 019-2834"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={styles.inputField}
                      />
                      {!phoneVerified && (
                        <button
                          type="button"
                          onClick={handleSendPhoneCode}
                          disabled={!phone || phoneSent}
                          className={styles.sendCodeBtn}
                        >
                          {phoneSent ? "Resend OTP" : "Send SMS"}
                        </button>
                      )}
                    </div>
                  </div>

                  {phoneSent && !phoneVerified && (
                    <div className={styles.otpInputWrapper}>
                      <label className={styles.formLabel}>Enter 6-Digit OTP *</label>
                      <div className={styles.verificationActionRow}>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                          className={styles.inputField}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPhoneCode}
                          disabled={phoneOtp.length !== 6}
                          className={styles.sendCodeBtn}
                        >
                          Confirm
                        </button>
                      </div>
                      <span className={styles.verificationText}>
                        💡 Enter any 6 digits (e.g. 123456) to mock a successful validation.
                      </span>
                    </div>
                  )}

                  {phoneVerified && (
                    <div className={styles.verifiedBadge}>
                      ✓ Phone Number Verified Successfully
                    </div>
                  )}
                </div>

                <div className={styles.btnGroup}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className={styles.backBtn}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToBank}
                    disabled={!phoneVerified}
                    className={styles.submitBtn}
                    style={{ marginTop: 0 }}
                  >
                    Proceed to Bank Details
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Bank Details Form */}
            {currentStep === 5 && (
              <form onSubmit={handleRegisterSubmit} className={styles.applicationForm}>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Payout Account Configuration</h2>
                  <p className={styles.formSubtitle}>Setup secure bank details where you'll receive payout transfers.</p>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bank Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chase Bank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Account Holder Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vintage Co. LLC"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Account Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1234567890"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                      className={styles.inputField}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Routing Number (9 Digits) *</label>
                    <input
                      type="text"
                      required
                      maxLength={9}
                      placeholder="e.g. 987654321"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, ""))}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div className={styles.btnGroup}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className={styles.backBtn}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!bankName.trim() || !accountName.trim() || !accountNumber.trim() || routingNumber.length !== 9}
                    className={styles.submitBtn}
                    style={{ marginTop: 0 }}
                  >
                    Complete Merchant Registration
                  </button>
                </div>
              </form>
            )}
          </section>
        )}
      </main>

      {/* Success Registration Overlay Modal */}
      {showSuccess && (
        <div className={styles.successOverlay}>
          <div className={styles.successCard}>
            <div className={styles.successTickCircle}>
              <CheckCircleIcon />
            </div>
            <h3 className={styles.successTitle}>Application Completed!</h3>
            <p className={styles.successText}>
              Congratulations! Your merchant setup for <strong>{storeName}</strong> has been completed successfully.
              <br />
              <span style={{ fontSize: "0.82rem", color: "var(--color-olive-gray)" }}>
                We've verified your email (<strong>{email}</strong>) and phone (<strong>{phone}</strong>). Payouts will settle to your Chase bank account. Our partnership team will activate your catalog within 24 hours.
              </span>
            </p>
            <button type="button" onClick={handleResetForm} className={styles.closeSuccessBtn}>
              Got It, Thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
