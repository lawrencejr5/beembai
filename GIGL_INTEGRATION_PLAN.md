# GIG Logistics (GIGL) Integration Plan for Beembai

> **Status:** Draft / Ready for Review  
> **Last Updated:** 2026-10-19  
> **Objective:** Integrate GIG Logistics APIs into Beembai for automated real-time shipping fee calculations, waybill generation/preshipment capture, and live order tracking.

---

## 1. Overview & Objectives

Beembai is an e-commerce platform featuring multi-vendor local merchants and Beembai direct import products. We are integrating GIGL to handle:
1. **Dynamic Delivery Fee Calculation:** Quoting live GIGL shipping fees on checkout based on seller pickup location and buyer delivery address.
2. **Waybill & Preshipment Generation:** Creating official GIGL shipment records (`Waybill`) when orders are ready for dispatch.
3. **Real-Time Tracking:** Providing live parcel tracking milestones directly within Beembai for buyers, sellers, and administrators.

---

## 2. GIGL Credentials & API Setup

### Environments
- **Sandbox Base URL:** `https://dev-thirdpartynode.theagilitysystems.com`
- **Production Base URL:** `https://thirdpartynode.theagilitysystems.com`
- **Official Documentation:** [GIG Logistics Readme API Reference](https://gig-logistics.readme.io/reference/getting-started-2)

### Authentication Contract
- Header required on all requests:
  ```http
  access-token: <GIGL_JWT_TOKEN>
  Content-Type: application/json
  ```
- Partner Identifiers:
  - `UserChannelCode`: `ECO038082`
  - `CustomerType`: `0` (Company)
  - `UserActiveCountryId`: `1` (Nigeria)

### Environment Variables Needed
File: `.env.local` & Convex Deployment Secrets
```env
GIGL_BASE_URL="https://dev-thirdpartynode.theagilitysystems.com"
GIGL_USER_CHANNEL_CODE="ECO038082"
GIGL_ACCESS_TOKEN="eyJhbGciOi..."
GIGL_EMAIL="gigtestsystems@gmail.com"
GIGL_PASSWORD="<YOUR_GIGL_PASSWORD>" # Needed to auto-refresh tokens when JWT expires
```

<!-- User Comment Space: Credentials & Setup -->
<!-- Add any notes or restrictions regarding API keys, tokens, or testing limits here -->

---

## 3. Architecture & Data Flow

```
[Storefront Checkout]
   │
   ├─► 1. Buyer selects/enters Shipping Address
   │
   ├─► 2. Call `api.gigl.calculateCheckoutShippingFee`
   │      - Group cart items by store
   │      - Call GIGL `/price/v3` or `/price`
   │      - Returns live shipping fee breakdown
   │
   ├─► 3. Buyer pays total (Subtotal + Shipping) via Paystack
   │
   └─► 4. Order created in Convex (`status: "placed"`, `paymentStatus: "paid"`)
          │
          ▼
[Order Fulfillment / Seller Dashboard]
   │
   ├─► 5. Seller packs item and clicks "Dispatch with GIGL"
   │
   ├─► 6. Call `api.gigl.createShipmentForOrder`
   │      - POST `/capture/preshipment`
   │      - Returns GIGL Waybill Number (e.g. "1349107274")
   │
   └─► 7. Order updated: `waybillNumber`, status: `"shipped"`
          │
          ▼
[Live Tracking (Buyer & Seller)]
   │
   └─► 8. Query `api.gigl.trackOrderShipment`
          - GET `/track/mobileShipment?waybill={waybill}`
          - Render timeline: Picked up -> In transit -> Out for delivery -> Delivered
```

---

## 4. Database Schema Updates (`convex/schema.ts`)

### A. Updates to `orders` table
```typescript
orders: defineTable({
  // ... existing fields ...

  // GIGL Integration Fields
  waybillNumber: v.optional(v.string()), // Primary waybill number
  giglShipmentDetails: v.optional(
    v.object({
      waybill: v.string(),
      pickupCharge: v.optional(v.number()),
      deliveryPrice: v.optional(v.number()),
      estimatedDelivery: v.optional(v.string()),
      vehicleType: v.optional(v.number()),
      createdAt: v.number(),
    })
  ),
  // For multi-vendor orders with separate store dispatches:
  vendorWaybills: v.optional(
    v.array(
      v.object({
        storeId: v.id("stores"),
        waybillNumber: v.string(),
        status: v.string(),
      })
    )
  ),
  giglLastScanStatus: v.optional(v.string()), // e.g., "MPIK", "WC", "SHD"
  giglLastScanReason: v.optional(v.string()), // Human-readable status description
})
```

### B. Updates to `stores` table (Pickup Location Details)
Stores already have `physicalAddress`, `city`, `lga`, `stateName`, `phone`.
We may optionally add:
```typescript
stores: defineTable({
  // ... existing fields ...
  giglStationId: v.optional(v.number()), // Cached GIGL Station ID
  latitude: v.optional(v.number()),
  longitude: v.optional(v.number()),
})
```

<!-- User Comment Space: Schema -->
<!-- Add any specific fields or constraints you'd like on orders/stores here -->

---

## 5. Location & Station Resolution Strategy

GIGL requires either coordinates (`Latitude`, `Longitude`) or Station IDs (`SenderStationId`, `ReceiverStationId`).

### Strategy:
1. **Station Master Data:**
   - Call GIGL `GET /localstations/get` and cache active Nigerian stations.
   - We will provide a helper that maps Nigerian states & major cities (Lagos, Abuja, Port Harcourt, Kano, Ibadan, etc.) to their matching GIGL Station IDs.
2. **Coordinate Fallback:**
   - If an address contains a locality/city, we map it to standard regional coordinates or use geocoding so GIGL's `/price/v3` calculation does not fail.

<!-- User Comment Space: Locations & Stations -->
<!-- Let us know if you want automatic station matching by state/city or GPS coordinate geocoding -->

---

## 6. Detailed Implementation Phases

### Phase 1: Convex GIGL Engine (`convex/gigl.ts`)
- [ ] Create `convex/gigl.ts` with typed helpers and response parsers.
- [ ] Implement `giglFetch()` utility to automatically handle `access-token`, JSON headers, and timeout handling.
- [ ] Add `calculateShippingPrice` action:
  - Calls `POST /price/v3`
  - Calculates cost based on package weight (defaulting to 1kg if unstated), declared value, and origin/destination.
- [ ] Add `capturePreshipment` action:
  - Calls `POST /capture/preshipment`
  - Sends Sender details (Seller store) & Receiver details (Buyer).
  - Receives and saves Waybill number.
- [ ] Add `trackShipment` action:
  - Calls `GET /track/mobileShipment?waybill={waybill}`
  - Parses scan history codes (`MCRT`, `MPIK`, `APT`, `WC`, `SHD`).
- [ ] Add `getLocalStations` query/action:
  - Calls `GET /localstations/get` for station lookups.

### Phase 2: Checkout Dynamic Pricing (`app/(storefront)/checkout/page.tsx`)
- [ ] Replace static `$10` / `$15` shipping rule with real GIGL quote query.
- [ ] Debounce address input / address selection so fee calculates cleanly when:
  - Buyer chooses a saved address.
  - Buyer enters City/State in guest address fields.
- [ ] Display shipping fee breakdown (Delivery Fee + Estimated delivery time) in the checkout order summary.
- [ ] Pass the verified GIGL shipping fee into `createUnpaidOrder` so total charged on Paystack matches the exact quote.

### Phase 3: Seller Order Dispatch & Waybill Generation (`app/(sell)/sell/orders/[id]/page.tsx`)
- [ ] Update Seller Order page:
  - Add a dedicated **"Dispatch with GIGL"** or **"Generate Waybill"** card.
  - Display Sender (Seller Store) address summary and Receiver (Buyer) address summary.
- [ ] Add action button to trigger `capturePreshipment`.
- [ ] When waybill is generated:
  - Display the Waybill number with copy button.
  - Provide a **"Print Shipping Label / Dispatch Note"** view or modal.
  - Automatically advance order status to `"shipped"`.

### Phase 4: Buyer Live Tracking (`app/(storefront)/orders/page.tsx`)
- [ ] Update the order card & tracking modal:
  - Show the GIGL Waybill number with an external link to GIGL tracking or internal live timeline.
- [ ] Render live GIGL milestone scans:
  - **Shipment Created:** GIGL dispatch created by seller.
  - **Picked Up:** Courier collected package from seller.
  - **In Transit / Hub:** Moving through GIGL sorting center.
  - **Out for Delivery:** With final delivery courier.
  - **Delivered:** Successfully delivered to buyer.

### Phase 5: Admin Logistics Oversight (`app/(admin)/admin/orders/[id]/page.tsx`)
- [ ] Allow platform admins to view all generated waybills across all sellers.
- [ ] Admin manual override: ability to re-trigger shipment booking or cancel preshipment (`POST /cancel/preshipment`) if an order is cancelled or refunded.

---

## 7. Multi-Vendor Handling (Crucial Design Decision)

### The Marketplace Nuance:
In Beembai, a customer can add items from **Store A (Lagos)** and **Store B (Port Harcourt)** into a single cart.

### Options:
- **Option 1 (Per-Vendor Split Shipments - Recommended):**
  - Group cart items by `storeId`.
  - Calculate GIGL shipping for each distinct vendor location to the buyer's address.
  - Total Shipping Fee = Sum of all vendor shipping fees.
  - Each vendor gets their own distinct Waybill when they dispatch their portion.
- **Option 2 (Single Warehouse / Beembai Central Fulfillment):**
  - If all goods route through a central Beembai hub before going to the buyer.
  - Only one waybill needed (Hub -> Buyer).

<!-- User Comment Space: Multi-Vendor Preference -->
<!-- Please specify if Beembai items ship directly from individual sellers (Option 1) or central hub (Option 2) -->

---

## 8. Immediate Next Step

Once you review and comment on this plan:
1. We will create [`convex/gigl.ts`](file:///c:/Users/DELL/OneDrive/dev/beembai/convex/gigl.ts) and run an initial test against GIGL sandbox to verify fee calculation between sample addresses.
2. We will connect the checkout page to display live quotes.
