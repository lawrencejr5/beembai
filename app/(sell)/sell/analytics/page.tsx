"use client";

import React, { useMemo } from "react";
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

export default function SellerAnalyticsPage() {
  const { stores, activeStoreId } = useSellerStore();

  // 1. Fetch Analytics based on active store context
  const allStoresAnalytics = useQuery(
    api.store.getSellerAnalyticsAllStores,
    activeStoreId === null ? {} : "skip"
  );
  
  const singleStoreAnalytics = useQuery(
    api.store.getStoreAnalyticsForOwner,
    activeStoreId !== null ? { storeId: activeStoreId as any } : "skip"
  );

  const stats = activeStoreId === null ? allStoresAnalytics : singleStoreAnalytics;

  // 2. Fetch all products to group by category for breakdown
  const allStoresProducts = useQuery(
    api.store.getSellerProductsAllStores,
    activeStoreId === null ? {} : "skip"
  );

  const singleStoreProducts = useQuery(
    api.store.getProductsByStoreForOwner,
    activeStoreId !== null ? { storeId: activeStoreId as any } : "skip"
  );

  const products = activeStoreId === null ? allStoresProducts : singleStoreProducts;

  // 3. Category Breakdown Data
  const categoryBreakdown = useMemo(() => {
    if (!products) return [];
    const counts: Record<string, number> = {};
    for (const p of products) {
      const cat = p.categoryName || "Uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  // Mock Sales Growth Chart Representation (Simulated for visual wow factor)
  const salesHistory = useMemo(() => {
    if (!stats) return [];
    const baseAmount = stats.totalSales || 0;
    return [
      { month: "May", sales: baseAmount * 0.15, orders: Math.round(stats.totalOrders * 0.1) },
      { month: "Jun", sales: baseAmount * 0.2, orders: Math.round(stats.totalOrders * 0.2) },
      { month: "Jul", sales: baseAmount * 0.3, orders: Math.round(stats.totalOrders * 0.3) },
      { month: "Aug", sales: baseAmount * 0.35, orders: Math.round(stats.totalOrders * 0.4) },
    ];
  }, [stats]);

  if (stats === undefined) {
    return (
      <div className={styles.sellerContent}>
        <div className={styles.skeleton} style={{ height: 320 }} />
      </div>
    );
  }

  return (
    <div className={styles.sellerContent}>
      
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Merchant Analytics</h1>
          <p className={styles.pageSubtitle}>Analyze performance insights, sales metrics, and catalog breakdown summaries</p>
        </div>
      </div>

      {/* Analytics Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statCardTitle}>Gross Sales Revenue</span>
          <span className={styles.statCardValue}>{formatCurrency(stats.totalSales)}</span>
          <span className={styles.statCardIcon}>💰</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCardTitle}>Orders volume</span>
          <span className={styles.statCardValue}>{stats.totalOrders} fulfillments</span>
          <span className={styles.statCardIcon}>📦</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCardTitle}>Inventory Catalog</span>
          <span className={styles.statCardValue}>{stats.totalProducts} listed</span>
          <span className={styles.statCardIcon}>🏷️</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCardTitle}>Average Store Rating</span>
          <span className={styles.statCardValue}>⭐ {stats.averageRating.toFixed(1)} / 5.0</span>
          <span className={styles.statCardIcon}>📈</span>
        </div>
      </div>

      {/* Analytics Visual Grid Details */}
      <div className={styles.detailLayout}>
        <div className={styles.detailMain}>
          
          {/* Sales History Growth Bar Representation */}
          <div className={styles.sellerCard}>
            <div className={styles.sellerCardHeader}>
              <h3 className={styles.sellerCardTitle}>Monthly Sales Performance (Simulated)</h3>
            </div>
            <div className={styles.sellerCardBody}>
              {stats.totalSales === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <p style={{ color: "var(--seller-text-secondary)" }}>No sales data available yet</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {salesHistory.map((item, idx) => {
                    const maxSales = Math.max(...salesHistory.map(h => h.sales)) || 1;
                    const percent = (item.sales / maxSales) * 100;
                    return (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 48, fontSize: 13, fontWeight: 700, color: "var(--seller-text-secondary)" }}>
                          {item.month}
                        </span>
                        <div style={{ flex: 1, height: 24, background: "var(--seller-content-bg)", borderRadius: 4, overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${percent}%`,
                              background: "linear-gradient(90deg, #d6983a, #485c2c)",
                              borderRadius: 4,
                              transition: "width 0.8s ease",
                            }}
                          />
                        </div>
                        <span style={{ width: 90, fontSize: 13, fontWeight: 700, textAlign: "right" }}>
                          {formatCurrency(item.sales)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Breakdown */}
        <div className={styles.detailSidebar}>
          
          {/* Category Catalog Breakdown */}
          <div className={styles.sellerCard}>
            <div className={styles.sellerCardHeader}>
              <h3 className={styles.sellerCardTitle}>Catalog Breakdown</h3>
            </div>
            <div className={styles.sellerCardBody}>
              {categoryBreakdown.length === 0 ? (
                <p style={{ color: "var(--seller-text-secondary)", fontSize: 13, textAlign: "center" }}>
                  No items listed
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {categoryBreakdown.map((item, idx) => {
                    const total = stats.totalProducts || 1;
                    const percent = Math.round((item.count / total) * 100);
                    return (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 600 }}>
                          <span style={{ color: "var(--seller-text-primary)" }}>{item.name}</span>
                          <span style={{ color: "var(--seller-text-secondary)" }}>
                            {item.count} items ({percent}%)
                          </span>
                        </div>
                        <div style={{ height: 6, background: "var(--seller-content-bg)", borderRadius: 3, overflow: "hidden" }}>
                          <div
                            style={{ height: "100%", width: `${percent}%`, background: "var(--seller-sidebar-active-border)" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
