"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import styles from "./UserMenu.module.css";
import homeStyles from "@/app/page.module.css";

const SpinnerIcon = () => (
  <svg
    className="animate-spin"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    style={{ animation: "spin 1s linear infinite" }}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      style={{ opacity: 0.25 }}
    />
    <path
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </svg>
);

export default function UserMenu() {
  const user = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // If auth is loading, show a subtle loading placeholder
  if (user === undefined) {
    return <div className={styles.loadingPlaceholder} />;
  }

  // If not authenticated, render the default Login/Register button
  if (user === null) {
    return (
      <Link href="/login" className={homeStyles.authBtn}>
        Login / Register
      </Link>
    );
  }

  // Extract initials for the avatar placeholder
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email
      ? user.email[0].toUpperCase()
      : "?";

  const displayName = user.name || user.email?.split("@")[0] || "User";

  return (
    <div className={styles.userMenuContainer} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.triggerBtn}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={displayName}
            className={styles.avatarImg}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>{initials}</div>
        )}
        <span className={styles.userName}>{displayName}</span>
        <svg
          className={`${styles.chevronIcon} ${isOpen ? styles.chevronRotate : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          width="16"
          height="16"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.menuHeader}>
            <p className={styles.menuName}>{user.name || "beembai Shopper"}</p>
            <p className={styles.menuEmail}>{user.email}</p>
            {user.phone && <p className={styles.menuPhone}>{user.phone}</p>}
          </div>
          <div className={styles.divider} />
          <button
            onClick={async () => {
              setIsSigningOut(true);
              try {
                await signOut();
              } catch (err) {
                console.error(err);
              } finally {
                setIsSigningOut(false);
                setIsOpen(false);
              }
            }}
            disabled={isSigningOut}
            className={styles.signOutBtn}
          >
            {isSigningOut ? (
              <SpinnerIcon />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                width="16"
                height="16"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                />
              </svg>
            )}
            <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
