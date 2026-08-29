"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";
import AdminGuard from "./AdminGuard";

const navItems = [
  {
    section: "Overview",
    links: [
      { href: "/admin", label: "Dashboard", icon: "🏠", exact: true as const },
    ],
  },
  {
    section: "Marketplace",
    links: [
      {
        href: "/admin/stores",
        label: "Sellers",
        icon: "🏪",
        exact: false as const,
      },
      {
        href: "/admin/products",
        label: "Products (General)",
        icon: "📦",
        exact: false as const,
      },
      {
        href: "/admin/orders",
        label: "Orders (General)",
        icon: "🛒",
        exact: false as const,
      },
      {
        href: "/admin/categories",
        label: "Categories",
        icon: "🏷️",
        exact: false as const,
      },
    ],
  },

  {
    section: "Beembai Store",
    links: [
      {
        href: "/admin/beembai",
        label: "Overview",
        icon: "🏪",
        exact: true as const,
      },
      {
        href: "/admin/beembai/orders",
        label: "Orders (Beembai)",
        icon: "🛒",
        exact: false as const,
      },
      {
        href: "/admin/beembai/products",
        label: "Products (Beembai)",
        icon: "🛍️",
        exact: false as const,
      },
      {
        href: "/admin/beembai/settings",
        label: "Store Settings",
        icon: "⚙️",
        exact: false as const,
      },
    ],
  },
  {
    section: "Platform",
    links: [
      {
        href: "/admin/users",
        label: "Users",
        icon: "👥",
        exact: false as const,
      },
    ],
  },
];

function Sidebar({
  isCollapsed,
  toggleCollapse,
  isMobile,
  onClose,
}: {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobile: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const viewer = useQuery(api.users.viewer);
  const stats = useQuery(api.admin.getDashboardStats);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getBadge = (href: string) => {
    if (!stats) return null;
    if (href === "/admin/stores" && stats.pendingStores > 0) {
      return stats.pendingStores;
    }
    if (href === "/admin/products" && stats.pendingProducts > 0) {
      return stats.pendingProducts;
    }
    if (href === "/admin/beembai/orders" && (stats as any).newBeembaiOrders > 0) {
      return (stats as any).newBeembaiOrders;
    }
    return null;
  };

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.sidebarLogo}>
        <div className={styles.sidebarLogoMark}>B</div>
        <div className={styles.sidebarLogoText}>
          <span className={styles.sidebarBrand}>Beembai</span>
          <span className={styles.sidebarSubBrand}>Admin Panel</span>
        </div>
        <button
          onClick={isMobile ? onClose : toggleCollapse}
          className={styles.collapseToggleBtn}
          title={
            isMobile
              ? "Close Menu"
              : isCollapsed
                ? "Expand Sidebar"
                : "Collapse Sidebar"
          }
        >
          {isMobile ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isCollapsed ? "rotate(180deg)" : "none",
                transition: "transform 0.3s ease",
              }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <path d="M16 15l-3-3 3-3" />
            </svg>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className={styles.sidebarNav}>
        {navItems.map((group) => (
          <div key={group.section}>
            <div className={styles.sidebarSection}>{group.section}</div>
            {group.links.map((link) => {
              const badge = getBadge(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.sidebarLink} ${isActive(link.href, link.exact) ? styles.active : ""}`}
                  title={isCollapsed ? link.label : undefined}
                  onClick={() => {
                    if (isMobile) onClose();
                  }}
                >
                  <span className={styles.sidebarLinkIcon}>{link.icon}</span>
                  <span className={styles.sidebarLinkText}>{link.label}</span>
                  {badge !== null && (
                    <span
                      className={`${styles.sidebarBadge} ${styles.pending}`}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
        <div className={styles.sidebarDivider} />
        <Link
          href="/"
          className={styles.sidebarLink}
          title={isCollapsed ? "Back to Storefront" : undefined}
          onClick={() => {
            if (isMobile) onClose();
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.sidebarLinkIcon}>🌍</span>
          <span className={styles.sidebarLinkText}>Back to Storefront</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        <div className={styles.sidebarUser}>
          <div className={styles.sidebarAvatar}>
            {viewer?.image ? (
              <img
                src={viewer.image}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              getInitials(viewer?.name)
            )}
          </div>
          <div className={styles.sidebarUserInfo}>
            <span className={styles.sidebarUserName}>
              {viewer?.name ?? "Admin"}
            </span>
            <span className={styles.sidebarUserRole}>Administrator</span>
          </div>
        </div>
        <button
          className={styles.signOutBtn}
          onClick={handleSignOut}
          id="admin-sign-out"
          title={isCollapsed ? "Sign out" : undefined}
        >
          <span>🚪</span>
          <span className={styles.signOutText}> Sign out</span>
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ensureStore = useMutation(api.beembaiStore.ensureBeembaiStore);

  useEffect(() => {
    // Ensure the Beembai Official Store exists before any admin work
    void ensureStore();
  }, [ensureStore]);

  useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  };

  return (
    <AdminGuard>
      <div
        className={`${styles.adminRoot} ${isCollapsed ? styles.collapsed : ""} ${
          isMobileOpen ? styles.mobileOpen : ""
        }`}
      >
        {/* Mobile Top Bar */}
        <div className={styles.mobileTopBar}>
          <button
            className={styles.menuToggleBtn}
            onClick={() => setIsMobileOpen(true)}
            id="mobile-menu-toggle"
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
          <span className={styles.mobileBrand}>Beembai Admin</span>
        </div>

        {/* Backdrop Overlay */}
        <div
          className={styles.backdrop}
          onClick={() => setIsMobileOpen(false)}
        />

        <Sidebar
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
          isMobile={isMobile}
          onClose={() => setIsMobileOpen(false)}
        />
        <div className={styles.adminMain}>{children}</div>
      </div>
    </AdminGuard>
  );
}
