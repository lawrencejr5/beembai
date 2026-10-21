"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSellerStore } from "../SellerStoreContext";
import styles from "./wallet.module.css";

// ─── Formatters ────────────────────────────────────────────────

const formatCurrency = (amount: number = 0) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function SellerWalletPage() {
  const { stores, activeStoreId, setActiveStoreId } = useSellerStore();

  // Active store resolution (fallback to first store if activeStoreId is "all" or null)
  const currentStore = useMemo(() => {
    if (!stores || stores.length === 0) return null;
    if (activeStoreId) {
      return stores.find((s) => s._id === activeStoreId) ?? stores[0];
    }
    return stores[0];
  }, [stores, activeStoreId]);

  const targetStoreId = currentStore?._id as Id<"stores"> | undefined;

  // Convex Queries
  const wallet = useQuery(
    api.wallets.getStoreWallet,
    targetStoreId ? { storeId: targetStoreId } : "skip"
  );

  const transactions = useQuery(
    api.wallets.getWalletTransactions,
    targetStoreId ? { storeId: targetStoreId } : "skip"
  );

  // Actions
  const initiateWithdrawal = useAction(api.wallets.initiateWithdrawal);

  // Modal & Form States
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  // Table Filter States
  const [activeTab, setActiveTab] = useState<"all" | "order_credit" | "withdrawal" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Derived Values
  const availableBalance = wallet?.availableBalance ?? 0;
  const totalBalance = wallet?.balance ?? 0;
  const escrowBalance = Math.max(0, totalBalance - availableBalance);
  const hasValidRecipient = Boolean(wallet?.hasRecipient || wallet?.recipientCode || currentStore?.recipientCode);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((tx) => {
      // Tab filter
      if (activeTab === "pending") {
        if (tx.status !== "pending") return false;
      } else if (activeTab !== "all") {
        if (tx.type !== activeTab) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatches = tx.description?.toLowerCase().includes(query);
        const refMatches = tx.paystackTransferCode?.toLowerCase().includes(query) ||
          tx.paystackReference?.toLowerCase().includes(query);
        return descMatches || refMatches;
      }

      return true;
    });
  }, [transactions, activeTab, searchQuery]);

  // Handle Preset Clicks
  const handlePreset = (percentage: number) => {
    if (availableBalance <= 0) return;
    const computed = Math.floor((availableBalance * percentage) / 100);
    setWithdrawAmount(computed > 0 ? computed.toString() : "");
    setWithdrawError("");
  };

  // Handle Withdrawal Submission
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStoreId) return;

    if (!hasValidRecipient) {
      setWithdrawError("Cannot withdraw: No Paystack recipient code found for this store. Please configure and verify your bank details in Settings first.");
      return;
    }

    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum < 1000) {
      setWithdrawError("Minimum withdrawal amount is ₦1,000.");
      return;
    }

    if (amountNum > availableBalance) {
      setWithdrawError(`Amount exceeds your available balance of ${formatCurrency(availableBalance)}.`);
      return;
    }

    setIsSubmitting(true);
    setWithdrawError("");
    setWithdrawSuccess("");

    try {
      const res = await initiateWithdrawal({
        storeId: targetStoreId,
        amount: amountNum,
      });

      if (res.success) {
        setWithdrawSuccess(res.message);
        setWithdrawAmount("");
        setTimeout(() => {
          setIsWithdrawOpen(false);
          setWithdrawSuccess("");
        }, 2200);
      } else {
        setWithdrawError(res.message || "Failed to process withdrawal transfer.");
      }
    } catch (err: any) {
      console.error(err);
      setWithdrawError(err.message || "Failed to initiate transfer with Paystack.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If seller has no stores at all
  if (stores && stores.length === 0) {
    return (
      <div className={styles.walletContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏪</div>
          <h3>No Store Found</h3>
          <p>You need to create and get a store approved before managing a wallet and receiving payouts.</p>
          <Link href="/sell/new" className={styles.withdrawBtn} style={{ marginTop: 16 }}>
            Create Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.walletContainer}>
      
      {/* ── Page Header ── */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h1>Store Wallet & Payouts</h1>
          <p>
            Real-time sales revenue, escrow clearance tracking, and instant automated bank transfers.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.withdrawBtn}
            onClick={() => {
              setWithdrawError("");
              setWithdrawSuccess("");
              setIsWithdrawOpen(true);
            }}
            disabled={availableBalance < 1000 || !hasValidRecipient}
            title={
              !hasValidRecipient
                ? "Please set up and verify your bank account in Settings to generate a Paystack recipient code before withdrawing"
                : availableBalance < 1000
                ? "Minimum available balance of ₦1,000 required to withdraw"
                : "Withdraw funds to bank"
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Withdraw Funds
          </button>
        </div>
      </div>

      {/* ── Multi-Store Switcher Banner (if user owns multiple stores) ── */}
      {stores && stores.length > 1 && (
        <div className={styles.storeNoticeBanner}>
          <div className={styles.storeNoticeLeft}>
            <span>🏪</span>
            <div>
              <strong>Viewing Wallet for:</strong> {currentStore?.name}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "#7d8076" }}>Switch Store:</span>
            <select
              className={styles.storeSelectDropdown}
              value={currentStore?._id ?? ""}
              onChange={(e) => setActiveStoreId(e.target.value)}
            >
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.status ?? "pending"})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── KPI Financial Metrics ── */}
      <div className={styles.metricsGrid}>
        
        {/* Available Balance (Highlighted) */}
        <div className={`${styles.metricCard} ${styles.metricCardPrimary}`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Available for Payout</span>
            <div className={styles.metricIcon}>💰</div>
          </div>
          <div className={styles.metricValue}>
            {formatCurrency(availableBalance)}
          </div>
          <p className={styles.metricSubtext}>
            <span className={styles.highlightGreen}>Ready for immediate transfer</span> to your bank account via Paystack.
          </p>
        </div>

        {/* Total Ledger Balance */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Total Ledger Balance</span>
            <div className={styles.metricIcon}>📈</div>
          </div>
          <div className={styles.metricValue}>
            {formatCurrency(totalBalance)}
          </div>
          <p className={styles.metricSubtext}>
            Gross revenue including orders currently in progress and fulfillment.
          </p>
        </div>

        {/* In Escrow (Pending Delivery) */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>In Escrow (Pending Delivery)</span>
            <div className={styles.metricIcon}>⏳</div>
          </div>
          <div className={styles.metricValue}>
            {formatCurrency(escrowBalance)}
          </div>
          <p className={styles.metricSubtext}>
            <span className={styles.highlightOchre}>Cleared automatically</span> once customer packages are marked delivered.
          </p>
        </div>
      </div>

      {/* ── Bank & Paystack Recipient Status Card ── */}
      <div className={styles.bankCard}>
        <div className={styles.bankLeft}>
          <div className={styles.bankIconWrapper}>🏦</div>
          <div className={styles.bankDetails}>
            <h3>
              {wallet?.bankName ?? currentStore?.bankName ?? "No Receiving Bank Set"}
            </h3>
            <p>
              {wallet?.accountNumber
                ? `Account: ••••${wallet.accountNumber.slice(-4)} (${wallet?.accountName ?? currentStore?.accountName ?? ""})`
                : "Add your bank account in Settings to unlock automated Paystack withdrawals."}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {wallet?.hasRecipient || wallet?.recipientCode ? (
            <span className={`${styles.bankBadge} ${styles.bankBadgeSuccess}`}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                <circle cx="4" cy="4" r="4" />
              </svg>
              Paystack Recipient Active
            </span>
          ) : (
            <span className={`${styles.bankBadge} ${styles.bankBadgeWarning}`}>
              ⚠️ Missing Recipient Code
            </span>
          )}

          <Link href="/sell/settings" className={styles.settingsLink}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Edit Bank Details
          </Link>
        </div>
      </div>

      {/* ── Transactions History Section ── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2>Transaction Statement</h2>
            <p>Full audit trail of customer payments, delivery releases, and payouts.</p>
          </div>

          {/* Filter Tabs */}
          <div className={styles.tabsRow}>
            <button
              className={`${styles.tabBtn} ${activeTab === "all" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === "order_credit" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("order_credit")}
            >
              Sales Credits
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === "withdrawal" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("withdrawal")}
            >
              Payouts
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === "pending" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              In Escrow
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid #e6dec9", background: "#fbf7ee" }}>
          <input
            type="text"
            placeholder="Search by description or transaction reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              maxWidth: 400,
              padding: "8px 14px",
              border: "1px solid #e6dec9",
              borderRadius: 8,
              fontSize: 13,
              background: "#ffffff",
              outline: "none",
            }}
          />
        </div>

        {/* Transactions Table */}
        <div className={styles.tableContainer}>
          {filteredTransactions.length > 0 ? (
            <table className={styles.txTable}>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Transaction</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isCredit = tx.type === "order_credit";
                  const isPending = tx.status === "pending";
                  const isCompleted = tx.status === "completed";

                  return (
                    <tr key={tx._id}>
                      <td style={{ whiteSpace: "nowrap", color: "#7d8076" }}>
                        {formatDate(tx.createdAt)}
                      </td>

                      <td>
                        <div className={styles.txTypeCell}>
                          <div className={isCredit ? styles.txTypeIconCredit : styles.txTypeIconDebit}>
                            {isCredit ? "↓" : "↑"}
                          </div>
                          <div className={styles.txTypeText}>
                            <span className={styles.txTypeTitle}>
                              {isCredit ? "Order Earnings" : "Bank Payout"}
                            </span>
                            <span className={styles.txTypeSubtitle}>
                              {tx.paystackTransferCode ?? tx.paystackReference ?? (tx.orderId ? `Order #${tx.orderId.slice(-6).toUpperCase()}` : "Convex Ledger")}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: 13 }}>{tx.description}</span>
                      </td>

                      <td>
                        {isCompleted && (
                          <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>
                            ● Cleared
                          </span>
                        )}
                        {isPending && (
                          <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                            ⏳ In Escrow
                          </span>
                        )}
                        {tx.status === "failed" && (
                          <span className={`${styles.statusBadge} ${styles.statusFailed}`}>
                            ✕ Failed
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <span className={isCredit ? styles.amountCredit : styles.amountDebit}>
                          {isCredit ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💳</div>
              <h3>No Transactions Yet</h3>
              <p>
                {activeTab !== "all"
                  ? `No transactions found under the "${activeTab}" filter.`
                  : "When customers purchase items from your store, credits and escrow progress will appear here."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Withdrawal Modal ── */}
      {isWithdrawOpen && (
        <div className={styles.modalOverlay} onClick={() => !isSubmitting && setIsWithdrawOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Withdraw Funds</h3>
              <button
                className={styles.closeBtn}
                onClick={() => !isSubmitting && setIsWithdrawOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit}>
              <div className={styles.modalBody}>
                {!hasValidRecipient && (
                  <div className={`${styles.alertBox} ${styles.alertError}`} style={{ marginBottom: 16 }}>
                    <strong>Paystack Recipient Missing:</strong> No transfer recipient code has been generated for this store. Please{" "}
                    <Link href="/sell/settings" style={{ textDecoration: "underline", fontWeight: 700 }}>
                      update and verify your bank account details in Settings
                    </Link>{" "}
                    first before withdrawing.
                  </div>
                )}

                {withdrawError && (
                  <div className={`${styles.alertBox} ${styles.alertError}`}>
                    {withdrawError}
                  </div>
                )}
                {withdrawSuccess && (
                  <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
                    {withdrawSuccess}
                  </div>
                )}

                {/* Receiving Account Summary */}
                <div className={styles.payoutAccountPreview}>
                  <div className={styles.payoutAccountLabel}>Destination Account</div>
                  <div className={styles.payoutAccountVal}>
                    {wallet?.bankName ?? currentStore?.bankName ?? "Bank"}
                  </div>
                  <div className={styles.payoutAccountSub}>
                    Account: ••••{wallet?.accountNumber?.slice(-4) ?? ""} — {wallet?.accountName ?? currentStore?.accountName ?? ""}
                  </div>
                </div>

                {/* Amount Input */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    Withdrawal Amount (Available: {formatCurrency(availableBalance)})
                  </label>
                  <div className={styles.amountInputWrapper}>
                    <span className={styles.currencyPrefix}>₦</span>
                    <input
                      type="number"
                      step="any"
                      min="1000"
                      max={availableBalance}
                      placeholder="0.00"
                      className={styles.amountInput}
                      value={withdrawAmount}
                      onChange={(e) => {
                        setWithdrawAmount(e.target.value);
                        setWithdrawError("");
                      }}
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>

                  {/* Percentage Presets */}
                  <div className={styles.presetsRow}>
                    <button
                      type="button"
                      className={styles.presetBtn}
                      onClick={() => handlePreset(25)}
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      className={styles.presetBtn}
                      onClick={() => handlePreset(50)}
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      className={styles.presetBtn}
                      onClick={() => handlePreset(75)}
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      className={styles.presetBtn}
                      onClick={() => handlePreset(100)}
                    >
                      100% (Max)
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: 12, color: "#7d8076", margin: "14px 0 0", lineHeight: 1.4 }}>
                  💡 Minimum withdrawal is ₦1,000. Transfers are processed securely via Paystack and typically settle into your bank account within minutes.
                </p>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsWithdrawOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.confirmWithdrawBtn}
                  disabled={isSubmitting || !hasValidRecipient || !withdrawAmount || parseFloat(withdrawAmount) < 1000}
                >
                  {isSubmitting ? "Processing Transfer..." : "Confirm & Withdraw"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
