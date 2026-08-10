"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import styles from "../sell.module.css";
import homeStyles from "@/app/page.module.css";
import { formatNumber } from "@/app/data/data";
import { useCart } from "@/app/context/CartContext";
import UserMenu from "@/app/components/UserMenu";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// ─── Icons ──────────────────────────────────────────────────────────────────

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 2h2.5l2.6 12.4a2 2 0 002 1.6h9.8a2 2 0 002-1.6l1.7-8.4H5.5" />
    <circle cx="9" cy="20" r="1.5" fill="currentColor" />
    <circle cx="18" cy="20" r="1.5" fill="currentColor" />
  </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.72-12.72l-1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const VerifiedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.454 1.358 4.49 4.49 0 011.358 3.454 4.49 4.49 0 011.549 3.397c0 1.357-.6 2.573-1.549 3.397a4.49 4.49 0 01-1.358 3.454 4.49 4.49 0 01-3.454 1.358A4.49 4.49 0 0112 21.75c-1.357 0-2.573-.6-3.397-1.549a4.49 4.49 0 01-3.454-1.358 4.49 4.49 0 01-1.358-3.454 4.49 4.49 0 01-1.549-3.397c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.358-3.454 4.49 4.49 0 013.454-1.358zM16.03 9.47a.75.75 0 00-1.06-1.06l-4.47 4.47-1.97-1.97a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.06 0l5-5z" clipRule="evenodd" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// ─── Helper ──────────────────────────────────────────────────────────────────

