"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatNumber } from "@/app/data/data";
import Navbar from "@/app/components/Navbar";
import styles from "./orders.module.css";
import Image from "next/image";

// ── Icons ─────────────────────────────────────────────────

const ArrowLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// Helper to format timestamps
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function SellerOrdersPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [activeTab, setActiveTab] = useState<"all" | "processing" | "shipped" | "delivered">("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, string>>({});

  // Get store details
  const store = useQuery(api.store.getStoreBySlugForOwner, { slug });
  
  // If store doesn't exist, redirect to /sell
  useEffect(() => {
    if (store === null) {
      router.replace("/sell");
    }
  }, [store, router]);

  // Get orders containing this store's products
  const storeOrders = useQuery(
    api.orders.getOrdersForStore,
    store ? { storeId: store._id } : "skip"
  );

  const updateShippingStatus = useMutation(api.orders.updateOrderShippingStatus);

  if (store === undefined || storeOrders === undefined) {
    return (
      <div className={styles.container}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.dashEmptyState} style={{ paddingTop: "6rem" }}>
            <span className={styles.dashEmptyIcon}>⏳</span>
            <p className={styles.dashEmptyTitle}>Loading store orders…</p>
          </div>
        </main>
      </div>
    );
  }

  if (store === null) return null;

  // Filter orders based on active tab
  const filteredOrders = storeOrders.filter((order) => {
    if (activeTab === "all") return true;
    return order.status === activeTab;
  });

  const handleStatusChange = (orderId: string, value: string) => {
    setSelectedStatuses((prev) => ({
      ...prev,
      [orderId]: value,
    }));
  };

  const handleUpdateStatus = async (orderId: any) => {
    const nextStatus = selectedStatuses[orderId];
    if (!nextStatus) return;

    setUpdatingOrderId(orderId);
    try {
      await updateShippingStatus({
        orderId,
        storeId: store._id,
        status: nextStatus as "processing" | "shipped" | "delivered" | "cancelled",
      });
      // Clear selection after update
      setSelectedStatuses((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    } catch (error) {
      console.error("Failed to update shipping status:", error);
      alert("Error updating order status. Please try again.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "placed":
        return styles.badgePlaced;
      case "processing":
        return styles.badgeProcessing;
      case "shipped":
        return styles.badgeShipped;
      case "delivered":
        return styles.badgeDelivered;
      case "cancelled":
        return styles.badgeCancelled;
      default:
        return styles.badgePlaced;
    }
  };

  return (
    <div className={styles.container}>
      <Navbar />

      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => router.push(`/sell/${store.slug}`)}
          >
            <ArrowLeftIcon /> Back to Dashboard
          </button>
          <h1 className={styles.pageTitle}>Store Orders</h1>
          <p className={styles.pageSubtitle}>
            Manage fulfillment, shipping status, and view customer purchase history for &ldquo;{store.name}&rdquo;
          </p>
        </div>

        {/* Tab Filters */}
        <div className={styles.tabsRow}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "all" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Orders ({storeOrders.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "processing" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("processing")}
          >
            Processing ({storeOrders.filter((o) => o.status === "processing").length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "shipped" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("shipped")}
          >
            Shipped ({storeOrders.filter((o) => o.status === "shipped").length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "delivered" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("delivered")}
          >
            Delivered ({storeOrders.filter((o) => o.status === "delivered").length})
          </button>
        </div>

        {/* Orders Listing */}
        {filteredOrders.length === 0 ? (
          <div className={styles.dashEmptyState}>
            <span className={styles.dashEmptyIcon}>📦</span>
            <p className={styles.dashEmptyTitle}>No orders found</p>
            <p className={styles.dashEmptySubtitle}>
              {activeTab === "all"
                ? "You haven't received any customer orders yet. Once products are purchased, they will appear here."
                : `There are currently no orders in the "${activeTab}" status.`}
            </p>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {filteredOrders.map((order) => {
              const shortId = order._id.slice(-8).toUpperCase();
              const paymentBadgeClass =
                order.paymentStatus === "paid"
                  ? styles.badgePaid
                  : order.paymentStatus === "unpaid"
                    ? styles.badgeUnpaid
                    : styles.badgeFailed;

              // Current selected status for this order card dropdown (falls back to current status)
              const currentStatusSelection = selectedStatuses[order._id] || order.status;

              // Determine allowed transitions
              const isFinalized = order.status === "delivered" || order.status === "cancelled";
              
              return (
                <div key={order._id} className={styles.orderCard}>
                  {/* Card Header */}
                  <div className={styles.cardHeader}>
                    <div className={styles.orderMetaInfo}>
                      <span className={styles.orderId}>Order #{shortId}</span>
                      <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                    </div>
                    <div className={styles.statusSection}>
                      <span className={`${styles.badge} ${paymentBadgeClass}`}>
                        {order.paymentStatus}
                      </span>
                      <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className={styles.cardBody}>
                    {/* Items list */}
                    <div className={styles.itemsSection}>
                      <h4 className={styles.itemsTitle}>Store Items Ordered</h4>
                      <div className={styles.itemList}>
                        {order.items.map((item, idx) => (
                          <div key={`${item.productId}-${idx}`} className={styles.itemRow}>
                            <div className={styles.itemImageWrapper}>
                              {item.image && (
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  fill
                                  sizes="60px"
                                  className={styles.itemImage}
                                />
                              )}
                            </div>
                            <div className={styles.itemDetails}>
                              <h5 className={styles.itemTitle}>{item.title}</h5>
                              <span className={styles.itemMeta}>
                                Qty: {item.quantity} {item.color && `| Color: ${item.color}`}
                              </span>
                            </div>
                            <span className={styles.itemPrice}>
                              ₦{formatNumber(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer & Address Details */}
                    <div className={styles.customerSection}>
                      <h4 className={styles.sectionHeading}>Shipping Address</h4>
                      <div>
                        <p className={styles.customerName}>{order.address.fullName}</p>
                        <p className={styles.customerPhone}>{order.address.phone}</p>
                      </div>
                      <p className={styles.addressText}>
                        {order.address.streetAddress}
                        {order.address.apartment && `, ${order.address.apartment}`}
                        <br />
                        {order.address.city}, {order.address.stateName}
                        <br />
                        {order.address.postalCode}, {order.address.country}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className={styles.cardFooter}>
                    <div className={styles.sellerRevenue}>
                      <span className={styles.revenueLabel}>Your Store Earnings</span>
                      <span className={styles.revenueValue}>₦{formatNumber(order.sellerSubtotal)}</span>
                    </div>

                    {/* Fulfillment Controls */}
                    {!isFinalized ? (
                      <div className={styles.actionsGroup}>
                        <select
                          className={styles.selectStatus}
                          value={currentStatusSelection}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          disabled={updatingOrderId === order._id}
                        >
                          {/* Placed -> Processing or Cancelled */}
                          {order.status === "placed" && (
                            <>
                              <option value="placed">Placed (Pending Fulfillment)</option>
                              <option value="processing">Start Processing</option>
                              <option value="cancelled">Cancel Order</option>
                            </>
                          )}
                          
                          {/* Processing -> Shipped or Cancelled */}
                          {order.status === "processing" && (
                            <>
                              <option value="processing">Processing (In Packaging)</option>
                              <option value="shipped">Mark as Shipped</option>
                              <option value="cancelled">Cancel Order</option>
                            </>
                          )}

                          {/* Shipped -> Delivered or Cancelled */}
                          {order.status === "shipped" && (
                            <>
                              <option value="shipped">Shipped (In Transit)</option>
                              <option value="delivered">Mark as Delivered</option>
                              <option value="cancelled">Cancel Order</option>
                            </>
                          )}
                        </select>

                        <button
                          type="button"
                          className={styles.updateBtn}
                          disabled={
                            updatingOrderId === order._id ||
                            currentStatusSelection === order.status
                          }
                          onClick={() => handleUpdateStatus(order._id)}
                        >
                          {updatingOrderId === order._id ? "Saving…" : "Update"}
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.83rem", color: "var(--color-olive-gray)", fontWeight: 600 }}>
                        Fulfillment finalized ({order.status})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
