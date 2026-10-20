import { action, mutation, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { applyShipmentUpdate, getShipmentView } from "./shipments";

import {
  GIGL_STATIONS,
  resolveGIGLStation,
  type GIGLStationInfo,
} from "./giglStations";

export { GIGL_STATIONS, resolveGIGLStation };
export type { GIGLStationInfo };


// ── Low-Level GIGL Fetch Helper ────────────────────────────

function getGIGLConfig() {
  const baseUrl =
    process.env.GIGL_BASE_URL ||
    "https://dev-thirdpartynode.theagilitysystems.com";
  const token = process.env.GIGL_ACCESS_TOKEN;
  const channelCode = process.env.GIGL_USER_CHANNEL_CODE || "ECO038082";

  return { baseUrl, token, channelCode };
}

async function giglFetch(path: string, options: RequestInit = {}) {
  const { baseUrl, token } = getGIGLConfig();

  const url = `${baseUrl.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    "access-token": token || "",
    "Content-Type": "application/json",
    "User-Agent": "Beembai/1.0",
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const rawText = await res.text();
  let json: any = {};
  try {
    json = JSON.parse(rawText);
  } catch {
    throw new Error(
      `GIGL returned non-JSON response (${res.status}): ${rawText.slice(0, 200)}`,
    );
  }

  if (!res.ok) {
    const errorMsg = json.message || `GIGL API error ${res.status}`;
    throw new Error(errorMsg);
  }

  return json;
}

// ── Public Actions ─────────────────────────────────────────

/**
 * Calculate live GIG Logistics delivery fees.
 * Quotes both Standard delivery and Priority/Express delivery.
 */
export const calculateShippingFee = action({
  args: {
    senderState: v.optional(v.string()),
    senderCity: v.optional(v.string()),
    receiverState: v.string(),
    receiverCity: v.optional(v.string()),
    items: v.array(
      v.object({
        title: v.string(),
        price: v.number(),
        quantity: v.number(),
        weight: v.optional(v.number()), // in kg
      }),
    ),
  },
  handler: async (_ctx, args) => {
    const senderStation = resolveGIGLStation(
      args.senderState || args.senderCity || "Lagos",
    );
    const receiverStation = resolveGIGLStation(
      args.receiverState || args.receiverCity,
    );
    const { channelCode } = getGIGLConfig();

    // Compute aggregated package weight and value
    const totalWeight = Math.max(
      0.1,
      Number(
        args.items
          .reduce(
            (sum, item) => sum + (item.weight || 0.5) * item.quantity,
            0,
          )
          .toFixed(2),
      ),
    );
    const totalValue = Math.max(
      100,
      args.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    );

    const totalItemCount = args.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const itemsSummary = args.items
      .map((i) => `${i.quantity}x ${i.title.slice(0, 30)}`)
      .join(", ");

    // Consolidate order items into a single shipping parcel so GIGL applies the 1kg minimum
    // to the total combined package rather than charging 1kg separately on every item.
    const shipmentItems = [
      {
        ItemName:
          args.items.length === 1
            ? args.items[0].title.slice(0, 50)
            : `Consolidated Package (${totalItemCount} items)`,
        Description: itemsSummary.slice(0, 100) || "Merchandise",
        Quantity: 1,
        Weight: totalWeight,
        IsVolumetric: false,
        ShipmentType: 1, // Regular e-commerce goods
        Value: totalValue,
      },
    ];

    const payload = {
      SenderStationId: senderStation.stationId,
      ReceiverStationId: receiverStation.stationId,
      VehicleType: totalWeight > 10 ? 2 : 1, // Bike for parcels <= 10kg, Van for heavier
      ReceiverLocation: {
        Latitude: receiverStation.latitude,
        Longitude: receiverStation.longitude,
      },
      SenderLocation: {
        Latitude: senderStation.latitude,
        Longitude: senderStation.longitude,
      },
      CustomerCode: channelCode,
      CustomerType: 0,
      PickUpOptions: 0, // Home delivery
      ShipmentItems: shipmentItems,
    };

    try {
      const response = await giglFetch("/price", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response && response.data) {
        const rawFee = Math.round(
          response.data.GrandTotal || response.data.DeliverPrice || 3500,
        );
        const isInterstate =
          senderStation.stationId !== receiverStation.stationId;

        // 1. Station Pickup: lower terminal-to-terminal rate (no last-mile dispatch bike)
        const pickupFee = isInterstate
          ? Math.max(2200, Math.round(rawFee * 0.72))
          : Math.min(rawFee, 1500);

        // 2. Doorstep Delivery: standard home delivery with dispatch rider
        const doorstepFee = isInterstate
          ? rawFee
          : Math.max(rawFee, 2500);

        // 3. Priority Express: expedited same-day / next-day delivery
        const expressFee = Math.round(doorstepFee * 1.5);

        return {
          success: true,
          pickupFee,
          doorstepFee,
          expressFee,
          standardFee: doorstepFee, // alias for backwards compatibility
          totalWeight,
          pickupCharge: response.data.PickupCharge || 0,
          currency: response.data.CurrencySymbol || "₦",
          senderStation: senderStation.stationName,
          receiverStation: receiverStation.stationName,
          estimatedDaysPickup: isInterstate
            ? "2 - 4 business days"
            : "1 - 2 business days",
          estimatedDaysDoorstep: isInterstate
            ? "3 - 5 business days"
            : "2 - 3 business days",
          estimatedDaysExpress: isInterstate
            ? "1 - 2 business days"
            : "Same day / Next day",
        };
      }

      throw new Error(response.message || "Unable to calculate delivery fee.");
    } catch (err: any) {
      console.error("GIGL price calculation fallback triggered:", err.message);

      // Graceful fallback estimation so checkout never crashes if GIGL dev sandbox experiences OCC or maintenance
      const isInterstate =
        senderStation.stationId !== receiverStation.stationId;
      const weightFee = Math.max(0, Math.ceil(totalWeight - 1)) * 500;

      const pickupFee = (isInterstate ? 3500 : 1500) + weightFee;
      const doorstepFee = (isInterstate ? 5000 : 2500) + weightFee;
      const expressFee = Math.round(doorstepFee * 1.5);

      return {
        success: false,
        error: err.message,
        isFallback: true,
        pickupFee,
        doorstepFee,
        expressFee,
        standardFee: doorstepFee,
        totalWeight,
        currency: "₦",
        senderStation: senderStation.stationName,
        receiverStation: receiverStation.stationName,
        estimatedDaysPickup: isInterstate
          ? "2 - 4 business days"
          : "1 - 2 business days",
        estimatedDaysDoorstep: isInterstate
          ? "3 - 5 business days"
          : "2 - 3 business days",
        estimatedDaysExpress: isInterstate
          ? "1 - 2 business days"
          : "Same day / Next day",
      };
    }
  },
});

/**
 * Fetches physical GIGL service centres / pickup stations for a given state or city.
 */
export const getServiceCentres = action({
  args: {
    stateOrCity: v.string(),
  },
  handler: async (_ctx, args) => {
    const station = resolveGIGLStation(args.stateOrCity);
    try {
      const response = await giglFetch(
        `/serviceCentresByStation?StationId=${station.stationId}`,
        { method: "GET" },
      );

      if (response && response.data && Array.isArray(response.data)) {
        return response.data.map((c: any) => ({
          serviceCentreId: c.ServiceCentreId,
          name: c.ServiceCentreName,
          code: c.ServiceCentreCode,
          address: c.Address,
          stationId: c.StationId,
          stationName: c.StationName,
        }));
      }
      return [];
    } catch (e: any) {
      console.error("Failed to fetch service centres from GIGL:", e.message);
      return [];
    }
  },
});

/**
 * Dispatches an order with GIG Logistics and generates a Waybill.
 * Intended to be invoked by the seller when packaging is complete.
 */
export const createShipmentForOrder = action({
  args: {
    orderId: v.id("orders"),
    storeId: v.optional(v.id("stores")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; waybill: string; message: string }> => {
    // 1. Fetch order details internally
    const order: any = await ctx.runQuery(
      internal.orders.getOrderByIdInternal,
      {
        orderId: args.orderId,
      },
    );

    if (!order) {
      throw new Error("Order not found");
    }

    // Check if THIS store's shipment already has a waybill
    const existing = getShipmentView(order, args.storeId);
    const existingWaybill = existing.waybillNumber || order.waybillNumber;
    if (existingWaybill) {
      if (order.status !== "shipped") {
        await ctx.runMutation(internal.gigl.attachOrderWaybillInternal, {
          orderId: args.orderId,
          waybillNumber: existingWaybill,
          details: null,
          storeId: args.storeId,
        });
      }
      return {
        success: true,
        waybill: existingWaybill,
        message: "Waybill already exists for this order.",
      };
    }

    // 2. Fetch sender store information if storeId provided, or default Beembai HQ
    let senderName = "Beembai Marketplace";
    let senderPhone = "+2348000000000";
    let senderAddress = "Beembai Logistics Hub, Lagos, Nigeria";
    let senderState = "Lagos";

    if (args.storeId) {
      const store: any = await ctx.runQuery(
        internal.store.getStoreByIdInternal,
        {
          storeId: args.storeId,
        },
      );

      if (store) {
        senderName = store.name;
        senderPhone = store.phone || senderPhone;
        senderAddress =
          [store.physicalAddress, store.city, store.stateName]
            .filter(Boolean)
            .join(", ") || senderAddress;
        senderState = store.stateName || "Lagos";
      }
    }

    const senderStation = resolveGIGLStation(senderState);
    const receiverStation = resolveGIGLStation(
      order.address?.stateName || order.address?.city,
    );

    // 3. Format shipment items (only this store's items, aggregated weight)
    let orderItems: any[] = order.items;
    if (args.storeId) {
      const store: any = await ctx.runQuery(
        internal.store.getStoreByIdInternal,
        {
          storeId: args.storeId,
        },
      );
      const isBeembaiStore = store?.slug === "beembai-official";

      if (isBeembaiStore) {
        const beembaiItems = order.items.filter(
          (i: any) => !i.storeId || i.storeId === args.storeId
        );
        orderItems = beembaiItems.length > 0 ? beembaiItems : order.items;
      } else {
        const vendorItems = order.items.filter((i: any) => i.storeId === args.storeId);
        orderItems = vendorItems.length > 0 ? vendorItems : order.items;
      }
    }

    if (orderItems.length === 0) {
      throw new Error("This order has no items belonging to your store.");
    }

    const totalOrderWeight = Math.max(
      0.1,
      Number(
        orderItems
          .reduce((sum: number, item: any) => {
            const w = typeof item.weight === "number" ? item.weight : 0.5;
            return sum + w * (item.quantity || 1);
          }, 0)
          .toFixed(2),
      ),
    );

    const totalOrderValue = Math.max(
      100,
      orderItems.reduce(
        (sum: number, item: any) => sum + item.price * (item.quantity || 1),
        0,
      ),
    );

    const totalItemCount = orderItems.reduce(
      (sum: number, i: any) => sum + (i.quantity || 1),
      0,
    );
    const itemsSummary = orderItems
      .map((i: any) => `${i.quantity || 1}x ${i.title.slice(0, 30)}`)
      .join(", ");

    const shipmentItems = [
      {
        ItemName:
          orderItems.length === 1
            ? orderItems[0].title.slice(0, 50)
            : `Order Package (${totalItemCount} items)`,
        Description: itemsSummary.slice(0, 100) || "E-commerce product",
        ShipmentType: 1, // Regular
        Quantity: 1,
        Weight: totalOrderWeight,
        IsVolumetric: false,
        Value: totalOrderValue,
      },
    ];

    const fullReceiverAddress = [
      order.address.streetAddress,
      order.address.apartment,
      order.address.city,
      order.address.stateName,
      order.address.country,
    ]
      .filter(Boolean)
      .join(", ");

    const isPickup = order.shippingMethod === "pickup";
    const receiverAddress = isPickup && order.address?.pickupStationAddress
      ? `GIGL Station Pickup: ${order.address.pickupStationName || "Service Centre"} - ${order.address.pickupStationAddress}`
      : fullReceiverAddress;

    const payload = {
      SenderDetails: {
        SenderName: senderName,
        SenderPhoneNumber: senderPhone,
        SenderStationId: senderStation.stationId,
        SenderAddress: senderAddress,
        InputtedSenderAddress: senderAddress,
        SenderLocality: senderStation.stationName,
        SenderLocation: {
          Latitude: senderStation.latitude,
          Longitude: senderStation.longitude,
        },
      },
      ReceiverDetails: {
        ReceiverStationId: receiverStation.stationId,
        ReceiverName: order.address.fullName,
        ReceiverPhoneNumber: order.address.phone,
        ReceiverAddress: receiverAddress,
        InputtedReceiverAddress: receiverAddress,
        ReceiverLocation: {
          Latitude: receiverStation.latitude,
          Longitude: receiverStation.longitude,
        },
      },
      ShipmentDetails: {
        VehicleType: totalOrderWeight > 10 ? 2 : 1, // 1: Bike (<=10kg), 2: Van (>10kg)
        IsPriorityShipment: order.shippingMethod === "express",
      },
      ShipmentItems: shipmentItems,
    };

    const response = await giglFetch("/capture/preshipment", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const waybill = response?.data?.Waybill;
    if (!waybill) {
      throw new Error(
        response.message || "GIGL did not return a valid Waybill number.",
      );
    }

    // 4. Update order with generated Waybill
    await ctx.runMutation(internal.gigl.attachOrderWaybillInternal, {
      orderId: args.orderId,
      waybillNumber: String(waybill),
      details: response.data,
      storeId: args.storeId,
    });

    return {
      success: true,
      waybill: String(waybill),
      message: "GIG Logistics shipment created successfully.",
    };
  },
});

/**
 * Track an order's live shipment progress using its GIGL Waybill.
 */
export const trackShipment = action({
  args: {
    waybillNumber: v.string(),
  },
  handler: async (_ctx, args) => {
    if (!args.waybillNumber) {
      throw new Error("Waybill number is required");
    }

    const cleanWaybill = encodeURIComponent(args.waybillNumber.trim());
    const response = await giglFetch(
      `/track/mobileShipment?Waybill=${cleanWaybill}`,
    );

    if (
      response &&
      response.data &&
      Array.isArray(response.data) &&
      response.data[0]
    ) {
      const shipment = response.data[0];
      const trackingScans = shipment.MobileShipmentTrackings || [];

      // Sort scans chronologically ascending
      const sortedScans = [...trackingScans].sort((a: any, b: any) => {
        return (
          new Date(a.DateTimeUtc || a.DateTime).getTime() -
          new Date(b.DateTimeUtc || b.DateTime).getTime()
        );
      });

      const latestScan = sortedScans[sortedScans.length - 1] || null;

      return {
        success: true,
        waybill: shipment.Waybill,
        amount: shipment.Amount,
        latestStatus: latestScan ? latestScan.Status : "MCRT",
        latestIncident: latestScan
          ? latestScan.ScanStatusIncident
          : "Shipment Created",
        latestComment: latestScan
          ? latestScan.ScanStatusComment
          : "Shipment registered with GIG Logistics",
        lastUpdated: latestScan
          ? latestScan.DateTimeUtc || latestScan.DateTime
          : null,
        scans: sortedScans.map((s: any) => ({
          status: s.Status,
          incident: s.ScanStatusIncident || s.ScanStatusReason,
          comment: s.ScanStatusComment,
          location: s.Location || s.DepartureServiceCentre?.Name,
          time: s.DateTimeUtc || s.DateTime,
        })),
      };
    }

    return {
      success: false,
      waybill: args.waybillNumber,
      message: "No tracking records found for this waybill yet.",
      scans: [],
    };
  },
});

// ── Internal Mutations ─────────────────────────────────────

/**
 * Internal mutation to attach a generated GIGL waybill to an order.
 */
export const attachOrderWaybillInternal = internalMutation({
  args: {
    orderId: v.id("orders"),
    waybillNumber: v.string(),
    details: v.any(),
    storeId: v.optional(v.id("stores")),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return;

    const now = Date.now();

    // 1. Direct single-store order check (covers decoupled orders and Beembai store orders)
    const isSingleStore =
      order.storeId !== undefined ||
      order.checkoutId !== undefined ||
      !order.items.some((i) => i.storeId && args.storeId && i.storeId !== args.storeId);

    if (isSingleStore) {
      await ctx.db.patch(args.orderId, {
        waybillNumber: args.waybillNumber,
        giglStatus: "shipped",
        status: "shipped",
        giglShipmentDetails: {
          waybill: args.waybillNumber,
          createdAt: now,
          ...(args.details ? { raw: args.details } : {}),
        },
        statusHistory: [
          ...order.statusHistory,
          {
            status: "shipped",
            timestamp: now,
            message: `Handed to GIG Logistics. Waybill: ${args.waybillNumber}`,
          },
        ],
      });
      return;
    }

    // 2. Legacy fallback for multi-store single-document orders
    const store = args.storeId ? await ctx.db.get(args.storeId) : null;

    const patch = applyShipmentUpdate(order, args.storeId, {
      status: "shipped",
      message: `Handed to GIG Logistics. Waybill: ${args.waybillNumber}`,
      source: "gigl",
      storeLabel: store?.name ?? "Beembai",
      waybillNumber: args.waybillNumber,
      giglStatus: "shipped",
    });

    await ctx.db.patch(args.orderId, {
      ...patch,
      waybillNumber: order.waybillNumber ?? args.waybillNumber,
      giglStatus: order.giglStatus ?? "shipped",
      giglShipmentDetails: order.giglShipmentDetails ?? {
        waybill: args.waybillNumber,
        createdAt: now,
      },
    });
  },
});
