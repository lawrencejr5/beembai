"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "../admin.module.css";
import Link from "next/link";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminUsersPage() {
  const users = useQuery(api.admin.getAllUsers);
  const setAdminRole = useMutation(api.admin.setUserAdminRole);
  const setBanned = useMutation(api.admin.setUserBanned);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "admin" | "seller" | "banned">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = (users ?? []).filter((u) => {
    const matchesSearch =
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "admin" && u.isAdmin) ||
      (filter === "seller" && u.hasStore) ||
      (filter === "banned" && u.isBanned);

    return matchesSearch && matchesFilter;
  });

  const handleToggleAdmin = async (userId: Id<"users">, current: boolean) => {
    setActionLoading(`admin-${userId}`);
    await setAdminRole({ userId, isAdmin: !current });
    setActionLoading(null);
  };

  const handleToggleBan = async (userId: Id<"users">, current: boolean) => {
    setActionLoading(`ban-${userId}`);
    await setBanned({ userId, isBanned: !current });
    setActionLoading(null);
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className={styles.adminContent}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Users</h1>
          <p className={styles.pageSubtitle}>Manage platform users, roles, and access</p>
        </div>
        {users && (
          <div style={{ fontSize: 14, color: "#6b6540", fontWeight: 500 }}>
            {users.length} total users
          </div>
        )}
      </div>

      <div className={styles.adminCard}>
        <div className={styles.adminCardHeader}>
          <div className={styles.filterRow}>
            <div className={styles.searchBox}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="users-search"
              />
            </div>
            <div className={styles.tabBar}>
              {(["all", "admin", "seller", "banned"] as const).map((f) => (
                <button
                  key={f}
                  className={`${styles.tabBtn} ${filter === f ? styles.activeTab : ""}`}
                  onClick={() => setFilter(f)}
                  id={`user-filter-${f}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {!users ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b6540" }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>👥</div>
              <h3 className={styles.emptyStateTitle}>No users found</h3>
              <p className={styles.emptyStateText}>Try a different search or filter</p>
            </div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Joined</th>
                  <th>Orders</th>
                  <th>Seller</th>
                  <th>Badges</th>
                  <th>Admin</th>
                  <th>Banned</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user._id} style={{ opacity: user.isBanned ? 0.6 : 1 }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {user.image ? (
                          <img src={user.image} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "1px solid #e8e2d0" }} />
                        ) : (
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: "linear-gradient(135deg, #636d21, #3e5c1e)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: 13, color: "#fff8ea", flexShrink: 0
                          }}>
                            {getInitials(user.name)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#282600" }}>{user.name ?? "—"}</div>
                          <div style={{ fontSize: 12, color: "#6b6540" }}>{user.email ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: "#6b6540" }}>{formatDate(user._creationTime)}</td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{user.orderCount}</td>
                    <td>
                      {user.hasStore ? (
                        <div>
                          <span className={`${styles.badge} ${styles[user.storeStatus ?? "approved"]}`} style={{ fontSize: 11 }}>
                            {user.storeName ?? "Seller"}
                          </span>
                        </div>
                      ) : (
                        <span className={styles.textMuted} style={{ fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {user.isAdmin && <span className={`${styles.badge} ${styles.admin}`} style={{ fontSize: 10 }}>Admin</span>}
                        {user.isBanned && <span className={`${styles.badge} ${styles.rejected}`} style={{ fontSize: 10 }}>Banned</span>}
                      </div>
                    </td>
                    <td>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={!!user.isAdmin}
                          onChange={() => handleToggleAdmin(user._id, !!user.isAdmin)}
                          disabled={actionLoading === `admin-${user._id}`}
                          id={`admin-toggle-${user._id}`}
                        />
                        <span className={styles.toggleSlider} />
                      </label>
                    </td>
                    <td>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={!!user.isBanned}
                          onChange={() => handleToggleBan(user._id, !!user.isBanned)}
                          disabled={actionLoading === `ban-${user._id}`}
                          id={`ban-toggle-${user._id}`}
                        />
                        <span className={styles.toggleSlider} />
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
