# Task List

## Backend
- [x] convex/schema.ts — add `isImportOrder` to orders table
- [x] convex/beembaiStore.ts — new file (ensureBeembaiStore, getBeembaiStore, updateBeembaiStore, getBeembaiStoreOrders, getBeembaiStoreProducts, backfillForeignProducts)
  - [x] Add getBeembaiStoreAnalytics query
- [x] convex/products.ts — createForeignProduct sets storeId from ensureBeembaiStore
- [x] convex/orders.ts — createUnpaidOrder sets isImportOrder flag
- [x] convex/admin.ts — getAllOrdersAdmin gets isImportOrder filter; getDashboardStats adds beembaiOrders count
- [x] Convex Backend — Filter out placed but unpaid orders
  - [x] Update `convex/orders.ts` (getSellerOrdersAllStores, getOrdersForStore)
  - [x] Update `convex/beembaiStore.ts` (getBeembaiStoreOrders, getBeembaiStoreAnalytics)
  - [x] Update `convex/admin.ts` (getAllOrdersAdmin, getDashboardStats)

## Admin Frontend
- [x] app/(admin)/admin/layout.tsx — ensureBeembaiStore on mount + Beembai HQ sidebar section
- [x] app/(admin)/admin/beembai/orders/page.tsx — NEW import orders list
- [x] app/(admin)/admin/beembai/orders/[id]/page.tsx — NEW import order detail
- [x] app/(admin)/admin/beembai/products/page.tsx — Refactor products list and modal
- [x] app/(admin)/admin/beembai/products/[id]/page.tsx — NEW Beembai product details page
- [x] app/(admin)/admin/beembai/page.tsx — NEW Beembai Overview console
- [x] app/(admin)/admin/page.tsx — Add button with new orders badge
- [x] app/(admin)/admin/beembai/settings/page.tsx — NEW store settings
- [x] app/(admin)/admin/orders/page.tsx — add type filter + 🇺🇸 badge
