"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
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
      { href: "/admin/stores", label: "Sellers", icon: "🏪", exact: false as const },
      { href: "/admin/products", label: "Products", icon: "📦", exact: false as const },
      { href: "/admin/categories", label: "Categories", icon: "🏷️", exact: false as const },
    ],
  },
  {
    section: "Commerce",
    links: [
      { href: "/admin/orders", label: "Orders", icon: "🛒", exact: false as const },
    ],
  },
  {
    section: "Platform",
    links: [
      { href: "/admin/users", label: "Users", icon: "👥", exact: false as const },
    ],
  },
];

function Sidebar() {
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
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getBadge = (href: string) => {
    if (!stats) return null;
    if (href === "/admin/stores" && stats.pendingStores > 0) {
      return stats.pendingStores;
    }
    if (href === "/admin/products" && stats.pendingProducts > 0) {
      return stats.pendingProducts;
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
                >
                  <span className={styles.sidebarLinkIcon}>{link.icon}</span>
                  {link.label}
                  {badge !== null && (
                    <span className={`${styles.sidebarBadge} ${styles.pending}`}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        <div className={styles.sidebarUser}>
          <div className={styles.sidebarAvatar}>
            {viewer?.image ? (
              <img src={viewer.image} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              getInitials(viewer?.name)
            )}
          </div>
          <div className={styles.sidebarUserInfo}>
            <span className={styles.sidebarUserName}>{viewer?.name ?? "Admin"}</span>
            <span className={styles.sidebarUserRole}>Administrator</span>
          </div>
        </div>
        <button className={styles.signOutBtn} onClick={handleSignOut} id="admin-sign-out">
          <span>🚪</span> Sign out
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className={styles.adminRoot}>
        <Sidebar />
        <div className={styles.adminMain}>
          {children}
        </div>
      </div>
    </AdminGuard>
  );
}
