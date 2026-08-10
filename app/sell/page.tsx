"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./sell.module.css";
import homeStyles from "@/app/page.module.css";
import { formatNumber } from "@/app/data/data";
import { useCart } from "@/app/context/CartContext";
import UserMenu from "@/app/components/UserMenu";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Local SVG Icons
const CartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2 2h2.5l2.6 12.4a2 2 0 002 1.6h9.8a2 2 0 002-1.6l1.7-8.4H5.5"
    />
    <circle cx="9" cy="20" r="1.5" fill="currentColor" />
    <circle cx="18" cy="20" r="1.5" fill="currentColor" />
  </svg>
);

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.72-12.72l-1.41-1.41"
    />
  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="36"
    height="36"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="3"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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

// ─── Helper ──────────────────────────────────────────────────────────────────

const getStoreInitials = (name: string): string => {
  const cleanName = name.replace(/[''\'&]/g, "").trim();
  const words = cleanName.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return "ST";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

// ─── Add Product Modal ────────────────────────────────────────────────────────

interface AddProductModalProps {
  storeName: string;
  onClose: () => void;
}

function AddProductModal({ storeName, onClose }: AddProductModalProps) {
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
            <p className={styles.productModalSubtitle}>
              Listing to <strong>{storeName}</strong>
            </p>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "2rem 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <div className={styles.successTickCircle} style={{ width: 60, height: 60 }}>
              <CheckCircleIcon />
            </div>
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

// ─── Approved Store Dashboard ─────────────────────────────────────────────────

type StoreType = NonNullable<ReturnType<typeof useQuery<typeof api.store.getStoresByOwner>>>[number];

interface ApprovedDashboardProps {
  store: StoreType;
  onCreateNewStore: () => void;
  allStores: StoreType[];
  selectedStoreId: Id<"stores">;
  onSelectStore: (id: Id<"stores">) => void;
}

function ApprovedDashboard({ store, onCreateNewStore, allStores, selectedStoreId, onSelectStore }: ApprovedDashboardProps) {
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
          const isActive = s._id === selectedStoreId;
          const isPending = s.status === "pending";
          return (
            <button
              key={s._id}
              type="button"
              onClick={() => onSelectStore(s._id)}
              className={`${styles.storePill} ${isActive ? styles.storePillActive : ""} ${isPending && !isActive ? styles.storePillPending : ""}`}
            >
              {isPending && !isActive && <span style={{ fontSize: "0.7rem" }}>⏳</span>}
              {s.name}
            </button>
          );
        })}
        <button type="button" className={styles.newStorePill} onClick={onCreateNewStore}>
          <span style={{ fontSize: "1.05rem", lineHeight: 1 }}>+</span>
          Create New Store
        </button>
      </div>

      {/* Dashboard Content */}
      <div className={styles.dashboardWrapper}>
        {/* Banner Hero */}
        <div
          className={styles.dashBanner}
          style={hasBanner ? { backgroundImage: `url('${store.banner}')` } : {}}
        >
          {!hasBanner && <div className={styles.dashBannerGradient} />}
          <div className={styles.dashBannerOverlay} />
          <button type="button" className={styles.editBannerBtn} title="Update store banner image">
            <span>🖼</span>
            Edit Banner
          </button>
        </div>

        {/* Store Header — overlaps banner */}
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

        {/* About & Stats */}
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

        {/* Products Grid + Add Card */}
        {storeProducts === undefined ? (
          <div className={styles.dashEmptyState}>
            <span className={styles.dashEmptyIcon}>⏳</span>
            <p className={styles.dashEmptyTitle}>Loading your catalog...</p>
          </div>
        ) : (
          <div className={styles.ownerProductsGrid}>
            {/* Add Product Card — always first */}
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
                  background: "var(--color-cream)",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: 18,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
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

export default function SellPage() {
  const { totalItemsCount, cartBounce } = useCart();
  const user = useQuery(api.users.viewer);
  const userStore = useQuery(api.store.getStoreByOwner);
  const userStores = useQuery(api.store.getStoresByOwner);
  const sendEmailOTP = useAction(api.store.sendEmailOTP);
  const verifyEmailOTP = useMutation(api.store.verifyEmailOTP);
  const createStoreMut = useMutation(api.store.createStore);
  const updateStoreMut = useMutation(api.store.updateStore);

  // Which store is active in the pill bar
  const [selectedStoreId, setSelectedStoreId] = useState<Id<"stores"> | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Step state: 0 = root (approved/pending/intro), 1–5 = onboarding
  const [currentStep, setCurrentStep] = useState(0);

  // Edit / Checkbox State
  const [isEditMode, setIsEditMode] = useState(false);
  const [useAccountEmail, setUseAccountEmail] = useState(false);

  // Loading States
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);

  // Errors / Messages
  const [otpError, setOtpError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [formError, setFormError] = useState("");

  // Form States
  // Step 1: Store Setup
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [bio, setBio] = useState("");

  // Step 2: Location
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("");

  // Step 3: Email Verification
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Step 4: Phone Verification
  const [phone, setPhone] = useState("");

  // Step 5: Bank Details
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);
  const [showCategoryInfo, setShowCategoryInfo] = useState(false);

  // Sync theme
  useEffect(() => {
    const activeTheme =
      (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
    setTheme(activeTheme);
  }, []);

  // Auto-select the first approved store (or first store) when stores load
  useEffect(() => {
    if (userStores && userStores.length > 0 && !selectedStoreId) {
      const approved = userStores.find((s) => s.status === "approved");
      setSelectedStoreId(approved ? approved._id : userStores[0]._id);
    }
  }, [userStores, selectedStoreId]);

  // Auto-start onboarding from URL param
  useEffect(() => {
    if (typeof window !== "undefined" && user && currentStep === 0) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("startOnboarding") === "true") {
        setCurrentStep(1);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, "", cleanUrl);
      }
    }
  }, [user, currentStep]);

  // Clear validation error when inputs or step changes
  useEffect(() => {
    setFormError("");
  }, [
    currentStep,
    storeName,
    bio,
    physicalAddress,
    city,
    stateName,
    country,
    email,
    phone,
    bankName,
    accountName,
    accountNumber,
    routingNumber
  ]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const handleSendEmailCode = async () => {
    if (!email) return;
    setIsSendingOtp(true);
    setOtpError("");
    try {
      const res = await sendEmailOTP({ email });
      setEmailSent(true);
      if (res.mocked) {
        console.log(`[Developer OTP Mock Link]: Use code ${res.token} to verify.`);
      }
    } catch (err: any) {
      setOtpError(err.message || "Failed to send verification email. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    if (emailOtp.length !== 6) return;
    setIsVerifyingOtp(true);
    setOtpError("");
    try {
      const isValid = await verifyEmailOTP({ email, code: emailOtp });
      if (isValid) {
        setEmailVerified(true);
      } else {
        setOtpError("Invalid or expired verification code.");
      }
    } catch (err: any) {
      setOtpError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleProceedToLocation = () => {
    if (!storeName.trim()) {
      setFormError("Store name is required.");
      return;
    }
    if (!bio.trim()) {
      setFormError("Store description / bio is required.");
      return;
    }
    setCurrentStep(2);
  };

  const handleProceedToEmail = () => {
    if (!physicalAddress.trim()) {
      setFormError("Street address is required.");
      return;
    }
    if (!city.trim()) {
      setFormError("City is required.");
      return;
    }
    if (!stateName.trim()) {
      setFormError("State / Province is required.");
      return;
    }
    if (!country.trim()) {
      setFormError("Country is required.");
      return;
    }
    setCurrentStep(3);
  };

  const handleProceedToPhone = () => {
    if (!emailVerified) {
      setFormError("Please verify your business email address before proceeding.");
      return;
    }
    setCurrentStep(4);
  };

  const handleProceedToBank = () => {
    if (!phone.trim()) {
      setFormError("Contact phone number is required.");
      return;
    }
    if (phone.trim().length < 7) {
      setFormError("Please enter a valid phone number.");
      return;
    }
    setCurrentStep(5);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) {
      setFormError("Bank name is required.");
      return;
    }
    if (!accountName.trim()) {
      setFormError("Account holder name is required.");
      return;
    }
    if (!accountNumber.trim()) {
      setFormError("Account number is required.");
      return;
    }
    if (routingNumber.length !== 9) {
      setFormError("Routing number must be exactly 9 digits.");
      return;
    }

    setIsSubmittingStore(true);
    setSubmitError("");
    setFormError("");
    try {
      if (isEditMode && userStore) {
        await updateStoreMut({
          storeId: userStore._id,
          name: storeName,
          category,
          description: bio,
          physicalAddress,
          city,
          stateName,
          country,
          email,
          phone,
          bankName,
          accountName,
          accountNumber,
          routingNumber,
        });
      } else {
        await createStoreMut({
          name: storeName,
          category,
          description: bio,
          physicalAddress,
          city,
          stateName,
          country,
          email,
          phone,
          bankName,
          accountName,
          accountNumber,
          routingNumber,
        });
      }
      setShowSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred during submission.");
    } finally {
      setIsSubmittingStore(false);
    }
  };

  const handleEditApplication = () => {
    if (!userStore) return;
    setStoreName(userStore.name);
    setCategory(userStore.category);
    setBio(userStore.description);
    setPhysicalAddress(userStore.physicalAddress || "");
    setCity(userStore.city || "");
    setStateName(userStore.stateName || "");
    setCountry(userStore.country || "");
    setEmail(userStore.email || "");
    setUseAccountEmail(userStore.email === user?.email);
    setEmailVerified(true);
    setPhone(userStore.phone || "");
    setBankName(userStore.bankName || "");
    setAccountName(userStore.accountName || "");
    setAccountNumber(userStore.accountNumber || "");
    setRoutingNumber(userStore.routingNumber || "");
    
    setIsEditMode(true);
    setCurrentStep(1);
  };

  const handleResetForm = () => {
    setStoreName(""); setCategory("All Categories"); setBio("");
    setPhysicalAddress(""); setCity(""); setStateName(""); setCountry("");
    setEmail(""); setEmailOtp(""); setEmailVerified(false); setEmailSent(false);
    setPhone(""); setBankName(""); setAccountName(""); setAccountNumber(""); setRoutingNumber("");
    setCurrentStep(0); setShowSuccess(false); setShowCategoryInfo(false);
    setIsEditMode(false); setUseAccountEmail(false);
  };

  // Determine which store is currently selected
  const selectedStore = useMemo(() => {
    if (!userStores || !selectedStoreId) return null;
    return userStores.find((s) => s._id === selectedStoreId) ?? null;
  }, [userStores, selectedStoreId]);

  const isApproved = selectedStore?.status === "approved";
  const isPending = selectedStore?.status === "pending";
  const hasMultipleStores = (userStores?.length ?? 0) > 1;

  return (
    <div className={styles.container}>
      {/* Fixed Header Navbar */}
      <header className={homeStyles.navbar}>
        <Link href="/" className={homeStyles.logo}>
          <span>beembai</span>
          <span className={homeStyles.logoDot} />
        </Link>

        <nav className={homeStyles.navLinks}>
          <Link href="/#featured" className={homeStyles.navLink}>
            Featured
          </Link>
          <Link href="/#shop" className={homeStyles.navLink}>
            New Arrivals
          </Link>
          <Link href="/stores" className={homeStyles.navLink}>
            Stores
          </Link>
          <Link
            href="/sell"
            className={`${homeStyles.navLink} ${homeStyles.activeNavLink}`}
          >
            Sell
          </Link>
        </nav>

        <div className={homeStyles.navActions}>
          <UserMenu />
          <button
            onClick={toggleTheme}
            className={homeStyles.themeToggleBtn}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>

          <Link
            href="/cart"
            className={`${homeStyles.cartIconBtn} ${cartBounce ? homeStyles.cartBounce : ""}`}
            aria-label="Shopping Cart"
          >
            <CartIcon />
            {totalItemsCount > 0 && (
              <span
                className={`${homeStyles.cartBadge} ${cartBounce ? homeStyles.badgePop : ""}`}
              >
                {formatNumber(totalItemsCount)}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Main Page Layout */}
      <main className={styles.mainContent}>
        {currentStep === 0 && (
          <>
            {/* ── APPROVED STORE DASHBOARD ── */}
            {isApproved && selectedStore && (
              <ApprovedDashboard
                store={selectedStore}
                allStores={userStores ?? []}
                selectedStoreId={selectedStoreId!}
                onSelectStore={(id) => setSelectedStoreId(id)}
                onCreateNewStore={() => { handleResetForm(); setCurrentStep(1); }}
              />
            )}

            {/* ── PENDING REVIEW CARD ── */}
            {isPending && selectedStore && (
              <>
                {hasMultipleStores && (
                  <div className={styles.storeSelectorBar}>
                    {(userStores ?? []).map((s) => (
                      <button key={s._id} type="button" onClick={() => setSelectedStoreId(s._id)}
                        className={`${styles.storePill} ${s._id === selectedStoreId ? styles.storePillActive : ""}`}>
                        {s.name}
                      </button>
                    ))}
                    <button type="button" className={styles.newStorePill} onClick={() => { handleResetForm(); setCurrentStep(1); }}>
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
                      We are currently reviewing your application for <strong>{selectedStore.name}</strong> in the <strong>{selectedStore.category}</strong> category. Our partnership team typically reviews applications within 24 hours.
                    </p>
                    <div className={styles.reviewDetails}>
                      <div className={styles.reviewDetailItem}><strong>Description:</strong> {selectedStore.description}</div>
                      <div className={styles.reviewDetailItem}><strong>Business Email:</strong> {selectedStore.email}</div>
                      <div className={styles.reviewDetailItem}><strong>Contact Phone:</strong> {selectedStore.phone}</div>
                      <div className={styles.reviewDetailItem}><strong>Payout Bank:</strong> {selectedStore.bankName} ({selectedStore.accountName})</div>
                    </div>
                    <button type="button" onClick={handleEditApplication} className={styles.editApplicationBtn}>
                      Edit Application Details
                    </button>
                  </div>
                </section>
              </>
            )}

            {/* ── INTRO / NO STORE ── */}
            {!isApproved && !isPending && (
              <>
                <section className={styles.heroBanner}>
                  <div className={styles.heroTag}><span>Merchant Portal</span></div>
                  <h1 className={styles.heroTitle}>Grow your business. Start selling on Beembai.</h1>
                  <p className={styles.heroSubtitle}>
                    List your curated products in front of thousands of daily active buyers searching for luxury electronics, designer fashion, and custom homeware.
                  </p>
                </section>
                <section style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Selling is Simple</h2>
                    <p className={styles.sectionSubtitle}>Follow our 3-step merchant integration path to list your catalog.</p>
                  </div>
                  <div className={styles.stepsGrid}>
                    <div className={styles.stepCard}>
                      <div className={styles.stepNumber}>1</div>
                      <h3 className={styles.stepCardTitle}>Create Store</h3>
                      <p className={styles.stepCardText}>Fill out the store details application form to set up your verified digital storefront on Beembai.</p>
                    </div>
                    <div className={styles.stepCard}>
                      <div className={styles.stepNumber}>2</div>
                      <h3 className={styles.stepCardTitle}>List Catalog</h3>
                      <p className={styles.stepCardText}>Upload product photos, set inventory levels, colors, specifications, and manage product details in one portal.</p>
                    </div>
                    <div className={styles.stepCard}>
                      <div className={styles.stepNumber}>3</div>
                      <h3 className={styles.stepCardTitle}>Receive Payouts</h3>
                      <p className={styles.stepCardText}>Enjoy low commission rates, zero listing fees, and secure bank payouts processed immediately within 24 hours of delivery.</p>
                    </div>
                  </div>
                  {user === undefined ? (
                    <button type="button" className={styles.proceedIntroBtn} disabled>Proceed to Store Setup</button>
                  ) : user ? (
                    <button type="button" onClick={() => setCurrentStep(1)} className={styles.proceedIntroBtn}>Proceed to Store Setup</button>
                  ) : (
                    <Link href="/login?redirectTo=/sell&startOnboarding=true" className={styles.proceedIntroBtn} style={{ display: "inline-block", textAlign: "center", textDecoration: "none" }}>
                      Proceed to Store Setup
                    </Link>
                  )}
                </section>
              </>
            )}
          </>
        )}

        {/* Step-by-Step Onboarding Form */}
        {currentStep > 0 && (
          <section className={styles.formSection}>
            {/* Step Progress Indicators */}
            <div className={styles.progressBarWrapper}>
              <div
                className={styles.progressBar}
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>

            <div className={styles.stepProgressHeader}>
              {[
                { step: 1, label: "Store" },
                { step: 2, label: "Location" },
                { step: 3, label: "Email" },
                { step: 4, label: "Phone" },
                { step: 5, label: "Bank" },
              ].map((item) => {
                let stepClass = styles.stepDot;
                if (currentStep === item.step) {
                  stepClass += ` ${styles.stepDotActive}`;
                } else if (currentStep > item.step) {
                  stepClass += ` ${styles.stepDotCompleted}`;
                }
                return (
                  <div key={item.step} className={styles.stepIndicatorItem}>
                    <div className={stepClass}>
                      {currentStep > item.step ? "✓" : item.step}
                    </div>
                    <span className={styles.stepLabel}>{item.label}</span>
                  </div>
                );
              })}
            </div>

            {formError && (
              <div style={{
                color: "#d93838",
                backgroundColor: "rgba(217, 56, 56, 0.06)",
                border: "1.5px solid rgba(217, 56, 56, 0.15)",
                borderRadius: "14px",
                padding: "0.85rem 1.25rem",
                fontSize: "0.85rem",
                fontWeight: "700",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <span>⚠️ {formError}</span>
              </div>
            )}

            {/* Step 1: Store Setup Form */}
            {currentStep === 1 && (
              <div className={styles.applicationForm}>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Store Setup</h2>
                  <p className={styles.formSubtitle}>
                    Provide initial details for your storefront.
                  </p>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Store Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vintage Co."
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>

                  <div
                    className={styles.formGroup}
                    style={{ position: "relative" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <label className={styles.formLabel}>
                        Primary Category (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCategoryInfo(!showCategoryInfo)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--color-palm)",
                          cursor: "pointer",
                          fontSize: "1rem",
                          fontWeight: "800",
                          padding: "0 0.25rem",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Category Info"
                      >
                        ⓘ
                      </button>
                    </div>
                    {showCategoryInfo && (
                      <div
                        style={{
                          backgroundColor: "var(--color-sand)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "10px",
                          padding: "0.6rem 0.8rem",
                          fontSize: "0.78rem",
                          lineHeight: "1.4",
                          color: "var(--color-olive-gray)",
                          fontWeight: "600",
                          marginBottom: "0.4rem",
                        }}
                      >
                        💡 Selecting a primary category helps us feature your
                        shop, but you can sell products across{" "}
                        <strong>any</strong> category at any time!
                      </div>
                    )}
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={styles.selectField}
                    >
                      <option value="All Categories">All Categories</option>
                      <option value="Phone & Tablets">Phone & Tablets</option>
                      <option value="Gadgets & Accessories">
                        Gadgets & Accessories
                      </option>
                      <option value="Apparel & Fashion">
                        Apparel & Fashion
                      </option>
                      <option value="Furniture & Living">
                        Furniture & Living
                      </option>
                      <option value="Beauty & Care">Beauty & Care</option>
                      <option value="Groceries">Groceries</option>
                      <option value="Home Appliances">Home Appliances</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Brand Biography / Description
                  </label>
                  <textarea
                    placeholder="Share a short summary about your brand, what you sell, and your design values..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className={styles.textAreaField}
                  />
                </div>

                <div className={styles.btnGroup}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(0)}
                    className={styles.backBtn}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToLocation}
                    className={styles.submitBtn}
                    style={{ marginTop: 0 }}
                  >
                    Proceed
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Location Setup Form */}
            {currentStep === 2 && (
              <div className={styles.applicationForm}>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Address & Location</h2>
                  <p className={styles.formSubtitle}>
                    Provide the physical location details for your business.
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Street Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123 Design Way"
                    value={physicalAddress}
                    onChange={(e) => setPhysicalAddress(e.target.value)}
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. New York"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      State / Province *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NY"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Country *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.btnGroup}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className={styles.backBtn}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToEmail}
                    className={styles.submitBtn}
                    style={{ marginTop: 0 }}
                  >
                    Proceed
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Email Verification */}
            {currentStep === 3 && (
              <div className={styles.applicationForm}>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Verify Your Email</h2>
                  <p className={styles.formSubtitle}>
                    We need a confirmed business email to process storefront
                    creation.
                  </p>
                </div>

                <div className={styles.verificationContainer}>
                  {user?.email && (
                    <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="checkbox"
                        id="useAccountEmail"
                        checked={useAccountEmail}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setUseAccountEmail(checked);
                          if (checked && user.email) {
                            setEmail(user.email);
                            setEmailVerified(true);
                          } else {
                            setEmail("");
                            setEmailVerified(false);
                            setEmailSent(false);
                            setEmailOtp("");
                          }
                        }}
                      />
                      <label htmlFor="useAccountEmail" className={styles.formLabel} style={{ cursor: "pointer", marginBottom: 0 }}>
                        Use my account email ({user.email})
                      </label>
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Business Email Address *
                    </label>
                    <div className={styles.verificationActionRow}>
                      <input
                        type="email"
                        required
                        disabled={emailVerified || useAccountEmail}
                        placeholder="e.g. partner@store.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.inputField}
                      />
                      {!emailVerified && !useAccountEmail && (
                        <button
                          type="button"
                          onClick={handleSendEmailCode}
                          disabled={!email || isSendingOtp}
                          className={styles.sendCodeBtn}
                        >
                          {isSendingOtp ? "Sending..." : emailSent ? "Resend OTP" : "Send Code"}
                        </button>
                      )}
                    </div>
                  </div>

                  {otpError && (
                    <span style={{ color: "#d93838", fontSize: "0.82rem", fontWeight: "600", marginTop: "0.5rem" }}>
                      ⚠️ {otpError}
                    </span>
                  )}

                  {emailSent && !emailVerified && !useAccountEmail && (
                    <div className={styles.otpInputWrapper}>
                      <label className={styles.formLabel}>
                        Enter 6-Digit OTP *
                      </label>
                      <div className={styles.verificationActionRow}>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={emailOtp}
                          onChange={(e) =>
                            setEmailOtp(e.target.value.replace(/\D/g, ""))
                          }
                          className={styles.inputField}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmailCode}
                          disabled={emailOtp.length !== 6 || isVerifyingOtp}
                          className={styles.sendCodeBtn}
                        >
                          {isVerifyingOtp ? "Verifying..." : "Confirm"}
                        </button>
                      </div>
                    </div>
                  )}

                  {emailVerified && (
                    <div className={styles.verifiedBadge}>
                      ✓ Email Address Verified Successfully
                    </div>
                  )}
                </div>

                <div className={styles.btnGroup}>
                  <button
                    type="button"
                    onClick={() => {
                      if (useAccountEmail) {
                        setEmail("");
                        setEmailVerified(false);
                        setUseAccountEmail(false);
                      }
                      setCurrentStep(2);
                    }}
                    className={styles.backBtn}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToPhone}
                    className={styles.submitBtn}
                    style={{ marginTop: 0 }}
                  >
                    Proceed
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Phone Verification */}
            {currentStep === 4 && (
              <div className={styles.applicationForm}>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Contact Phone Number</h2>
                  <p className={styles.formSubtitle}>
                    Provide your contact phone number to finalize your store creation.
                  </p>
                </div>

                <div className={styles.verificationContainer}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Contact Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 09025816161"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div className={styles.btnGroup}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className={styles.backBtn}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToBank}
                    className={styles.submitBtn}
                    style={{ marginTop: 0 }}
                  >
                    Proceed
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Bank Details Form */}
            {currentStep === 5 && (
              <form
                onSubmit={handleRegisterSubmit}
                className={styles.applicationForm}
              >
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>
                    Payout Account Configuration
                  </h2>
                  <p className={styles.formSubtitle}>
                    Setup secure bank details where you'll receive payout
                    transfers.
                  </p>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bank Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chase Bank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vintage Co. LLC"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Account Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1234567890"
                      value={accountNumber}
                      onChange={(e) =>
                        setAccountNumber(e.target.value.replace(/\D/g, ""))
                      }
                      className={styles.inputField}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Routing Number (9 Digits) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={9}
                      placeholder="e.g. 987654321"
                      value={routingNumber}
                      onChange={(e) =>
                        setRoutingNumber(e.target.value.replace(/\D/g, ""))
                      }
                      className={styles.inputField}
                    />
                  </div>
                </div>

                {submitError && (
                  <span style={{ color: "#d93838", fontSize: "0.82rem", fontWeight: "600", marginTop: "0.5rem" }}>
                    ⚠️ {submitError}
                  </span>
                )}

                <div className={styles.btnGroup}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className={styles.backBtn}
                    disabled={isSubmittingStore}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingStore}
                    className={styles.submitBtn}
                    style={{ marginTop: 0 }}
                  >
                    {isSubmittingStore ? "Submitting..." : isEditMode ? "Save Changes" : "Complete"}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}
      </main>

      {/* Success Registration Overlay Modal */}
      {showSuccess && (
        <div className={styles.successOverlay}>
          <div className={styles.successCard}>
            <div className={styles.successTickCircle}>
              <CheckCircleIcon />
            </div>
            <h3 className={styles.successTitle}>
              {isEditMode ? "Changes Saved!" : "Application Completed!"}
            </h3>
            <p className={styles.successText}>
              {isEditMode ? (
                <>
                  Your store details for <strong>{storeName}</strong> have been updated and are under review.
                </>
              ) : (
                <>
                  Congratulations! Your merchant setup for <strong>{storeName}</strong> has been completed successfully.
                </>
              )}
              <br />
              <span
                style={{
                  fontSize: "0.82rem",
                  color: "var(--color-olive-gray)",
                }}
              >
                We've verified your email (<strong>{email}</strong>) and phone (
                <strong>{phone}</strong>). Payouts will settle to your bank account.
                Our partnership team will review your storefront within 24 hours.
              </span>
            </p>
            <button
              type="button"
              onClick={handleResetForm}
              className={styles.closeSuccessBtn}
            >
              Got It, Thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
