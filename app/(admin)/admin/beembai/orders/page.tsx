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
  });
}

type OrderStatus = "placed" | "processing" | "shipped" | "delivered" | "cancelled" | "all";
type PaymentStatus = "paid" | "unpaid" | "failed" | "all";

const OrderRow = React.memo(({ order }: { order: any }) => (
  <tr>
    <td>
      <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#636d21" }}>
        #{order._id.slice(-8).toUpperCase()}
      </span>
    </td>
    <td>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{order.buyerName}</div>
      <div style={{ fontSize: 11, color: "#6b6540" }}>{order.buyerEmail}</div>
    </td>
    <td style={{ fontSize: 13, fontWeight: 600 }}>{order.items.length}</td>
    <td style={{ fontSize: 13, fontWeight: 700 }}>{formatCurrency(order.totalAmount)}</td>
    <td><span className={`${styles.badge} ${styles[order.paymentStatus]}`}>{order.paymentStatus}</span></td>
    <td><span className={`${styles.badge} ${styles[order.status]}`}>{order.status}</span></td>
    <td style={{ fontSize: 12, color: "#6b6540" }}>{formatDate(order.createdAt)}</td>
    <td>
      <Link href={`/admin/beembai/orders/${order._id}`} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}>
        View
      </Link>
    </td>
  </tr>
));
OrderRow.displayName = "OrderRow";

export default function BeembaiOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus>("all");
  const [search, setSearch] = useState("");

  const { results: orders, status, loadMore } = usePaginatedQuery(
    api.beembaiStore.getBeembaiStoreOrders,
    { status: statusFilter, paymentStatus: paymentFilter },
    { initialNumItems: 10 }
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status !== "CanLoadMore") return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(10); },
      { threshold: 0.1 }
    );
    const el = loadMoreRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
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

  return (
    <div className={styles.adminContent}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Orders (Beembai) 🇺🇸</h1>
          <p className={styles.pageSubtitle}>US import orders fulfilled by the Beembai Official Store</p>
        </div>
      </div>

      <div className={styles.adminCard}>
        <div className={styles.adminCardHeader}>
          <div className={styles.filterRow}>
            <div className={styles.searchBox}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
              <input type="text" className={styles.searchInput} placeholder="Search orders, buyers..." value={search} onChange={(e) => setSearch(e.target.value)} id="beembai-orders-search" />
            </div>
            <select className={styles.selectFilter} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus)} id="beembai-status-filter">
              {(["all","placed","processing","shipped","delivered","cancelled"] as OrderStatus[]).map((v) => (
                <option key={v} value={v}>{v === "all" ? "All Statuses" : v.charAt(0).toUpperCase() + v.slice(1)}</option>
              ))}
            </select>
            <select className={styles.selectFilter} value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus)} id="beembai-payment-filter">
              {(["all","paid","unpaid","failed"] as PaymentStatus[]).map((v) => (
                <option key={v} value={v}>{v === "all" ? "All Payments" : v.charAt(0).toUpperCase() + v.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {status === "LoadingFirstPage" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 24px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div className={styles.skeleton} style={{ width: 80, height: 16 }} />
                  <div style={{ flex: 1 }}><div className={styles.skeleton} style={{ width: "40%", height: 14 }} /></div>
                  <div className={styles.skeleton} style={{ width: 60, height: 20, borderRadius: 100 }} />
                  <div className={styles.skeleton} style={{ width: 80, height: 32, borderRadius: 8 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🇺🇸</div>
              <h3 className={styles.emptyStateTitle}>No import orders yet</h3>
              <p className={styles.emptyStateText}>Import orders from Buy From Abroad will appear here.</p>
            </div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Order ID</th><th>Buyer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => <OrderRow key={order._id} order={order} />)}
              </tbody>
            </table>
          )}
          {status === "CanLoadMore" && <div ref={loadMoreRef} style={{ height: 20, margin: "16px 0" }} />}
          {status === "LoadingMore" && (
            <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
              <div className={styles.skeleton} style={{ width: 120, height: 16, borderRadius: 4 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

