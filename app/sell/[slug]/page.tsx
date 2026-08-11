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
import { useQuery, useMutation } from "convex/react";
import { useRef } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// ─── Icons ──────────────────────────────────────────────────────────────────

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

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const StarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const VerifiedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.454 1.358 4.49 4.49 0 011.358 3.454 4.49 4.49 0 011.549 3.397c0 1.357-.6 2.573-1.549 3.397a4.49 4.49 0 01-1.358 3.454 4.49 4.49 0 01-3.454 1.358A4.49 4.49 0 0112 21.75c-1.357 0-2.573-.6-3.397-1.549a4.49 4.49 0 01-3.454-1.358 4.49 4.49 0 01-1.358-3.454 4.49 4.49 0 01-1.549-3.397c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.358-3.454 4.49 4.49 0 013.454-1.358zM16.03 9.47a.75.75 0 00-1.06-1.06l-4.47 4.47-1.97-1.97a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.06 0l5-5z"
      clipRule="evenodd"
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

// ─── Helper ──────────────────────────────────────────────────────────────────

const getStoreInitials = (name: string): string => {
  const cleanName = name.replace(/['''"&]/g, "").trim();
  const words = cleanName.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return "ST";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

// ─── Add Product Modal ────────────────────────────────────────────────────────

function AddProductModal({
  storeId,
  storeName,
  onClose,
}: {
  storeId: Id<"stores">;
  storeName: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [productTitle, setProductTitle] = useState("");
  const [productCategory, setProductCategory] = useState("Phone & Tablets");
  const [productPrice, setProductPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productCondition, setProductCondition] = useState("New");
  const [productColors, setProductColors] = useState("");
  const [productStock, setProductStock] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");

  // Step 2 states
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.store.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.products.resolveStorageUrl);
  const createProductMut = useMutation(api.products.createProduct);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productTitle.trim() || !productPrice.trim()) return;
    setStep(2);
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError("");
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 1. Generate Convex storage upload URL
        const uploadUrl = await generateUploadUrl();

        // 2. POST the image file to the Convex storage
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) throw new Error(`Failed to upload file ${file.name}`);

        const { storageId } = await result.json();

        // 3. Resolve the storage ID to its public URL
        const publicUrl = await resolveStorageUrl({ storageId });
        if (publicUrl) {
          newUrls.push(publicUrl);
        }
      }

      setUploadedImages((prev) => {
        const updated = [...prev, ...newUrls];
        // Automatically select the first image as main if none is selected yet
        if (!mainImage && updated.length > 0) {
          setMainImage(updated[0]);
        }
        return updated;
      });
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setUploadError(err.message || "Failed to upload one or more images.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // clear input
    }
  };

  const handleDeleteImage = (urlToDelete: string) => {
    setUploadedImages((prev) => {
      const filtered = prev.filter((url) => url !== urlToDelete);
      if (mainImage === urlToDelete) {
        setMainImage(filtered.length > 0 ? filtered[0] : "");
      }
      return filtered;
    });
  };

  const handleFinalSubmit = async () => {
    if (uploadedImages.length === 0) {
      setSubmitError("Please upload at least one image.");
      return;
    }
    if (!mainImage) {
      setSubmitError("Please select a main image.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    // Parse colors string into array
    const colorsArray = productColors
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    try {
      await createProductMut({
        title: productTitle,
        price: parseFloat(productPrice),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        categoryName: productCategory,
        description: productDesc || undefined,
        condition: productCondition || undefined,
        colors: colorsArray.length > 0 ? colorsArray : undefined,
        stock: productStock ? parseInt(productStock, 10) : undefined,
        storeId,
        images: uploadedImages,
        image: mainImage,
        youtubeLink: youtubeLink.trim() || undefined,
      });

      setSubmitted(true);
      setTimeout(onClose, 2000);
    } catch (err: any) {
      console.error("Failed to create product:", err);
      setSubmitError(
        err.message || "Failed to list your product. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles.modalBackdrop}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={styles.productModal}
        style={step === 2 ? { maxWidth: 640 } : undefined}
      >
        <div className={styles.productModalHeader}>
          <div>
            <h2 className={styles.productModalTitle}>
              Add New Product (Step {step} of 2)
            </h2>
            <p className={styles.productModalSubtitle}>
              Listing to <strong>{storeName}</strong>
            </p>
          </div>
          <button
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              className={styles.successTickCircle}
              style={{ width: 60, height: 60 }}
            >
              <CheckCircleIcon />
            </div>
            <p
              style={{
                fontWeight: 800,
                fontSize: "1.05rem",
                color: "var(--color-papyrus)",
              }}
            >
              Product submitted successfully!
            </p>
            <p
              style={{ fontSize: "0.85rem", color: "var(--color-olive-gray)" }}
            >
              Your product is pending admin approval.
            </p>
          </div>
        ) : step === 1 ? (
          <form className={styles.modalForm} onSubmit={handleNextStep}>
            <div className={styles.modalFormGroup}>
              <label className={styles.modalFormLabel}>Product Title *</label>
              <input
                className={styles.modalInput}
                type="text"
                required
                placeholder="e.g. iPhone 15 Pro Max 256GB"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
              />
            </div>

            <div className={styles.modalFormRow}>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>Category *</label>
                <select
                  className={styles.modalSelect}
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                >
                  <option value="Phone & Tablets">Phone &amp; Tablets</option>
                  <option value="Gadgets & Accessories">
                    Gadgets &amp; Accessories
                  </option>
                  <option value="Apparel & Fashion">
                    Apparel &amp; Fashion
                  </option>
                  <option value="Furniture & Living">
                    Furniture &amp; Living
                  </option>
                  <option value="Beauty & Care">Beauty &amp; Care</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Home Appliances">Home Appliances</option>
                </select>
              </div>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>Condition</label>
                <select
                  className={styles.modalSelect}
                  value={productCondition}
                  onChange={(e) => setProductCondition(e.target.value)}
                >
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
                <label className={styles.modalFormLabel}>
                  Sale Price (₦) *
                </label>
                <div className={styles.modalPriceWrapper}>
                  <span className={styles.modalPriceSymbol}>₦</span>
                  <input
                    className={`${styles.modalInput} ${styles.modalPriceInput}`}
                    type="number"
                    required
                    min="0"
                    placeholder="0.00"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>
                  Original Price (₦)
                </label>
                <div className={styles.modalPriceWrapper}>
                  <span className={styles.modalPriceSymbol}>₦</span>
                  <input
                    className={`${styles.modalInput} ${styles.modalPriceInput}`}
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFormRow}>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>Stock Quantity</label>
                <input
                  className={styles.modalInput}
                  type="number"
                  min="0"
                  placeholder="e.g. 50"
                  value={productStock}
                  onChange={(e) => setProductStock(e.target.value)}
                />
              </div>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>
                  Available Colors
                </label>
                <input
                  className={styles.modalInput}
                  type="text"
                  placeholder="e.g. Black, White, Gold"
                  value={productColors}
                  onChange={(e) => setProductColors(e.target.value)}
                />
                <span className={styles.modalColorsHint}>
                  Separate each color with a comma
                </span>
              </div>
            </div>

            <div className={styles.modalFormGroup}>
              <label className={styles.modalFormLabel}>
                Product Description
              </label>
              <textarea
                className={styles.modalTextarea}
                placeholder="Describe your product — features, specifications, what makes it special..."
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
              />
            </div>

            <div className={styles.modalBtnGroup}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.modalSubmitBtn}
                disabled={!productTitle.trim() || !productPrice.trim()}
              >
                Next: Upload Images
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.modalForm}>
            <div style={{ marginBottom: "1.5rem" }}>
              <p
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "var(--color-papyrus)",
                  marginBottom: "0.4rem",
                }}
              >
                Product Images *
              </p>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--color-olive-gray)",
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                Upload multiple images for your product page. Click on an image
                to select it as the <strong>Main/Thumbnail</strong> image.
              </p>
            </div>

            {/* Upload area */}
            <input
              type="file"
              multiple
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleImagesUpload}
            />

            <div
              className={styles.imageUploadZone}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              style={{ cursor: isUploading ? "not-allowed" : "pointer" }}
            >
              <span style={{ fontSize: "2rem" }}>📁</span>
              <p
                style={{
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  color: "var(--color-palm)",
                }}
              >
                {isUploading
                  ? "Uploading Images..."
                  : "Click to select product images"}
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-olive-gray)",
                  marginTop: "0.2rem",
                }}
              >
                {isUploading
                  ? "Please wait..."
                  : "Select one or more JPG, PNG, or WEBP files"}
              </p>
            </div>

            {uploadError && (
              <div
                style={{
                  color: "#d93838",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  marginTop: "0.5rem",
                }}
              >
                ⚠️ {uploadError}
              </div>
            )}

            {/* Uploaded images list */}
            {uploadedImages.length > 0 && (
              <div className={styles.imagePreviewGrid}>
                {uploadedImages.map((url, idx) => {
                  const isMain = url === mainImage;
                  return (
                    <div
                      key={idx}
                      className={`${styles.imagePreviewWrapper} ${isMain ? styles.imagePreviewMainActive : ""}`}
                      onClick={() => setMainImage(url)}
                    >
                      <Image
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        fill
                        sizes="100px"
                        style={{ objectFit: "cover" }}
                      />
                      {isMain && (
                        <span className={styles.mainImageBadgeTag}>Main</span>
                      )}
                      <button
                        type="button"
                        className={styles.deletePreviewBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(url);
                        }}
                        title="Delete image"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {submitError && (
              <div
                style={{
                  color: "#d93838",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  marginTop: "1rem",
                }}
              >
                ⚠️ {submitError}
              </div>
            )}

            <div
              className={styles.modalFormGroup}
              style={{ marginTop: "1.5rem" }}
            >
              <label className={styles.modalFormLabel}>
                YouTube Video Link (Optional)
              </label>
              <input
                className={styles.modalInput}
                type="url"
                placeholder="e.g. https://www.youtube.com/watch?v=..."
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
              />
              <span className={styles.modalColorsHint}>
                Provide a link to a product video or demonstration
              </span>
            </div>

            <div className={styles.modalBtnGroup} style={{ marginTop: "2rem" }}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setStep(1)}
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                type="button"
                className={styles.modalSubmitBtn}
                onClick={handleFinalSubmit}
                disabled={
                  isSubmitting || isUploading || uploadedImages.length === 0
                }
              >
                {isSubmitting ? "Listing Product..." : "List Product"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StoreVerificationModal({
  storeId,
  onClose,
}: {
  storeId: Id<"stores">;
  onClose: () => void;
}) {
  const [taxId, setTaxId] = useState("");

  // File states
  const [bizRegFile, setBizRegFile] = useState<File | null>(null);
  const [bizRegUrl, setBizRegUrl] = useState("");
  const [proofAddrFile, setProofAddrFile] = useState<File | null>(null);
  const [proofAddrUrl, setProofAddrUrl] = useState("");

  const [isUploadingBiz, setIsUploadingBiz] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const generateUploadUrl = useMutation(api.store.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.products.resolveStorageUrl);
  const submitVerification = useMutation(api.store.submitStoreVerification);

  const uploadFileToConvex = async (
    file: File,
    setUploading: (u: boolean) => void,
  ) => {
    setUploading(true);
    setError("");
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Upload failed");
      const { storageId } = await response.json();
      const publicUrl = await resolveStorageUrl({ storageId });
      if (!publicUrl) throw new Error("Failed to resolve file URL");
      return publicUrl;
    } catch (err: any) {
      console.error(err);
      setError("Failed to upload document. Please try again.");
      return "";
    } finally {
      setUploading(false);
    }
  };

  const handleBizRegChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBizRegFile(file);
    const url = await uploadFileToConvex(file, setIsUploadingBiz);
    setBizRegUrl(url);
  };

  const handleProofAddrChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofAddrFile(file);
    const url = await uploadFileToConvex(file, setIsUploadingProof);
    setProofAddrUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizRegUrl) {
      setError("Please upload your Business Registration Document.");
      return;
    }
    if (!taxId.trim()) {
      setError("Please enter your Tax Identification Number.");
      return;
    }
    if (!proofAddrUrl) {
      setError("Please upload a Proof of Address Document.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await submitVerification({
        storeId,
        businessRegistrationFile: bizRegUrl,
        taxId: taxId.trim(),
        proofOfAddressFile: proofAddrUrl,
      });
      setSubmitted(true);
      setTimeout(onClose, 2000);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
          "Failed to submit verification request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles.modalBackdrop}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.productModal} style={{ maxWidth: 580 }}>
        <div className={styles.productModalHeader}>
          <div>
            <h2 className={styles.productModalTitle}>Verify Your Store</h2>
            <p className={styles.productModalSubtitle}>
              Submit corporate documentation to obtain verification status
            </p>
          </div>
          <button
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div
            style={{
              textAlign: "center",
              padding: "2.5rem 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              className={styles.successTickCircle}
              style={{ width: 60, height: 60 }}
            >
              <CheckCircleIcon />
            </div>
            <p
              style={{
                fontWeight: 800,
                fontSize: "1.1rem",
                color: "var(--color-papyrus)",
              }}
            >
              Verification Submitted!
            </p>
            <p
              style={{ fontSize: "0.85rem", color: "var(--color-olive-gray)" }}
            >
              Your documentation is currently under review by our admin team.
            </p>
          </div>
        ) : (
          <form className={styles.modalForm} onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  color: "#d93838",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Business Registration */}
            <div className={styles.modalFormGroup}>
              <label className={styles.modalFormLabel}>
                Business Registration Document *
              </label>
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleBizRegChange}
                  style={{ display: "none" }}
                  id="biz-reg-upload"
                />
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("biz-reg-upload")?.click()
                  }
                  className={styles.editStoreDetailsBtn}
                  disabled={isUploadingBiz}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {isUploadingBiz
                    ? "Uploading..."
                    : bizRegFile
                      ? "Change Document"
                      : "Upload Certificate"}
                </button>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-olive-gray)",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {bizRegFile
                    ? bizRegFile.name
                    : "Select registration certificate or incorporation document (PDF/Image)"}
                </span>
              </div>
            </div>

            {/* Proof of Address */}
            <div className={styles.modalFormGroup}>
              <label className={styles.modalFormLabel}>
                Proof of Address *
              </label>
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleProofAddrChange}
                  style={{ display: "none" }}
                  id="proof-addr-upload"
                />
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("proof-addr-upload")?.click()
                  }
                  className={styles.editStoreDetailsBtn}
                  disabled={isUploadingProof}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {isUploadingProof
                    ? "Uploading..."
                    : proofAddrFile
                      ? "Change Document"
                      : "Upload Utility Bill"}
                </button>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-olive-gray)",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {proofAddrFile
                    ? proofAddrFile.name
                    : "Select recent utility bill or official bank statement (PDF/Image)"}
                </span>
              </div>
            </div>

            {/* Tax Identification */}
            <div className={styles.modalFormGroup}>
              <label className={styles.modalFormLabel}>
                Tax Identification Number (TIN) *
              </label>
              <input
                className={styles.modalInput}
                type="text"
                required
                placeholder="e.g. RC-12345678 or official TIN"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>

            <div
              className={styles.modalBtnGroup}
              style={{ marginTop: "1.5rem" }}
            >
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.modalSubmitBtn}
                disabled={isSubmitting || isUploadingBiz || isUploadingProof}
              >
                {isSubmitting ? "Submitting..." : "Submit Verification"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Store Owner Dashboard ───────────────────────────────────────────────────

type StoreType = NonNullable<
  ReturnType<typeof useQuery<typeof api.store.getStoreBySlugForOwner>>
>;

function ApprovedDashboard({
  store,
  allStores,
}: {
  store: StoreType;
  allStores: StoreType[];
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Edit details modal state
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [editName, setEditName] = useState(store.name);
  const [editCategory, setEditCategory] = useState(store.category);
  const [editDescription, setEditDescription] = useState(store.description);
  const [editPhysicalAddress, setEditPhysicalAddress] = useState(
    store.physicalAddress || "",
  );
  const [editCity, setEditCity] = useState(store.city || "");
  const [editStateName, setEditStateName] = useState(store.stateName || "");
  const [editCountry, setEditCountry] = useState(store.country || "");
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // File upload states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const generateUploadUrl = useMutation(api.store.generateUploadUrl);
  const updateStoreLogo = useMutation(api.store.updateStoreLogo);
  const updateStoreBanner = useMutation(api.store.updateStoreBanner);
  const updateStoreDetails = useMutation(api.store.updateStoreDetails);

  const storeProducts = useQuery(api.store.getProductsByStore, {
    storeId: store._id,
  });

  // Sync form states when store changes (e.g., store navigation)
  useEffect(() => {
    setEditName(store.name);
    setEditCategory(store.category);
    setEditDescription(store.description);
    setEditPhysicalAddress(store.physicalAddress || "");
    setEditCity(store.city || "");
    setEditStateName(store.stateName || "");
    setEditCountry(store.country || "");
  }, [store]);

  const filteredProducts = useMemo(() => {
    if (!storeProducts) return [];
    if (!searchQuery.trim()) return storeProducts;
    const q = searchQuery.toLowerCase();
    return storeProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.tag && p.tag.toLowerCase().includes(q)),
    );
  }, [storeProducts, searchQuery]);

  const hasBanner = !!store.banner;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();
      await updateStoreLogo({ storeId: store._id, storageId });
    } catch (err) {
      console.error("Logo upload failed:", err);
      alert(
        "Failed to upload logo image. Please check your connection and try again.",
      );
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();
      await updateStoreBanner({ storeId: store._id, storageId });
    } catch (err) {
      console.error("Banner upload failed:", err);
      alert(
        "Failed to upload banner image. Please check your connection and try again.",
      );
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setDetailsError("Store name is required.");
      return;
    }
    if (!editDescription.trim()) {
      setDetailsError("Brand biography is required.");
      return;
    }

    setIsSubmittingDetails(true);
    setDetailsError("");
    try {
      await updateStoreDetails({
        storeId: store._id,
        name: editName,
        category: editCategory,
        description: editDescription,
        physicalAddress: editPhysicalAddress,
        city: editCity,
        stateName: editStateName,
        country: editCountry,
      });
      setShowEditDetailsModal(false);
    } catch (err: any) {
      setDetailsError(
        err.message || "An error occurred while updating store details.",
      );
    } finally {
      setIsSubmittingDetails(false);
    }
  };

  return (
    <>
      {/* Hidden file input tags */}
      <input
        type="file"
        ref={logoInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleLogoUpload}
      />
      <input
        type="file"
        ref={bannerInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleBannerUpload}
      />

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
              {isPending && !isActive && (
                <span style={{ fontSize: "0.7rem" }}>⏳</span>
              )}
              {s.name}
            </button>
          );
        })}
        <button
          type="button"
          className={styles.newStorePill}
          onClick={() => router.push("/sell/new")}
        >
          <span style={{ fontSize: "1.05rem", lineHeight: 1 }}>+</span>
          Create New Store
        </button>
      </div>

      {/* Dashboard Content */}
      <div className={styles.dashboardWrapper}>
        {/* Banner */}
        <div
          className={styles.dashBanner}
          style={hasBanner ? { backgroundImage: `url('${store.banner}')` } : {}}
        >
          {!hasBanner && <div className={styles.dashBannerGradient} />}
          <div className={styles.dashBannerOverlay} />
          <button
            type="button"
            className={styles.editBannerBtn}
            onClick={() => bannerInputRef.current?.click()}
            disabled={isUploadingBanner}
            title="Update store banner image"
          >
            <span>🖼</span>
            {isUploadingBanner ? "Uploading..." : "Edit Banner"}
          </button>
        </div>

        {/* Store Header */}
        <div className={styles.dashStoreHeader}>
          <div className={styles.dashLogoWrap}>
            <div
              className={styles.dashLogoContainer}
              style={{ position: "relative" }}
            >
              {store.logo ? (
                <Image
                  src={store.logo}
                  alt={store.name}
                  width={130}
                  height={130}
                  className={styles.dashLogoImage}
                />
              ) : (
                <span className={styles.dashLogoInitials}>
                  {getStoreInitials(store.name)}
                </span>
              )}
              {isUploadingLogo && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 28,
                    color: "#fff",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                  }}
                >
                  ⏳ Uploading...
                </div>
              )}
            </div>
            <button
              type="button"
              className={styles.editLogoBtn}
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo}
              title="Update store logo"
              aria-label="Edit store logo"
            >
              ✏
            </button>
          </div>

          <div className={styles.dashMetaBlock}>
            <h1 className={styles.dashStoreName}>{store.name}</h1>
            <div className={styles.dashRatingRow}>
              <span className={styles.dashStarIcon}>
                <StarIcon />
              </span>
              <span className={styles.dashRatingValue}>
                {store.rating.toFixed(1)} / 5.0 rating
              </span>
            </div>
            <div
              className={styles.dashBadgeRow}
              style={{ flexWrap: "wrap", gap: "0.5rem" }}
            >
              <span className={styles.dashCategoryTag}>{store.category}</span>
              {store.verified || store.verificationStatus === "verified" ? (
                <span className={styles.dashVerifiedLabel}>
                  <VerifiedIcon />
                  <span>Verified Store</span>
                </span>
              ) : store.verificationStatus === "under_review" ? (
                <span className={styles.dashVerificationUnderReviewBadge}>
                  ⏳ Pending Verification
                </span>
              ) : (
                <button
                  type="button"
                  className={styles.verifyStoreBtn}
                  onClick={() => setShowVerifyModal(true)}
                >
                  Verify Store
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bio & Stats */}
        <div className={styles.dashBioSection}>
          <div className={styles.dashBioContent}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <h2
                className={styles.dashSectionTitle}
                style={{ marginBottom: 0 }}
              >
                About the Brand
              </h2>
              <button
                type="button"
                className={styles.editStoreDetailsBtn}
                onClick={() => setShowEditDetailsModal(true)}
              >
                ✏️ Edit Brand Info
              </button>
            </div>
            <p className={styles.dashBioText}>{store.description}</p>
          </div>
          <div className={styles.dashStatsSidebar}>
            <h3
              className={styles.dashSectionTitle}
              style={{ fontSize: "1rem" }}
            >
              Store Details
            </h3>
            <div className={styles.dashStatRow}>
              <span className={styles.dashStatLabel}>Products Listed</span>
              <span className={styles.dashStatValue}>
                {storeProducts ? storeProducts.length : "—"} items
              </span>
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
              My Catalog{" "}
              {filteredProducts.length > 0 && `(${filteredProducts.length})`}
            </h2>
            <p className={styles.dashInventorySubtitle}>
              Manage and list products in your store
            </p>
          </div>
          <div className={styles.dashInventoryActions}>
            <div className={styles.dashInventorySearch}>
              <span className={styles.dashSearchIcon}>
                <SearchIcon />
              </span>
              <input
                id="catalog-search"
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.dashSearchInput}
              />
            </div>
            <button
              id="add-product-btn"
              type="button"
              className={styles.addProductBtn}
              onClick={() => setShowAddModal(true)}
            >
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
            <button
              id="add-product-card"
              type="button"
              className={styles.addProductCard}
              onClick={() => setShowAddModal(true)}
            >
              <div className={styles.addProductIconCircle}>+</div>
              <span className={styles.addProductCardTitle}>
                Add New Product
              </span>
              <span className={styles.addProductCardSub}>
                Click to list a new item in your store
              </span>
            </button>

            {filteredProducts.length === 0 && !searchQuery && (
              <div
                className={`${styles.dashEmptyState} ${styles.dashCatalogEmptyState}`}
              >
                <span className={styles.dashEmptyIcon}>📦</span>
                <p className={styles.dashEmptyTitle}>No products listed yet</p>
                <p className={styles.dashEmptySubtitle}>
                  Add your first product using the card on the left to start
                  selling on Beembai.
                </p>
              </div>
            )}

            {filteredProducts.length === 0 && searchQuery && (
              <div
                className={`${styles.dashEmptyState} ${styles.dashCatalogEmptyState}`}
              >
                <span className={styles.dashEmptyIcon}>🔍</span>
                <p className={styles.dashEmptyTitle}>
                  No results for &ldquo;{searchQuery}&rdquo;
                </p>
                <p className={styles.dashEmptySubtitle}>
                  Try a different search term or clear the search.
                </p>
              </div>
            )}

            {filteredProducts.map((product) => (
              <div
                key={product._id}
                onClick={() => router.push(`/product/${product._id}`)}
                style={{
                  background: "var(--color-cream)",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: 18,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  opacity: product.status === "pending" ? 0.82 : 1,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    background: "var(--color-sand)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {product.image && (
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      style={{ objectFit: "cover" }}
                    />
                  )}
                  {product.status === "pending" ? (
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        backgroundColor: "#eab308",
                        color: "#1e1b4b",
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        padding: "0.2rem 0.55rem",
                        borderRadius: 99,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        zIndex: 2,
                      }}
                    >
                      Pending Review
                    </span>
                  ) : product.tag ? (
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        background: "var(--color-palm)",
                        color: "#fff",
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        padding: "0.2rem 0.55rem",
                        borderRadius: 99,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {product.tag}
                    </span>
                  ) : null}
                </div>
                <div
                  style={{
                    padding: "1rem 1rem 1.1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                    flex: 1,
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--color-olive-gray)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {product.categoryName}
                  </p>
                  <p
                    style={{
                      fontSize: "0.93rem",
                      fontWeight: 800,
                      color: "var(--color-papyrus)",
                      lineHeight: 1.3,
                    }}
                  >
                    {product.title}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginTop: "auto",
                      paddingTop: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 900,
                        fontSize: "1rem",
                        color: "var(--color-palm)",
                      }}
                    >
                      ₦{formatNumber(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className={styles.catalogOriginalPrice}>
                        ₦{formatNumber(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  {product.stock !== undefined && (
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color:
                          product.stock > 0 ? "var(--color-palm)" : "#d93838",
                        fontWeight: 700,
                      }}
                    >
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : "Out of stock"}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit details modal */}
      {showEditDetailsModal && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) =>
            e.target === e.currentTarget && setShowEditDetailsModal(false)
          }
        >
          <div className={styles.productModal} style={{ maxWidth: 640 }}>
            <div className={styles.productModalHeader}>
              <div>
                <h2 className={styles.productModalTitle}>Edit Brand Details</h2>
                <p className={styles.productModalSubtitle}>
                  Update your public storefront information
                </p>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowEditDetailsModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form className={styles.modalForm} onSubmit={handleDetailsSubmit}>
              {detailsError && (
                <div
                  style={{
                    color: "#d93838",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    marginBottom: "1rem",
                  }}
                >
                  ⚠️ {detailsError}
                </div>
              )}

              <div className={styles.modalFormRow}>
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalFormLabel}>Store Name *</label>
                  <input
                    className={styles.modalInput}
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalFormLabel}>
                    Primary Category
                  </label>
                  <select
                    className={styles.modalSelect}
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    <option value="All Categories">All Categories</option>
                    <option value="Phone & Tablets">Phone &amp; Tablets</option>
                    <option value="Gadgets & Accessories">
                      Gadgets &amp; Accessories
                    </option>
                    <option value="Apparel & Fashion">
                      Apparel &amp; Fashion
                    </option>
                    <option value="Furniture & Living">
                      Furniture &amp; Living
                    </option>
                    <option value="Beauty & Care">Beauty &amp; Care</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Home Appliances">Home Appliances</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>
                  Brand Biography / Description *
                </label>
                <textarea
                  className={styles.modalTextarea}
                  style={{ minHeight: 100 }}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>Street Address</label>
                <input
                  className={styles.modalInput}
                  type="text"
                  value={editPhysicalAddress}
                  onChange={(e) => setEditPhysicalAddress(e.target.value)}
                />
              </div>

              <div className={styles.modalFormRow}>
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalFormLabel}>City</label>
                  <input
                    className={styles.modalInput}
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                  />
                </div>
                <div className={styles.modalFormGroup}>
                  <label className={styles.modalFormLabel}>
                    State / Province
                  </label>
                  <input
                    className={styles.modalInput}
                    type="text"
                    value={editStateName}
                    onChange={(e) => setEditStateName(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFormGroup}>
                <label className={styles.modalFormLabel}>Country</label>
                <input
                  className={styles.modalInput}
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                />
              </div>

              <div className={styles.modalBtnGroup}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setShowEditDetailsModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.modalSubmitBtn}
                  disabled={isSubmittingDetails}
                >
                  {isSubmittingDetails ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddProductModal
          storeId={store._id}
          storeName={store.name}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {showVerifyModal && (
        <StoreVerificationModal
          storeId={store._id}
          onClose={() => setShowVerifyModal(false)}
        />
      )}
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
      (document.documentElement.getAttribute("data-theme") as
        "light" | "dark") || "light";
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
            aria-label="Toggle theme"
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
                <button
                  type="button"
                  className={styles.newStorePill}
                  onClick={() => router.push("/sell/new")}
                >
                  <span style={{ fontSize: "1.05rem" }}>+</span> Create New
                  Store
                </button>
              </div>
            )}

            <section className={styles.reviewSection}>
              <div className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewStatusBadge}>Under Review</div>
                  <h2 className={styles.reviewTitle}>
                    Your Store Application is Under Review
                  </h2>
                </div>
                <p className={styles.reviewText}>
                  We are currently reviewing your application for{" "}
                  <strong>{store.name}</strong> in the{" "}
                  <strong>{store.category}</strong> category. Our partnership
                  team typically reviews applications within 24 hours.
                </p>
                <div className={styles.reviewDetails}>
                  <div className={styles.reviewDetailItem}>
                    <strong>Description:</strong> {store.description}
                  </div>
                  <div className={styles.reviewDetailItem}>
                    <strong>Business Email:</strong> {store.email}
                  </div>
                  <div className={styles.reviewDetailItem}>
                    <strong>Contact Phone:</strong> {store.phone}
                  </div>
                  <div className={styles.reviewDetailItem}>
                    <strong>Payout Bank:</strong> {store.bankName} (
                    {store.accountName})
                  </div>
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
