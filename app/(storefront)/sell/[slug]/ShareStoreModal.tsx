"use client";

import React, { useState, useEffect } from "react";
import styles from "../sell.module.css";

interface ShareStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  storeName: string;
}

export default function ShareStoreModal({
  isOpen,
  onClose,
  slug,
  storeName,
}: ShareStoreModalProps) {
  const [domainPrefix, setDomainPrefix] = useState("beembai.lawjun.ng");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDomainPrefix(window.location.host);
    }
  }, []);

  if (!isOpen) return null;

  const storeUrl = `${domainPrefix}/stores/${slug}`;
  const fullClipboardUrl = typeof window !== "undefined"
    ? `${window.location.origin}/stores/${slug}`
    : `https://${storeUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullClipboardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={`${styles.productModal} ${styles.shareStoreModal}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.productModalHeader}>
          <div>
            <h2 className={styles.productModalTitle}>Share Store</h2>
            <p className={styles.productModalSubtitle}>
              Share this link so customers can find your store: &ldquo;{storeName}&rdquo;.
            </p>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.shareLinkContainer}>
          <span className={styles.shareLinkLabel}>{storeUrl}</span>
          <button
            type="button"
            onClick={handleCopy}
            className={copied ? styles.shareCopyBtnCopied : styles.shareCopyBtn}
          >
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
