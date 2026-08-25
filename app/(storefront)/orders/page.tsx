"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/app/data/data";
import styles from "./orders.module.css";

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

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
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

const formatTimeOnly = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateOnly = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// ── Status Roadmap Details ─────────────────────────────────

const ROADMAP_STEPS = [
  { key: "placed", label: "Placed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const getStatusStepIndex = (status: string) => {
  switch (status) {
    case "placed": return 0;
    case "processing": return 1;
    case "shipped": return 2;
    case "delivered": return 3;
    default: return -1;
  }
};

// ── Components ──────────────────────────────────────────────

interface OrderRoadmapProps {
  currentStatus: string;
}

const OrderRoadmap: React.FC<OrderRoadmapProps> = ({ currentStatus }) => {
  const currentIndex = getStatusStepIndex(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  if (isCancelled) {
    return (
      <div className={styles.cancelledRoadmap}>
        <span className={styles.cancelledBadge}>Cancelled</span>
        <p className={styles.cancelledText}>This order has been cancelled and refunded if charged.</p>
      </div>
    );
  }

  return (
    <div className={styles.roadmapWrapper}>
      {ROADMAP_STEPS.map((step, idx) => {
        const isCompleted = idx <= currentIndex;
        const isActive = idx === currentIndex && currentStatus !== "delivered";
        
        let stepClass = styles.stepDot;
        if (isActive) stepClass += ` ${styles.stepDotActive}`;
        else if (isCompleted) stepClass += ` ${styles.stepDotCompleted}`;

        return (
          <React.Fragment key={step.key}>
            <div className={styles.stepContainer}>
              <div className={stepClass}>
                {isCompleted && (!isActive || currentStatus === "delivered") ? "✓" : idx + 1}
              </div>
              <span className={`${styles.stepLabel} ${isCompleted ? styles.stepLabelActive : ""}`}>
                {step.label}
              </span>
            </div>
            {idx < ROADMAP_STEPS.length - 1 && (
              <div className={`${styles.stepLine} ${idx < currentIndex ? styles.stepLineCompleted : ""}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const orders = useQuery(
    api.orders.getUserOrders,
    isAuthenticated ? {} : "skip"
  );

  const userReviews = useQuery(
    api.reviews.getUserReviews,
    isAuthenticated ? {} : "skip"
  );

  const addOrUpdateReview = useMutation(api.reviews.addOrUpdateReview);

  const [activeTab, setActiveTab] = useState<"active" | "history" | "track">("active");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Guest tracking states
  const [trackOrderId, setTrackOrderId] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [queryTrackArgs, setQueryTrackArgs] = useState<{ orderId: any; email: string } | null>(null);

  const guestOrderResult = useQuery(
    api.orders.getGuestOrder,
    queryTrackArgs ? { orderId: queryTrackArgs.orderId, email: queryTrackArgs.email } : "skip"
  );

  // Review states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<string | null>(null);
  const [reviewProductTitle, setReviewProductTitle] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const reviewsMap = useMemo(() => {
    const map = new Map<string, any>();
    if (userReviews) {
      userReviews.forEach(r => {
        map.set(r.productId, r);
      });
    }
    return map;
  }, [userReviews]);

  useEffect(() => {
    const track = searchParams.get("track");
    const orderId = searchParams.get("orderId");
    const email = searchParams.get("email");
    if (track === "true" && orderId && email) {
      setTrackOrderId(orderId);
      setTrackEmail(email);
      setQueryTrackArgs({ orderId: orderId as any, email });
      setActiveTab("track");
    } else if (!authLoading && !isAuthenticated) {
      setActiveTab("track");
    }
  }, [searchParams, authLoading, isAuthenticated]);

  const handleOpenReviewModal = (productId: string, productTitle: string) => {
    const existing = reviewsMap.get(productId);
    setReviewProductId(productId);
    setReviewProductTitle(productTitle);
    setReviewRating(existing ? existing.rating : 5);
    setReviewComment(existing ? existing.comment : "");
    setReviewError("");
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewProductId) return;

    setIsSubmittingReview(true);
    setReviewError("");

    try {
      await addOrUpdateReview({
        productId: reviewProductId as any,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setIsReviewModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setReviewError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const toggleExpand = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  const isLoadingData = authLoading || (isAuthenticated && orders === undefined);

  // Filter orders by tab
  const activeOrders = orders?.filter(o => o.status !== "delivered" && o.status !== "cancelled") || [];
  const historyOrders = orders?.filter(o => o.status === "delivered" || o.status === "cancelled") || [];
  const displayedOrders = activeTab === "active" ? activeOrders : historyOrders;

  return (
    <div className={styles.container}>
      <main className={styles.main}>

        {/* ── Header ── */}
        <header className={styles.header}>
          <button onClick={() => router.push("/")} className={styles.backButton}>
            <ArrowLeftIcon />
            <span>Go Shopping</span>
          </button>
          <h1 className={styles.pageTitle}>My Orders</h1>
          <p className={styles.pageSubtitle}>
            Track shipment roadmaps and review purchase history details.
          </p>
        </header>

        {/* ── Tabs ── */}
        <div className={styles.tabsRow}>
          {isAuthenticated ? (
            <>
              <button
                onClick={() => { setActiveTab("active"); setExpandedOrderId(null); }}
                className={`${styles.tabBtn} ${activeTab === "active" ? styles.tabBtnActive : ""}`}
              >
                Active Orders ({activeOrders.length})
              </button>
              <button
                onClick={() => { setActiveTab("history"); setExpandedOrderId(null); }}
                className={`${styles.tabBtn} ${activeTab === "history" ? styles.tabBtnActive : ""}`}
              >
                Order History ({historyOrders.length})
              </button>
              <button
                onClick={() => { setActiveTab("track"); setExpandedOrderId(null); }}
                className={`${styles.tabBtn} ${activeTab === "track" ? styles.tabBtnActive : ""}`}
              >
                Track Guest Order
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setActiveTab("track"); setExpandedOrderId(null); }}
                className={`${styles.tabBtn} ${activeTab === "track" ? styles.tabBtnActive : ""}`}
              >
                Track Guest Order
              </button>
              <button
                onClick={() => { setActiveTab("active"); setExpandedOrderId(null); }}
                className={`${styles.tabBtn} ${activeTab === "active" ? styles.tabBtnActive : ""}`}
              >
                Account Orders
              </button>
            </>
          )}
        </div>

        {/* ── Guest Tracking Content ── */}
        {activeTab === "track" && (
          <div className={styles.ordersList} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {queryTrackArgs && guestOrderResult === undefined ? (
              <div className={styles.loaderPlaceholder}>Loading order details...</div>
            ) : queryTrackArgs && guestOrderResult ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Tracking details for #{guestOrderResult._id.slice(-6).toUpperCase()}</h3>
                  <button
                    onClick={() => {
                      setQueryTrackArgs(null);
                      setTrackOrderId("");
                    }}
                    className={styles.changeBtn}
                    style={{ fontSize: "0.85rem" }}
                  >
                    Track another order
                  </button>
                </div>
                
                <div className={styles.orderCard} style={{ border: "1px solid var(--color-palm)" }}>
                  {/* Summary Card Header */}
                  <div className={styles.orderCardHeader}>
                    <div className={styles.headerDetails}>
                      <div className={styles.dateAndRef}>
                        <span className={styles.orderDate}>
                          <CalendarIcon />
                          {formatDateOnly(guestOrderResult.createdAt)}
                        </span>
                        <span className={styles.orderIdText}>
                          ID: #{guestOrderResult._id.toUpperCase()}
                        </span>
                      </div>
                      <p className={styles.orderItemsCount}>
                        {guestOrderResult.items.length} {guestOrderResult.items.length === 1 ? "item" : "items"} · &nbsp;
                        <strong className={styles.totalPrice}>
                          ₦{formatPrice(guestOrderResult.totalAmount)}
                        </strong>
                      </p>
                    </div>

                    <div className={styles.headerActions}>
                      <span className={`${styles.paymentStatusBadge} ${guestOrderResult.paymentStatus === "paid" ? styles.paidBadge : styles.unpaidBadge}`}>
                        {guestOrderResult.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Status Roadmap Row */}
                  <div className={styles.roadmapContainer}>
                    <OrderRoadmap currentStatus={guestOrderResult.status} />
                  </div>

                  {/* Details Body */}
                  <div className={styles.orderDetailsBody} style={{ display: "block" }}>
                    {/* Ordered Items List */}
                    <div className={styles.detailSection}>
                      <h4 className={styles.detailSectionTitle}>Ordered Items ({guestOrderResult.items.length})</h4>
                      <div className={styles.itemsList}>
                        {guestOrderResult.items.map((item: any, idx: number) => (
                          <div key={idx} className={styles.itemRow}>
                            <img
                              src={item.image}
                              alt={item.title}
                              className={styles.itemRowImg}
                            />
                            <div className={styles.itemRowInfo}>
                              <span className={styles.itemRowTitle}>{item.title}</span>
                              <span className={styles.itemRowMeta}>
                                Qty: {item.quantity} {item.color ? `| Color: ${item.color}` : ""}
                              </span>
                            </div>
                            <span className={styles.itemRowPrice}>
                              ₦{formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Details & Summary columns */}
                    <div className={styles.detailsGrid}>
                      <div className={styles.detailsGridBlock}>
                        <h4 className={styles.detailSectionTitle}>Shipping Details</h4>
                        <div className={styles.summaryInfoCard}>
                          <p className={styles.summaryName}>{guestOrderResult.address.fullName}</p>
                          <p className={styles.summaryText}>
                            {guestOrderResult.address.streetAddress}
                            {guestOrderResult.address.apartment ? `, ${guestOrderResult.address.apartment}` : ""}
                          </p>
                          <p className={styles.summaryText}>
                            {guestOrderResult.address.city}, {guestOrderResult.address.stateName} {guestOrderResult.address.postalCode}
                          </p>
                          <p className={styles.summaryText}>{guestOrderResult.address.country}</p>
                          <p className={styles.summaryPhone}>📞 {guestOrderResult.address.phone}</p>
                          {guestOrderResult.email && (
                            <p className={styles.summaryText} style={{ marginTop: "4px" }}>✉ {guestOrderResult.email}</p>
                          )}
                          <p className={styles.summaryDelivery}>
                            Method: {guestOrderResult.shippingMethod === "express" ? "Express Courier (₦22,500)" : "Standard Delivery"}
                          </p>
                        </div>
                      </div>

                      <div className={styles.detailsGridBlock}>
                        <h4 className={styles.detailSectionTitle}>Transaction Details</h4>
                        <div className={styles.summaryInfoCard}>
                          <p className={styles.summaryText}>
                            Payment: <strong style={{ color: guestOrderResult.paymentStatus === "paid" ? "var(--color-palm)" : "var(--color-error)" }}>{guestOrderResult.paymentStatus.toUpperCase()}</strong>
                          </p>
                          <div className={styles.receiptLine} style={{ marginTop: "12px", borderTop: "1px solid var(--color-border)", paddingTop: "8px" }}>
                            <div className={styles.receiptRow}>
                              <span>Items Subtotal</span>
                              <span>₦{formatPrice(guestOrderResult.totalAmount - guestOrderResult.shippingFee)}</span>
                            </div>
                            <div className={styles.receiptRow}>
                              <span>Shipping Fee</span>
                              <span>₦{formatPrice(guestOrderResult.shippingFee)}</span>
                            </div>
                            <div className={styles.receiptRow} style={{ fontWeight: 800, marginTop: "4px", fontSize: "0.9rem" }}>
                              <span>Grand Total</span>
                              <span>₦{formatPrice(guestOrderResult.totalAmount)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status History Logs */}
                    <div className={styles.detailSection} style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
                      <h4 className={styles.detailSectionTitle}>Shipment Progress Logs</h4>
                      <div className={styles.logsTimeline}>
                        {guestOrderResult.statusHistory.map((log: any, logIdx: number) => (
                          <div key={logIdx} className={styles.logRow}>
                            <div className={styles.logDot} />
                            <div className={styles.logContent}>
                              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.25rem" }}>
                                <span className={styles.logStatusName}>{log.status.toUpperCase()}</span>
                                <span className={styles.logTime}>{formatDate(log.timestamp)}</span>
                              </div>
                              <p className={styles.logMessage}>{log.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: "480px", margin: "2rem auto", padding: "2rem", backgroundColor: "var(--color-sand)", border: "1px solid var(--color-border)", borderRadius: "16px" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 900, marginBottom: "0.5rem" }}>Track Guest Order</h3>
                <p style={{ fontSize: "0.88rem", opacity: 0.8, marginBottom: "1.5rem" }}>Enter your Order ID and checkout email address to view real-time delivery status.</p>
                
                {queryTrackArgs && guestOrderResult === null && (
                  <div className={styles.cancelledRoadmap} style={{ margin: "0 0 1.5rem 0", padding: "1rem", backgroundColor: "#ffeae8", border: "1px solid #f5c2c2" }}>
                    <p style={{ color: "#d32f2f", fontSize: "0.85rem", fontWeight: 700, margin: 0 }}>⚠️ No matching order found. Please check details.</p>
                  </div>
                )}

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!trackOrderId.trim() || !trackEmail.trim()) return;
                  setQueryTrackArgs({ orderId: trackOrderId.trim() as any, email: trackEmail.trim() });
                }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>Order ID</label>
                    <input
                      type="text"
                      className={styles.tabBtn}
                      style={{ border: "1px solid var(--color-border)", background: "var(--background)", borderRadius: "8px", padding: "0.75rem 1rem", color: "var(--foreground)", width: "100%", textTransform: "none", cursor: "text", fontSize: "0.88rem" }}
                      value={trackOrderId}
                      onChange={(e) => setTrackOrderId(e.target.value)}
                      placeholder="e.g. j77z4qwe..."
                      required
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>Email Address</label>
                    <input
                      type="email"
                      className={styles.tabBtn}
                      style={{ border: "1px solid var(--color-border)", background: "var(--background)", borderRadius: "8px", padding: "0.75rem 1rem", color: "var(--foreground)", width: "100%", textTransform: "none", cursor: "text", fontSize: "0.88rem" }}
                      value={trackEmail}
                      onChange={(e) => setTrackEmail(e.target.value)}
                      placeholder="shopper@example.com"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className={styles.tabBtn}
                    style={{ background: "var(--color-palm)", color: "white", borderRadius: "8px", padding: "0.75rem 1rem", fontWeight: 700, fontSize: "0.9rem", border: "none", marginTop: "1rem", cursor: "pointer", transition: "opacity 0.2s" }}
                  >
                    Track Order Status
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── Logged-out Account Orders View message ── */}
        {((activeTab === "active" || activeTab === "history") && !isAuthenticated) && (
          <div style={{ textAlign: "center", padding: "4rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--color-papyrus)" }}>Sign in to view account orders</h2>
            <p style={{ maxWidth: "480px", opacity: 0.8 }}>Log in with your email or social accounts to see all your past and current order history details.</p>
            <button onClick={() => router.push("/login?redirectTo=/orders")} className={styles.tabBtn} style={{ background: "var(--color-palm)", color: "white", padding: "0.75rem 2rem", borderRadius: "8px", fontWeight: 700 }}>
              Sign In / Sign Up
            </button>
          </div>
        )}

        {/* ── Logged-in Orders Content ── */}
        {((activeTab === "active" || activeTab === "history") && isAuthenticated) && (
          isLoadingData ? (
            <div className={styles.ordersList}>
              {[1, 2].map((i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonLine} style={{ width: "30%", height: 16 }} />
                  <div className={styles.skeletonLine} style={{ width: "70%", height: 32, marginTop: 12 }} />
                  <div className={styles.skeletonLine} style={{ width: "50%", height: 14 }} />
                </div>
              ))}
            </div>
          ) : displayedOrders.length > 0 ? (
            <div className={styles.ordersList}>
              {displayedOrders.map((order: any) => {
                const isExpanded = expandedOrderId === order._id;
                
                return (
                  <div key={order._id} className={styles.orderCard}>
                    {/* Summary Card Header */}
                    <div className={styles.orderCardHeader} onClick={() => toggleExpand(order._id)}>
                      <div className={styles.headerDetails}>
                        <div className={styles.dateAndRef}>
                          <span className={styles.orderDate}>
                            <CalendarIcon />
                            {formatDateOnly(order.createdAt)}
                          </span>
                          <span className={styles.orderIdText}>
                            ID: #{order._id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <p className={styles.orderItemsCount}>
                          {order.items.length} {order.items.length === 1 ? "item" : "items"} · &nbsp;
                          <strong className={styles.totalPrice}>
                            ₦{formatPrice(order.totalAmount)}
                          </strong>
                        </p>
                        {/* Product thumbnail images displayed on collapsed card */}
                        {!isExpanded && (
                          <div className={styles.collapsedImages}>
                            {order.items.slice(0, 4).map((item: any, i: number) => (
                              <img key={i} src={item.image} alt="" className={styles.collapsedImg} />
                            ))}
                            {order.items.length > 4 && (
                              <span className={styles.moreItemsLabel}>+{order.items.length - 4}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className={styles.headerActions}>
                        <span className={`${styles.paymentStatusBadge} ${order.paymentStatus === "paid" ? styles.paidBadge : styles.unpaidBadge}`}>
                          {order.paymentStatus.toUpperCase()}
                        </span>
                        <button className={styles.expandToggleBtn}>
                          {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        </button>
                      </div>
                    </div>

                    {/* Status Roadmap Row */}
                    <div className={styles.roadmapContainer}>
                      <OrderRoadmap currentStatus={order.status} />
                    </div>

                    {/* Expandable Details Body */}
                    {isExpanded && (
                      <div className={styles.orderDetailsBody}>
                        
                        {/* Ordered Items List */}
                        <div className={styles.detailSection}>
                          <h4 className={styles.detailSectionTitle}>Ordered Items ({order.items.length})</h4>
                          <div className={styles.itemsList}>
                            {order.items.map((item: any, idx: number) => {
                              const hasReviewed = reviewsMap.has(item.productId);
                              return (
                                <div key={idx} className={styles.itemRow}>
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className={styles.itemRowImg}
                                  />
                                  <div className={styles.itemRowInfo}>
                                    <span className={styles.itemRowTitle}>{item.title}</span>
                                    <span className={styles.itemRowMeta}>
                                      Qty: {item.quantity} {item.color ? `| Color: ${item.color}` : ""}
                                    </span>
                                  </div>
                                  <span className={styles.itemRowPrice}>
                                    ₦{formatPrice(item.price * item.quantity)}
                                  </span>
                                  
                                  {/* Review trigger button */}
                                  {order.status === "delivered" && (
                                    <button
                                      onClick={() => handleOpenReviewModal(item.productId, item.title)}
                                      className={styles.reviewTriggerBtn}
                                      style={{
                                        border: hasReviewed ? "1px solid var(--color-border)" : "1px solid var(--color-palm)",
                                        color: hasReviewed ? "var(--color-olive-gray)" : "var(--color-palm)",
                                        background: "transparent",
                                        padding: "4px 10px",
                                        borderRadius: "6px",
                                        fontSize: "0.78rem",
                                        fontWeight: 700,
                                        cursor: "pointer"
                                      }}
                                    >
                                      {hasReviewed ? "Update Review" : "Write Review"}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Order Details & Summary columns */}
                        <div className={styles.detailsGrid}>
                          <div className={styles.detailsGridBlock}>
                            <h4 className={styles.detailSectionTitle}>Shipping Details</h4>
                            <div className={styles.summaryInfoCard}>
                              <p className={styles.summaryName}>{order.address.fullName}</p>
                              <p className={styles.summaryText}>
                                {order.address.streetAddress}
                                {order.address.apartment ? `, ${order.address.apartment}` : ""}
                              </p>
                              <p className={styles.summaryText}>
                                {order.address.city}, {order.address.stateName} {order.address.postalCode}
                              </p>
                              <p className={styles.summaryText}>{order.address.country}</p>
                              <p className={styles.summaryPhone}>📞 {order.address.phone}</p>
                              {order.email && (
                                <p className={styles.summaryText} style={{ marginTop: "4px" }}>✉ {order.email}</p>
                              )}
                              <p className={styles.summaryDelivery}>
                                Method: {order.shippingMethod === "express" ? "Express Courier (₦22,500)" : "Standard Delivery"}
                              </p>
                            </div>
                          </div>

                          <div className={styles.detailsGridBlock}>
                            <h4 className={styles.detailSectionTitle}>Transaction Details</h4>
                            <div className={styles.summaryInfoCard}>
                              <p className={styles.summaryText}>
                                Payment: <strong style={{ color: order.paymentStatus === "paid" ? "var(--color-palm)" : "var(--color-error)" }}>{order.paymentStatus.toUpperCase()}</strong>
                              </p>
                              <div className={styles.receiptLine} style={{ marginTop: "12px", borderTop: "1px solid var(--color-border)", paddingTop: "8px" }}>
                                <div className={styles.receiptRow}>
                                  <span>Items Subtotal</span>
                                  <span>₦{formatPrice(order.totalAmount - order.shippingFee)}</span>
                                </div>
                                <div className={styles.receiptRow}>
                                  <span>Shipping Fee</span>
                                  <span>₦{formatPrice(order.shippingFee)}</span>
                                </div>
                                <div className={styles.receiptRow} style={{ fontWeight: 800, marginTop: "4px", fontSize: "0.9rem" }}>
                                  <span>Grand Total</span>
                                  <span>₦{formatPrice(order.totalAmount)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status History Logs */}
                        <div className={styles.detailSection} style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
                          <h4 className={styles.detailSectionTitle}>Shipment Progress Logs</h4>
                          <div className={styles.logsTimeline}>
                            {order.statusHistory.map((log: any, logIdx: number) => (
                              <div key={logIdx} className={styles.logRow}>
                                <div className={styles.logDot} />
                                <div className={styles.logContent}>
                                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.25rem" }}>
                                    <span className={styles.logStatusName}>{log.status.toUpperCase()}</span>
                                    <span className={styles.logTime}>{formatDate(log.timestamp)}</span>
                                  </div>
                                  <p className={styles.logMessage}>{log.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "4rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--color-papyrus)" }}>No orders found</h2>
              <p style={{ maxWidth: "480px", opacity: 0.8 }}>You haven't placed any orders in this tab yet. Start shopping to fill your purchase history!</p>
              <button onClick={() => router.push("/")} className={styles.tabBtn} style={{ background: "var(--color-palm)", color: "white", padding: "0.75rem 2rem", borderRadius: "8px", fontWeight: 700 }}>
                Go to Homepage
              </button>
            </div>
          )
        )}

      </main>

      {/* Review Modal overlay */}
      {isReviewModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsReviewModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 className={styles.modalTitle}>Review Product</h3>
              <button onClick={() => setIsReviewModalOpen(false)} className={styles.closeBtn}>✕</button>
            </div>

            {reviewError && <p className={styles.errorText} style={{ marginBottom: "1rem" }}>{reviewError}</p>}

            <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "0.5rem" }}>Product Name</p>
                <p style={{ fontWeight: 800, fontSize: "1.05rem" }}>{reviewProductTitle}</p>
              </div>

              {/* Star Rating selector */}
              <div>
                <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "0.5rem" }}>Rating</p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = hoverRating !== null ? star <= hoverRating : star <= reviewRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setReviewRating(star)}
                        className={styles.starButton}
                      >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill={isFilled ? "#FBBF24" : "#E5E7EB"}>
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Comment textarea */}
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your thoughts about this product..."
                required
                className={styles.reviewTextarea}
              />

              <div className={styles.modalActionsRow}>
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className={styles.cancelBtn}
                  disabled={isSubmittingReview}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--background)", color: "var(--foreground)" }}>
        <p style={{ fontWeight: 700 }}>Loading orders page...</p>
      </div>
    }>
      <OrdersPageContent />
    </Suspense>
  );
}
