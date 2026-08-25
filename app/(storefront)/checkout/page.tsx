"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./checkout.module.css";
import { useCart } from "@/app/context/CartContext";
import { formatPrice } from "@/app/data/data";
import { useQuery, useMutation, useAction } from "convex/react";
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

  const isGuest = user === null;

  // State for manual address inputs (for guests, or if logged-in user wants to use a new address)
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [payDirectly, setPayDirectly] = useState(false);

  const [guestAddress, setGuestAddress] = useState({
    fullName: "",
    email: "",
    phone: "",
    streetAddress: "",
    apartment: "",
    city: "",
    stateName: "",
    postalCode: "",
    country: "Nigeria",
  });

  // Fetch saved shipping addresses and tokenized card details from Convex
  const addresses = useQuery(api.addresses.getUserAddresses);
  const paymentMethods = useQuery(api.billing.getUserPaymentMethods);
  const dbProducts = useQuery(api.products.getProducts);

  // Selected address/card options
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [isChangingPayment, setIsChangingPayment] = useState(false);

  const createOrder = useMutation(api.orders.createUnpaidOrder);
  const chargeCard = useAction(api.paystackBilling.chargeSavedCardForOrder);
  const verifyInlinePayment = useAction(api.paystackActions.verifyInlinePaymentForOrder);

  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const isUsingSavedCard = !isGuest && activePayment && !payDirectly;
    const activeAddrObj = isGuest || useManualAddress || !activeAddress ? {
      fullName: guestAddress.fullName,
      phone: guestAddress.phone,
      streetAddress: guestAddress.streetAddress,
      apartment: guestAddress.apartment,
      city: guestAddress.city,
      stateName: guestAddress.stateName,
      postalCode: guestAddress.postalCode,
      country: guestAddress.country,
    } : {
      fullName: activeAddress.fullName,
      phone: activeAddress.phone,
      streetAddress: activeAddress.streetAddress,
      apartment: activeAddress.apartment,
      city: activeAddress.city,
      stateName: activeAddress.stateName,
      postalCode: activeAddress.postalCode,
      country: activeAddress.country,
    };

    if (selectedCart.length === 0) return;
    if (!activeAddrObj.fullName || !activeAddrObj.phone || !activeAddrObj.streetAddress || !activeAddrObj.city || !activeAddrObj.stateName || !activeAddrObj.postalCode || !activeAddrObj.country) {
      setPaymentError("Please fill in all shipping address fields.");
      return;
    }
    if (isGuest && !guestAddress.email) {
      setPaymentError("Please enter your email address.");
      return;
    }
    if (!isUsingSavedCard && !process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
      setPaymentError("Paystack is not configured. Please contact support.");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // 1. Prepare items snapshot using database product IDs
      const orderItems = selectedCart.map((item: any) => {
        const dbProd = dbProducts?.find((p: any) => p.title === item.product.title);
        if (!dbProd) {
          throw new Error(`Product "${item.product.title}" not found in database catalog.`);
        }
        return {
          productId: dbProd._id,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
          color: item.selectedColor,
          image: item.product.image,
        };
      });

      // 2. Create the unpaid order record in Convex
      const orderId = await createOrder({
        email: isGuest ? guestAddress.email : (user?.email || undefined),
        items: orderItems,
        address: activeAddrObj,
        shippingMethod,
        shippingFee,
        totalAmount: finalTotal,
      });

      if (isUsingSavedCard) {
        // 3. Request Paystack billing server-side via saved card authorization
        const result = await chargeCard({
          orderId,
          authorizationCode: activePayment.authorizationCode,
          email: user?.email || activePayment.email || "shopper@beembai.com",
          amount: finalTotal,
        });

        if (!result.success) {
          setPaymentError(result.message);
          setIsProcessing(false);
          return;
        }

        // 4. Success! Clear cart items and show confirmation screen
        clearSelectedCart();
        setIsProcessing(false);
        setShowSuccess(true);
        setTimeout(() => {
          router.push("/orders");
        }, 3500);
      } else {
        // 3. Direct/Guest payment: open Paystack inline popup
        const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
        const customerEmail = isGuest ? guestAddress.email : (user?.email || "shopper@beembai.com");

        import("@paystack/inline-js").then(({ default: PaystackPop }) => {
          const popup = new PaystackPop();
          popup.newTransaction({
            key: publicKey || "",
            email: customerEmail,
            amount: Math.round(finalTotal * 100), // in kobo
            currency: "NGN",
            onSuccess: async (transaction: { reference: string }) => {
              try {
                // Verify on Convex
                const result = await verifyInlinePayment({
                  orderId,
                  reference: transaction.reference,
                });

                if (!result.success) {
                  setPaymentError(result.message);
                  setIsProcessing(false);
                  return;
                }

                // 4. Success! Clear cart items and show confirmation screen
                clearSelectedCart();
                setIsProcessing(false);
                setShowSuccess(true);
                setTimeout(() => {
                  if (isGuest) {
                    router.push(`/orders?track=true&orderId=${orderId}&email=${customerEmail}`);
                  } else {
                    router.push("/orders");
                  }
                }, 3500);
              } catch (err: unknown) {
                console.error("Inline payment verification failed:", err);
                const msg = err instanceof Error ? err.message : "Payment verification failed.";
                setPaymentError(msg);
                setIsProcessing(false);
              }
            },
            onCancel: () => {
              setIsProcessing(false);
            },
          });
        }).catch((err) => {
          console.error("Could not load Paystack Inline JS:", err);
          setPaymentError("Could not load payment popup. Please check your network and try again.");
          setIsProcessing(false);
        });
      }
    } catch (err: unknown) {
      console.error("Checkout process failed:", err);
      const msg = err instanceof Error ? err.message : "Checkout order processing failed.";
      setPaymentError(msg);
      setIsProcessing(false);
    }
  };

  // If loading session
  if (user === undefined) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--background)", color: "var(--foreground)" }}>
        <p style={{ fontWeight: 700 }}>Authenticating session...</p>
      </div>
    );
  }

  const isCheckoutDisabled = selectedCart.length === 0 || 
    (isGuest && (!guestAddress.fullName || !guestAddress.email || !guestAddress.phone || !guestAddress.streetAddress || !guestAddress.city || !guestAddress.stateName || !guestAddress.postalCode)) ||
    (!isGuest && useManualAddress && (!guestAddress.fullName || !guestAddress.phone || !guestAddress.streetAddress || !guestAddress.city || !guestAddress.stateName || !guestAddress.postalCode)) ||
    (!isGuest && !useManualAddress && !activeAddress) ||
    (!isGuest && !payDirectly && !activePayment);

  return (
    <main className={styles.checkoutPage}>
      {/* Header Row */}
      <header className={styles.headerRow}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <button onClick={() => router.push("/cart")} className={styles.backButton}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </button>
          <Link href="/" className={styles.logo}>
            <span>beembai</span>
            <span className={styles.logoDot} />
          </Link>
        </div>
        <div className={styles.securityBadge}>
          <ShieldCheckIcon />
          <span>Secure Checkout</span>
        </div>
      </header>

      {paymentError && (
        <div className={styles.paymentErrorBanner}>
          <span>⚠ {paymentError}</span>
          <button onClick={() => setPaymentError(null)} className={styles.errorClose}>✕</button>
        </div>
      )}

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
                {!isGuest && addresses && addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (useManualAddress) {
                        setUseManualAddress(false);
                      } else {
                        setIsChangingAddress(true);
                      }
                    }}
                    className={styles.changeBtn}
                  >
                    {useManualAddress ? "Use Saved Address" : "Change"}
                  </button>
                )}
              </div>

              {addresses === undefined ? (
                <div className={styles.loaderPlaceholder}>Loading saved addresses...</div>
              ) : (isGuest || useManualAddress || addresses.length === 0) ? (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Full Name</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={guestAddress.fullName}
                      onChange={(e) => setGuestAddress({ ...guestAddress, fullName: e.target.value })}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                  {isGuest && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Email Address</label>
                      <input
                        type="email"
                        className={styles.inputField}
                        value={guestAddress.email}
                        onChange={(e) => setGuestAddress({ ...guestAddress, email: e.target.value })}
                        required
                        placeholder="john@example.com"
                      />
                    </div>
                  )}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Phone Number</label>
                    <input
                      type="tel"
                      className={styles.inputField}
                      value={guestAddress.phone}
                      onChange={(e) => setGuestAddress({ ...guestAddress, phone: e.target.value })}
                      required
                      placeholder="+234..."
                    />
                  </div>
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Street Address</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={guestAddress.streetAddress}
                      onChange={(e) => setGuestAddress({ ...guestAddress, streetAddress: e.target.value })}
                      required
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Apartment, Suite, etc. (optional)</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={guestAddress.apartment}
                      onChange={(e) => setGuestAddress({ ...guestAddress, apartment: e.target.value })}
                      placeholder="Apt 4B"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>City</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={guestAddress.city}
                      onChange={(e) => setGuestAddress({ ...guestAddress, city: e.target.value })}
                      required
                      placeholder="Lagos"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>State / Region</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={guestAddress.stateName}
                      onChange={(e) => setGuestAddress({ ...guestAddress, stateName: e.target.value })}
                      required
                      placeholder="Lagos State"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Postal / ZIP Code</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={guestAddress.postalCode}
                      onChange={(e) => setGuestAddress({ ...guestAddress, postalCode: e.target.value })}
                      required
                      placeholder="100001"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Country</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={guestAddress.country}
                      onChange={(e) => setGuestAddress({ ...guestAddress, country: e.target.value })}
                      required
                      placeholder="Nigeria"
                    />
                  </div>
                  {!isGuest && addresses.length > 0 && (
                    <div className={styles.formGroupFull} style={{ marginTop: "1rem" }}>
                      <button
                        type="button"
                        onClick={() => setUseManualAddress(false)}
                        className={styles.cancelSelectionBtn}
                        style={{ width: "fit-content" }}
                      >
                        Cancel & Use Saved Address
                      </button>
                    </div>
                  )}
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
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setUseManualAddress(true);
                        setIsChangingAddress(false);
                      }}
                      className={styles.addDetailsBtn}
                      style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
                    >
                      + Use a New Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChangingAddress(false)}
                      className={styles.cancelSelectionBtn}
                    >
                      Cancel
                    </button>
                  </div>
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
                  <div style={{ marginTop: "1rem" }}>
                    <button
                      type="button"
                      onClick={() => setUseManualAddress(true)}
                      className={styles.changeBtn}
                      style={{ fontSize: "0.82rem" }}
                    >
                      Use a new address instead
                    </button>
                  </div>
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
                {!isGuest && paymentMethods && paymentMethods.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (payDirectly) {
                        setPayDirectly(false);
                      } else {
                        setIsChangingPayment(true);
                      }
                    }}
                    className={styles.changeBtn}
                  >
                    {payDirectly ? "Use Saved Card" : "Change"}
                  </button>
                )}
              </div>

              {paymentMethods === undefined ? (
                <div className={styles.loaderPlaceholder}>Loading saved cards...</div>
              ) : (isGuest || payDirectly || paymentMethods.length === 0) ? (
                <div className={styles.detailsPreviewCard} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <p style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, color: "var(--foreground)" }}>
                    💳 Secure Checkout via Paystack
                  </p>
                  <p style={{ fontSize: "0.88rem", opacity: 0.8, margin: 0, lineHeight: 1.5 }}>
                    You will be prompted to make a secure payment using Paystack popup on clicking &ldquo;Authorize &amp; Pay&rdquo;. Paystack supports Cards, USSD, Bank Transfers, and EFTs securely.
                  </p>
                  {!isGuest && paymentMethods.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayDirectly(false)}
                      className={styles.cancelSelectionBtn}
                      style={{ width: "fit-content", marginTop: "0.5rem" }}
                    >
                      Cancel & Use Saved Card
                    </button>
                  )}
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
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPayDirectly(true);
                        setIsChangingPayment(false);
                      }}
                      className={styles.addDetailsBtn}
                      style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
                    >
                      + Pay with a New Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChangingPayment(false)}
                      className={styles.cancelSelectionBtn}
                    >
                      Cancel
                    </button>
                  </div>
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
                  <p className={styles.previewText} style={{ opacity: 0.8, marginBottom: "1rem" }}>
                    Expires {activePayment.expMonth}/{activePayment.expYear}
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => setPayDirectly(true)}
                      className={styles.changeBtn}
                      style={{ fontSize: "0.82rem" }}
                    >
                      Pay with a new card instead
                    </button>
                  </div>
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
