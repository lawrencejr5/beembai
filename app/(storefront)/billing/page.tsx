"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "./billing.module.css";

// ── Icons ─────────────────────────────────────────────────

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
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const CardIcon = ({ type }: { type: string }) => {
  const t = type.toLowerCase();
  if (t.includes("visa")) {
    return <span className={styles.cardBadge} style={{ background: "#1a1f71", color: "#fff" }}>VISA</span>;
  }
  if (t.includes("mastercard")) {
    return <span className={styles.cardBadge} style={{ background: "#eb001b", color: "#fff" }}>MC</span>;
  }
  if (t.includes("verve")) {
    return <span className={styles.cardBadge} style={{ background: "#016936", color: "#fff" }}>VERVE</span>;
  }
  return <span className={styles.cardBadge}>{type.toUpperCase().slice(0, 4)}</span>;
};

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

// ── Spinner ────────────────────────────────────────────────

const Spinner = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

// ── Main Page ──────────────────────────────────────────────

export default function BillingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const viewer = useQuery(api.users.viewer);
  const paymentMethods = useQuery(
    api.billing.getUserPaymentMethods,
    isAuthenticated ? {} : "skip",
  );

  const deleteMethod = useMutation(api.billing.deletePaymentMethod);
  const setDefault = useMutation(api.billing.setDefaultPaymentMethod);
  const verifyAndSave = useAction(api.paystackActions.verifyAndSaveCard);

  const [addingCard, setAddingCard] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect unauthenticated users
  if (!authLoading && !isAuthenticated) {
    router.replace("/login");
    return null;
  }

  const userEmail = viewer?.email ?? "";

  const handleAddCard = () => {
    setError(null);
    setAddingCard(true);

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      setError("Paystack is not configured. Please contact support.");
      setAddingCard(false);
      return;
    }

    // Dynamically load @paystack/inline-js and open popup
    import("@paystack/inline-js").then(({ default: PaystackPop }) => {
      const popup = new PaystackPop();
      popup.newTransaction({
        key: publicKey,
        email: userEmail,
        amount: 5000, // ₦50 in kobo — minimum verification charge
        currency: "NGN",
        label: "Card Verification",
        onSuccess: async (transaction: { reference: string }) => {
          try {
            await verifyAndSave({
              reference: transaction.reference,
              email: userEmail,
            });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to save card";
            setError(msg);
          } finally {
            setAddingCard(false);
          }
        },
        onCancel: () => {
          setAddingCard(false);
        },
      });
    }).catch(() => {
      setError("Could not load payment popup. Please refresh and try again.");
      setAddingCard(false);
    });
  };

  const handleDelete = async (id: Id<"paymentMethods">) => {
    setDeletingId(id);
    setError(null);
    try {
      await deleteMethod({ id });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete card";
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: Id<"paymentMethods">) => {
    setSettingDefaultId(id);
    setError(null);
    try {
      await setDefault({ id });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update default";
      setError(msg);
    } finally {
      setSettingDefaultId(null);
    }
  };

  const isLoadingData = authLoading || paymentMethods === undefined;

  return (
    <div className={styles.container}>
      <main className={styles.main}>

        {/* ── Header ── */}
        <header className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            <ArrowLeftIcon />
            <span>Back</span>
          </button>
          <h1 className={styles.pageTitle}>Billing & Payment Methods</h1>
          <p className={styles.pageSubtitle}>
            Your cards are stored securely via Paystack. We only keep a safe token — never your raw card number.
          </p>
        </header>

        {/* ── Error Banner ── */}
        {error && (
          <div className={styles.errorBanner}>
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} className={styles.errorClose}>✕</button>
          </div>
        )}

        {/* ── Saved Cards ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Saved Cards</h2>
            <button
              onClick={handleAddCard}
              disabled={addingCard}
              className={styles.addCardBtn}
            >
              {addingCard ? <Spinner /> : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
              <span>{addingCard ? "Processing..." : "Add Card"}</span>
            </button>
          </div>

          {isLoadingData ? (
            <div className={styles.cardList}>
              {[1, 2].map((i) => (
                <div key={i} className={styles.cardSkeleton}>
                  <div className={styles.skeletonBlock} style={{ width: 48, height: 28 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className={styles.skeletonLine} style={{ width: "60%" }} />
                    <div className={styles.skeletonLine} style={{ width: "40%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : paymentMethods && paymentMethods.length > 0 ? (
            <div className={styles.cardList}>
              {paymentMethods.map((method: any) => (
                <div key={method._id} className={`${styles.cardItem} ${method.isDefault ? styles.cardItemDefault : ""}`}>
                  <CardIcon type={method.cardType} />

                  <div className={styles.cardInfo}>
                    <p className={styles.cardNumber}>
                      •••• •••• •••• {method.last4}
                    </p>
                    <p className={styles.cardMeta}>
                      {method.bank} &nbsp;·&nbsp; Expires {method.expMonth}/{method.expYear}
                    </p>
                  </div>

                  <div className={styles.cardActions}>
                    {method.isDefault ? (
                      <span className={styles.defaultBadge}>
                        <StarIcon filled />
                        Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(method._id as Id<"paymentMethods">)}
                        disabled={settingDefaultId === method._id}
                        className={styles.setDefaultBtn}
                        title="Set as default"
                      >
                        {settingDefaultId === method._id ? <Spinner /> : <StarIcon filled={false} />}
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(method._id as Id<"paymentMethods">)}
                      disabled={deletingId === method._id}
                      className={styles.deleteBtn}
                      title="Remove card"
                    >
                      {deletingId === method._id ? <Spinner /> : <TrashIcon />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💳</div>
              <p className={styles.emptyTitle}>No saved cards yet</p>
              <p className={styles.emptyDesc}>
                Add a card to speed up checkout. A small ₦50 verification charge will be made.
              </p>
            </div>
          )}
        </section>

        {/* ── Security Note ── */}
        <div className={styles.securityNote}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span>Secured by <strong>Paystack</strong> — PCI-DSS compliant. We never store your full card number.</span>
        </div>

      </main>
    </div>
  );
}
