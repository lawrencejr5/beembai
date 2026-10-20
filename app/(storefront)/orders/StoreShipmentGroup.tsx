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
  multi: boolean;
  roadmap: React.ReactNode;
  reviewsMap?: Map<string, any>;
  onReview?: (productId: string, title: string) => void;
  trackShipment: (args: { waybillNumber: string }) => Promise<any>;
}) {
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

  // Load live courier scans automatically so the log is blended on open
  useEffect(() => {
    if (group.waybillNumber) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.waybillNumber]);

  const timeline = useMemo(() => buildTimeline(group, tracking), [group, tracking]);

  return (
    <div
      style={{
        border: multi ? "1px solid var(--color-border)" : "none",
        borderRadius: 14,
        padding: multi ? "1rem 1.1rem" : 0,
        background: multi ? "rgba(0,0,0,0.015)" : "transparent",
      }}
    >
      {/* Store header */}
      {multi && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "0.9rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {group.storeLogo ? (
              <img
                src={group.storeLogo}
                alt=""
                style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: "1.2rem" }}>🏬</span>
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{group.storeName}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.65 }}>
                {group.items.length} {group.items.length === 1 ? "item" : "items"} · ₦
                {formatPrice(group.subtotal)}
              </div>
            </div>
          </div>
          <StatusChip status={group.status} />
        </div>
      )}

      {/* Per-store roadmap (only needed when more than one store) */}
      {multi && <div style={{ marginBottom: "0.9rem" }}>{roadmap}</div>}

      {/* Items */}
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
                  }}
                >
                  {hasReviewed ? "Update Review" : "Write Review"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Blended delivery log */}
      <div style={{ marginTop: "1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "0.6rem",
          }}
        >
          <h4 className={styles.detailSectionTitle} style={{ margin: 0 }}>
            Delivery Updates{multi ? ` · ${group.storeName}` : ""}
          </h4>
          {group.waybillNumber && (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  background: "#f0fdf4",
                  color: "#166534",
                  border: "1px solid #86efac",
                  padding: "2px 10px",
                  borderRadius: 100,
                }}
              >
                Tracking: {group.waybillNumber}
              </span>
              <button
                onClick={refresh}
                disabled={loading}
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  background: "var(--color-palm)",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 12px",
                  cursor: "pointer",
                }}
              >
                {loading ? "Updating..." : "Refresh"}
              </button>
            </div>
          )}
        </div>

        <div className={styles.logsTimeline}>
          {timeline.map((entry, i) => (
            <div key={entry.key} className={styles.logRow}>
              <div
                className={styles.logDot}
                style={{ background: i === 0 ? "var(--color-palm)" : undefined }}
              />
              <div className={styles.logContent}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.25rem",
                  }}
                >
                  <span className={styles.logStatusName}>
                    {entry.icon} {entry.title}
                  </span>
                  <span className={styles.logTime}>{formatLogTime(entry.time)}</span>
                </div>
                {entry.detail && <p className={styles.logMessage}>{entry.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