const getStoreInitials = (name: string): string => {
  const cleanName = name.replace(/['''"&]/g, "").trim();
  const words = cleanName.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return "ST";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

// ─── Add Product Modal ────────────────────────────────────────────────────────

function AddProductModal({ storeName, onClose }: { storeName: string; onClose: () => void }) {
  const [productTitle, setProductTitle] = useState("");
  const [productCategory, setProductCategory] = useState("Phone & Tablets");
  const [productPrice, setProductPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productCondition, setProductCondition] = useState("New");
  const [productColors, setProductColors] = useState("");
  const [productStock, setProductStock] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productTitle.trim() || !productPrice.trim()) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsSubmitting(false);
    setSubmitted(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className={styles.modalBackdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.productModal}>
        <div className={styles.productModalHeader}>
          <div>
            <h2 className={styles.productModalTitle}>Add New Product</h2>
            <p className={styles.productModalSubtitle}>Listing to <strong>{storeName}</strong></p>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "2rem 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <div className={styles.successTickCircle} style={{ width: 60, height: 60 }}><CheckCircleIcon /></div>
            <p style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--color-papyrus)" }}>Product added successfully!</p>
            <p style={{ fontSize: "0.85rem", color: "var(--color-olive-gray)" }}>Your listing will appear shortly.</p>
          </div>
        ) : (
          <form className={styles.modalForm} onSubmit={handleSubmit}>
            <div className={styles.modalFormGroup}>
              <label className={styles.modalFormLabel}>Product Title *</label>
              <input className={styles.modalInput} type="text" required placeholder="e.g. iPhone 15 Pro Max 256GB" value={productTitle} onChange={(e) => setProductTitle(e.target.value)} />
            </div>

            <div className={styles.modalFormRow}>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>Category *</label>
                <select className={styles.modalSelect} value={productCategory} onChange={(e) => setProductCategory(e.target.value)}>
                  <option value="Phone & Tablets">Phone &amp; Tablets</option>
                  <option value="Gadgets & Accessories">Gadgets &amp; Accessories</option>
                  <option value="Apparel & Fashion">Apparel &amp; Fashion</option>
                  <option value="Furniture & Living">Furniture &amp; Living</option>
                  <option value="Beauty & Care">Beauty &amp; Care</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Home Appliances">Home Appliances</option>
                </select>
              </div>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>Condition</label>
                <select className={styles.modalSelect} value={productCondition} onChange={(e) => setProductCondition(e.target.value)}>
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Used - Good">Used – Good</option>
                  <option value="Used - Fair">Used – Fair</option>
                  <option value="Refurbished">Refurbished</option>
                </select>
              </div>
            </div>

            <div className={styles.modalFormRow}>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>Sale Price (₦) *</label>
                <div className={styles.modalPriceWrapper}>
                  <span className={styles.modalPriceSymbol}>₦</span>
                  <input className={`${styles.modalInput} ${styles.modalPriceInput}`} type="number" required min="0" placeholder="0.00" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} />
                </div>
              </div>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>Original Price (₦)</label>
                <div className={styles.modalPriceWrapper}>
                  <span className={styles.modalPriceSymbol}>₦</span>
                  <input className={`${styles.modalInput} ${styles.modalPriceInput}`} type="number" min="0" placeholder="0.00" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} />
                </div>
              </div>
            </div>

            <div className={styles.modalFormRow}>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>Stock Quantity</label>
                <input className={styles.modalInput} type="number" min="0" placeholder="e.g. 50" value={productStock} onChange={(e) => setProductStock(e.target.value)} />
              </div>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>Available Colors</label>
                <input className={styles.modalInput} type="text" placeholder="e.g. Black, White, Gold" value={productColors} onChange={(e) => setProductColors(e.target.value)} />
                <span className={styles.modalColorsHint}>Separate each color with a comma</span>
              </div>
            </div>

            <div className={styles.modalFormGroup}>
              <label className={styles.modalFormLabel}>Product Description</label>
              <textarea className={styles.modalTextarea} placeholder="Describe your product — features, specifications, what makes it special..." value={productDesc} onChange={(e) => setProductDesc(e.target.value)} />
            </div>

            <div className={styles.modalBtnGroup}>
              <button type="button" className={styles.modalCancelBtn} onClick={onClose}>Cancel</button>
              <button type="submit" className={styles.modalSubmitBtn} disabled={isSubmitting || !productTitle.trim() || !productPrice.trim()}>
                {isSubmitting ? "Adding..." : "Add Product"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Store Owner Dashboard ───────────────────────────────────────────────────

type StoreType = NonNullable<ReturnType<typeof useQuery<typeof api.store.getStoreBySlugForOwner>>>;

function ApprovedDashboard({ store, allStores }: { store: StoreType; allStores: StoreType[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const storeProducts = useQuery(api.store.getProductsByStore, { storeId: store._id });

  const filteredProducts = useMemo(() => {
    if (!storeProducts) return [];
    if (!searchQuery.trim()) return storeProducts;
    const q = searchQuery.toLowerCase();
    return storeProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.tag && p.tag.toLowerCase().includes(q))
    );
  }, [storeProducts, searchQuery]);

  const hasBanner = !!store.banner;

  return (
    <>
      {/* Store Selector Pill Bar */}
      <div className={styles.storeSelectorBar}>
        {allStores.map((s) => {
          const isActive = s._id === store._id;
          const isPending = s.status === "pending";
          return (
            <button
              key={s._id}
              type="button"
              onClick={() => router.push(`/sell/${s.slug}`)}
              className={`${styles.storePill} ${isActive ? styles.storePillActive : ""} ${isPending && !isActive ? styles.storePillPending : ""}`}
            >
              {isPending && !isActive && <span style={{ fontSize: "0.7rem" }}>⏳</span>}
              {s.name}
            </button>
          );
        })}
        <button type="button" className={styles.newStorePill} onClick={() => router.push("/sell/new")}>
          <span style={{ fontSize: "1.05rem", lineHeight: 1 }}>+</span>
          Create New Store
        </button>
      </div>

      {/* Dashboard Content */}
      <div className={styles.dashboardWrapper}>
        {/* Banner */}
        <div className={styles.dashBanner} style={hasBanner ? { backgroundImage: `url('${store.banner}')` } : {}}>
          {!hasBanner && <div className={styles.dashBannerGradient} />}
          <div className={styles.dashBannerOverlay} />
          <button type="button" className={styles.editBannerBtn} title="Update store banner image">
            <span>🖼</span>
            Edit Banner
          </button>
        </div>

        {/* Store Header */}
        <div className={styles.dashStoreHeader}>
          <div className={styles.dashLogoWrap}>
            <div className={styles.dashLogoContainer}>
              {store.logo ? (
                <Image src={store.logo} alt={store.name} width={130} height={130} className={styles.dashLogoImage} />
              ) : (
                <span className={styles.dashLogoInitials}>{getStoreInitials(store.name)}</span>
              )}
            </div>
            <button type="button" className={styles.editLogoBtn} title="Update store logo" aria-label="Edit store logo">✏</button>
          </div>

          <div className={styles.dashMetaBlock}>
            <div className={styles.dashBadgeRow}>
              <span className={styles.dashCategoryTag}>{store.category}</span>
              {store.verified && (
                <span className={styles.dashVerifiedLabel}><VerifiedIcon /><span>Verified Store</span></span>
              )}
              <span className={styles.dashApprovedBadge}>✓ Approved</span>
            </div>
            <h1 className={styles.dashStoreName}>{store.name}</h1>
            <div className={styles.dashRatingRow}>
              <span className={styles.dashStarIcon}><StarIcon /></span>
              <span className={styles.dashRatingValue}>{store.rating.toFixed(1)} / 5.0 rating</span>
            </div>
          </div>
        </div>

        {/* Bio & Stats */}
        <div className={styles.dashBioSection}>
          <div className={styles.dashBioContent}>
            <h2 className={styles.dashSectionTitle}>About the Brand</h2>
            <p className={styles.dashBioText}>{store.description}</p>
          </div>
          <div className={styles.dashStatsSidebar}>
            <h3 className={styles.dashSectionTitle} style={{ fontSize: "1rem" }}>Store Details</h3>
            <div className={styles.dashStatRow}>
              <span className={styles.dashStatLabel}>Products Listed</span>
              <span className={styles.dashStatValue}>{storeProducts ? storeProducts.length : "—"} items</span>
            </div>
            <div className={styles.dashStatRow}>
              <span className={styles.dashStatLabel}>City</span>
              <span className={styles.dashStatValue}>{store.city || "—"}</span>
            </div>
            <div className={styles.dashStatRow}>
              <span className={styles.dashStatLabel}>Avg Shipping</span>
              <span className={styles.dashStatValue}>1 – 3 Days</span>
            </div>
            <div className={styles.dashStatRow}>
              <span className={styles.dashStatLabel}>Response Rate</span>
              <span className={styles.dashStatValue}>99% (Excellent)</span>
            </div>
          </div>
        </div>

        {/* Catalog Header */}
        <div className={styles.dashInventoryHeader}>
          <div className={styles.dashInventoryLeft}>
            <h2 className={styles.dashInventoryTitle}>
              My Catalog {filteredProducts.length > 0 && `(${filteredProducts.length})`}
            </h2>
            <p className={styles.dashInventorySubtitle}>Manage and list products in your store</p>
          </div>
          <div className={styles.dashInventoryActions}>
            <div className={styles.dashInventorySearch}>
              <span className={styles.dashSearchIcon}><SearchIcon /></span>
              <input
                id="catalog-search"
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.dashSearchInput}
              />
            </div>
            <button id="add-product-btn" type="button" className={styles.addProductBtn} onClick={() => setShowAddModal(true)}>
              <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span>
              Add Product
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {storeProducts === undefined ? (
          <div className={styles.dashEmptyState}>
            <span className={styles.dashEmptyIcon}>⏳</span>
            <p className={styles.dashEmptyTitle}>Loading your catalog...</p>
          </div>
        ) : (
          <div className={styles.ownerProductsGrid}>
            {/* Add Product Card */}
            <button id="add-product-card" type="button" className={styles.addProductCard} onClick={() => setShowAddModal(true)}>
              <div className={styles.addProductIconCircle}>+</div>
              <span className={styles.addProductCardTitle}>Add New Product</span>
              <span className={styles.addProductCardSub}>Click to list a new item in your store</span>
            </button>

            {filteredProducts.length === 0 && !searchQuery && (
              <div className={styles.dashEmptyState} style={{ gridColumn: "2 / -1" }}>
                <span className={styles.dashEmptyIcon}>📦</span>
                <p className={styles.dashEmptyTitle}>No products listed yet</p>
                <p className={styles.dashEmptySubtitle}>Add your first product using the card on the left to start selling on Beembai.</p>
              </div>
            )}

            {filteredProducts.length === 0 && searchQuery && (
              <div className={styles.dashEmptyState} style={{ gridColumn: "2 / -1" }}>
                <span className={styles.dashEmptyIcon}>🔍</span>
                <p className={styles.dashEmptyTitle}>No results for &ldquo;{searchQuery}&rdquo;</p>
                <p className={styles.dashEmptySubtitle}>Try a different search term or clear the search.</p>
              </div>
            )}

            {filteredProducts.map((product) => (
              <div
                key={product._id}
                style={{
                  background: "var(--color-cream)", border: "1.5px solid var(--color-border)",
                  borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div style={{ width: "100%", aspectRatio: "1", background: "var(--color-sand)", position: "relative", overflow: "hidden" }}>
                  {product.image && (
                    <Image src={product.image} alt={product.title} fill sizes="(max-width: 640px) 50vw, 25vw" style={{ objectFit: "cover" }} />
                  )}
                  {product.tag && (
                    <span style={{ position: "absolute", top: 10, left: 10, background: "var(--color-palm)", color: "#fff", fontSize: "0.65rem", fontWeight: 800, padding: "0.2rem 0.55rem", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {product.tag}
                    </span>
                  )}
                </div>
                <div style={{ padding: "1rem 1rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-olive-gray)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{product.categoryName}</p>
                  <p style={{ fontSize: "0.93rem", fontWeight: 800, color: "var(--color-papyrus)", lineHeight: 1.3 }}>{product.title}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "auto", paddingTop: "0.5rem" }}>
                    <span style={{ fontWeight: 900, fontSize: "1rem", color: "var(--color-palm)" }}>₦{formatNumber(product.price)}</span>
                    {product.originalPrice && (
                      <span style={{ fontSize: "0.8rem", color: "var(--color-olive-gray)", textDecoration: "line-through" }}>₦{formatNumber(product.originalPrice)}</span>
                    )}
                  </div>
                  {product.stock !== undefined && (
                    <p style={{ fontSize: "0.75rem", color: product.stock > 0 ? "var(--color-palm)" : "#d93838", fontWeight: 700 }}>
                      {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && <AddProductModal storeName={store.name} onClose={() => setShowAddModal(false)} />}
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function StoreOwnerDashboardPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { totalItemsCount, cartBounce } = useCart();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const store = useQuery(api.store.getStoreBySlugForOwner, { slug });
  const allStores = useQuery(api.store.getStoresByOwner);

  useEffect(() => {
    const activeTheme =
      (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
    setTheme(activeTheme);
  }, []);

  // If store doesn't exist or user doesn't own it, redirect to /sell
  useEffect(() => {
    if (store === null) {
      router.replace("/sell");
    }
  }, [store, router]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const isApproved = store?.status === "approved";
  const isPending = store?.status === "pending";

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <header className={homeStyles.navbar}>
        <Link href="/" className={homeStyles.logo}>
          <span>beembai</span>
          <span className={homeStyles.logoDot} />
        </Link>
        <nav className={homeStyles.navLinks}>
          <Link href="/#featured" className={homeStyles.navLink}>Featured</Link>
          <Link href="/#shop" className={homeStyles.navLink}>New Arrivals</Link>
          <Link href="/stores" className={homeStyles.navLink}>Stores</Link>
          <Link href="/sell" className={`${homeStyles.navLink} ${homeStyles.activeNavLink}`}>Sell</Link>
        </nav>
        <div className={homeStyles.navActions}>
          <UserMenu />
          <button onClick={toggleTheme} className={homeStyles.themeToggleBtn} aria-label="Toggle theme">
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
          <Link href="/cart" className={`${homeStyles.cartIconBtn} ${cartBounce ? homeStyles.cartBounce : ""}`} aria-label="Shopping Cart">
            <CartIcon />
            {totalItemsCount > 0 && (
              <span className={`${homeStyles.cartBadge} ${cartBounce ? homeStyles.badgePop : ""}`}>
                {formatNumber(totalItemsCount)}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className={styles.mainContent}>
        {/* Loading */}
        {store === undefined && (
          <div className={styles.dashEmptyState} style={{ paddingTop: "4rem" }}>
            <span className={styles.dashEmptyIcon}>⏳</span>
            <p className={styles.dashEmptyTitle}>Loading your store…</p>
          </div>
        )}

        {/* Approved Dashboard */}
        {isApproved && store && (
          <ApprovedDashboard store={store} allStores={allStores ?? []} />
        )}

        {/* Pending Review */}
        {isPending && store && (
          <>
            {/* Pill bar (only if user has multiple stores) */}
            {(allStores?.length ?? 0) > 1 && (
              <div className={styles.storeSelectorBar}>
                {(allStores ?? []).map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => router.push(`/sell/${s.slug}`)}
                    className={`${styles.storePill} ${s._id === store._id ? styles.storePillActive : ""}`}
                  >
                    {s.name}
                  </button>
                ))}
                <button type="button" className={styles.newStorePill} onClick={() => router.push("/sell/new")}>
                  <span style={{ fontSize: "1.05rem" }}>+</span> Create New Store
                </button>
              </div>
            )}

            <section className={styles.reviewSection}>
              <div className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewStatusBadge}>Under Review</div>
                  <h2 className={styles.reviewTitle}>Your Store Application is Under Review</h2>
                </div>
                <p className={styles.reviewText}>
                  We are currently reviewing your application for <strong>{store.name}</strong> in the <strong>{store.category}</strong> category. Our partnership team typically reviews applications within 24 hours.
                </p>
                <div className={styles.reviewDetails}>
                  <div className={styles.reviewDetailItem}><strong>Description:</strong> {store.description}</div>
                  <div className={styles.reviewDetailItem}><strong>Business Email:</strong> {store.email}</div>
                  <div className={styles.reviewDetailItem}><strong>Contact Phone:</strong> {store.phone}</div>
                  <div className={styles.reviewDetailItem}><strong>Payout Bank:</strong> {store.bankName} ({store.accountName})</div>
                </div>
                <button
                  type="button"
                  className={styles.editApplicationBtn}
                  onClick={() => router.push(`/sell/new?edit=${store._id}`)}
                >
                  Edit Application Details
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
