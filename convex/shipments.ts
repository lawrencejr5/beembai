import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

/**
 * Per-store shipment helpers.
 *
 * An order can contain items from several stores. Each store fulfils (and
 * dispatches via GIGL) independently, so every store gets its own shipment
 * record: status, history and waybill. `order.status` is derived from them.
 *
 * Legacy orders (no `shipments` array) are treated as a single shipment
 * shared by every store, using the old order-level fields.
 */

export type HistoryEntry = {
  status: string;
  timestamp: number;
  message: string;
  source?: string; // "gigl" when auto-generated from a GIGL dispatch
};

export type Shipment = {
  storeId?: Id<"stores">;
  status: string;
  statusHistory: HistoryEntry[];
  waybillNumber?: string;
  giglStatus?: string;
  dispatchedAt?: number;
};

type OrderDoc = Doc<"orders">;

const ORDER_LEVEL_STATUSES = ["placed", "paid", "failed"];

/** Distinct store ids (or undefined for store-less items) in an order. */
export function getStoreKeys(order: OrderDoc): (Id<"stores"> | undefined)[] {
  const keys: (Id<"stores"> | undefined)[] = [];
  for (const item of order.items) {
    if (!keys.includes(item.storeId)) keys.push(item.storeId);
  }
  return keys;
}

/** Read-only view of one store's shipment, falling back to legacy fields. */
export function getShipmentView(
  order: OrderDoc,
  storeId?: Id<"stores">
): Shipment {
  const existing = order.shipments?.find((s) => s.storeId === storeId);
  if (existing) {
    return {
      ...existing,
      waybillNumber: existing.waybillNumber ?? order.waybillNumber,
      giglStatus: existing.giglStatus ?? order.giglStatus,
    };
  }

  // If storeId is provided but no exact match, check for unassigned store shipment (Beembai store)
  if (storeId) {
    const unassigned = order.shipments?.find((s) => s.storeId === undefined);
    if (unassigned) {
      return {
        ...unassigned,
        storeId,
        waybillNumber: unassigned.waybillNumber ?? order.waybillNumber,
        giglStatus: unassigned.giglStatus ?? order.giglStatus,
      };
    }
  }

  if (!order.shipments || order.shipments.length === 0) {
    // Legacy or single-store order: one shared shipment using top-level fields
    return {
      storeId,
      status: order.status,
      statusHistory: order.statusHistory,
      waybillNumber: order.waybillNumber,
      giglStatus: order.giglStatus,
    };
  }

  // If this order only has one store's items or is a dedicated store order
  const storeKeys = getStoreKeys(order);
  if (storeKeys.length <= 1) {
    return {
      storeId,
      status: order.status,
      statusHistory: order.statusHistory,
      waybillNumber: order.waybillNumber,
      giglStatus: order.giglStatus,
    };
  }

  // Other stores have shipments but this one hasn't been touched yet
  return {
    storeId,
    status: "placed",
    statusHistory: order.statusHistory.filter((h) =>
      ORDER_LEVEL_STATUSES.includes(h.status)
    ),
  };
}

/** Make sure every store in the order has a shipment entry. */
export function ensureShipments(order: OrderDoc): Shipment[] {
  const current: Shipment[] = [...(order.shipments ?? [])];
  for (const key of getStoreKeys(order)) {
    if (!current.some((s) => s.storeId === key)) {
      const view = getShipmentView(order, key);
      current.push({ ...view, statusHistory: [...view.statusHistory] });
    }
  }
  return current;
}

/** Aggregate order status from its shipments. */
export function deriveOrderStatus(shipments: Shipment[]): OrderDoc["status"] {
  const active = shipments.filter((s) => s.status !== "cancelled");
  if (active.length === 0) return "cancelled";
  if (active.every((s) => s.status === "delivered")) return "delivered";
  if (active.some((s) => s.status === "shipped" || s.status === "delivered"))
    return "shipped";
  if (active.some((s) => s.status === "processing")) return "processing";
  return "placed";
}

/**
 * Apply an update to ONE store's shipment and return the order patch.
 * Never touches other stores' shipments.
 */
export function applyShipmentUpdate(
  order: OrderDoc,
  storeId: Id<"stores"> | undefined,
  update: {
    status: string;
    message: string;
    source?: string;
    storeLabel?: string;
    waybillNumber?: string;
    giglStatus?: string;
  }
) {
  const now = Date.now();
  const shipments = ensureShipments(order);
  let idx = shipments.findIndex((s) => s.storeId === storeId);
  if (idx < 0 && storeId) {
    idx = shipments.findIndex((s) => s.storeId === undefined);
  }

  const entry: HistoryEntry = {
    status: update.status,
    timestamp: now,
    message: update.message,
    ...(update.source ? { source: update.source } : {}),
  };

  const base: Shipment =
    idx >= 0 ? shipments[idx] : { storeId, status: "placed", statusHistory: [] };
  const updated: Shipment = {
    ...base,
    status: update.status,
    statusHistory: [...base.statusHistory, entry],
    ...(update.waybillNumber
      ? { waybillNumber: update.waybillNumber, dispatchedAt: now }
      : {}),
    ...(update.giglStatus ? { giglStatus: update.giglStatus } : {}),
  };
  if (idx >= 0) shipments[idx] = updated;
  else shipments.push(updated);

  const multiStore = getStoreKeys(order).length > 1;
  return {
    shipments,
    status: deriveOrderStatus(shipments),
    statusHistory: [
      ...order.statusHistory,
      {
        status: update.status,
        timestamp: now,
        message:
          multiStore && update.storeLabel
            ? `[${update.storeLabel}] ${update.message}`
            : update.message,
      },
    ],
  };
}

/** Buyer-facing grouping: items + shipment state per store. */
export async function buildStoreGroups(ctx: QueryCtx, order: OrderDoc) {
  const keys = getStoreKeys(order);
  return await Promise.all(
    keys.map(async (storeId) => {
      const store = storeId ? await ctx.db.get(storeId) : null;
      const items = order.items.filter((i) => i.storeId === storeId);
      const view = getShipmentView(order, storeId);
      return {
        storeId: storeId ?? null,
        storeName: store?.name ?? "Beembai",
        storeLogo: store?.logo ?? null,
        items,
        subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
        status: view.status,
        statusHistory: view.statusHistory,
        waybillNumber: view.waybillNumber ?? null,
        giglStatus: view.giglStatus ?? null,
      };
    })
  );
}
