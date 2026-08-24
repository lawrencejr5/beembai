"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import styles from "./seller.module.css";

// ─── Store Context Definition ───────────────────────────────

interface Store {
  _id: string;
  _creationTime: number;
  userId: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  status?: string;
  verificationStatus?: string;
  rejectionReason?: string;
  rating: number;
  logo?: string;
  banner?: string;
  physicalAddress?: string;
  city?: string;
  stateName?: string;
  country?: string;
  email?: string;
  phone?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
}

interface SellerStoreContextType {
  activeStoreId: string | null; // null represents "All Stores"
  setActiveStoreId: (id: string | null) => void;
  stores: Store[];
  loading: boolean;
}

const SellerStoreContext = createContext<SellerStoreContextType>({
  activeStoreId: null,
  setActiveStoreId: () => {},
  stores: [],
  loading: true,
});

export const useSellerStore = () => useContext(SellerStoreContext);

// ─── Navigation Configuration ───────────────────────────────

const navItems = [
  { href: "/sell", label: "Overview", icon: "🏪", exact: true },
  { href: "/sell/products", label: "Products", icon: "📦", exact: false },
  { href: "/sell/orders", label: "Orders", icon: "🛒", exact: false },
  { href: "/sell/settings", label: "Settings", icon: "⚙️", exact: false },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuthActions();

  // Authentication & Store Queries
  const viewer = useQuery(api.users.viewer);
  const stores = useQuery(api.store.getStoresByOwner) as Store[] | undefined;

  // Layout States
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Sync activeStoreId once stores load (default to "all")
  useEffect(() => {
    if (stores && stores.length > 0) {
      const savedStoreId = localStorage.getItem("seller-active-store-id");
      if (savedStoreId && (savedStoreId === "all" || stores.some(s => s._id === savedStoreId))) {
        setActiveStoreId(savedStoreId === "all" ? null : savedStoreId);
      } else {
        setActiveStoreId(null); // default to All Stores
      }
    }
  }, [stores]);

  // Auth Guard Redirect
  useEffect(() => {
    if (viewer === null) {
      router.replace("/login?redirectTo=/sell");
    }
  }, [viewer, router]);

  // Sync active store selection to localStorage
  const handleStoreChange = (storeId: string | null) => {
    setActiveStoreId(storeId);
    localStorage.setItem("seller-active-store-id", storeId || "all");
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "M";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  // ─── Render Loading State ────────────────────────────────

  if (viewer === undefined || stores === undefined) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1f211d",
      }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#d6983a",
              animation: "pulse 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,80%,100%{opacity:.2;transform:scale(.85)}40%{opacity:1;transform:scale(1.15)} }`}</style>
      </div>
    );
  }

  if (viewer === null) return null;

  return (
    <SellerStoreContext.Provider
      value={{
        activeStoreId,
        setActiveStoreId: handleStoreChange,
        stores: stores || [],
        loading: false,
      }}
    >
      <div className={`${styles.sellerRoot} ${isMobileOpen ? styles.mobileOpen : ""}`}>
        
        {/* Mobile Top Bar */}
        <div className={styles.mobileTopBar}>
          <button
            className={styles.menuToggleBtn}
            onClick={() => setIsMobileOpen(true)}
            title="Open Menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 20, height: 20 }}
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className={styles.mobileBrand}>Beembai Merchant</span>
        </div>

        {/* Backdrop Overlay for mobile drawer */}
        <div className={styles.backdrop} onClick={() => setIsMobileOpen(false)} />

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {/* Logo Header */}
          <div className={styles.sidebarLogo}>
            <div className={styles.sidebarLogoMark}>M</div>
            <div className={styles.sidebarLogoText}>
              <span className={styles.sidebarBrand}>Beembai</span>
              <span className={styles.sidebarSubBrand}>Merchant Portal</span>
            </div>
          </div>

          {/* Store Selector Context Dropdown */}
          {stores && stores.length > 0 && (
            <div className={styles.contextSelectorWrapper}>
              <label className={styles.contextLabel}>Active Store</label>
              <select
                className={styles.contextSelect}
                value={activeStoreId || "all"}
                onChange={(e) => handleStoreChange(e.target.value === "all" ? null : e.target.value)}
              >
                <option value="all">🌐 All Stores (Unified)</option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.status === "pending" ? "⏳ " : ""}
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Navigation Links */}
          <nav className={styles.sidebarNav}>
            <span className={styles.sidebarSection}>Console</span>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.sidebarLink} ${isActive(item.href, item.exact) ? styles.active : ""}`}
                onClick={() => setIsMobileOpen(false)}
              >
                <span className={styles.sidebarLinkIcon}>{item.icon}</span>
                <span className={styles.sidebarLinkText}>{item.label}</span>
              </Link>
            ))}
            <div className={styles.sidebarDivider} />
            <Link
              href="/"
              className={styles.sidebarLink}
              onClick={() => setIsMobileOpen(false)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.sidebarLinkIcon}>🏠</span>
              <span className={styles.sidebarLinkText}>Back to Storefront</span>
            </Link>
          </nav>

          {/* Sidebar Footer */}
          <div className={styles.sidebarFooter}>
            <div className={styles.sidebarUser}>
              <div className={styles.sidebarAvatar}>
                {viewer?.image ? (
                  <img src={viewer.image} alt="" />
                ) : (
                  getInitials(viewer?.name)
                )}
              </div>
              <div className={styles.sidebarUserInfo}>
                <span className={styles.sidebarUserName}>{viewer?.name || "Merchant"}</span>
                <span className={styles.sidebarUserRole}>Store Partner</span>
              </div>
            </div>
            <button
              className={styles.signOutBtn}
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              🚪 {isSigningOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className={styles.sellerMain}>
          {children}
        </div>
      </div>
    </SellerStoreContext.Provider>
  );
}
