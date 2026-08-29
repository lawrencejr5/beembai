"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "../../admin.module.css";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type OrderStatus =
  | "placed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "all";
type PaymentStatus = "paid" | "unpaid" | "failed" | "all";

// Status colour map matching sell dashboard style
const STATUS_ROW_BG: Record<string, string> = {
  placed: "rgba(234, 179, 8, 0.06)",
  processing: "rgba(59, 130, 246, 0.05)",
  shipped: "rgba(99, 102, 241, 0.05)",
  delivered: "rgba(34, 197, 94, 0.06)",
  cancelled: "rgba(239, 68, 68, 0.05)",
};

const OrderRow = React.memo(({ order }: { order: any }) => {
  const rowBg = STATUS_ROW_BG[order.status] ?? "transparent";

  return (
    <tr style={{ backgroundColor: rowBg }}>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: 700,
              color: "#636d21",
            }}
          >
            #{order._id.slice(-8).toUpperCase()}
          </span>
          {order.isImportOrder && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                padding: "2px 6px",
                borderRadius: 4,
              }}
              title="US Import Order"
            >
              🇺🇸 Import
            </span>
          )}
        </div>
      </td>
      <td>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{order.buyerName}</div>
        <div style={{ fontSize: 11, color: "#6b6540" }}>{order.buyerEmail}</div>
      </td>
      <td style={{ fontSize: 13 }}>
        {order.items.reduce((s: number, i: any) => s + i.quantity, 0)} items
      </td>
      <td style={{ fontSize: 13, fontWeight: 700 }}>
        {formatCurrency(order.totalAmount)}
      </td>
      <td>
        <span className={`${styles.badge} ${styles[order.paymentStatus]}`}>
          {order.paymentStatus}
        </span>
      </td>
      <td>
        <span className={`${styles.badge} ${styles[order.status]}`}>
          {order.status}
        </span>
      </td>
      <td style={{ fontSize: 12, color: "#6b6540" }}>
        {formatDate(order.createdAt)}
      </td>
      <td>
        <Link
          href={`/admin/beembai/orders/${order._id}`}
          className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
          style={{ textDecoration: "none" }}
        >
          Manage →
        </Link>
      </td>
    </tr>
  );
});
OrderRow.displayName = "OrderRow";

export default function BeembaiOrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus>("all");
  const [search, setSearch] = useState("");

  const {
    results: orders,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.beembaiStore.getBeembaiStoreOrders,
    { status: activeTab, paymentStatus: paymentFilter },
    { initialNumItems: 15 },
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status !== "CanLoadMore") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore(15);
      },
      { threshold: 0.1 },
    );
    const el = loadMoreRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [status, loadMore]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return orders ?? [];
    return (orders ?? []).filter(
      (o) =>
        o._id.toLowerCase().includes(term) ||
        o.buyerName.toLowerCase().includes(term) ||
        o.buyerEmail.toLowerCase().includes(term),
    );
  }, [orders, search]);

  const tabs: { value: OrderStatus; label: string }[] = [
    { value: "all", label: "All Orders" },
    { value: "placed", label: "New / Placed" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const paymentOptions: { value: PaymentStatus; label: string }[] = [
    { value: "all", label: "All Payments" },
    { value: "paid", label: "Paid" },
    { value: "unpaid", label: "Unpaid" },
    { value: "failed", label: "Failed" },
  ];

  return (
    <div className={styles.adminContent}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Orders (Beembai)</h1>
          <p className={styles.pageSubtitle}>
            Manage and fulfil orders from the Beembai Official Store — including
            local listings and international imports.
          </p>
        </div>
      </div>

      <div className={styles.adminCard} style={{ marginBottom: 20 }}>
        <div className={styles.adminCardHeader}>
          <div className={styles.filterRow}>
            <div className={styles.searchBox} style={{ flex: 1 }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by Order ID, buyer name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="beembai-orders-search"
              />
            </div>
            <select
              className={styles.selectFilter}
              value={paymentFilter}
              onChange={(e) =>
                setPaymentFilter(e.target.value as PaymentStatus)
              }
              id="beembai-payment-filter"
            >
              {paymentOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Status Tabs — mirroring the sell dashboard */}
      <div className={styles.tabBar} style={{ marginBottom: 16 }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.tabBtn} ${activeTab === tab.value ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(tab.value)}
            id={`beembai-orders-tab-${tab.value}`}
          >
            {tab.label}
            {/* Show placed count badge on the "New / Placed" tab */}
            {tab.value === "placed" &&
              orders &&
              orders.filter((o) => o.status === "placed").length > 0 && (
                <span
                  className={`${styles.tabCount} ${styles.pending}`}
                  style={{ marginLeft: 6 }}
                >
                  {orders.filter((o) => o.status === "placed").length}
                </span>
              )}
          </button>
        ))}
      </div>

      <div className={styles.adminCard}>
        <div className={styles.tableWrapper}>
          {status === "LoadingFirstPage" ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                padding: "20px 24px",
              }}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 16, alignItems: "center" }}
                >
                  <div
                    className={styles.skeleton}
                    style={{ width: 80, height: 16 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      className={styles.skeleton}
                      style={{ width: "40%", height: 14 }}
                    />
                  </div>
                  <div
                    className={styles.skeleton}
                    style={{ width: 60, height: 20, borderRadius: 100 }}
                  />
                  <div
                    className={styles.skeleton}
                    style={{ width: 80, height: 32, borderRadius: 8 }}
                  />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🛒</div>
              <h3 className={styles.emptyStateTitle}>No orders found</h3>
              <p className={styles.emptyStateText}>
                {search || activeTab !== "all"
                  ? "Try adjusting your filters or search query"
                  : "Orders placed on the Beembai store will appear here"}
              </p>
            </div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Shipping Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <OrderRow key={order._id} order={order} />
                ))}
              </tbody>
            </table>
          )}
          {status === "CanLoadMore" && (
            <div ref={loadMoreRef} style={{ height: 20, margin: "16px 0" }} />
          )}
          {status === "LoadingMore" && (
            <div
              style={{ display: "flex", justifyContent: "center", padding: 16 }}
            >
              <div
                className={styles.skeleton}
                style={{ width: 120, height: 16, borderRadius: 4 }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
