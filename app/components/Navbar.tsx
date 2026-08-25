"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { formatNumber } from "@/app/data/data";

import UserMenu from "./UserMenu";
import styles from "./Navbar.module.css";
import { useTheme } from "@/app/context/ThemeContext";

// SVG Components
const CartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2 2h2.5l2.6 12.4a2 2 0 002 1.6h9.8a2 2 0 002-1.6l1.7-8.4H5.5"
    />
    <circle cx="9" cy="20" r="1.5" fill="currentColor" />
    <circle cx="18" cy="20" r="1.5" fill="currentColor" />
  </svg>
);

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.72-12.72l-1.41-1.41"
    />
  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItemsCount, cartBounce } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to determine if a link is active
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    if (path === "/sell") {
      return pathname.startsWith("/sell");
    }
    return pathname.startsWith(path);
  };

  return (
    <header className={styles.navbar}>
      <Link href="/" className={styles.logo}>
        beembai
        <span className={styles.logoDot} />
      </Link>

      <nav className={styles.navLinks}>
        <Link
          href="/"
          className={`${styles.navLink} ${isActive("/") ? styles.activeNavLink : ""}`}
        >
          Home
        </Link>
        <Link
          href="/categories"
          className={`${styles.navLink} ${isActive("/categories") ? styles.activeNavLink : ""}`}
        >
          Categories
        </Link>
        <Link
          href="/stores"
          className={`${styles.navLink} ${isActive("/stores") ? styles.activeNavLink : ""}`}
        >
          Stores
        </Link>
        <Link
          href="/buy-from-abroad"
          className={`${styles.navLink} ${isActive("/buy-from-abroad") ? styles.activeNavLink : ""}`}
        >
          Buy from Abroad
        </Link>
        <Link
          href="/orders"
          className={`${styles.navLink} ${isActive("/orders") ? styles.activeNavLink : ""}`}
        >
          Track Order
        </Link>
      </nav>

      <div className={styles.navActions}>
        <UserMenu />

        <button
          onClick={toggleTheme}
          className={styles.themeToggleBtn}
          aria-label={mounted ? `Switch to ${theme === "light" ? "dark" : "light"} mode` : "Switch theme"}
        >
          {mounted ? (theme === "light" ? <MoonIcon /> : <SunIcon />) : <div style={{ width: 18, height: 18 }} />}
        </button>

        <Link
          href="/cart"
          className={`${styles.cartIconBtn} ${cartBounce ? styles.cartBounce : ""}`}
          aria-label="Shopping Cart"
        >
          <CartIcon />
          {totalItemsCount > 0 && (
            <span
              className={`${styles.cartBadge} ${cartBounce ? styles.badgePop : ""}`}
            >
              {formatNumber(totalItemsCount)}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
