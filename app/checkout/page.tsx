"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./checkout.module.css";
import { useCart } from "@/app/context/CartContext";
import { formatPrice } from "@/app/data/data";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const CheckIcon = () => (
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

export default function CheckoutPage() {
  const router = useRouter();
  const user = useQuery(api.users.viewer);
  const {
    cart,
    selectedItemKeys,
    toggleSelectItem,
    selectedCart,
    selectedSubtotalPrice,
    clearSelectedCart,
  } = useCart();

  // Redirect if logged out
  useEffect(() => {
    if (user === null) {
      router.push("/login?redirectTo=/checkout");
    }
  }, [user, router]);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const shippingFee = shippingMethod === "express" ? 15 : (selectedSubtotalPrice > 100 || selectedSubtotalPrice === 0 ? 0 : 10);
  const estimatedTax = Math.round(selectedSubtotalPrice * 0.05);
  const finalTotal = selectedSubtotalPrice + shippingFee + estimatedTax;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCart.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      clearSelectedCart();
      setIsProcessing(false);
      setShowSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 3500);
    }, 2500);
  };

  // If loading user or redirecting
  if (user === undefined || user === null) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--background)", color: "var(--foreground)" }}>
        <p style={{ fontWeight: 700 }}>Authenticating session...</p>
      </div>
    );
  }

  return (
    <main className={styles.checkoutPage}>
      {/* Header Row */}
      <header className={styles.headerRow}>
        <Link href="/" className={styles.logo}>
          <span>beembai</span>
          <span className={styles.logoDot} />
        </Link>
        <div className={styles.securityBadge}>
          <ShieldCheckIcon />
          <span>Secure Checkout</span>
        </div>
      </header>

      {cart.length === 0 && !showSuccess ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--color-papyrus)" }}>Your checkout cart is empty</h2>
          <p style={{ maxWidth: "480px", opacity: 0.8 }}>There are no items in your cart. Redirecting you back to homepage to continue shopping...</p>
          <Link href="/" className={styles.payBtn} style={{ maxWidth: "240px" }}>Go to Homepage</Link>
        </div>
      ) : (
        <div className={styles.checkoutGrid}>
          {/* Left Column: Checkout details form */}
          <form onSubmit={handleSubmitOrder} className={styles.formSection}>
            {/* Step 1: Shipping Details */}
            <div className={styles.stepCard}>
              <h2 className={styles.cardTitle}>
                <span className={styles.titleNum}>1</span>
                <span>Shipping Address</span>
              </h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className={styles.inputField}
                    disabled={isProcessing}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className={styles.inputField}
                    disabled={isProcessing}
                  />
                </div>
                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>Address</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Curated Lane"
                    className={styles.inputField}
                    disabled={isProcessing}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Design City"
                    className={styles.inputField}
                    disabled={isProcessing}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>State / Region</label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="West Region"
                    className={styles.inputField}
                    disabled={isProcessing}
                  />
                </div>
                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>Postal / ZIP Code</label>
                  <input
                    type="text"
                    required
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="90210"
                    className={styles.inputField}
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Method */}
            <div className={styles.stepCard}>
              <h2 className={styles.cardTitle}>
                <span className={styles.titleNum}>2</span>
                <span>Shipping Method</span>
              </h2>
              <div className={styles.shippingOptions}>
                <label className={styles.shippingRadioLabel}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === "standard"}
                      onChange={() => setShippingMethod("standard")}
                      className={styles.radioInput}
                      disabled={isProcessing}
                    />
                    <div>
                      <span className={styles.radioLabelText}>Standard Shipping</span>
                      <p className={styles.radioLabelDesc}>Delivered within 3–5 business days</p>
                    </div>
                  </div>
                  <span className={styles.shippingPrice}>
                    {selectedSubtotalPrice > 100 ? "FREE" : "$10.00"}
                  </span>
                </label>

                <label className={styles.shippingRadioLabel}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === "express"}
                      onChange={() => setShippingMethod("express")}
                      className={styles.radioInput}
                      disabled={isProcessing}
                    />
                    <div>
                      <span className={styles.radioLabelText}>Express Courier</span>
                      <p className={styles.radioLabelDesc}>Delivered within 1–2 business days</p>
                    </div>
                  </div>
                  <span className={styles.shippingPrice}>$15.00</span>
                </label>
              </div>
            </div>

            {/* Step 3: Payment Details */}
            <div className={styles.stepCard}>
              <h2 className={styles.cardTitle}>
                <span className={styles.titleNum}>3</span>
                <span>Payment Details</span>
              </h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, ""))}
                    placeholder="4111 2222 3333 4444"
                    maxLength={16}
                    className={styles.inputField}
                    disabled={isProcessing}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Expiration Date</label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className={styles.inputField}
                    disabled={isProcessing}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Security Code (CVV)</label>
                  <input
                    type="password"
                    required
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                    placeholder="•••"
                    maxLength={3}
                    className={styles.inputField}
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Right Column: Order Summary */}
          <aside className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Review Order</h2>

            <div className={styles.checkoutItemsList}>
              {cart.map((item) => {
                const itemKey = `${item.product.id}-${item.selectedColor || "default"}`;
                const isSelected = selectedItemKeys[itemKey] === true;
                return (
                  <div
                    key={itemKey}
                    className={`${styles.checkoutItemRow} ${isSelected ? "" : styles.unselectedRow}`}
                  >
                    <div className={styles.checkboxWrapper}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.product.id, item.selectedColor)}
                        className={styles.itemCheckbox}
                        disabled={isProcessing}
                      />
                    </div>
                    <div className={styles.itemImageWrapper}>
                      <Image
                        src={item.product.image}
                        alt={item.product.title}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="50px"
                      />
                    </div>
                    <div className={styles.itemRowInfo}>
                      <span className={styles.itemRowTitle}>{item.product.title}</span>
                      <span className={styles.itemRowMeta}>
                        Qty: {item.quantity} {item.selectedColor ? `| ${item.selectedColor}` : ""}
                      </span>
                    </div>
                    <span className={styles.itemRowPrice}>
                      ${formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Subtotal</span>
                <span>${formatPrice(selectedSubtotalPrice)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Shipping</span>
                {shippingFee === 0 ? (
                  <span className={styles.freeShippingTag}>FREE</span>
                ) : (
                  <span>${formatPrice(shippingFee)}</span>
                )}
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Estimated Tax</span>
                <span>${formatPrice(estimatedTax)}</span>
              </div>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalValue}>${formatPrice(finalTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={isProcessing || selectedCart.length === 0}
              className={styles.payBtn}
            >
              {isProcessing ? (
                <span className={styles.loadingSpinner} />
              ) : (
                <>
                  <LockIcon />
                  <span>Authorize & Pay ${formatPrice(finalTotal)}</span>
                </>
              )}
            </button>

            <Link href="/cart" className={styles.backToCartLink}>
              Modify Shopping Cart
            </Link>
          </aside>
        </div>
      )}

      {/* Success Modal overlay */}
      {showSuccess && (
        <div className={styles.successOverlay}>
          <div className={styles.successCard}>
            <div className={styles.successTickCircle}>
              <CheckIcon />
            </div>
            <h3 className={styles.successTitle}>Order Placed!</h3>
            <p className={styles.successText}>
              Thank you for your purchase. We are processing your order and a receipt has been sent to your email.
            </p>
            <span style={{ fontSize: "0.8rem", color: "var(--color-olive-gray)" }}>
              Redirecting you to homepage...
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
