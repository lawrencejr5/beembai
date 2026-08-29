"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "../admin.module.css";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

type OrderStatus = "placed" | "processing" | "shipped" | "delivered" | "cancelled" | "all";
type PaymentStatus = "paid" | "unpaid" | "failed" | "all";

const OrderRow = React.memo(({
  order,
}: {
  order: any;
}) => {
  return (
    <tr>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#636d21" }}>
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
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
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
      <td style={{ fontSize: 13, fontWeight: 600, color: "#282600" }}>{order.items.length}</td>
      <td style={{ fontSize: 13, fontWeight: 700 }}>{formatCurrency(order.totalAmount)}</td>
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
      <td style={{ fontSize: 12, color: "#6b6540" }}>{formatDate(order.createdAt)}</td>
      <td>
        <Link href={`/admin/orders/${order._id}`} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}>
          View
        </Link>
      </td>
    </tr>
  );
});

OrderRow.displayName = "OrderRow";

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "regular" | "import">("all");
  const [search, setSearch] = useState("");

  const { results: orders, status, loadMore } = usePaginatedQuery(
    api.admin.getAllOrdersAdmin,
    {
      status: statusFilter,
      paymentStatus: paymentFilter,
      orderType: typeFilter,
    },
    { initialNumItems: 10 }
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "CanLoadMore") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore(10);
        }
      },
      { threshold: 0.1 }
    );
    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [status, loadMore]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return orders ?? [];
    return (orders ?? []).filter((o) =>
      o._id.toLowerCase().includes(term) ||
      o.buyerName.toLowerCase().includes(term) ||
      o.buyerEmail.toLowerCase().includes(term)
    );
  }, [orders, search]);

  const statusOptions: { label: string; value: OrderStatus }[] = [
    { label: "All Statuses", value: "all" },
    { label: "Placed", value: "placed" },
    { label: "Processing", value: "processing" },
    { label: "Shipped", value: "shipped" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const paymentOptions: { label: string; value: PaymentStatus }[] = [
    { label: "All Payments", value: "all" },
    { label: "Paid", value: "paid" },
    { label: "Unpaid", value: "unpaid" },
    { label: "Failed", value: "failed" },
  ];

  const typeOptions = [
    { label: "All Types", value: "all" },
    { label: "Regular Orders", value: "regular" },
    { label: "US Imports", value: "import" },
  ];

  return (
    <div className={styles.adminContent}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Orders</h1>
          <p className={styles.pageSubtitle}>View and manage all platform orders</p>
        </div>
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
                placeholder="Search orders, buyers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="orders-search"
              />
            </div>
            <select className={styles.selectFilter} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus)} id="order-status-filter">
              {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select className={styles.selectFilter} value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus)} id="order-payment-filter">
              {paymentOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select className={styles.selectFilter} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} id="order-type-filter">
              {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {status === "LoadingFirstPage" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 24px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div className={styles.skeleton} style={{ width: 80, height: 16 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className={styles.skeleton} style={{ width: "30%", height: 14 }} />
                    <div className={styles.skeleton} style={{ width: "15%", height: 10 }} />
                  </div>
                  <div className={styles.skeleton} style={{ width: 40, height: 14 }} />
                  <div className={styles.skeleton} style={{ width: 80, height: 14 }} />
                  <div className={styles.skeleton} style={{ width: 60, height: 20, borderRadius: 100 }} />
                  <div className={styles.skeleton} style={{ width: 60, height: 20, borderRadius: 100 }} />
                  <div className={styles.skeleton} style={{ width: 80, height: 14 }} />
                  <div className={styles.skeleton} style={{ width: 80, height: 32, borderRadius: 8 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🛒</div>
              <h3 className={styles.emptyStateTitle}>No orders found</h3>
              <p className={styles.emptyStateText}>Try adjusting filters or search</p>
            </div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Buyer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <OrderRow
                    key={order._id}
                    order={order}
                  />
                ))}
              </tbody>
            </table>
          )}
          {/* Infinite Scroll Trigger */}
          {status === "CanLoadMore" && (
            <div ref={loadMoreRef} style={{ height: 20, margin: "16px 0" }} />
          )}
          {status === "LoadingMore" && (
            <div style={{ display: "flex", justifyContent: "center", padding: "16px", color: "#6b6540" }}>
              <div className={styles.skeleton} style={{ width: 120, height: 16, borderRadius: 4 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
