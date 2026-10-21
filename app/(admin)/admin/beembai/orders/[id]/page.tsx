"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "../../../admin.module.css";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

type OrderStatus = "placed" | "processing" | "shipped" | "delivered" | "cancelled";

// GIGL scan code descriptions
const GIGL_SCAN_LABELS: Record<string, { label: string; icon: string }> = {
  MCRT: { label: "Shipment Created", icon: "📋" },
  MPIK: { label: "Package Picked Up", icon: "📦" },
  APT: { label: "Arrived at Hub", icon: "🏭" },
  WC: { label: "With Courier", icon: "🚚" },
  SHD: { label: "Delivered", icon: "✅" },
  OFD: { label: "Out for Delivery", icon: "🛵" },
};

function shippingMethodLabel(method?: string) {
  if (method === "express") return "Priority Express";
  if (method === "pickup") return "GIGL Station Pickup";
  return "Home Delivery";
}

export default function BeembaiOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.id as Id<"orders">;
  const order = useQuery(api.beembaiStore.getBeembaiOrderById, { orderId });
  const store = useQuery(api.beembaiStore.getBeembaiStore);
  const updateStatus = useMutation(api.beembaiStore.updateBeembaiOrderStatus);
  const createShipment = useAction(api.gigl.createShipmentForOrder);
  const trackShipment = useAction(api.gigl.trackShipment);

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

  // Auto-advance placed → processing when admin views the order (mirrors sell dashboard)
  useEffect(() => {
    if (order && order.status === "placed" && !order.waybillNumber) {
      updateStatus({
        orderId,
        status: "processing",
        message: "Order viewed by admin. Packaging and preparation is in progress.",
      }).catch((err) =>
        console.error("Failed to auto-advance Beembai order to processing:", err)
      );
    }
  }, [order, orderId, updateStatus]);

  if (order === undefined || store === undefined) {
    return <div className={styles.adminContent} style={{ color: "#6b6540" }}>Loading…</div>;
  }
  if (!order) return <div className={styles.adminContent}><p>Order not found.</p></div>;

  const handleStatusUpdate = async () => {
    setLoading(true);
    try {
      await updateStatus({ orderId, status: selectedStatus, message: customMessage || undefined });
      setShowUpdate(false);
      setCustomMessage("");
    } catch (e) {
      console.error(e);
      alert("Failed to update status.");
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
        storeId: (order.beembaiStoreId ?? undefined) as Id<"stores"> | undefined,
      });
      if (result.success) {
        setDispatchSuccess(`✅ Waybill generated: ${result.waybill}. GIGL courier will be notified for pickup.`);
      } else {
        setDispatchError("Dispatch failed. Please try again.");
      }
    } catch (err: any) {
      console.error("GIGL dispatch error:", err);
      setDispatchError(err.message || "Failed to create GIGL shipment.");
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

  const statusOptions: OrderStatus[] = ["placed", "processing", "shipped", "delivered", "cancelled"];
  const isImport = Boolean(order.isImportOrder);
  const hasUsWarehouse = Boolean(
    store?.usWarehouseAddress &&
    store?.usWarehouseCity &&
    store?.usWarehouseState
  );
  const hasNgWarehouse = Boolean(
    store?.physicalAddress && store?.stateName
  );
  const isWarehouseReady = isImport ? hasUsWarehouse : hasNgWarehouse;
  const hasWaybill = !!order.waybillNumber;
  const canDispatch = order.paymentStatus === "paid" && !hasWaybill && order.status !== "cancelled";

  return (
    <div className={styles.adminContent}>
      <div className={styles.pageHeader}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <Link href="/admin/beembai/orders" style={{ fontSize: 13, color: "#6b6540" }}>← Beembai Orders</Link>
          </div>
          <h1 className={styles.pageTitle}>
            {order.isImportOrder ? "🇺🇸 " : ""}Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p className={styles.pageSubtitle}>{formatDate(order.createdAt)}</p>
        </div>
        <div className={styles.flexRow}>
          <span className={`${styles.badge} ${styles[order.paymentStatus]}`}>{order.paymentStatus}</span>
          <span className={`${styles.badge} ${styles[order.status]}`}>{order.status}</span>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowUpdate(!showUpdate)} id="update-import-status-btn">
            Update Status
          </button>
        </div>
      </div>

      {/* ── GIG Logistics Dispatch Card ── */}
      <div className={styles.adminCard} style={{ marginBottom: 20, borderColor: hasWaybill ? "#4ade80" : canDispatch ? "#d4a72c" : undefined }}>
        <div className={styles.adminCardHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🚚</span>
            <h3 className={styles.adminCardTitle} style={{ margin: 0 }}>GIG Logistics Fulfillment</h3>
          </div>
          {hasWaybill && (
            <span style={{ fontSize: 12, fontWeight: 700, background: "#dcfce7", color: "#166534", padding: "3px 10px", borderRadius: 100 }}>
              DISPATCHED
            </span>
          )}
        </div>

        <div className={styles.adminCardBody}>
          {hasWaybill ? (
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
                  style={{ fontSize: 13, textDecoration: "none" }}
                >
                  Open GIGL Tracker ↗
                </a>
              </div>

              {showTracking && (
                <div style={{ marginTop: 20, borderTop: "1px solid #f0ebe0", paddingTop: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#282600" }}>📡 Live Courier Scan History</h4>
                  {isTracking ? (
                    <div style={{ color: "#6b6540", fontSize: 13 }}>Fetching…</div>
                  ) : trackingData?.scans?.length > 0 ? (
                    <div className={styles.timeline}>
                      {[...trackingData.scans].reverse().map((scan: any, idx: number) => {
                        const meta = GIGL_SCAN_LABELS[scan.status] || { label: scan.status, icon: "📌" };
                        return (
                          <div key={idx} className={styles.timelineItem}>
                            <div className={styles.timelineDot} />
                            <div className={styles.timelineContent}>
                              <div className={styles.timelineStatus}>{meta.icon} {meta.label}</div>
                              <div className={styles.timelineMessage}>
                                {scan.comment || scan.incident || "—"}
                                {scan.location && <span style={{ color: "#6b6540", fontSize: 12 }}> · {scan.location}</span>}
                              </div>
                              {scan.time && (
                                <div className={styles.timelineTime}>
                                  {new Date(scan.time).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: "#6b6540" }}>
                      {trackingData?.message || "No scan records found yet. GIGL courier pickup may not have happened yet."}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : canDispatch ? (
            <div>
              {!isWarehouseReady ? (
                <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "16px 18px", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <span style={{ fontSize: 26, lineHeight: 1 }}>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: 14, color: "#92400e", display: "block", marginBottom: 6 }}>
                        {isImport
                          ? "US Warehouse Address Required Before Dispatch"
                          : "Nigeria Warehouse Address Required Before Dispatch"}
                      </strong>
                      <p style={{ fontSize: 13, color: "#b45309", margin: "0 0 12px 0", lineHeight: 1.5 }}>
                        {isImport
                          ? "This is an international foreign import order. GIG Logistics requires a designated US warehouse pickup address where your purchased item from Amazon / US store is received. You must configure your US Warehouse in Beembai Store Management before generating a waybill."
                          : "GIG Logistics requires your local warehouse pickup address to schedule courier dispatch. Please set up your Nigerian warehouse address in Beembai Store Management before dispatching."}
                      </p>
                      <Link
                        href="/admin/beembai"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{
                          fontSize: 12.5,
                          padding: "8px 16px",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          background: "#d97706",
                        }}
                      >
                        <span>🏢 Configure {isImport ? "US" : "Nigeria"} Warehouse Address</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 16 }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <p style={{ fontSize: 13, color: "#282600", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                      {isImport
                        ? "Order is paid and prepared. Click below to create a GIG Logistics Inbound Waybill to pick up this package from your US Warehouse and deliver it to Nigeria."
                        : "Order is paid and ready for dispatch. Click below to create a GIG Logistics waybill and schedule a courier pickup from your Nigeria Warehouse."}
                    </p>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 10, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", lineHeight: 1.5 }}>
                      <div>
                        📍 <strong>Pickup Origin:</strong>{" "}
                        {isImport
                          ? `🇺🇸 ${store?.usWarehouseAddress}, ${store?.usWarehouseCity}, ${store?.usWarehouseCounty ? store?.usWarehouseCounty + ", " : ""}${store?.usWarehouseState} ${store?.usWarehouseZip || ""}`
                          : `🇳🇬 ${store?.physicalAddress}, ${store?.city}, ${store?.lga ? store?.lga + " LGA, " : ""}${store?.stateName}`}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        🎯 <strong>Delivery Destination:</strong>{" "}
                        {order.address ? `${order.address.streetAddress}, ${order.address.city}, ${order.address.stateName}` : "Customer address on file"} &nbsp;|&nbsp;
                        🚀 <strong>Method:</strong> {shippingMethodLabel(order.shippingMethod)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleDispatchWithGIGL}
                    disabled={isDispatching}
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    style={{
                      minWidth: 200,
                      background: isImport ? "#2563eb" : "#16a34a",
                      color: "white",
                      border: "none",
                      whiteSpace: "nowrap",
                      padding: "12px 20px",
                      fontSize: 13.5,
                      fontWeight: 700,
                    }}
                    id="dispatch-with-gigl-btn"
                  >
                    {isDispatching
                      ? "Creating shipment..."
                      : isImport
                      ? "🚚 Dispatch Inbound Import (GIGL)"
                      : "🚚 Dispatch with GIGL"}
                  </button>
                </div>
              )}

              {dispatchError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginTop: 12 }}>
                  ⚠️ {dispatchError}
                </div>
              )}
              {dispatchSuccess && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#166534", marginTop: 12 }}>
                  {dispatchSuccess}
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "#6b6540", margin: 0 }}>
              {order.paymentStatus !== "paid"
                ? "⏳ Waiting for buyer payment confirmation before dispatch can be created."
                : order.status === "cancelled"
                ? "❌ This order has been cancelled and cannot be dispatched."
                : "Shipment has already been handled for this order."}
            </p>
          )}
        </div>
      </div>

      {showUpdate && (
        <div className={styles.adminCard} style={{ marginBottom: 20, background: "#fffef5", border: "1px solid #e8e2d0" }}>
          <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Update Order Status</h3></div>
          <div className={styles.adminCardBody}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className={styles.formGroup} style={{ flex: 1, minWidth: 160 }}>
                <label className={styles.formLabel}>New Status</label>
                <select className={styles.formSelect} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)} id="new-import-status">
                  {statusOptions.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className={styles.formGroup} style={{ flex: 2, minWidth: 200 }}>
                <label className={styles.formLabel}>Custom Message (optional)</label>
                <input type="text" className={styles.formInput} placeholder="Override status update message..." value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} id="import-status-message" />
              </div>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleStatusUpdate} disabled={loading} id="confirm-import-status">
                {loading ? "Saving…" : "Save"}
              </button>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowUpdate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.detailLayout}>
        <div className={styles.detailMain}>
          {/* Items */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Order Items ({order.items.length})</h3></div>
            <div className={styles.tableWrapper}>
              <table className={`${styles.adminTable} ${styles.smallTable}`}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <img src={item.image} alt="" className={styles.productThumb} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#282600", maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                            <div style={{ fontSize: 11, color: "#9e9970", display: "flex", gap: 6, alignItems: "center" }}>
                              <span>Store: {item.brand || "US Store"}</span>
                              {item.color && <span>• Color: {item.color}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700 }}>×{item.quantity}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(item.price * item.quantity)}</td>
                      <td>
                        {item.sourceUrl ? (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none", color: "#636d21" }}
                          >
                            🔗 Buy Source Item
                          </a>
                        ) : (
                          <span style={{ fontSize: 11, color: "#9e9970" }}>No source URL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid #f0ebe0", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#282600" }}>
                <span>Beembai Items Total</span>
                <span>{formatCurrency(order.beembaiSubtotal)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Import Fulfilment Timeline</h3></div>
            <div className={styles.adminCardBody}>
              <div className={styles.timeline}>
                {[...order.statusHistory].reverse().map((h, i) => (
                  <div key={i} className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineStatus}>{h.status}</div>
                      <div className={styles.timelineMessage}>{h.message}</div>
                      <div className={styles.timelineTime}>{formatDate(h.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.detailSidebar}>
          {/* Buyer */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Buyer Info</h3></div>
            <div className={styles.adminCardBody}>
              <div className={styles.infoRow}><span className={styles.infoRowLabel}>Name</span><span className={styles.infoRowValue}>{order.buyerName}</span></div>
              <div className={styles.infoRow}><span className={styles.infoRowLabel}>Email</span><span className={styles.infoRowValue} style={{ fontSize: 12 }}>{order.buyerEmail}</span></div>
              {order.paystackReference && (
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Payment Ref</span>
                  <span className={styles.infoRowValue} style={{ fontFamily: "monospace", fontSize: 11 }}>{order.paystackReference}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Delivery Address</h3></div>
            <div className={styles.adminCardBody}>
              <div style={{ fontSize: 13.5, color: "#282600", lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700 }}>{order.address.fullName}</div>
                <div>{order.address.phone}</div>
                <div>{order.address.streetAddress}{order.address.apartment ? `, ${order.address.apartment}` : ""}</div>
                <div>{order.address.city}, {order.address.stateName} {order.address.postalCode}</div>
                <div>{order.address.country}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}