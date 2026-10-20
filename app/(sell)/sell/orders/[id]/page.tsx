"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
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

// GIGL scan code descriptions
const GIGL_SCAN_LABELS: Record<string, { label: string; icon: string }> = {
  MCRT: { label: "Shipment Created", icon: "📋" },
  MPIK: { label: "Package Picked Up", icon: "📦" },
  APT: { label: "Arrived at Hub", icon: "🏭" },
  WC: { label: "With Courier", icon: "🚚" },
  SHD: { label: "Delivered", icon: "✅" },
  OFD: { label: "Out for Delivery", icon: "🛵" },
};

export default function SellerOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params.id as Id<"orders">;

  // Query order details
  const order = useQuery(api.orders.getSellerOrderById, { orderId });
  const updateStatusMut = useMutation(api.orders.updateOrderShippingStatus);
  const createShipment = useAction(api.gigl.createShipmentForOrder);
  const trackShipment = useAction(api.gigl.trackShipment);

  // States
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("processing");
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  // GIGL Dispatch state
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  // GIGL Live tracking state
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [copiedWaybill, setCopiedWaybill] = useState(false);

  // Auto-advance status from placed to processing when viewed by merchant
  useEffect(() => {
    if (order && order.status === "placed" && order.storeId) {
      updateStatusMut({
        orderId,
        storeId: order.storeId as Id<"stores">,
        status: "processing",
        message: "Order viewed by merchant. Packaging and preparation is in progress.",
      }).catch((err) => {
        console.error("Failed to auto-advance order status to processing:", err);
      });
    }
  }, [order, orderId, updateStatusMut]);

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

  const handleDispatchWithGIGL = async () => {
    setIsDispatching(true);
    setDispatchError(null);
    setDispatchSuccess(null);

    try {
      const result = await createShipment({
        orderId,
        storeId: order.storeId as Id<"stores"> | undefined,
      });

      if (result.success) {
        setDispatchSuccess(`✅ Waybill generated: ${result.waybill}. GIGL courier will be notified for pickup.`);
      } else {
        setDispatchError("Dispatch failed. Please try again.");
      }
    } catch (err: any) {
      console.error("GIGL dispatch error:", err);
      setDispatchError(err.message || "Failed to create GIGL shipment. Please check your store address settings.");
    } finally {
      setIsDispatching(false);
    }
  };

  const handleTrackWaybill = async () => {
    if (!order.waybillNumber) return;
    setIsTracking(true);
    setShowTracking(true);

    try {
      const result = await trackShipment({ waybillNumber: order.waybillNumber });
      setTrackingData(result);
    } catch (err: any) {
      console.error("GIGL tracking error:", err);
      setTrackingData({ success: false, message: err.message || "Failed to fetch tracking data.", scans: [] });
    } finally {
      setIsTracking(false);
    }
  };

  const handleCopyWaybill = () => {
    if (!order.waybillNumber) return;
    navigator.clipboard.writeText(order.waybillNumber).then(() => {
      setCopiedWaybill(true);
      setTimeout(() => setCopiedWaybill(false), 2000);
    });
  };

  const statusOptions: OrderStatus[] = ["processing", "shipped", "delivered", "cancelled"];
  const canDispatch = order.paymentStatus === "paid" && !order.waybillNumber && order.status !== "cancelled";
  const hasWaybill = !!order.waybillNumber;

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

      {/* ── GIG Logistics Dispatch Card ── */}
      <div className={styles.sellerCard} style={{ marginBottom: 20, borderColor: hasWaybill ? "var(--seller-success-border, #4ade80)" : canDispatch ? "#d4a72c" : undefined }}>
        <div className={styles.sellerCardHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🚚</span>
            <h3 className={styles.sellerCardTitle} style={{ margin: 0 }}>
              GIG Logistics Fulfillment
            </h3>
          </div>
          {hasWaybill && (
            <span style={{ fontSize: 12, fontWeight: 700, background: "#dcfce7", color: "#166534", padding: "3px 10px", borderRadius: 100 }}>
              DISPATCHED
            </span>
          )}
        </div>

        <div className={styles.sellerCardBody}>
          {hasWaybill ? (
            // Waybill Display — already dispatched
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#166534" }}>Waybill No.</span>
                  <code style={{ fontWeight: 900, fontSize: 16, color: "#15803d", letterSpacing: 1 }}>{order.waybillNumber}</code>
                  <button
                    onClick={handleCopyWaybill}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#16a34a", fontSize: 13, fontWeight: 700, padding: "0 6px" }}
                    title="Copy waybill number"
                  >
                    {copiedWaybill ? "✅ Copied!" : "📋 Copy"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={handleTrackWaybill}
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={isTracking}
                  style={{ fontSize: 13 }}
                >
                  {isTracking ? "Fetching..." : "🔍 Refresh Live Status"}
                </button>
                <a
                  href={`https://www.giglogistics.com/shipment-tracking?waybill=${order.waybillNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  style={{ fontSize: 13 }}
                >
                  Open GIGL Tracker ↗
                </a>
              </div>

              {/* Live tracking scans panel */}
              {showTracking && (
                <div style={{ marginTop: 20, borderTop: "1px solid var(--seller-content-bg)", paddingTop: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "var(--seller-text-primary)" }}>
                    📡 Live Courier Scan History
                  </h4>
                  {isTracking ? (
                    <div className={styles.skeleton} style={{ height: 80 }} />
                  ) : trackingData?.scans?.length > 0 ? (
                    <div className={styles.timeline}>
                      {[...trackingData.scans].reverse().map((scan: any, idx: number) => {
                        const meta = GIGL_SCAN_LABELS[scan.status] || { label: scan.status, icon: "📌" };
                        return (
                          <div key={idx} className={`${styles.timelineItem} ${idx === 0 ? styles.active : ""}`}>
                            <div className={styles.timelineIndicator} />
                            <div className={styles.timelineHeader}>
                              <span className={styles.timelineStatus}>
                                {meta.icon} {meta.label}
                              </span>
                              {scan.time && (
                                <span className={styles.timelineTime}>
                                  {new Date(scan.time).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>
                            <p className={styles.timelineMessage}>
                              {scan.comment || scan.incident || "—"}
                              {scan.location && <span style={{ color: "var(--seller-text-secondary)", fontSize: 12 }}> · {scan.location}</span>}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: "var(--seller-text-secondary)" }}>
                      {trackingData?.message || "No scan records found yet. GIGL courier pickup may not have happened yet."}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : canDispatch ? (
            // Dispatch Button — ready to dispatch
            <div>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 16 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: 13, color: "var(--seller-text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    Order is paid and ready for dispatch. Click <strong>Dispatch with GIGL</strong> to create a GIG Logistics waybill and schedule a pickup from your store.
                  </p>
                  <p style={{ fontSize: 12, color: "var(--seller-text-secondary)", marginTop: 8, opacity: 0.7 }}>
                    📍 Pickup: {order.address ? `${order.address.city}, ${order.address.stateName}` : "Customer address on file"} &nbsp;|&nbsp;
                    🚀 Method: {order.shippingMethod === "express" ? "Priority Express" : "Standard Delivery"}
                  </p>
                </div>
                <button
                  onClick={handleDispatchWithGIGL}
                  disabled={isDispatching}
                  className={`${styles.btn} ${styles.btnSuccess || styles.btnPrimary}`}
                  style={{ minWidth: 180, background: "#16a34a", color: "white", border: "none", whiteSpace: "nowrap" }}
                >
                  {isDispatching ? "Creating shipment..." : "🚚 Dispatch with GIGL"}
                </button>
              </div>

              {dispatchError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>
                  ⚠️ {dispatchError}
                </div>
              )}
              {dispatchSuccess && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#166534" }}>
                  {dispatchSuccess}
                </div>
              )}
            </div>
          ) : (
            // Not yet eligible
            <p style={{ fontSize: 13, color: "var(--seller-text-secondary)", margin: 0 }}>
              {order.paymentStatus !== "paid"
                ? "⏳ Waiting for buyer payment confirmation before dispatch can be created."
                : order.status === "cancelled"
                ? "❌ This order has been cancelled and cannot be dispatched."
                : "Shipment has already been handled for this order."}
            </p>
          )}
        </div>
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
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "var(--seller-text-primary)" }}>
                <span>Your Items Total</span>
                <span>{formatCurrency(order.sellerSubtotal)}</span>
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
              {hasWaybill && (
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>GIGL Waybill</span>
                  <code style={{ fontSize: 13, fontWeight: 800, color: "#16a34a" }}>{order.waybillNumber}</code>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
