"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./sell.module.css";
import homeStyles from "@/app/page.module.css";
import { formatNumber } from "@/app/data/data";
import { useCart } from "@/app/context/CartContext";
import Navbar from "@/app/components/Navbar";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// ─── Icons ──────────────────────────────────────────────────────────────────

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

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function SellLandingPage() {
  const router = useRouter();
  const { totalItemsCount, cartBounce } = useCart();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const user = useQuery(api.users.viewer);
  const userStores = useQuery(api.store.getStoresByOwner);

  // Sync theme on mount
  useEffect(() => {
    const activeTheme =
      (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
    setTheme(activeTheme);
  }, []);

  // Auto-redirect to first store if user already has one
  useEffect(() => {
    if (!userStores) return;
    if (userStores.length > 0) {
      // Prefer approved stores, otherwise take the first store
      const preferred =
        userStores.find((s) => s.status === "approved") ?? userStores[0];
      router.replace(`/sell/${preferred.slug}`);
    }
  }, [userStores, router]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  // While we're checking if the user has stores, show a neutral loading state
  // to avoid flashing the landing page before a redirect
  if (userStores === undefined) {
    return (
      <div className={styles.container}>
        <Navbar />
        <main className={styles.mainContent}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: "1rem" }}>
            <div style={{ fontSize: "2rem" }}>⏳</div>
            <p style={{ color: "var(--color-olive-gray)", fontWeight: 600, fontSize: "0.95rem" }}>
              Checking store status…
            </p>
          </div>
        </main>
      </div>
    );
  }

  const isRedirecting = userStores.length > 0;

  return (
    <div className={styles.container}>
      <Navbar />

      {/* Main */}
      <main className={styles.mainContent}>
        {isRedirecting ? (
          /* Redirecting to store dashboard… */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: "1rem" }}>
            <div style={{ fontSize: "2rem" }}>⏳</div>
            <p style={{ color: "var(--color-olive-gray)", fontWeight: 600, fontSize: "0.95rem" }}>
              Taking you to your store dashboard…
            </p>
          </div>
        ) : (
          <>
            {/* Hero */}
            <section className={styles.heroBanner}>
              <div className={styles.heroTag}><span>Merchant Portal</span></div>
              <h1 className={styles.heroTitle}>Grow your business. Start selling on Beembai.</h1>
              <p className={styles.heroSubtitle}>
                List your curated products in front of thousands of daily active buyers searching for luxury electronics, designer fashion, and custom homeware.
              </p>
            </section>

            {/* How it works */}
            <section style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Selling is Simple</h2>
                <p className={styles.sectionSubtitle}>
                  Follow our 3-step merchant integration path to list your catalog.
                </p>
              </div>

              <div className={styles.stepsGrid}>
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>1</div>
                  <h3 className={styles.stepCardTitle}>Create Store</h3>
                  <p className={styles.stepCardText}>
                    Fill out the store details application form to set up your verified digital storefront on Beembai.
                  </p>
                </div>
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>2</div>
                  <h3 className={styles.stepCardTitle}>List Catalog</h3>
                  <p className={styles.stepCardText}>
                    Upload product photos, set inventory levels, colors, specifications, and manage product details in one portal.
                  </p>
                </div>
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>3</div>
                  <h3 className={styles.stepCardTitle}>Receive Payouts</h3>
                  <p className={styles.stepCardText}>
                    Enjoy low commission rates, zero listing fees, and secure bank payouts processed within 24 hours of delivery.
                  </p>
                </div>
              </div>

              {/* CTA */}
              {user === undefined ? (
                /* Still loading — disabled button */
                <button type="button" className={styles.proceedIntroBtn} disabled>
                  Proceed to Store Setup
                </button>
              ) : user ? (
                /* Authenticated — go to /sell/new */
                <button type="button" onClick={() => router.push("/sell/new")} className={styles.proceedIntroBtn}>
                  Proceed to Store Setup
                </button>
              ) : (
                /* Not signed in — go to login first */
                <Link
                  href="/login?redirectTo=/sell/new"
                  className={styles.proceedIntroBtn}
                  style={{ display: "inline-block", textAlign: "center", textDecoration: "none" }}
                >
                  Sign in to Get Started
                </Link>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
