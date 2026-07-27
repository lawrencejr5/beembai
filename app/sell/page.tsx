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

  // Form States
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
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

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (storeName && email && phone) {
      setShowSuccess(true);
    }
  };

  const handleResetForm = () => {
    setStoreName("");
    setCategory("All Categories");
    setEmail("");
    setPhone("");
    setBio("");
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
        {/* Sell Hero Header */}
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
                Fill out the store details application form below to set up your verified digital storefront on Beembai.
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
        </section>

        {/* Registration Form */}
        <section className={styles.formSection}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Merchant Application</h2>
            <p className={styles.formSubtitle}>Apply to create your digital storefront. Our team reviews all stores in 24 hours.</p>
          </div>

          <form onSubmit={handleRegisterSubmit} className={styles.applicationForm}>
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

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Business Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. partner@store.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.inputField}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Contact Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +1 (555) 019-2834"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={styles.inputField}
                />
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

            <button type="submit" className={styles.submitBtn}>
              Submit Application
            </button>
          </form>
        </section>
      </main>

      {/* Success Registration Overlay Modal */}
      {showSuccess && (
        <div className={styles.successOverlay}>
          <div className={styles.successCard}>
            <div className={styles.successTickCircle}>
              <CheckCircleIcon />
            </div>
            <h3 className={styles.successTitle}>Application Submitted!</h3>
            <p className={styles.successText}>
              Congratulations! Your merchant application for <strong>{storeName}</strong> has been received successfully.
              <br />
              <span style={{ fontSize: "0.82rem", color: "var(--color-olive-gray)" }}>
                We sent a validation link to <strong>{email}</strong>. Our partnership team will reach out within 24 hours.
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
