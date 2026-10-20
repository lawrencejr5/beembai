"use client";

import React, { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/app/data/data";
import styles from "./orders.module.css";

// ── Types ────────────────────────────────────────────────────

type HistoryEntry = {
  status: string;
  timestamp: number;
  message: string;
  source?: string;
};

export type StoreGroup = {
  storeId: string | null;
  storeName: string;
  storeLogo: string | null;
  items: any[];
  subtotal: number;
  status: string;
  statusHistory: HistoryEntry[];
  waybillNumber: string | null;
  giglStatus: string | null;
};

type TimelineEntry = {
  key: string;
  time: number;
  icon: string;
  title: string;
  detail?: string;
  live?: boolean; // true for entries that came from the courier
};

// ── Blended timeline ─────────────────────────────────────────
// Store log + GIGL scans are merged into ONE chronological story so the
// buyer never sees "Shipped" from the store and "Shipment Created" from
// the courier for the exact same moment.

const COURIER_STEPS: Record<string, { title: string; icon: string }> = {
  MCRT: { title: "Package registered with courier", icon: "📋" },
  MPIK: { title: "Picked up by courier", icon: "📦" },
  APT: { title: "Arrived at sorting hub", icon: "🏭" },
  WC: { title: "With courier", icon: "🚚" },
  OFD: { title: "Out for delivery", icon: "🛵" },
  SHD: { title: "Delivered", icon: "✅" },
};

const STORE_STEPS: Record<string, { title: string; icon: string }> = {
  placed: { title: "Order placed", icon: "🧾" },
  paid: { title: "Payment confirmed", icon: "💳" },
  failed: { title: "Payment failed", icon: "⚠️" },
  processing: { title: "Seller is preparing your package", icon: "📦" },
  shipped: { title: "Dispatched", icon: "🚚" },
  delivered: { title: "Delivered", icon: "✅" },
  cancelled: { title: "Cancelled", icon: "❌" },
};

const isGiglDispatchEntry = (h: HistoryEntry) =>
  h.source === "gigl" || /^(Shipped via GIG|Handed to GIG)/i.test(h.message);

function buildTimeline(group: StoreGroup, tracking: any): TimelineEntry[] {
  const scans: any[] = tracking?.scans ?? [];
  const hasScans = scans.length > 0;
  const hasCourierDelivered = scans.some((s) => s.status === "SHD");
  const entries: TimelineEntry[] = [];

  group.statusHistory.forEach((h, i) => {
    if (isGiglDispatchEntry(h)) {
      // The courier's own "registered" scan replaces this once we have it
      if (hasScans) return;
      entries.push({
        key: `s-${i}`,
        time: h.timestamp,
        icon: "🚚",
        title: "Handed to GIG Logistics",
        detail: group.waybillNumber ? `Waybill ${group.waybillNumber}` : undefined,
      });
      return;
    }
    // Courier already told us it's delivered — don't repeat it
    if (h.status === "delivered" && hasCourierDelivered) return;

    const step = STORE_STEPS[h.status] ?? { title: h.status, icon: "📌" };
    entries.push({
      key: `s-${i}`,
      time: h.timestamp,
      icon: step.icon,
      title: step.title,
      detail: h.message,
    });
  });

  scans.forEach((scan, i) => {
    const step = COURIER_STEPS[scan.status];
    const time = scan.time ? new Date(scan.time).getTime() : 0;
    entries.push({
      key: `c-${i}`,
      time,
      icon: step?.icon ?? "📌",
      title: step?.title ?? scan.incident ?? scan.status,
      detail:
        [scan.comment, scan.location].filter(Boolean).join(" · ") || undefined,
      live: true,
    });
  });

  return entries.sort((a, b) => b.time - a.time);
}

const formatLogTime = (ts: number) =>
  ts
    ? new Date(ts).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  placed: { bg: "#f3f4f6", fg: "#374151" },
  processing: { bg: "#fef3c7", fg: "#92400e" },
  shipped: { bg: "#dbeafe", fg: "#1e40af" },
  delivered: { bg: "#dcfce7", fg: "#166534" },
  cancelled: { bg: "#fee2e2", fg: "#991b1b" },
};

