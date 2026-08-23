"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSellerStore } from "../layout";
import styles from "../seller.module.css";

// Formatter Helpers
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function SellerOrdersPage() {
  const { activeStoreId } = useSellerStore();
  const [activeTab, setActiveTab] = useState<"all" | "placed" | "processing" | "shipped" | "delivered" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch orders based on active store context
  const allStoresOrders = useQuery(
    api.orders.getSellerOrdersAllStores,
    activeStoreId === null ? {} : "skip"
  );

  const singleStoreOrders = useQuery(
    api.orders.getOrdersForStore,
    activeStoreId !== null ? { storeId: activeStoreId as any } : "skip"
  );

  const rawOrders = activeStoreId === null ? allStoresOrders : singleStoreOrders;

  const filteredOrders = useMemo(() => {
    if (!rawOrders) return [];

    return rawOrders.filter((order) => {
      // 1. Filter by shipping status tab
      if (activeTab !== "all" && order.status !== activeTab) return false;

      // 2. Filter by search query (Order ID or Buyer Name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = order._id.toLowerCase().includes(query);
        
        // Safety check if buyerName exists or try mapping from order.address.fullName
        const buyerName = order.address?.fullName?.toLowerCase() || "";
        const matchesBuyer = buyerName.includes(query);

        return matchesId || matchesBuyer;
      }

      return true;
    });
  }, [rawOrders, activeTab, searchQuery]);

  return (
    <div className={styles.sellerContent}>
      
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Merchant Orders</h1>
          <p className={styles.pageSubtitle}>Track shipment progress, view invoices, and fulfill customers' requests</p>
        </div>
      </div>

      {/* Search Input Box */}
      <div className={styles.sellerCard} style={{ marginBottom: 20 }}>
        <div className={styles.sellerCardBody} style={{ padding: "16px 20px" }}>
          <div className={styles.filterRow}>
            <div className={styles.searchBox} style={{ minWidth: "100%" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search orders by Order ID or Buyer Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabBar}>
        {(["all", "placed", "processing", "shipped", "delivered", "cancelled"] as const).map((tab) => {
          const tabLabel = tab.charAt(0).toUpperCase() + tab.slice(1);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ""}`}
            >
              {tabLabel}
            </button>
          );
        })}
      </div>

      {/* Orders List Table */}
      <div className={styles.sellerCard}>
        {rawOrders === undefined ? (
          <div className={styles.sellerCardBody}>
            <div className={styles.skeleton} style={{ height: 160 }} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className={styles.sellerCardBody} style={{ textAlign: "center", padding: "60px 20px" }}>
            <span style={{ fontSize: 40 }}>🛒</span>
            <p style={{ color: "var(--seller-text-secondary)", marginTop: 12 }}>
              {searchQuery || activeTab !== "all"
                ? "No merchant orders match your search query or filters"
                : "No customer orders have been received yet"
              }
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.sellerTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Items Included</th>
                  <th>Fulfillment Value</th>
                  <th>Shipping Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                      <Link href={`/sell/orders/${order._id}`} style={{ color: "var(--seller-accent)", textDecoration: "none" }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td>{order.address?.fullName || "Shopper"}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {formatCurrency(order.sellerSubtotal)}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[order.status || "placed"]}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
