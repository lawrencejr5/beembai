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
import {
  NIGERIA_STATES_LIST,
  getLgasByState,
  getCitiesByState,
} from "@/app/data/nigeriaLocations";

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
    lga: "",
    stateName: "",
    postalCode: "",
    country: "Nigeria",
  });
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState("");
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(true);

  // Cascading options for state, LGA, and city selection
  const availableLgas = guestAddress.stateName
    ? getLgasByState(guestAddress.stateName)
    : [];
  const availableCities = guestAddress.stateName
    ? getCitiesByState(guestAddress.stateName)
    : [];

  const handleStateChange = (newState: string) => {
    setGuestAddress((prev) => ({
      ...prev,
      stateName: newState,
      lga: "",
      city: "",
    }));
    setIsCustomCity(false);
    setCustomCity("");
  };

  const handleCitySelectChange = (val: string) => {
    if (val === "__custom__") {
      setIsCustomCity(true);
      setGuestAddress((prev) => ({ ...prev, city: customCity }));
    } else {
      setIsCustomCity(false);
      setGuestAddress((prev) => ({ ...prev, city: val }));
    }
  };

  const handleCustomCityChange = (val: string) => {
    setCustomCity(val);
    setGuestAddress((prev) => ({ ...prev, city: val }));
  };

  // Fetch saved shipping addresses and tokenized card details from Convex
  const addresses = useQuery(api.addresses.getUserAddresses);
  const paymentMethods = useQuery(api.billing.getUserPaymentMethods);
  const dbProducts = useQuery(api.products.getProducts);

  // Selected address/card options
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null,
  );
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [isChangingPayment, setIsChangingPayment] = useState(false);

  const addAddress = useMutation(api.addresses.addAddress);
  const createOrder = useMutation(api.orders.createUnpaidOrder);
  const chargeCard = useAction(api.paystackBilling.chargeSavedCardForOrder);
  const verifyInlinePayment = useAction(
    api.paystackActions.verifyInlinePaymentForOrder,
  );
  const calculateGiglFee = useAction(api.gigl.calculateShippingFee);
  const getServiceCentres = useAction(api.gigl.getServiceCentres);

  const [shippingMethod, setShippingMethod] = useState<
    "pickup" | "doorstep" | "express"
  >("pickup");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Available GIGL physical service centres in destination state
  const [serviceCentres, setServiceCentres] = useState<
    Array<{
      serviceCentreId: number;
      name: string;
      code: string;
      address: string;
    }>
  >([]);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(
    null,
  );
  const [loadingCentres, setLoadingCentres] = useState(false);
  const chosenStation = serviceCentres.find(
    (c) => c.serviceCentreId === selectedStationId,
  );

  // GIG Logistics Live Shipping Calculation State
  const [giglQuotes, setGiglQuotes] = useState({
    pickupFee: 1500,
    doorstepFee: 3500,
    expressFee: 5500,
    standardFee: 3500,
    totalWeight: 0.5,
    estimatedDaysPickup: "1 - 2 business days",
    estimatedDaysDoorstep: "2 - 4 business days",
    estimatedDaysExpress: "1 - 2 business days",
    isCalculating: false,
  });

  // Initialize selected address/payment
  useEffect(() => {
    if (addresses && !selectedAddressId) {
      const def = addresses.find((a: any) => a.isDefault) || addresses[0];
      if (def) setSelectedAddressId(def._id);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (paymentMethods && !selectedPaymentId) {
      const def =
        paymentMethods.find((p: any) => p.isDefault) || paymentMethods[0];
      if (def) setSelectedPaymentId(def._id);
    }
  }, [paymentMethods, selectedPaymentId]);

  const activeAddress = addresses?.find(
    (a: any) => a._id === selectedAddressId,
  );
  const activePayment = paymentMethods?.find(
    (p: any) => p._id === selectedPaymentId,
  );

  // Recalculate GIG Logistics fee dynamically whenever the destination changes
  const destinationState =
    isGuest || useManualAddress || !activeAddress
      ? guestAddress.stateName
      : activeAddress?.stateName;

  const destinationCity =
    isGuest || useManualAddress || !activeAddress
      ? guestAddress.city
      : activeAddress?.city;

  // Fetch GIGL physical service centres whenever the destination state changes
  useEffect(() => {
    const stateToFetch = destinationState || destinationCity;
    if (!stateToFetch) return;

    let active = true;
    setLoadingCentres(true);

    getServiceCentres({ stateOrCity: stateToFetch })
      .then((centres) => {
        if (active && centres) {
          setServiceCentres(centres);
          if (centres.length > 0) {
            setSelectedStationId(centres[0].serviceCentreId);
          }
        }
      })
      .catch((err) => console.error("Error fetching service centres:", err))
      .finally(() => {
        if (active) setLoadingCentres(false);
      });

    return () => {
      active = false;
    };
  }, [destinationState, destinationCity, getServiceCentres]);

  useEffect(() => {
    if (!destinationState && !destinationCity) return;
    if (selectedCart.length === 0) return;

    let isMounted = true;
    setGiglQuotes((prev) => ({ ...prev, isCalculating: true }));

    const timer = setTimeout(async () => {
      try {
        const itemsPayload = selectedCart.map((i: any) => ({
          title: i.product.title,
          price: i.product.price,
          quantity: i.quantity,
          weight:
            typeof i.product.weight === "number"
              ? i.product.weight
              : parseFloat(
                  String(i.product.weight || "").replace(/[^0-9.]/g, ""),
                ) || 0.5,
        }));

        const res = await calculateGiglFee({
          receiverState: destinationState || "Lagos",
          receiverCity: destinationCity || undefined,
          items: itemsPayload,
        });

        if (isMounted && res) {
          setGiglQuotes({
            pickupFee: res.pickupFee ?? 1500,
            doorstepFee: res.doorstepFee ?? res.standardFee ?? 3500,
            expressFee: res.expressFee ?? 5500,
            standardFee: res.doorstepFee ?? res.standardFee ?? 3500,
            totalWeight: res.totalWeight ?? 0.5,
            estimatedDaysPickup:
              res.estimatedDaysPickup ?? "1 - 2 business days",
            estimatedDaysDoorstep:
              res.estimatedDaysDoorstep ?? "2 - 4 business days",
            estimatedDaysExpress:
              res.estimatedDaysExpress ?? "1 - 2 business days",
            isCalculating: false,
          });
        }
      } catch (err) {
        console.error("GIGL delivery fee calculation error:", err);
        if (isMounted) {
          setGiglQuotes((prev) => ({ ...prev, isCalculating: false }));
        }
      }
    }, 450);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [destinationState, destinationCity, selectedCart, calculateGiglFee]);

  const shippingFee =
    selectedCart.length === 0
      ? 0
      : shippingMethod === "pickup"
        ? giglQuotes.pickupFee
        : shippingMethod === "express"
          ? giglQuotes.expressFee
          : giglQuotes.doorstepFee;
  const finalTotal = selectedSubtotalPrice + shippingFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const isUsingSavedCard = !isGuest && activePayment && !payDirectly;
    const activeAddrObj =
      isGuest || useManualAddress || !activeAddress
        ? {
            fullName: guestAddress.fullName,
            phone: guestAddress.phone,
            streetAddress:
              shippingMethod === "pickup" && chosenStation
                ? chosenStation.address
                : guestAddress.streetAddress || "GIGL Station Pickup",
            apartment: guestAddress.apartment,
            city:
              guestAddress.city ||
              (chosenStation ? chosenStation.name : "City"),
            lga: guestAddress.lga,
            stateName: guestAddress.stateName,
            postalCode: guestAddress.postalCode || "100001",
            country: guestAddress.country || "Nigeria",
            pickupStationName:
              shippingMethod === "pickup" ? chosenStation?.name : undefined,
            pickupStationAddress:
              shippingMethod === "pickup" ? chosenStation?.address : undefined,
            pickupStationId:
              shippingMethod === "pickup"
                ? chosenStation?.serviceCentreId
                : undefined,
          }
        : {
            fullName: activeAddress.fullName,
            phone: activeAddress.phone,
            streetAddress:
              shippingMethod === "pickup" && chosenStation
                ? chosenStation.address
                : activeAddress.streetAddress,
            apartment: activeAddress.apartment,
            city: activeAddress.city,
            lga: activeAddress.lga,
            stateName: activeAddress.stateName,
            postalCode: activeAddress.postalCode,
            country: activeAddress.country,
            pickupStationName:
              shippingMethod === "pickup" ? chosenStation?.name : undefined,
            pickupStationAddress:
              shippingMethod === "pickup" ? chosenStation?.address : undefined,
            pickupStationId:
              shippingMethod === "pickup"
                ? chosenStation?.serviceCentreId
                : undefined,
          };

    if (selectedCart.length === 0) return;
    if (
      !activeAddrObj.fullName ||
      !activeAddrObj.phone ||
      !activeAddrObj.stateName
    ) {
      setPaymentError(
        "Please fill in all required shipping contact and state details.",
      );
      return;
    }
    if (shippingMethod === "pickup") {
      if (serviceCentres.length > 0 && !selectedStationId) {
        setPaymentError("Please select a GIGL pickup station for collection.");
        return;
      }
    } else {
      if (
        !activeAddrObj.streetAddress ||
        activeAddrObj.streetAddress === "GIGL Station Pickup"
      ) {
        setPaymentError(
          "Please provide your street address for home delivery.",
        );
        return;
      }
      if (!activeAddrObj.city) {
        setPaymentError("Please provide your city/town for home delivery.");
        return;
      }
    }
    if ((isGuest || useManualAddress || !activeAddress) && !activeAddrObj.lga) {
      setPaymentError("Please select your Local Government Area (LGA).");
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
        const dbProd = dbProducts?.find(
          (p: any) => p.title === item.product.title,
        );
        if (!dbProd) {
          throw new Error(
            `Product "${item.product.title}" not found in database catalog.`,
          );
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
        email: isGuest ? guestAddress.email : user?.email || undefined,
        items: orderItems,
        address: activeAddrObj,
        shippingMethod,
        shippingFee,
        totalAmount: finalTotal,
      });

      // Optional: Save new address to user profile if authenticated and requested
      if (
        !isGuest &&
        (useManualAddress || !activeAddress) &&
        saveAddressToAccount
      ) {
        try {
          await addAddress({
            fullName: activeAddrObj.fullName,
            phone: activeAddrObj.phone,
            streetAddress: activeAddrObj.streetAddress,
            apartment: activeAddrObj.apartment,
            city: activeAddrObj.city,
            lga: activeAddrObj.lga,
            stateName: activeAddrObj.stateName,
            postalCode: activeAddrObj.postalCode || "100001",
            country: activeAddrObj.country || "Nigeria",
          });
        } catch (e) {
          console.error("Failed to save address to user account:", e);
        }
      }

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
        const customerEmail = isGuest
          ? guestAddress.email
          : user?.email || "shopper@beembai.com";

        import("@paystack/inline-js")
          .then(({ default: PaystackPop }) => {
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
                      router.push(
                        `/orders?track=true&orderId=${orderId}&email=${customerEmail}`,
                      );
                    } else {
                      router.push("/orders");
                    }
                  }, 3500);
                } catch (err: unknown) {
                  console.error("Inline payment verification failed:", err);
                  const msg =
                    err instanceof Error
                      ? err.message
                      : "Payment verification failed.";
                  setPaymentError(msg);
                  setIsProcessing(false);
                }
              },
              onCancel: () => {
                setIsProcessing(false);
              },
            });
          })
          .catch((err) => {
            console.error("Could not load Paystack Inline JS:", err);
            setPaymentError(
              "Could not load payment popup. Please check your network and try again.",
            );
            setIsProcessing(false);
          });
      }
    } catch (err: unknown) {
      console.error("Checkout process failed:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Checkout order processing failed.";
      setPaymentError(msg);
      setIsProcessing(false);
    }
  };

  // If loading session
  if (user === undefined) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        <p style={{ fontWeight: 700 }}>Authenticating session...</p>
      </div>
    );
  }

  const isCheckoutDisabled =
    selectedCart.length === 0 ||
    (isGuest &&
      (!guestAddress.fullName ||
        !guestAddress.email ||
        !guestAddress.phone ||
        !guestAddress.streetAddress ||
        !guestAddress.city ||
        !guestAddress.stateName ||
        !guestAddress.postalCode)) ||
    (!isGuest &&
      useManualAddress &&
      (!guestAddress.fullName ||
        !guestAddress.phone ||
        !guestAddress.streetAddress ||
        !guestAddress.city ||
        !guestAddress.stateName ||
        !guestAddress.postalCode)) ||
    (!isGuest && !useManualAddress && !activeAddress) ||
    (!isGuest && !payDirectly && !activePayment);

  return (
    <main className={styles.checkoutPage}>
      {/* Header Row */}
      <header className={styles.headerRow}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <button
            onClick={() => router.push("/cart")}
            className={styles.backButton}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
          <button
            onClick={() => setPaymentError(null)}
            className={styles.errorClose}
          >
            ✕
          </button>
        </div>
      )}

      {cart.length === 0 && !showSuccess ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.8rem",
              fontWeight: 900,
              color: "var(--color-papyrus)",
            }}
          >
            Your checkout cart is empty
          </h2>
          <p style={{ maxWidth: "480px", opacity: 0.8 }}>
            There are no items in your cart. Redirecting you back to homepage to
            continue shopping...
          </p>
          <Link
            href="/"
            className={styles.payBtn}
            style={{ maxWidth: "240px" }}
          >
            Go to Homepage
          </Link>
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
                <div className={styles.loaderPlaceholder}>
                  Loading saved addresses...
                </div>
              ) : isGuest || useManualAddress || addresses.length === 0 ? (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Full Name</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={guestAddress.fullName}
                      onChange={(e) =>
                        setGuestAddress({
                          ...guestAddress,
                          fullName: e.target.value,
                        })
                      }
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
                        onChange={(e) =>
                          setGuestAddress({
                            ...guestAddress,
                            email: e.target.value,
                          })
                        }
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
                      onChange={(e) =>
                        setGuestAddress({
                          ...guestAddress,
                          phone: e.target.value,
                        })
                      }
                      required
                      placeholder="+234..."
                    />
                  </div>
                  {/* State / Region */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>State / Region *</label>
                    <select
                      className={styles.selectField}
                      value={guestAddress.stateName}
                      onChange={(e) => handleStateChange(e.target.value)}
                      required
                    >
                      <option value="">Select State</option>
                      {NIGERIA_STATES_LIST.map((st) => (
                        <option key={st} value={st}>
                          {st === "Federal Capital Territory"
                            ? "Abuja (Federal Capital Territory)"
                            : st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Local Government Area (LGA) */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Local Government Area (LGA) *
                    </label>
                    <select
                      className={styles.selectField}
                      value={guestAddress.lga}
                      onChange={(e) =>
                        setGuestAddress({
                          ...guestAddress,
                          lga: e.target.value,
                        })
                      }
                      disabled={!guestAddress.stateName}
                      required
                    >
                      <option value="">
                        {guestAddress.stateName
                          ? "Select LGA"
                          : "Select State First"}
                      </option>
                      {availableLgas.map((lga) => (
                        <option key={lga} value={lga}>
                          {lga}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City / Hub */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      City / Delivery Hub *
                    </label>
                    <select
                      className={styles.selectField}
                      value={isCustomCity ? "__custom__" : guestAddress.city}
                      onChange={(e) => handleCitySelectChange(e.target.value)}
                      disabled={!guestAddress.stateName}
                      required
                    >
                      <option value="">
                        {guestAddress.stateName
                          ? "Select City / Hub"
                          : "Select State First"}
                      </option>
                      {availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                      {guestAddress.stateName && (
                        <option value="__custom__">
                          Other / Specific Area...
                        </option>
                      )}
                    </select>
                  </div>

                  {/* Postal / ZIP Code */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Postal / ZIP Code
                    </label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={guestAddress.postalCode}
                      onChange={(e) =>
                        setGuestAddress({
                          ...guestAddress,
                          postalCode: e.target.value,
                        })
                      }
                      placeholder="100001 (optional)"
                    />
                  </div>

                  {/* Specific City / Area if "Other" is chosen */}
                  {isCustomCity && (
                    <div className={styles.formGroupFull}>
                      <label className={styles.formLabel}>
                        Specific City / Area Name *
                      </label>
                      <input
                        type="text"
                        className={styles.inputField}
                        value={customCity}
                        onChange={(e) => handleCustomCityChange(e.target.value)}
                        required
                        placeholder="e.g. Sangotedo, Magodo, Satellite Town"
                      />
                      <span className={styles.formHint}>
                        Enter your specific town, district, or landmark area for
                        door-step dispatch.
                      </span>
                    </div>
                  )}

                  {/* Street Address */}
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Street Address *</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={guestAddress.streetAddress}
                      onChange={(e) =>
                        setGuestAddress({
                          ...guestAddress,
                          streetAddress: e.target.value,
                        })
                      }
                      required
                      placeholder="123 Main Street"
                    />
                  </div>

                  {/* Apartment, Suite */}
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>
                      Apartment, Suite, etc. (optional)
                    </label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={guestAddress.apartment}
                      onChange={(e) =>
                        setGuestAddress({
                          ...guestAddress,
                          apartment: e.target.value,
                        })
                      }
                      placeholder="Penthouse A / Suite 402"
                    />
                  </div>

                  {/* Country */}
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Country</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value="Nigeria"
                      readOnly
                      style={{ opacity: 0.85, cursor: "not-allowed" }}
                    />
                    <span className={styles.formHint}>
                      Nationwide domestic delivery handled via GIG Logistics
                      network.
                    </span>
                  </div>

                  {/* Save address checkbox for authenticated users */}
                  {!isGuest && (
                    <div
                      className={styles.formGroupFull}
                      style={{ marginTop: "0.25rem" }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={saveAddressToAccount}
                          onChange={(e) =>
                            setSaveAddressToAccount(e.target.checked)
                          }
                          style={{
                            accentColor: "var(--color-palm)",
                            width: 16,
                            height: 16,
                          }}
                        />
                        Save this address to my saved addresses
                      </label>
                    </div>
                  )}

                  {!isGuest && addresses.length > 0 && (
                    <div
                      className={styles.formGroupFull}
                      style={{ marginTop: "0.75rem" }}
                    >
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
                        <span className={styles.selectionName}>
                          {addr.fullName} ({addr.phone})
                        </span>
                        <span className={styles.selectionText}>
                          {addr.streetAddress}
                          {addr.apartment ? `, ${addr.apartment}` : ""},{" "}
                          {addr.city}
                          {addr.lga ? `, ${addr.lga} LGA` : ""},{" "}
                          {addr.stateName}
                        </span>
                      </div>
                    </label>
                  ))}
                  <div
                    style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}
                  >
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
                    {activeAddress.apartment
                      ? `, ${activeAddress.apartment}`
                      : ""}
                  </p>
                  <p className={styles.previewText}>
                    {activeAddress.city}
                    {activeAddress.lga
                      ? `, ${activeAddress.lga} LGA`
                      : ""}, {activeAddress.stateName}{" "}
                    {activeAddress.postalCode
                      ? `(${activeAddress.postalCode})`
                      : ""}
                  </p>
                  <p className={styles.previewText}>
                    {activeAddress.country || "Nigeria"}
                  </p>
                  <p className={styles.previewPhone}>
                    📞 {activeAddress.phone}
                  </p>
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                  <span className={styles.titleNum}>2</span>
                  <span>Shipping Method</span>
                </h2>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.78rem",
                    color: "var(--color-palm)",
                    fontWeight: 600,
                    background: "rgba(35, 78, 64, 0.08)",
                    padding: "3px 10px",
                    borderRadius: "100px",
                  }}
                >
                  <span>🚚 Powered by GIG Logistics</span>
                  {giglQuotes.isCalculating ? (
                    <span style={{ opacity: 0.6, fontSize: "0.72rem" }}>
                      (calculating...)
                    </span>
                  ) : (
                    <span style={{ opacity: 0.85, fontSize: "0.72rem" }}>
                      • Parcel: {giglQuotes.totalWeight}kg
                    </span>
                  )}
                </div>
              </div>
              <div
                className={styles.shippingOptions}
                style={{ marginTop: "1rem" }}
              >
                {/* 1. GIGL Station Pickup */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    className={`${styles.shippingRadioLabel} ${shippingMethod === "pickup" ? styles.shippingRadioLabelActive : ""}`}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingMethod === "pickup"}
                        onChange={() => setShippingMethod("pickup")}
                        className={styles.radioInput}
                        disabled={isProcessing}
                      />
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "4px",
                          }}
                        >
                          <span className={styles.radioLabelText}>
                            🏢 GIGL Pickup Station
                          </span>
                        </div>
                        <p className={styles.radioLabelDesc}>
                          Collect at your nearest GIGL Service Centre in{" "}
                          {destinationState || "your state"} •{" "}
                          {giglQuotes.estimatedDaysPickup}
                        </p>
                      </div>
                    </div>
                    <span className={styles.shippingPrice}>
                      ₦{formatPrice(giglQuotes.pickupFee)}
                    </span>
                  </label>

                  {/* Station Selector Sub-card when Pickup is selected */}
                  {shippingMethod === "pickup" && (
                    <div className={styles.stationSelectorCard}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            color: "var(--foreground)",
                          }}
                        >
                          Choose GIGL Experience Centre:
                        </label>
                        {loadingCentres && (
                          <span
                            style={{
                              fontSize: "0.74rem",
                              color: "var(--color-olive-gray)",
                            }}
                          >
                            Refreshing stations...
                          </span>
                        )}
                      </div>

                      {serviceCentres.length > 0 ? (
                        <>
                          <select
                            className={styles.selectField}
                            value={selectedStationId ?? ""}
                            onChange={(e) =>
                              setSelectedStationId(Number(e.target.value))
                            }
                            disabled={isProcessing}
                            style={{
                              width: "100%",
                              padding: "0.65rem 0.85rem",
                              borderRadius: "8px",
                              fontSize: "0.85rem",
                            }}
                          >
                            {serviceCentres.map((centre) => (
                              <option
                                key={centre.serviceCentreId}
                                value={centre.serviceCentreId}
                              >
                                {centre.name} — {centre.address}
                              </option>
                            ))}
                          </select>

                          {chosenStation && (
                            <div
                              style={{
                                marginTop: "0.65rem",
                                padding: "0.6rem 0.85rem",
                                borderRadius: "8px",
                                background: "rgba(35, 78, 64, 0.06)",
                                borderLeft: "3px solid var(--color-palm)",
                                fontSize: "0.78rem",
                              }}
                            >
                              <strong
                                style={{
                                  color: "var(--color-palm)",
                                  display: "block",
                                }}
                              >
                                🏢 {chosenStation.name}
                              </strong>
                              <span
                                style={{
                                  color: "var(--foreground)",
                                  opacity: 0.85,
                                }}
                              >
                                {chosenStation.address}
                              </span>
                            </div>
                          )}
                        </>
                      ) : loadingCentres ? (
                        <div
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--color-olive-gray)",
                            padding: "0.5rem 0",
                          }}
                        >
                          Finding nearest GIG Logistics stations in{" "}
                          {destinationState || "your state"}...
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--color-olive-gray)",
                            padding: "0.5rem 0",
                          }}
                        >
                          Select your destination state above to view available
                          GIGL experience centres.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Standard Home Delivery */}
                <label
                  className={`${styles.shippingRadioLabel} ${shippingMethod === "doorstep" ? styles.shippingRadioLabelActive : ""}`}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === "doorstep"}
                      onChange={() => setShippingMethod("doorstep")}
                      className={styles.radioInput}
                      disabled={isProcessing}
                    />
                    <div>
                      <span className={styles.radioLabelText}>
                        🏠 Standard Home Delivery
                      </span>
                      <p className={styles.radioLabelDesc}>
                        Doorstep delivery to your street address in{" "}
                        {giglQuotes.estimatedDaysDoorstep}
                      </p>
                    </div>
                  </div>
                  <span className={styles.shippingPrice}>
                    ₦{formatPrice(giglQuotes.doorstepFee)}
                  </span>
                </label>

                {/* 3. Priority Express Delivery */}
                <label
                  className={`${styles.shippingRadioLabel} ${shippingMethod === "express" ? styles.shippingRadioLabelActive : ""}`}
                >
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "4px",
                        }}
                      >
                        <span className={styles.radioLabelText}>
                          ⚡ Priority Express Delivery
                        </span>
                        <span
                          className={`${styles.shippingBadge} ${styles.shippingBadgeExpress}`}
                        >
                          Fastest
                        </span>
                      </div>
                      <p className={styles.radioLabelDesc}>
                        Expedited priority dispatch in{" "}
                        {giglQuotes.estimatedDaysExpress}
                      </p>
                    </div>
                  </div>
                  <span className={styles.shippingPrice}>
                    ₦{formatPrice(giglQuotes.expressFee)}
                  </span>
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
                <div className={styles.loaderPlaceholder}>
                  Loading saved cards...
                </div>
              ) : isGuest || payDirectly || paymentMethods.length === 0 ? (
                <div
                  className={styles.detailsPreviewCard}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <p
                    style={{
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      margin: 0,
                      color: "var(--foreground)",
                    }}
                  >
                    💳 Secure Checkout via Paystack
                  </p>
                  <p
                    style={{
                      fontSize: "0.88rem",
                      opacity: 0.8,
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    You will be prompted to make a secure payment using Paystack
                    popup on clicking &ldquo;Authorize &amp; Pay&rdquo;.
                    Paystack supports Cards, USSD, Bank Transfers, and EFTs
                    securely.
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
                  <div
                    style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}
                  >
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "8px",
                    }}
                  >
                    <span className={styles.cardIconBadge}>
                      {activePayment.cardType.toUpperCase()}
                    </span>
                    <span className={styles.previewName}>
                      •••• •••• •••• {activePayment.last4}
                    </span>
                  </div>
                  <p className={styles.previewText}>{activePayment.bank}</p>
                  <p
                    className={styles.previewText}
                    style={{ opacity: 0.8, marginBottom: "1rem" }}
                  >
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
                        onChange={() =>
                          toggleSelectItem(item.product.id, item.selectedColor)
                        }
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
                      <span className={styles.itemRowTitle}>
                        {item.product.title}
                      </span>
                      <span className={styles.itemRowMeta}>
                        Qty: {item.quantity}{" "}
                        {item.selectedColor ? `| ${item.selectedColor}` : ""}
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
                <span className={styles.totalValue}>
                  ₦{formatPrice(finalTotal)}
                </span>
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
              Thank you for your purchase. We are processing your order and a
              receipt has been sent to your email.
            </p>
            <span
              style={{ fontSize: "0.8rem", color: "var(--color-olive-gray)" }}
            >
              Redirecting you to homepage...
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