export function StatusChip({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.placed;
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: "0.7rem",
        fontWeight: 800,
        padding: "2px 9px",
        borderRadius: 100,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

// ── Component ────────────────────────────────────────────────

export default function StoreShipmentGroup({
  group,
  multi,
  roadmap,
  reviewsMap,
  onReview,
  trackShipment,
}: {
  group: StoreGroup;
  multi?: boolean;
  roadmap?: React.ReactNode;
  reviewsMap?: Map<string, any>;
  onReview?: (productId: string, title: string) => void;
  trackShipment: (args: { waybillNumber: string }) => Promise<any>;
}) {
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    if (!group.waybillNumber) return;
    setLoading(true);
    try {
      setTracking(await trackShipment({ waybillNumber: group.waybillNumber }));
    } catch (err: any) {
      setTracking({ success: false, message: err?.message, scans: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWaybill = async () => {
    if (!group.waybillNumber) return;
    try {
      await navigator.clipboard.writeText(group.waybillNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy waybill", err);
    }
  };

  // Load live courier scans automatically so the log is blended on open
  useEffect(() => {
    if (group.waybillNumber) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.waybillNumber]);

  const timeline = useMemo(() => buildTimeline(group, tracking), [group, tracking]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Optional store header if multi is explicitly requested */}
      {multi && (
        <div className={styles.storeHeaderRow}>
          <div className={styles.storeIdentity}>
            {group.storeLogo ? (
              <img src={group.storeLogo} alt="" className={styles.storeLogo} />
            ) : (
              <div className={styles.storeDefaultIcon}>🏬</div>
            )}
            <div className={styles.storeTitleGroup}>
              <span className={styles.storeName}>{group.storeName}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-olive-gray)" }}>
                {group.items.length} {group.items.length === 1 ? "item" : "items"} · ₦
                {formatPrice(group.subtotal)}
              </span>
            </div>
          </div>
          <StatusChip status={group.status} />
        </div>
      )}

      {/* Per-store roadmap if passed */}
      {roadmap && <div>{roadmap}</div>}

      {/* Items List (if items provided and not rendered by parent) */}
      {group.items && group.items.length > 0 && (
        <div className={styles.itemsList}>
          {group.items.map((item: any, idx: number) => {
            const hasReviewed = reviewsMap?.has(item.productId);
            return (
              <div key={idx} className={styles.itemRow}>
                <img src={item.image} alt={item.title} className={styles.itemRowImg} />
                <div className={styles.itemRowInfo}>
                  <span className={styles.itemRowTitle}>{item.title}</span>
                  <span className={styles.itemRowMeta}>
                    Qty: {item.quantity} {item.color ? `| Color: ${item.color}` : ""}
                  </span>
                </div>
                <span className={styles.itemRowPrice}>
                  ₦{formatPrice(item.price * item.quantity)}
                </span>
                {group.status === "delivered" && onReview && (
                  <button
                    type="button"
                    onClick={() => onReview(item.productId, item.title)}
                    style={{
                      border: hasReviewed
                        ? "1px solid var(--color-border)"
                        : "1px solid var(--color-palm)",
                      color: hasReviewed ? "var(--color-olive-gray)" : "var(--color-palm)",
                      background: "transparent",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {hasReviewed ? "Update Review" : "Write Review"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Polished Delivery Updates & Tracking Card */}
      <div className={styles.deliveryCard}>
        <div className={styles.deliveryHeader}>
          <h4 className={styles.deliveryTitle}>
            <span>🚚</span>
            <span>Delivery & Tracking Updates</span>
          </h4>

          {group.waybillNumber ? (
            <div className={styles.waybillActions}>
              <div className={styles.waybillBadge}>
                <span>Waybill: {group.waybillNumber}</span>
                <button
                  type="button"
                  onClick={handleCopyWaybill}
                  className={styles.waybillCopyBtn}
                  title="Copy waybill number"
                >
                  {copied ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>

              <a
                href={`https://www.giglogistics.com/shipment-tracking?waybill=${encodeURIComponent(group.waybillNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.waybillLink}
                title="Track directly on GIG Logistics official tracking portal"
              >
                Track on GIG Logistics ↗
              </a>

              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className={styles.waybillRefreshBtn}
                title="Refresh latest courier scans"
              >
                {loading ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>
          ) : (
            <span style={{ fontSize: "0.78rem", color: "var(--color-olive-gray)", fontWeight: 600 }}>
              Tracking will appear once dispatched
            </span>
          )}
        </div>

        {timeline.length > 0 ? (
          <div className={styles.logsTimeline}>
            {timeline.map((entry, i) => {
              const isLatest = i === 0;
              const isDelivered = group.status === "delivered";
              // Latest status is active/unfilled (just borders) unless the order is delivered
              const isChecked = !isLatest || isDelivered;
              const isActive = isLatest && !isDelivered;

              let dotClass = styles.logDot;
              if (isActive) dotClass += ` ${styles.logDotActive}`;
              else if (isChecked) dotClass += ` ${styles.logDotCompleted}`;

              return (
                <div key={entry.key} className={styles.logRow}>
                  <div className={dotClass}>
                    {isChecked ? "✓" : ""}
                  </div>
                  <div className={styles.logContent}>
                    <div className={styles.logHeader}>
                      <span className={styles.logStatusName}>
                        <span style={{ fontSize: "1rem" }}>{entry.icon}</span>
                        <span>{entry.title}</span>
                      </span>
                      {entry.time > 0 && (
                        <span className={styles.logTime}>{formatLogTime(entry.time)}</span>
                      )}
                    </div>
                    {entry.detail && <p className={styles.logMessage}>{entry.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-olive-gray)" }}>
            Order placed. Dispatch and transit logs will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
