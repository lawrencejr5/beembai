"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
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

export default function BeembaiOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.id as Id<"orders">;
  const order = useQuery(api.beembaiStore.getBeembaiOrderById, { orderId });
  const updateStatus = useMutation(api.beembaiStore.updateBeembaiOrderStatus);

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("processing");
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  if (order === undefined) return <div className={styles.adminContent} style={{ color: "#6b6540" }}>Loading…</div>;
  if (!order) return <div className={styles.adminContent}><p>Order not found or is not an import order.</p></div>;

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

  const statusOptions: OrderStatus[] = ["placed", "processing", "shipped", "delivered", "cancelled"];

  return (
    <div className={styles.adminContent}>
      <div className={styles.pageHeader}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <Link href="/admin/beembai/orders" style={{ fontSize: 13, color: "#6b6540" }}>← Beembai Orders</Link>
          </div>
          <h1 className={styles.pageTitle}>Import Order #{order._id.slice(-8).toUpperCase()} 🇺🇸</h1>
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

      {showUpdate && (
        <div className={styles.adminCard} style={{ marginBottom: 20, background: "#fffef5", border: "1px solid #e8e2d0" }}>
          <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Update Import Fulfilment Status</h3></div>
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
            <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Imported Items ({order.items.length})</h3></div>
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
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b6540" }}>
                <span>Shipping ({order.shippingMethod})</span>
                <span>{formatCurrency(order.shippingFee)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#282600" }}>
                <span>Total Amount Paid</span>
                <span>{formatCurrency(order.totalAmount)}</span>
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