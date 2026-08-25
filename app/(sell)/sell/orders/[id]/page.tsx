"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "../../seller.module.css";

// Formatter Helpers
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export default function SellerOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params.id as Id<"orders">;

  // Query order details
  const order = useQuery(api.orders.getSellerOrderById, { orderId });
  const updateStatusMut = useMutation(api.orders.updateOrderShippingStatus);

  // States
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("processing");
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  if (order === undefined) {
    return (
      <div className={styles.sellerContent}>
        <div className={styles.skeleton} style={{ height: 320 }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.sellerContent}>
        <div style={{ textAlign: "center", padding: "48px 20px" }}>
          <span style={{ fontSize: 40 }}>⚠️</span>
          <h2 style={{ marginTop: 12 }}>Order Not Found</h2>
          <p style={{ color: "var(--seller-text-secondary)", marginTop: 8 }}>
            The requested order could not be located or you do not have permission to view it.
          </p>
          <Link href="/sell/orders" className={`${styles.btn} ${styles.btnGhost}`} style={{ marginTop: 16 }}>
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const handleStatusUpdate = async () => {
    if (!order.storeId) return;
    setLoading(true);
    try {
      await updateStatusMut({
        orderId,
        storeId: order.storeId as Id<"stores">,
        status: selectedStatus,
        message: customMessage || undefined,
      });
      setShowUpdate(false);
      setCustomMessage("");
    } catch (err) {
      console.error(err);
      alert("Failed to update shipping status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const statusOptions: OrderStatus[] = ["processing", "shipped", "delivered", "cancelled"];

  return (
    <div className={styles.sellerContent}>
      
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <Link href="/sell/orders" style={{ fontSize: 13, color: "var(--seller-text-secondary)", textDecoration: "none" }}>
              ← Orders
            </Link>
          </div>
          <h1 className={styles.pageTitle}>Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className={styles.pageSubtitle}>
            Fulfillment details and tracking history for {order.address?.fullName || "Shopper"}
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedStatus((order.status as OrderStatus) || "processing");
            setShowUpdate(true);
          }}
          className={`${styles.btn} ${styles.btnPrimary}`}
        >
          Update Fulfillment Status
        </button>
      </div>

      {/* Fulfillment Status Modal / Panel */}
      {showUpdate && (
        <div className={styles.sellerCard} style={{ marginBottom: 20, background: "#fffdf8", borderColor: "var(--seller-sidebar-active-border)" }}>
          <div className={styles.sellerCardHeader}>
            <h3 className={styles.sellerCardTitle}>Update Fulfillment Status</h3>
          </div>
          <div className={styles.sellerCardBody}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className={styles.formGroup} style={{ flex: 1, minWidth: 160 }}>
                <label className={styles.formLabel}>New Status</label>
                <select
                  className={styles.formSelect}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup} style={{ flex: 2, minWidth: 240 }}>
                <label className={styles.formLabel}>Custom Tracking Message (optional)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Package dispatched from Lagos sorting office."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className={`${styles.btn} ${styles.btnSuccess}`}
                  onClick={handleStatusUpdate}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowUpdate(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Grid Layout */}
      <div className={styles.detailLayout}>
        <div className={styles.detailMain}>
          
          {/* Order Items list */}
          <div className={styles.sellerCard}>
            <div className={styles.sellerCardHeader}>
              <h3 className={styles.sellerCardTitle}>Ordered Items ({order.items.length})</h3>
            </div>
            <div className={styles.tableWrapper}>
              <table className={`${styles.sellerTable} ${styles.smallTable}`}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <img
                            src={item.image}
                            alt=""
                            style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }}
                          />
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 700, color: "var(--seller-text-primary)" }}>
                              {item.title}
                            </span>
                            {item.color && (
                              <span style={{ fontSize: 11, color: "var(--seller-text-secondary)" }}>
                                Color: {item.color}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700 }}>×{item.quantity}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--seller-content-bg)", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--seller-text-secondary)" }}>
                <span>Subtotal (Your store items)</span>
                <span>{formatCurrency(order.sellerSubtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--seller-text-secondary)" }}>
                <span>Buyer Paid Shipping ({order.shippingMethod})</span>
                <span>{formatCurrency(order.shippingFee)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "var(--seller-text-primary)" }}>
                <span>Total Payment Value</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Fulfillment Tracking History Timeline */}
          <div className={styles.sellerCard}>
            <div className={styles.sellerCardHeader}>
              <h3 className={styles.sellerCardTitle}>Shipping Status History</h3>
            </div>
            <div className={styles.sellerCardBody}>
              <div className={styles.timeline}>
                {[...(order.statusHistory || [])].reverse().map((history, idx) => (
                  <div key={idx} className={`${styles.timelineItem} ${idx === 0 ? styles.active : ""}`}>
                    <div className={styles.timelineIndicator} />
                    <div className={styles.timelineHeader}>
                      <span className={styles.timelineStatus}>{history.status}</span>
                      <span className={styles.timelineTime}>{formatDate(history.timestamp)}</span>
                    </div>
                    <p className={styles.timelineMessage}>{history.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div className={styles.detailSidebar}>
          
          {/* Customer Address Details */}
          <div className={styles.sellerCard}>
            <div className={styles.sellerCardHeader}>
              <h3 className={styles.sellerCardTitle}>Shipping Address</h3>
            </div>
            <div className={styles.sellerCardBody} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>Recipient Name</span>
                <span className={styles.infoRowValue}>{order.address?.fullName || "—"}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>Buyer Email</span>
                <span className={styles.infoRowValue}>{(order as any).buyerEmail || "—"}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>Contact Phone</span>
                <span className={styles.infoRowValue}>{order.address?.phone || "—"}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>Street Address</span>
                <span className={styles.infoRowValue} style={{ maxWidth: 160 }}>
                  {order.address?.streetAddress}
                  {order.address?.apartment ? `, ${order.address.apartment}` : ""}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>City / Town</span>
                <span className={styles.infoRowValue}>{order.address?.city || "—"}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>State / Postal</span>
                <span className={styles.infoRowValue}>
                  {order.address?.stateName} {order.address?.postalCode}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>Country</span>
                <span className={styles.infoRowValue}>{order.address?.country || "—"}</span>
              </div>
            </div>
          </div>

          {/* Payment Card details */}
          <div className={styles.sellerCard}>
            <div className={styles.sellerCardHeader}>
              <h3 className={styles.sellerCardTitle}>Payment Summary</h3>
            </div>
            <div className={styles.sellerCardBody} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>Transaction status</span>
                <span className={`${styles.badge} ${styles[order.paymentStatus || "unpaid"]}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>Fulfillment Method</span>
                <span className={styles.infoRowValue}>{order.shippingMethod}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
