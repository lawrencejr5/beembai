"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "../../admin.module.css";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

type OrderStatus = "placed" | "processing" | "shipped" | "delivered" | "cancelled";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.id as Id<"orders">;
  const order = useQuery(api.admin.getOrderByIdAdmin, { orderId });
  const updateStatus = useMutation(api.admin.adminUpdateOrderStatus);

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("processing");
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  if (order === undefined) return <div className={styles.adminContent} style={{ color: "#6b6540" }}>Loading…</div>;
  if (!order) return <div className={styles.adminContent}><p>Order not found.</p></div>;

  const handleStatusUpdate = async () => {
    setLoading(true);
    await updateStatus({ orderId, status: selectedStatus, message: customMessage || undefined });
    setShowUpdate(false);
    setCustomMessage("");
    setLoading(false);
  };

  const statusOptions: OrderStatus[] = ["placed", "processing", "shipped", "delivered", "cancelled"];

  return (
    <div className={styles.adminContent}>
      <div className={styles.pageHeader}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <Link href="/admin/orders" style={{ fontSize: 13, color: "#6b6540" }}>← Orders</Link>
          </div>
          <h1 className={styles.pageTitle}>Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className={styles.pageSubtitle}>{formatDate(order.createdAt)}</p>
        </div>
        <div className={styles.flexRow}>
          <span className={`${styles.badge} ${styles[order.paymentStatus]}`}>{order.paymentStatus}</span>
          <span className={`${styles.badge} ${styles[order.status]}`}>{order.status}</span>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowUpdate(!showUpdate)} id="update-order-status-btn">
            Update Status
          </button>
        </div>
      </div>

      {showUpdate && (
        <div className={styles.adminCard} style={{ marginBottom: 20, background: "#fffef5", border: "1px solid #e8e2d0" }}>
          <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Update Fulfillment Status</h3></div>
          <div className={styles.adminCardBody}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className={styles.formGroup} style={{ flex: 1, minWidth: 160 }}>
                <label className={styles.formLabel}>New Status</label>
                <select className={styles.formSelect} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)} id="new-order-status">
                  {statusOptions.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className={styles.formGroup} style={{ flex: 2, minWidth: 200 }}>
                <label className={styles.formLabel}>Custom Message (optional)</label>
                <input type="text" className={styles.formInput} placeholder="Override the default status message..." value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} id="order-status-message" />
              </div>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleStatusUpdate} disabled={loading} id="confirm-order-status">
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
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <img src={item.image} alt="" className={styles.productThumb} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#282600", maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                            {item.color && <div style={{ fontSize: 11, color: "#9e9970" }}>Color: {item.color}</div>}
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
            <div style={{ padding: "14px 20px", borderTop: "1px solid #f0ebe0", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b6540" }}>
                <span>Shipping ({order.shippingMethod})</span>
                <span>{formatCurrency(order.shippingFee)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#282600" }}>
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className={styles.adminCard}>
            <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Order Timeline</h3></div>
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
            <div className={styles.adminCardHeader}><h3 className={styles.adminCardTitle}>Buyer</h3></div>
            <div className={styles.adminCardBody}>
              <div className={styles.infoRow}><span className={styles.infoRowLabel}>Name</span><span className={styles.infoRowValue}>{(order as any).buyer?.name ?? order.address.fullName}</span></div>
              <div className={styles.infoRow}><span className={styles.infoRowLabel}>Email</span><span className={styles.infoRowValue} style={{ fontSize: 12 }}>{(order as any).buyer?.email ?? "—"}</span></div>
              {(order as any).paystackReference && (
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Ref</span>
                  <span className={styles.infoRowValue} style={{ fontFamily: "monospace", fontSize: 11 }}>{(order as any).paystackReference}</span>
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
