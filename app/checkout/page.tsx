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

  // Fetch saved shipping addresses and tokenized card details from Convex
  const addresses = useQuery(api.addresses.getUserAddresses);
  const paymentMethods = useQuery(api.billing.getUserPaymentMethods);

  // Selected address/card options
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [isChangingPayment, setIsChangingPayment] = useState(false);

  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize selected address/payment
  useEffect(() => {
    if (addresses && !selectedAddressId) {
      const def = addresses.find((a: any) => a.isDefault) || addresses[0];
      if (def) setSelectedAddressId(def._id);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (paymentMethods && !selectedPaymentId) {
      const def = paymentMethods.find((p: any) => p.isDefault) || paymentMethods[0];
      if (def) setSelectedPaymentId(def._id);
    }
  }, [paymentMethods, selectedPaymentId]);

  const activeAddress = addresses?.find((a: any) => a._id === selectedAddressId);
  const activePayment = paymentMethods?.find((p: any) => p._id === selectedPaymentId);

  const shippingFee = shippingMethod === "express" ? 15 : (selectedSubtotalPrice > 100 || selectedSubtotalPrice === 0 ? 0 : 10);
  const finalTotal = selectedSubtotalPrice + shippingFee;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCart.length === 0 || !activeAddress || !activePayment) return;
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

  const isCheckoutDisabled = selectedCart.length === 0 || !activeAddress || !activePayment;

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
          {/* Left Column: Saved checkout configurations */}
          <div className={styles.formSection}>
            
            {/* Step 1: Shipping Address Details */}
            <div className={styles.stepCard}>
              <div className={styles.stepCardHeader}>
                <h2 className={styles.cardTitle}>
                  <span className={styles.titleNum}>1</span>
                  <span>Shipping Address</span>
                </h2>
                {addresses && addresses.length > 0 && !isChangingAddress && (
                  <button
                    type="button"
                    onClick={() => setIsChangingAddress(true)}
                    className={styles.changeBtn}
                  >
                    Change
                  </button>
                )}
              </div>

              {addresses === undefined ? (
                <div className={styles.loaderPlaceholder}>Loading saved addresses...</div>
              ) : addresses.length === 0 ? (
                <div className={styles.emptyCallout}>
                  <p>You don't have any shipping addresses saved yet.</p>
                  <Link href="/addresses" className={styles.addDetailsBtn}>
                    Add Shipping Address
                  </Link>
                </div>
              ) : isChangingAddress ? (
                <div className={styles.selectionList}>
                  {addresses.map((addr: any) => (
                    <label
                      key={addr._id}
                      className={`${styles.selectionItem} ${selectedAddressId === addr._id ? styles.selectionItemActive : ""}`}
                    >
                      <input
                        type="radio"
                        name="checkout_address"
                        checked={selectedAddressId === addr._id}
                        onChange={() => {
                          setSelectedAddressId(addr._id);
                          setIsChangingAddress(false);
                        }}
                        className={styles.selectionRadio}
                      />
                      <div className={styles.selectionInfo}>
                        <span className={styles.selectionName}>{addr.fullName} ({addr.phone})</span>
                        <span className={styles.selectionText}>
                          {addr.streetAddress}{addr.apartment ? `, ${addr.apartment}` : ""}, {addr.city}, {addr.stateName}
                        </span>
                      </div>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsChangingAddress(false)}
                    className={styles.cancelSelectionBtn}
                  >
                    Cancel
                  </button>
                </div>
              ) : activeAddress ? (
                <div className={styles.detailsPreviewCard}>
                  <p className={styles.previewName}>{activeAddress.fullName}</p>
                  <p className={styles.previewText}>
                    {activeAddress.streetAddress}
                    {activeAddress.apartment ? `, ${activeAddress.apartment}` : ""}
                  </p>
                  <p className={styles.previewText}>
                    {activeAddress.city}, {activeAddress.stateName} {activeAddress.postalCode}
                  </p>
                  <p className={styles.previewText}>{activeAddress.country}</p>
                  <p className={styles.previewPhone}>📞 {activeAddress.phone}</p>
                </div>
              ) : null}
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
                    {selectedSubtotalPrice > 100 ? "FREE" : "₦15,000"}
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
                  <span className={styles.shippingPrice}>₦22,500</span>
                </label>
              </div>
            </div>

            {/* Step 3: Payment Details */}
            <div className={styles.stepCard}>
              <div className={styles.stepCardHeader}>
                <h2 className={styles.cardTitle}>
                  <span className={styles.titleNum}>3</span>
                  <span>Payment Details</span>
                </h2>
                {paymentMethods && paymentMethods.length > 0 && !isChangingPayment && (
                  <button
                    type="button"
                    onClick={() => setIsChangingPayment(true)}
                    className={styles.changeBtn}
                  >
                    Change
                  </button>
                )}
              </div>

              {paymentMethods === undefined ? (
                <div className={styles.loaderPlaceholder}>Loading saved cards...</div>
              ) : paymentMethods.length === 0 ? (
                <div className={styles.emptyCallout}>
                  <p>You don't have any saved payment methods.</p>
                  <Link href="/billing" className={styles.addDetailsBtn}>
                    Add Payment Method
                  </Link>
                </div>
              ) : isChangingPayment ? (
                <div className={styles.selectionList}>
                  {paymentMethods.map((pm: any) => (
                    <label
                      key={pm._id}
                      className={`${styles.selectionItem} ${selectedPaymentId === pm._id ? styles.selectionItemActive : ""}`}
                    >
                      <input
                        type="radio"
                        name="checkout_payment"
                        checked={selectedPaymentId === pm._id}
                        onChange={() => {
                          setSelectedPaymentId(pm._id);
                          setIsChangingPayment(false);
                        }}
                        className={styles.selectionRadio}
                      />
                      <div className={styles.selectionInfo}>
                        <span className={styles.selectionName}>
                          {pm.cardType.toUpperCase()} •••• {pm.last4}
                        </span>
                        <span className={styles.selectionText}>
                          {pm.bank} · Expires {pm.expMonth}/{pm.expYear}
                        </span>
                      </div>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsChangingPayment(false)}
                    className={styles.cancelSelectionBtn}
                  >
                    Cancel
                  </button>
                </div>
              ) : activePayment ? (
                <div className={styles.detailsPreviewCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span className={styles.cardIconBadge}>
                      {activePayment.cardType.toUpperCase()}
                    </span>
                    <span className={styles.previewName}>
                      •••• •••• •••• {activePayment.last4}
                    </span>
                  </div>
                  <p className={styles.previewText}>{activePayment.bank}</p>
                  <p className={styles.previewText} style={{ opacity: 0.8 }}>
                    Expires {activePayment.expMonth}/{activePayment.expYear}
                  </p>
                </div>
              ) : null}
            </div>

          </div>

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
                      ₦{formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Subtotal</span>
                <span>₦{formatPrice(selectedSubtotalPrice)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Shipping</span>
                {shippingFee === 0 ? (
                  <span className={styles.freeShippingTag}>FREE</span>
                ) : (
                  <span>₦{formatPrice(shippingFee)}</span>
                )}
              </div>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalValue}>₦{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={isProcessing || isCheckoutDisabled}
              className={styles.payBtn}
            >
              {isProcessing ? (
                <span className={styles.loadingSpinner} />
              ) : (
                <>
                  <LockIcon />
                  <span>Authorize & Pay ₦{formatPrice(finalTotal)}</span>
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
