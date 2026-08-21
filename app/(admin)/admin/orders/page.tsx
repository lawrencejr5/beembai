"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
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

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus>("all");
  const [search, setSearch] = useState("");

  const orders = useQuery(api.admin.getAllOrdersAdmin, {
    status: statusFilter,
    paymentStatus: paymentFilter,
  });

  const filtered = (orders ?? []).filter((o) =>
    o._id.toLowerCase().includes(search.toLowerCase()) ||
    o.buyerName.toLowerCase().includes(search.toLowerCase()) ||
    o.buyerEmail.toLowerCase().includes(search.toLowerCase())
  );

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
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {!orders ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b6540" }}>Loading…</div>
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
                  <tr key={order._id}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#636d21" }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </span>
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
