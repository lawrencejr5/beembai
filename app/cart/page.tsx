"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./cart.module.css";
import { useCart } from "@/app/context/CartContext";
import { formatPrice, formatNumber } from "@/app/data/data";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// SVG Icons
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
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

const TrashIcon = () => (
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
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const CartEmptyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="44"
    height="44"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItemsCount,
    subtotalPrice,
    selectedItemKeys,
    toggleSelectItem,
    setSelectedAll,
    selectedCart,
    selectedSubtotalPrice,
    selectedItemsCount,
  } = useCart();
  const user = useQuery(api.users.viewer);

  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  const shippingFee = selectedSubtotalPrice > 100 || selectedSubtotalPrice === 0 ? 0 : 10;
  const estimatedTax = Math.round(selectedSubtotalPrice * 0.05);
  const finalTotal = Math.max(
    0,
    selectedSubtotalPrice + shippingFee + estimatedTax - discountAmount,
  );

  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === "BEEMBAI10" || code === "WELCOME10") {
      const discount = Math.round(selectedSubtotalPrice * 0.1);
      setDiscountAmount(discount);
      setPromoMessage({
        text: "10% Discount applied successfully!",
        isError: false,
      });
    } else if (code === "") {
      setPromoMessage({ text: "Please enter a valid code", isError: true });
    } else {
      setPromoMessage({ text: "Invalid promo code", isError: true });
    }
  };

  return (
    <main className={styles.cartPage}>
      {/* Header with Back Button & Title */}
      <div className={styles.headerRow}>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <button
            type="button"
            onClick={handleGoBack}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.45rem 1rem",
              borderRadius: "99px",
              backgroundColor: "var(--color-sand)",
              border: "1px solid var(--color-border)",
              color: "var(--color-papyrus)",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              width: "fit-content",
              fontFamily: "inherit",
            }}
          >
            <ArrowLeftIcon />
            <span>Continue Shopping</span>
          </button>

          <div className={styles.titleGroup}>
            <h1 className={styles.pageTitle}>Shopping Cart</h1>
            {totalItemsCount > 0 && (
              <span className={styles.itemCountBadge}>
                {formatNumber(totalItemsCount)} items
              </span>
            )}
          </div>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className={styles.clearCartLinkBtn}
          >
            Clear Cart
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        /* Empty Cart State */
        <div className={styles.emptyCartContainer}>
          <div className={styles.emptyIconWrapper}>
            <CartEmptyIcon />
          </div>
          <h2 className={styles.emptyTitle}>Your cart is empty</h2>
          <p className={styles.emptyText}>
            Looks like you haven't added any items to your shopping cart yet.
            Discover our curated catalog of premium tech and lifestyle products.
          </p>
          <Link href="/" className={styles.startShoppingBtn}>
            <span>Explore Products</span>
          </Link>
        </div>
      ) : (
        /* Active Cart 2-Column Showcase */
        <div className={styles.cartGrid}>
          {/* Left Column: List of Cart Items */}
          <div className={styles.itemsContainer}>
            <div className={styles.selectAllBar}>
              <label className={styles.selectAllLabel}>
                <input
                  type="checkbox"
                  checked={selectedCart.length === cart.length}
                  onChange={(e) => setSelectedAll(e.target.checked)}
                  className={styles.selectAllCheckbox}
                />
                <span className={styles.selectAllText}>Select All ({cart.length} items)</span>
              </label>
              {selectedCart.length > 0 && (
                <span className={styles.selectedCountText}>
                  {selectedItemsCount} selected
                </span>
              )}
            </div>

            {cart.map((item) => {
              const itemTotal = item.product.price * item.quantity;
              const itemKey = `${item.product.id}-${item.selectedColor || "default"}`;
              const isSelected = selectedItemKeys[itemKey] === true;
              return (
                <div
                  key={`${item.product.id}-${item.selectedColor || "default"}`}
                  className={`${styles.cartItemCard} ${isSelected ? styles.selectedCard : ""}`}
                >
                  <div className={styles.checkboxWrapper}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.product.id, item.selectedColor)}
                      className={styles.itemCheckbox}
                    />
                  </div>

                  <div className={styles.itemImageWrapper}>
                    <Image
                      src={item.product.image}
                      alt={item.product.title}
                      fill
                      className={styles.itemImg}
                      sizes="95px"
                    />
                  </div>

                  <div className={styles.itemInfo}>
                    {item.product.brand && (
                      <span className={styles.brandLabel}>
                        {item.product.brand}
                      </span>
                    )}
                    <Link
                      href={`/product/${item.product.id}`}
                      className={styles.itemTitle}
                    >
                      {item.product.title}
                    </Link>

                    <div className={styles.itemMetaRow}>
                      {item.selectedColor && (
                        <span className={styles.colorBadge}>
                          {item.selectedColor}
                        </span>
                      )}
                      <span className={styles.unitPrice}>
                        ${formatPrice(item.product.price)} each
                      </span>
                    </div>
                  </div>

                  {/* Quantity Control Buttons */}
                  <div className={styles.quantityControls}>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.quantity - 1,
                          item.selectedColor,
                        )
                      }
                      className={styles.qtyBtn}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className={styles.qtyValue}>
                      {formatNumber(item.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.quantity + 1,
                          item.selectedColor,
                        )
                      }
                      disabled={item.quantity >= (item.product.stock ?? 15)}
                      className={styles.qtyBtn}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal & Trash Remove Button */}
                  <div className={styles.itemActionGroup}>
                    <span className={styles.subtotalPrice}>
                      ${formatPrice(itemTotal)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        removeFromCart(item.product.id, item.selectedColor)
                      }
                      className={styles.removeBtn}
                      aria-label={`Remove ${item.product.title}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Order Summary Sidebar */}
          <aside className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Subtotal</span>
                <span>${formatPrice(subtotalPrice)}</span>
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>
                  Estimated Shipping
                </span>
                {shippingFee === 0 ? (
                  <span className={styles.freeShippingTag}>FREE</span>
                ) : (
                  <span>${formatPrice(shippingFee)}</span>
                )}
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>
                  Estimated Tax (5%)
                </span>
                <span>${formatPrice(estimatedTax)}</span>
              </div>

              {discountAmount > 0 && (
                <div
                  className={styles.summaryRow}
                  style={{ color: "var(--color-palm)" }}
                >
                  <span
                    className={styles.summaryRowLabel}
                    style={{ color: "var(--color-palm)" }}
                  >
                    Promo Discount
                  </span>
                  <span>-${formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalValue}>
                  ${formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            {/* Promo Coupon Form */}
            <form onSubmit={handleApplyPromo} className={styles.promoContainer}>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Promo Code (BEEMBAI10)"
                className={styles.promoInput}
              />
              <button type="submit" className={styles.applyPromoBtn}>
                Apply
              </button>
            </form>

            {promoMessage && (
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: promoMessage.isError ? "#e53e3e" : "var(--color-palm)",
                  marginTop: "-0.5rem",
                }}
              >
                {promoMessage.text}
              </span>
            )}

            {user === undefined ? (
              <button type="button" className={styles.checkoutBtn} disabled>
                Proceed to Checkout (${formatPrice(finalTotal)})
              </button>
            ) : selectedCart.length === 0 ? (
              <button type="button" className={styles.checkoutBtn} disabled>
                Proceed to Checkout ($0.00)
              </button>
            ) : user ? (
              <Link
                href="/checkout"
                className={styles.checkoutBtn}
                style={{ display: "block", textAlign: "center", textDecoration: "none" }}
              >
                Proceed to Checkout (${formatPrice(finalTotal)})
              </Link>
            ) : (
              <Link
                href={`/login?redirectTo=/checkout`}
                className={styles.checkoutBtn}
                style={{ display: "block", textAlign: "center", textDecoration: "none" }}
              >
                Proceed to Checkout (${formatPrice(finalTotal)})
              </Link>
            )}

            <div className={styles.trustFooter}>
              <ShieldCheckIcon />
              <span>Encrypted 256-bit SSL Checkout</span>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
