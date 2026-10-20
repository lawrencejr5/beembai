import { action, mutation, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Master GIGL Station & Geolocation Lookup Table ─────────

export interface GIGLStationInfo {
  stationId: number;
  stationName: string;
  stateName: string;
  latitude: number;
  longitude: number;
}

export const GIGL_STATIONS: Record<string, GIGLStationInfo> = {
  lagos: {
    stationId: 4,
    stationName: "LAGOS",
    stateName: "LAGOS",
    latitude: 6.5244,
    longitude: 3.3792,
  },
  abuja: {
    stationId: 3,
    stationName: "ABUJA",
    stateName: "FCT",
    latitude: 9.0765,
    longitude: 7.3986,
  },
  fct: {
    stationId: 3,
    stationName: "ABUJA",
    stateName: "FCT",
    latitude: 9.0765,
    longitude: 7.3986,
  },
  rivers: {
    stationId: 30,
    stationName: "PORT HARCOURT",
    stateName: "RIVERS",
    latitude: 4.8156,
    longitude: 7.0498,
  },
  "port harcourt": {
    stationId: 30,
    stationName: "PORT HARCOURT",
    stateName: "RIVERS",
    latitude: 4.8156,
    longitude: 7.0498,
  },
  oyo: {
    stationId: 14,
    stationName: "IBADAN",
    stateName: "OYO",
    latitude: 7.3775,
    longitude: 3.947,
  },
  ibadan: {
    stationId: 14,
    stationName: "IBADAN",
    stateName: "OYO",
    latitude: 7.3775,
    longitude: 3.947,
  },
  ogun: {
    stationId: 2,
    stationName: "ABEOKUTA",
    stateName: "OGUN",
    latitude: 7.1557,
    longitude: 3.3451,
  },
  abeokuta: {
    stationId: 2,
    stationName: "ABEOKUTA",
    stateName: "OGUN",
    latitude: 7.1557,
    longitude: 3.3451,
  },
  "ijebu ode": {
    stationId: 42,
    stationName: "IJEBU-ODE",
    stateName: "OGUN",
    latitude: 6.8206,
    longitude: 3.9208,
  },
  edo: {
    stationId: 6,
    stationName: "BENIN",
    stateName: "EDO",
    latitude: 6.335,
    longitude: 5.6037,
  },
  benin: {
    stationId: 6,
    stationName: "BENIN",
    stateName: "EDO",
    latitude: 6.335,
    longitude: 5.6037,
  },
  delta: {
    stationId: 7,
    stationName: "ASABA",
    stateName: "DELTA",
    latitude: 6.1984,
    longitude: 6.7327,
  },
  asaba: {
    stationId: 7,
    stationName: "ASABA",
    stateName: "DELTA",
    latitude: 6.1984,
    longitude: 6.7327,
  },
  warri: {
    stationId: 34,
    stationName: "WARRI",
    stateName: "DELTA",
    latitude: 5.5174,
    longitude: 5.7501,
  },
  anambra: {
    stationId: 28,
    stationName: "ONITSHA",
    stateName: "ANAMBRA",
    latitude: 6.1498,
    longitude: 6.7858,
  },
  onitsha: {
    stationId: 28,
    stationName: "ONITSHA",
    stateName: "ANAMBRA",
    latitude: 6.1498,
    longitude: 6.7858,
  },
  awka: {
    stationId: 9,
    stationName: "AWKA",
    stateName: "ANAMBRA",
    latitude: 6.2209,
    longitude: 7.072,
  },
  nnewi: {
    stationId: 45,
    stationName: "NNEWI",
    stateName: "ANAMBRA",
    latitude: 6.0199,
    longitude: 6.917,
  },
  enugu: {
    stationId: 13,
    stationName: "ENUGU",
    stateName: "ENUGU",
    latitude: 6.4584,
    longitude: 7.5464,
  },
  imo: {
    stationId: 29,
    stationName: "OWERRI",
    stateName: "IMO",
    latitude: 5.4833,
    longitude: 7.0333,
  },
  owerri: {
    stationId: 29,
    stationName: "OWERRI",
    stateName: "IMO",
    latitude: 5.4833,
    longitude: 7.0333,
  },
  kano: {
    stationId: 20,
    stationName: "KANO",
    stateName: "KANO",
    latitude: 12.0022,
    longitude: 8.592,
  },
  kaduna: {
    stationId: 19,
    stationName: "KADUNA",
    stateName: "KADUNA",
    latitude: 10.5105,
    longitude: 7.4165,
  },
  zaria: {
    stationId: 36,
    stationName: "ZARIA",
    stateName: "KADUNA",
    latitude: 11.0855,
    longitude: 7.7199,
  },
  "akwa ibom": {
    stationId: 33,
    stationName: "UYO",
    stateName: "AKWA IBOM",
    latitude: 5.0377,
    longitude: 7.9128,
  },
  uyo: {
    stationId: 33,
    stationName: "UYO",
    stateName: "AKWA IBOM",
    latitude: 5.0377,
    longitude: 7.9128,
  },
  "cross river": {
    stationId: 11,
    stationName: "CALABAR",
    stateName: "CROSS RIVER",
    latitude: 4.9757,
    longitude: 8.3417,
  },
  calabar: {
    stationId: 11,
    stationName: "CALABAR",
    stateName: "CROSS RIVER",
    latitude: 4.9757,
    longitude: 8.3417,
  },
  kwara: {
    stationId: 17,
    stationName: "ILORIN",
    stateName: "KWARA",
    latitude: 8.4966,
    longitude: 4.5421,
  },
  ilorin: {
    stationId: 17,
    stationName: "ILORIN",
    stateName: "KWARA",
    latitude: 8.4966,
    longitude: 4.5421,
  },
  ondo: {
    stationId: 5,
    stationName: "AKURE",
    stateName: "ONDO",
    latitude: 7.2571,
    longitude: 5.2058,
  },
  akure: {
    stationId: 5,
    stationName: "AKURE",
    stateName: "ONDO",
    latitude: 7.2571,
    longitude: 5.2058,
  },
  osun: {
    stationId: 47,
    stationName: "OSOGBO",
    stateName: "OSUN",
    latitude: 7.7827,
    longitude: 4.5418,
  },
  osogbo: {
    stationId: 47,
    stationName: "OSOGBO",
    stateName: "OSUN",
    latitude: 7.7827,
    longitude: 4.5418,
  },
  plateau: {
    stationId: 18,
    stationName: "JOS",
    stateName: "PLATEAU",
    latitude: 9.8965,
    longitude: 8.8583,
  },
  jos: {
    stationId: 18,
    stationName: "JOS",
    stateName: "PLATEAU",
    latitude: 9.8965,
    longitude: 8.8583,
  },
  benue: {
    stationId: 25,
    stationName: "MAKURDI",
    stateName: "BENUE",
    latitude: 7.7322,
    longitude: 8.5391,
  },
  makurdi: {
    stationId: 25,
    stationName: "MAKURDI",
    stateName: "BENUE",
    latitude: 7.7322,
    longitude: 8.5391,
  },
  abia: {
    stationId: 1,
    stationName: "ABA",
    stateName: "ABIA",
    latitude: 5.1066,
    longitude: 7.3667,
  },
  aba: {
    stationId: 1,
    stationName: "ABA",
    stateName: "ABIA",
    latitude: 5.1066,
    longitude: 7.3667,
  },
  umuahia: {
    stationId: 50,
    stationName: "UMUAHIA",
    stateName: "ABIA",
    latitude: 5.5263,
    longitude: 7.4896,
  },
  bayelsa: {
    stationId: 51,
    stationName: "YENAGOA",
    stateName: "BAYELSA",
    latitude: 4.9267,
    longitude: 6.2676,
  },
  yenagoa: {
    stationId: 51,
    stationName: "YENAGOA",
    stateName: "BAYELSA",
    latitude: 4.9267,
    longitude: 6.2676,
  },
  ebonyi: {
    stationId: 37,
    stationName: "ABAKALIKI",
    stateName: "EBONYI",
    latitude: 6.3249,
    longitude: 8.1137,
  },
  abakaliki: {
    stationId: 37,
    stationName: "ABAKALIKI",
    stateName: "EBONYI",
    latitude: 6.3249,
    longitude: 8.1137,
  },
  ekiti: {
    stationId: 38,
    stationName: "ADO EKITI",
    stateName: "EKITI",
    latitude: 7.6211,
    longitude: 5.2212,
  },
  "ado ekiti": {
    stationId: 38,
    stationName: "ADO EKITI",
    stateName: "EKITI",
    latitude: 7.6211,
    longitude: 5.2212,
  },
  kogi: {
    stationId: 23,
    stationName: "LOKOJA",
    stateName: "KOGI",
    latitude: 7.8023,
    longitude: 6.743,
  },
  lokoja: {
    stationId: 23,
    stationName: "LOKOJA",
    stateName: "KOGI",
    latitude: 7.8023,
    longitude: 6.743,
  },
  niger: {
    stationId: 26,
    stationName: "MINNA",
    stateName: "NIGER",
    latitude: 9.6139,
    longitude: 6.5569,
  },
  minna: {
    stationId: 26,
    stationName: "MINNA",
    stateName: "NIGER",
    latitude: 9.6139,
    longitude: 6.5569,
  },
  nasarawa: {
    stationId: 44,
    stationName: "LAFIA",
    stateName: "NASARAWA",
    latitude: 8.4932,
    longitude: 8.5153,
  },
  lafia: {
    stationId: 44,
    stationName: "LAFIA",
    stateName: "NASARAWA",
    latitude: 8.4932,
    longitude: 8.5153,
  },
  bauchi: {
    stationId: 10,
    stationName: "BAUCHI",
    stateName: "BAUCHI",
    latitude: 10.3158,
    longitude: 9.8442,
  },
  borno: {
    stationId: 24,
    stationName: "MAIDUGURI",
    stateName: "BORNO",
    latitude: 11.8333,
    longitude: 13.15,
  },
  maiduguri: {
    stationId: 24,
    stationName: "MAIDUGURI",
    stateName: "BORNO",
    latitude: 11.8333,
    longitude: 13.15,
  },
  gombe: {
    stationId: 368,
    stationName: "GOMBE",
    stateName: "GOMBE",
    latitude: 10.2897,
    longitude: 11.1673,
  },
  taraba: {
    stationId: 57,
    stationName: "JALINGO",
    stateName: "TARABA",
    latitude: 8.8937,
    longitude: 11.3596,
  },
  jalingo: {
    stationId: 57,
    stationName: "JALINGO",
    stateName: "TARABA",
    latitude: 8.8937,
    longitude: 11.3596,
  },
  adamawa: {
    stationId: 52,
    stationName: "YOLA",
    stateName: "ADAMAWA",
    latitude: 9.2004,
    longitude: 12.4836,
  },
  yola: {
    stationId: 52,
    stationName: "YOLA",
    stateName: "ADAMAWA",
    latitude: 9.2004,
    longitude: 12.4836,
  },
  sokoto: {
    stationId: 49,
    stationName: "SOKOTO",
    stateName: "SOKOTO",
    latitude: 13.0059,
    longitude: 5.2476,
  },
  katsina: {
    stationId: 43,
    stationName: "KATSINA",
    stateName: "KATSINA",
    latitude: 12.9908,
    longitude: 7.6018,
  },
  jigawa: {
    stationId: 55,
    stationName: "DUTSE",
    stateName: "JIGAWA",
    latitude: 11.7562,
    longitude: 9.339,
  },
  dutse: {
    stationId: 55,
    stationName: "DUTSE",
    stateName: "JIGAWA",
    latitude: 11.7562,
    longitude: 9.339,
  },
  zamfara: {
    stationId: 62,
    stationName: "GUSAU",
    stateName: "ZAMFARA",
    latitude: 12.1628,
    longitude: 6.6614,
  },
  gusau: {
    stationId: 62,
    stationName: "GUSAU",
    stateName: "ZAMFARA",
    latitude: 12.1628,
    longitude: 6.6614,
  },
};

/**
 * Resolves an address input string or state/city to a known GIGL Station and GPS coordinates.
 */
export function resolveGIGLStation(stateOrCity?: string): GIGLStationInfo {
  if (!stateOrCity) {
    return GIGL_STATIONS["lagos"];
  }

  const clean = stateOrCity.toLowerCase().trim();

  // Exact match
  if (GIGL_STATIONS[clean]) {
    return GIGL_STATIONS[clean];
  }

  // Partial match
  for (const [key, station] of Object.entries(GIGL_STATIONS)) {
    if (clean.includes(key) || key.includes(clean)) {
      return station;
    }
  }

  // Default fallback to Lagos headquarters
  return GIGL_STATIONS["lagos"];
}

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

    // Check if waybill is already generated
    if (order.waybillNumber) {
      return {
        success: true,
        waybill: order.waybillNumber,
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
        senderAddress = [store.physicalAddress, store.city, store.stateName]
          .filter(Boolean)
          .join(", ");
        senderState = store.stateName || "Lagos";
      }
    }

    const senderStation = resolveGIGLStation(senderState);
    const receiverStation = resolveGIGLStation(
      order.address?.stateName || order.address?.city,
    );

    // 3. Format shipment items (consolidated package with aggregated weight)
    const totalOrderWeight = Math.max(
      0.1,
      Number(
        order.items
          .reduce((sum: number, item: any) => {
            const w = typeof item.weight === "number" ? item.weight : 0.5;
            return sum + w * (item.quantity || 1);
          }, 0)
          .toFixed(2),
      ),
    );

    const totalOrderValue = Math.max(
      100,
      order.totalAmount ||
        order.items.reduce(
          (sum: number, item: any) =>
            sum + item.price * (item.quantity || 1),
          0,
        ),
    );

    const totalItemCount = order.items.reduce(
      (sum: number, i: any) => sum + (i.quantity || 1),
      0,
    );
    const itemsSummary = order.items
      .map((i: any) => `${i.quantity || 1}x ${i.title.slice(0, 30)}`)
      .join(", ");

    const shipmentItems = [
      {
        ItemName:
          order.items.length === 1
            ? order.items[0].title.slice(0, 50)
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
    const statusMsg = `Shipped via GIG Logistics. Waybill Number: ${args.waybillNumber}`;

    await ctx.db.patch(args.orderId, {
      waybillNumber: args.waybillNumber,
      giglStatus: "shipped",
      giglShipmentDetails: {
        waybill: args.waybillNumber,
        createdAt: now,
      },
      status: "shipped",
      statusHistory: [
        ...order.statusHistory,
        {
          status: "shipped",
          timestamp: now,
          message: statusMsg,
        },
      ],
    });
  },
});
