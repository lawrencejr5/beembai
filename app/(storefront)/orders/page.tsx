"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
        const isActive = idx === currentIndex;
        
        let stepClass = styles.stepDot;
        if (isActive) stepClass += ` ${styles.stepDotActive}`;
        else if (isCompleted) stepClass += ` ${styles.stepDotCompleted}`;

        return (
          <React.Fragment key={step.key}>
            <div className={styles.stepContainer}>
              <div className={stepClass}>
                {isCompleted && !isActive ? "✓" : idx + 1}
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

export default function OrdersPage() {
  const router = useRouter();
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

  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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

  // Redirect if unauthenticated
  if (!authLoading && !isAuthenticated) {
    router.replace("/login");
    return null;
  }

  const toggleExpand = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  const isLoadingData = authLoading || orders === undefined;

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
        </div>

        {/* ── Orders Content ── */}
        {isLoadingData ? (
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
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                                  <span className={styles.itemRowPrice}>
                                    ₦{formatPrice(item.price * item.quantity)}
                                  </span>
                                  {order.status === "delivered" && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReviewModal(item.productId, item.title)}
                                      className={styles.reviewBtn}
                                    >
                                      {hasReviewed ? "Edit Review" : "Review Product"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Timeline Detail Log */}
                      <div className={styles.detailSection}>
                        <h4 className={styles.detailSectionTitle}>Delivery Timeline</h4>
                        <div className={styles.timelineList}>
                          {order.statusHistory.map((history: any, idx: number) => (
                            <div key={idx} className={styles.timelineItem}>
                              <div className={styles.timelineMarker}>
                                <div className={styles.markerDot} />
                                {idx < order.statusHistory.length - 1 && <div className={styles.markerLine} />}
                              </div>
                              <div className={styles.timelineContent}>
                                <span className={styles.timelineTime}>
                                  {formatTimeOnly(history.timestamp)} · {formatDateOnly(history.timestamp)}
                                </span>
                                <span className={styles.timelineMessage}>
                                  {history.message}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping & Payment summary */}
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

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <p className={styles.emptyTitle}>
              {activeTab === "active" ? "No active orders" : "No order history"}
            </p>
            <p className={styles.emptyDesc}>
              {activeTab === "active"
                ? "You don't have any items currently on their way. Head over to our catalog to place an order!"
                : "Your completed and cancelled purchases will appear here."}
            </p>
            <button onClick={() => router.push("/")} className={styles.goShoppingBtn}>
              Browse Catalog
            </button>
          </div>
        )}

      </main>

      {/* Review Modal Dialog */}
      {isReviewModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsReviewModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {reviewsMap.has(reviewProductId || "") ? "Edit Review" : "Write Review"}
              </h3>
              <button className={styles.modalCloseBtn} onClick={() => setIsReviewModalOpen(false)}>
                ✕
              </button>
            </div>
            
            <p style={{ fontSize: "0.85rem", color: "var(--color-olive-gray)", marginTop: "-4px" }}>
              How would you rate <strong style={{ color: "var(--foreground)" }}>{reviewProductTitle}</strong>?
            </p>

            <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {reviewError && (
                <div style={{ color: "var(--color-error)", fontSize: "0.82rem", fontWeight: 700 }}>
                  ⚠️ {reviewError}
                </div>
              )}

              {/* Star selection */}
              <div className={styles.ratingSelector}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = hoverRating !== null ? star <= hoverRating : star <= reviewRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className={styles.starButton}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill={isFilled ? "#FBBF24" : "#E5E7EB"}>
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </button>
                  );
                })}
              </div>

              {/* Review Comment textarea */}
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Write your review here. What did you like or dislike about the product?"
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
