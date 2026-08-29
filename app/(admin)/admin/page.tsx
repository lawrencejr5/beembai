"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "./admin.module.css";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

function StatCard({
  icon,
  label,
  value,
  color,
  href,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: "green" | "amber" | "red" | "blue" | "purple";
  href?: string;
}) {
  const card = (
    <div className={`${styles.statCard} ${styles[color]}`}>
      <div className={styles.statCardContent}>
        <div className={styles.statCardValue}>{value}</div>
        <div className={styles.statCardLabel}>{label}</div>
      </div>
      <div className={`${styles.statCardIcon} ${styles[color]}`}>{icon}</div>
    </div>
  );
  return href ? (
    <Link href={href} style={{ textDecoration: "none" }}>
      {card}
    </Link>
  ) : (
    card
  );
}

export default function AdminDashboard() {
  const stats = useQuery(api.admin.getDashboardStats);
  const activity = useQuery(api.admin.getRecentActivity);

  if (!stats) {
    return (
      <div className={styles.adminContent}>
        <div className={styles.statsGrid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.statCard} style={{ height: 130 }}>
              <div
                className={`${styles.skeleton}`}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  marginBottom: 12,
                }}
              />
              <div
                className={styles.skeleton}
                style={{ width: 60, height: 32, marginBottom: 8 }}
              />
              <div
                className={styles.skeleton}
                style={{ width: 100, height: 14 }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContent}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Platform overview and key metrics
          </p>
        </div>
        <div>
          <Link
            href="/admin/beembai"
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}
            id="go-to-beembai-console-btn"
          >
            🏪 Beembai Store Console
            {stats && (stats as any).newBeembaiOrders > 0 && (
              <span
                style={{
                  background: "#a63e26",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 800,
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {(stats as any).newBeembaiOrders}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Pending Alerts */}
      {(stats.pendingStores > 0 || stats.pendingProducts > 0) && (
        <div
          style={{
            background: "rgba(201, 147, 32, 0.08)",
            border: "1px solid rgba(201, 147, 32, 0.25)",
            borderRadius: 12,
            padding: "14px 20px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "#8a6200", fontSize: 14 }}>
              Action Required
            </div>
            <div style={{ color: "#6b6540", fontSize: 13 }}>
              {stats.pendingStores > 0 && (
                <span>
                  {stats.pendingStores} seller application
                  {stats.pendingStores !== 1 ? "s" : ""} awaiting review.{" "}
                </span>
              )}
              {stats.pendingProducts > 0 && (
                <span>
                  {stats.pendingProducts} product
                  {stats.pendingProducts !== 1 ? "s" : ""} pending approval.
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {stats.pendingStores > 0 && (
              <Link
                href="/admin/stores?tab=pending"
                className={`${styles.btn} ${styles.btnSm}`}
                style={{
                  background: "rgba(201, 147, 32, 0.15)",
                  color: "#8a6200",
                  border: "1px solid rgba(201, 147, 32, 0.3)",
                }}
              >
                Review Sellers →
              </Link>
            )}
            {stats.pendingProducts > 0 && (
              <Link
                href="/admin/products?tab=pending"
                className={`${styles.btn} ${styles.btnSm}`}
                style={{
                  background: "rgba(201, 147, 32, 0.15)",
                  color: "#8a6200",
                  border: "1px solid rgba(201, 147, 32, 0.3)",
                }}
              >
                Review Products →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Revenue highlight */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a1900 0%, #2d2c00 100%)",
          borderRadius: 16,
          padding: "28px 32px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -20,
            top: -20,
            width: 180,
            height: 180,
            background: "rgba(200, 184, 64, 0.06)",
            borderRadius: "50%",
          }}
        />
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,248,234,0.5)",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            Total Platform Revenue
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: "#fff8ea",
              letterSpacing: "-2px",
              marginTop: 4,
            }}
          >
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,248,234,0.5)",
              marginTop: 6,
            }}
          >
            from {stats.paidOrders} paid order
            {stats.paidOrders !== 1 ? "s" : ""}
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "Total Orders", value: stats.totalOrders },
            { label: "Pending Orders", value: stats.pendingOrders },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#c8b840" }}>
                {item.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,248,234,0.5)",
                  marginTop: 2,
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat Grid */}
      <div className={styles.statsGrid}>
        <StatCard
          icon="👥"
          label="Total Users"
          value={stats.totalUsers}
          color="blue"
          href="/admin/users"
        />
        <StatCard
          icon="🏪"
          label="Total Sellers"
          value={stats.totalStores}
          color="green"
          href="/admin/stores"
        />
        <StatCard
          icon="⏳"
          label="Pending Sellers"
          value={stats.pendingStores}
          color="amber"
          href="/admin/stores?tab=pending"
        />
        <StatCard
          icon="✅"
          label="Active Sellers"
          value={stats.approvedStores}
          color="green"
          href="/admin/stores?tab=approved"
        />
        <StatCard
          icon="📦"
          label="Total Products"
          value={stats.totalProducts}
          color="purple"
          href="/admin/products"
        />
        <StatCard
          icon="⏳"
          label="Pending Products"
          value={stats.pendingProducts}
          color="amber"
          href="/admin/products?tab=pending"
        />
        <StatCard
          icon="⭐"
          label="Featured Products"
          value={stats.featuredProducts}
          color="amber"
          href="/admin/products"
        />
        <StatCard
          icon="📢"
          label="Sponsored Products"
          value={stats.sponsoredProducts}
          color="blue"
          href="/admin/products"
        />
      </div>

      {/* Recent Activity */}
      {activity && (
        <div className={styles.recentGrid}>
          {/* Recent Orders */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}>
              <h3 className={styles.adminCardTitle}>Recent Orders</h3>
              <Link
                href="/admin/orders"
                className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
              >
                View all
              </Link>
            </div>
            <div className={styles.tableWrapper}>
              {activity.recentOrders.length === 0 ? (
                <div
                  className={styles.emptyState}
                  style={{ padding: "32px 20px" }}
                >
                  <p className={styles.textMuted}>No orders yet</p>
                </div>
              ) : (
                activity.recentOrders.map((order) => (
                  <Link
                    href={`/admin/orders/${order._id}`}
                    key={order._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 20px",
                      borderBottom: "1px solid #f0ebe0",
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#282600",
                        }}
                      >
                        #{order._id.slice(-6).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b6540" }}>
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </div>
                    <span
                      className={`${styles.badge} ${styles[order.paymentStatus]}`}
                    >
                      {order.paymentStatus}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Sellers */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}>
              <h3 className={styles.adminCardTitle}>Recent Sellers</h3>
              <Link
                href="/admin/stores"
                className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
              >
                View all
              </Link>
            </div>
            {activity.recentStores.length === 0 ? (
              <div
                className={styles.emptyState}
                style={{ padding: "32px 20px" }}
              >
                <p className={styles.textMuted}>No sellers yet</p>
              </div>
            ) : (
              activity.recentStores.map((store) => (
                <Link
                  href={`/admin/stores/${store._id}`}
                  key={store._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 20px",
                    borderBottom: "1px solid #f0ebe0",
                    textDecoration: "none",
                  }}
                >
                  {store.logo ? (
                    <img
                      src={store.logo}
                      alt=""
                      className={styles.storeLogoThumb}
                    />
                  ) : (
                    <div
                      className={styles.storeLogoThumb}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#636d21",
                      }}
                    >
                      {store.name[0]}
                    </div>
                  )}
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#282600",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {store.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b6540" }}>
                      {store.category}
                    </div>
                  </div>
                  <span
                    className={`${styles.badge} ${styles[store.status ?? "approved"]}`}
                  >
                    {store.status ?? "approved"}
                  </span>
                </Link>
              ))
            )}
          </div>

          {/* Recent Products */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}>
              <h3 className={styles.adminCardTitle}>Recent Products</h3>
              <Link
                href="/admin/products"
                className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
              >
                View all
              </Link>
            </div>
            {activity.recentProducts.length === 0 ? (
              <div
                className={styles.emptyState}
                style={{ padding: "32px 20px" }}
              >
                <p className={styles.textMuted}>No products yet</p>
              </div>
            ) : (
              activity.recentProducts.map((product) => (
                <Link
                  href={`/admin/products/${product._id}`}
                  key={product._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 20px",
                    borderBottom: "1px solid #f0ebe0",
                    textDecoration: "none",
                  }}
                >
                  <img
                    src={product.image}
                    alt=""
                    className={styles.productThumb}
                  />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#282600",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {product.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b6540" }}>
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                  <span
                    className={`${styles.badge} ${styles[product.status ?? "approved"]}`}
                  >
                    {product.status ?? "active"}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
