"use client";

import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "../seller.module.css";
import { ProductWeightSelector } from "./ProductWeightComponents";
import {
  WeightClassId,
  detectWeightClass,
  validateWeightValue,
} from "@/app/data/weightClasses";

// ─── Add Product Modal Component ──────────────────────────────────────────────

export function AddProductModal({
  onClose,
  preSelectedStoreId,
  allowedStores,
  productToEdit,
}: {
  onClose: () => void;
  preSelectedStoreId: string | null;
  allowedStores: any[];
  productToEdit?: any;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    productToEdit?.storeId ||
      preSelectedStoreId ||
      (allowedStores[0]?._id as string) ||
      "",
  );

  // Step 1 Form fields
  const [productTitle, setProductTitle] = useState(productToEdit?.title || "");
  const [productCategory, setProductCategory] = useState(
    productToEdit?.categoryName || "Phone & Tablets",
  );
  const [productPrice, setProductPrice] = useState(
    productToEdit?.price ? String(productToEdit.price) : "",
  );
  const [originalPrice, setOriginalPrice] = useState(
    productToEdit?.originalPrice ? String(productToEdit.originalPrice) : "",
  );
  const [productDesc, setProductDesc] = useState(
    productToEdit?.description || "",
  );
  const [productCondition, setProductCondition] = useState(
    productToEdit?.condition || "New",
  );
  const [productColors, setProductColors] = useState(
    productToEdit?.colors ? productToEdit.colors.join(", ") : "",
  );
  const [productSizes, setProductSizes] = useState(
    productToEdit?.sizes ? productToEdit.sizes.join(", ") : "",
  );
  const [productGender, setProductGender] = useState(
    productToEdit?.gender || "All / Unisex",
  );
  const [productMaterial, setProductMaterial] = useState(
    productToEdit?.material || "",
  );
  const [productWarranty, setProductWarranty] = useState(
    productToEdit?.warranty || "No Warranty",
  );
  const [productRam, setProductRam] = useState(productToEdit?.ram || "");
  const [productStorage, setProductStorage] = useState(productToEdit?.storage || "");
  const [productBattery, setProductBattery] = useState(productToEdit?.batteryCapacity || "");
  const [productScreenSize, setProductScreenSize] = useState(productToEdit?.screenSize || "");
  const [productDisplayType, setProductDisplayType] = useState(productToEdit?.displayType || "");
  const [productStock, setProductStock] = useState(
    productToEdit?.stock ? String(productToEdit.stock) : "",
  );

  // Step 2 Weight fields (Dedicated Middle Page)
  const initialWeightConfig = detectWeightClass(productToEdit?.weight);
  const [weightClassId, setWeightClassId] = useState<WeightClassId>(
    (productToEdit?.weightClass as WeightClassId) || initialWeightConfig.id,
  );
  const [productWeight, setProductWeight] = useState<string>(
    productToEdit?.weight
      ? String(productToEdit.weight).replace(/[^0-9.]/g, "")
      : String(initialWeightConfig.defaultWeight),
  );
  const [weightError, setWeightError] = useState<string | null>(null);

  // Step 3 Upload & Media fields
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    productToEdit?.images || [],
  );
  const [mainImage, setMainImage] = useState<string>(
    productToEdit?.image || "",
  );
  const [youtubeLink, setYoutubeLink] = useState(
    productToEdit?.youtubeLink || "",
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const generateUploadUrl = useMutation(api.store.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.products.resolveStorageUrl);
  const createProductMut = useMutation(api.products.createProduct);
  const updateProductMut = useMutation(api.products.updateProduct);

  const categories = useQuery(api.products.getCategories);

  // Step 1 → Step 2
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productTitle.trim() || !productPrice.trim() || !selectedStoreId)
      return;
    setStep(2);
  };

  // Step 2 → Step 3 (Weight validation)
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productWeight || productWeight.trim() === "") {
      setWeightError("Please enter the product weight figure.");
      return;
    }

    const weightNum = parseFloat(productWeight);
    const weightValidation = validateWeightValue(weightNum, weightClassId);
    if (!weightValidation.isValid) {
      setWeightError(
        weightValidation.error ||
          "Please enter a valid weight within the selected class range.",
      );
      return;
    }

    setWeightError(null);
    setStep(3);
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 1. Generate Upload URL
        const uploadUrl = await generateUploadUrl();

        // 2. Fetch/POST upload URL
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok)
          throw new Error("Failed to upload image to storage");
        const { storageId } = await uploadResponse.json();

        // 3. Resolve storage URL
        const publicUrl = await resolveStorageUrl({ storageId });
        if (publicUrl) urls.push(publicUrl);
      }

      setUploadedImages((prev) => {
        const next = [...prev, ...urls];
        if (!mainImage && next.length > 0) {
          setMainImage(next[0]);
        }
        return next;
      });
    } catch (err: any) {
      console.error(err);
      setUploadError(
        err.message || "Failed to upload images. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = (urlToDelete: string) => {
    setUploadedImages((prev) => prev.filter((url) => url !== urlToDelete));
    if (mainImage === urlToDelete) {
      setMainImage(uploadedImages.find((url) => url !== urlToDelete) || "");
    }
  };

  const handleFinalSubmit = async () => {
    if (!mainImage) {
      setSubmitError("Please select a primary thumbnail image.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const colorsArr = productColors
        ? productColors
            .split(",")
            .map((c: string) => c.trim())
            .filter((c: string) => c.length > 0)
        : [];
      const sizesArr = productSizes
        ? productSizes
            .split(",")
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
        : [];

      const categoryLower = (productCategory || "").toLowerCase();
      const isTech = categoryLower.includes("phone") || categoryLower.includes("gadget") || categoryLower.includes("tablet") || categoryLower.includes("electronics");
      const isFashion = categoryLower.includes("apparel") || categoryLower.includes("fashion") || categoryLower.includes("cloth");
      const isFurniture = categoryLower.includes("furniture") || categoryLower.includes("living");
      const isAppliance = categoryLower.includes("appliance") || categoryLower.includes("home");
      const isBeauty = categoryLower.includes("beauty") || categoryLower.includes("care");
      const isGrocery = categoryLower.includes("grocery") || categoryLower.includes("groceries") || categoryLower.includes("food");

      const payload = {
        title: productTitle,
        price: parseFloat(productPrice),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        categoryName: productCategory,
        description: productDesc || undefined,
        condition: productCondition || undefined,
        colors: (isFashion || isTech || isFurniture || isAppliance) && colorsArr.length > 0 ? colorsArr : undefined,
        sizes: isFashion && sizesArr.length > 0 ? sizesArr : undefined,
        gender: (isFashion || isBeauty) && productGender ? productGender : undefined,
        material: (isFashion || isFurniture) && productMaterial ? productMaterial : undefined,
        warranty: (isTech || isAppliance || isFurniture) && productWarranty ? productWarranty : undefined,
        weight: productWeight && productWeight.trim() !== "" ? productWeight.trim() : undefined,
        weightClass: weightClassId || undefined,
        ram: isTech && productRam ? productRam : undefined,
        storage: isTech && productStorage ? productStorage : undefined,
        batteryCapacity: isTech && productBattery ? productBattery : undefined,
        screenSize: isTech && productScreenSize ? productScreenSize : undefined,
        displayType: isTech && productDisplayType ? productDisplayType : undefined,
        stock: productStock ? parseInt(productStock) : undefined,
        image: mainImage,
        images: uploadedImages,
        youtubeLink: youtubeLink || undefined,
      };

      if (productToEdit) {
        await updateProductMut({
          productId: productToEdit._id,
          ...payload,
        });
      } else {
        await createProductMut({
          ...payload,
          storeId: selectedStoreId as Id<"stores">,
        });
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to save product listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const approvedStores = allowedStores.filter((s) => s.status === "approved");

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: "720px" }}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>
              {productToEdit ? "Edit Product Details" : "List New Product"}
            </h3>
            <span style={{ fontSize: "12px", color: "var(--seller-text-secondary)" }}>
              Step {step} of 3 • {step === 1 ? "Product Information" : step === 2 ? "Package Weight & Shipping Tier" : "Photos & Media"}
            </span>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            ×
          </button>
        </div>

        {/* 3-Step Wizard Breadcrumb Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px",
            borderBottom: "1px solid var(--seller-card-border, #e5e7eb)",
            background: "rgba(0,0,0,0.02)",
            gap: "8px",
          }}
        >
          {/* Step 1 */}
          <div
            onClick={() => setStep(1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              color: step === 1 ? "#636d21" : step > 1 ? "#059669" : "var(--seller-text-secondary, #9ca3af)",
              fontWeight: 700,
              fontSize: "12.5px",
            }}
          >
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: step === 1 ? "#636d21" : step > 1 ? "#059669" : "#e5e7eb",
                color: step === 1 || step > 1 ? "#ffffff" : "#6b7280",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              {step > 1 ? "✓" : "1"}
            </span>
            <span>1. Product Info</span>
          </div>

          <div style={{ flex: 1, height: "2px", background: step > 1 ? "#059669" : "#e5e7eb", margin: "0 4px" }} />

          {/* Step 2 (Dedicated Middle Page) */}
          <div
            onClick={() => {
              if (productTitle.trim() && productPrice.trim() && selectedStoreId) {
                setStep(2);
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: productTitle.trim() ? "pointer" : "not-allowed",
              color: step === 2 ? "#636d21" : step > 2 ? "#059669" : "var(--seller-text-secondary, #9ca3af)",
              fontWeight: 700,
              fontSize: "12.5px",
            }}
          >
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: step === 2 ? "#636d21" : step > 2 ? "#059669" : "#e5e7eb",
                color: step === 2 || step > 2 ? "#ffffff" : "#6b7280",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              {step > 2 ? "✓" : "2"}
            </span>
            <span>2. Package Weight</span>
          </div>

          <div style={{ flex: 1, height: "2px", background: step > 2 ? "#059669" : "#e5e7eb", margin: "0 4px" }} />

          {/* Step 3 */}
          <div
            onClick={() => {
              const num = parseFloat(productWeight);
              if (productTitle.trim() && productPrice.trim() && selectedStoreId && !isNaN(num)) {
                setStep(3);
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: productTitle.trim() ? "pointer" : "not-allowed",
              color: step === 3 ? "#636d21" : "var(--seller-text-secondary, #9ca3af)",
              fontWeight: 700,
              fontSize: "12.5px",
            }}
          >
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: step === 3 ? "#636d21" : "#e5e7eb",
                color: step === 3 ? "#ffffff" : "#6b7280",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              3
            </span>
            <span>3. Photos & Media</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* ═════════════════════════════════════════════════════════ */}
          {/* STEP 1: Basic Information & Category Specs                */}
          {/* ═════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <form
              onSubmit={handleStep1Submit}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {/* Store Selector */}
              {preSelectedStoreId === null && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Target Store storefront *
                  </label>
                  <select
                    className={styles.formSelect}
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select Store
                    </option>
                    {approvedStores.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category Selector placed at top below Store */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Product Category *</label>
                <select
                  className={styles.formSelect}
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  required
                >
                  {categories?.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  )) || (
                    <>
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
                    </>
                  )}
                </select>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Product Name / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google Pixel 10 Pro 5G"
                    className={styles.formInput}
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Condition Status</label>
                  <select
                    className={styles.formSelect}
                    value={productCondition}
                    onChange={(e) => setProductCondition(e.target.value)}
                  >
                    <option value="New">Brand New</option>
                    <option value="Refurbished">Refurbished / Certified</option>
                    <option value="Used">Used / Vintage</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Price (₦) *</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    className={styles.formInput}
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Original Price (Compare at ₦)
                  </label>
                  <input
                    type="number"
                    placeholder="35000"
                    className={styles.formInput}
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Stock Levels / Qty</label>
                <input
                  type="number"
                  placeholder="10"
                  className={styles.formInput}
                  value={productStock}
                  onChange={(e) => setProductStock(e.target.value)}
                />
              </div>

              {/* Dynamic Category Specifications Section */}
              {(() => {
                const cat = (productCategory || "").toLowerCase();
                const isTech = cat.includes("phone") || cat.includes("gadget") || cat.includes("tablet") || cat.includes("electronics");
                const isFashion = cat.includes("apparel") || cat.includes("fashion") || cat.includes("cloth");
                const isFurniture = cat.includes("furniture") || cat.includes("living");
                const isAppliance = cat.includes("appliance") || cat.includes("home");
                const isBeauty = cat.includes("beauty") || cat.includes("care");
                const isGrocery = cat.includes("grocery") || cat.includes("groceries") || cat.includes("food");

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, borderTop: "1px dashed var(--seller-card-border)", paddingTop: 16, marginTop: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--seller-accent)", margin: 0 }}>
                      📋 {productCategory} Specifications
                    </p>

                    {/* Phones, Tablets & Tech Specs */}
                    {isTech && (
                      <>
                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>RAM / Memory</label>
                            <select
                              className={styles.formSelect}
                              value={productRam}
                              onChange={(e) => setProductRam(e.target.value)}
                            >
                              <option value="">Select RAM</option>
                              <option value="4GB">4GB</option>
                              <option value="6GB">6GB</option>
                              <option value="8GB">8GB</option>
                              <option value="12GB">12GB</option>
                              <option value="16GB">16GB</option>
                              <option value="24GB">24GB</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Internal Storage</label>
                            <select
                              className={styles.formSelect}
                              value={productStorage}
                              onChange={(e) => setProductStorage(e.target.value)}
                            >
                              <option value="">Select Storage</option>
                              <option value="64GB">64GB</option>
                              <option value="128GB">128GB</option>
                              <option value="256GB">256GB</option>
                              <option value="512GB">512GB</option>
                              <option value="1TB">1TB</option>
                            </select>
                          </div>
                        </div>

                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Battery Capacity</label>
                            <input
                              type="text"
                              placeholder="e.g. 5000 mAh, 4500 mAh"
                              className={styles.formInput}
                              value={productBattery}
                              onChange={(e) => setProductBattery(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Screen Size (inches)</label>
                            <input
                              type="text"
                              placeholder='e.g. 6.7", 6.1", 11"'
                              className={styles.formInput}
                              value={productScreenSize}
                              onChange={(e) => setProductScreenSize(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Display Technology</label>
                            <select
                              className={styles.formSelect}
                              value={productDisplayType}
                              onChange={(e) => setProductDisplayType(e.target.value)}
                            >
                              <option value="">Select Display Type</option>
                              <option value="AMOLED">AMOLED</option>
                              <option value="OLED">OLED</option>
                              <option value="Super Retina XDR">Super Retina XDR</option>
                              <option value="IPS LCD">IPS LCD</option>
                              <option value="Fluid AMOLED">Fluid AMOLED</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Warranty & Guarantee</label>
                            <select
                              className={styles.formSelect}
                              value={productWarranty}
                              onChange={(e) => setProductWarranty(e.target.value)}
                            >
                              <option value="No Warranty">No Warranty</option>
                              <option value="6 Months Warranty">6 Months Warranty</option>
                              <option value="1 Year Warranty">1 Year Warranty</option>
                              <option value="2 Years Warranty">2 Years Warranty</option>
                            </select>
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Available Colors (comma-separated)</label>
                          <input
                            type="text"
                            placeholder="e.g. Black, Titanium, Hazel, Silver"
                            className={styles.formInput}
                            value={productColors}
                            onChange={(e) => setProductColors(e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {/* Apparel & Fashion Specs */}
                    {isFashion && (
                      <>
                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Available Sizes (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. S, M, L, XL, XXL or 38, 40, 42, 14"
                              className={styles.formInput}
                              value={productSizes}
                              onChange={(e) => setProductSizes(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Available Colors (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. Black, White, Navy Blue"
                              className={styles.formInput}
                              value={productColors}
                              onChange={(e) => setProductColors(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Target Audience / Gender</label>
                            <select
                              className={styles.formSelect}
                              value={productGender}
                              onChange={(e) => setProductGender(e.target.value)}
                            >
                              <option value="All / Unisex">All / Unisex</option>
                              <option value="Men">Men</option>
                              <option value="Women">Women</option>
                              <option value="Kids">Kids</option>
                              <option value="Boys">Boys</option>
                              <option value="Girls">Girls</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Material / Fabric</label>
                            <input
                              type="text"
                              placeholder="e.g. 100% Cotton, Genuine Leather, Denim"
                              className={styles.formInput}
                              value={productMaterial}
                              onChange={(e) => setProductMaterial(e.target.value)}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Furniture & Living Specs */}
                    {isFurniture && (
                      <>
                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Available Colors (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. Walnut, Oak, Beige, Charcoal"
                              className={styles.formInput}
                              value={productColors}
                              onChange={(e) => setProductColors(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Material / Finish</label>
                            <input
                              type="text"
                              placeholder="e.g. Solid Oak Wood, Genuine Leather, Velvet"
                              className={styles.formInput}
                              value={productMaterial}
                              onChange={(e) => setProductMaterial(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Warranty & Guarantee</label>
                            <select
                              className={styles.formSelect}
                              value={productWarranty}
                              onChange={(e) => setProductWarranty(e.target.value)}
                            >
                              <option value="No Warranty">No Warranty</option>
                              <option value="1 Year Warranty">1 Year Warranty</option>
                              <option value="2 Years Warranty">2 Years Warranty</option>
                              <option value="5 Years Warranty">5 Years Warranty</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Dimensions (Optional)</label>
                            <input
                              type="text"
                              placeholder="e.g. 120 x 60 x 75 cm"
                              className={styles.formInput}
                              value={productMaterial}
                              onChange={(e) => setProductMaterial(e.target.value)}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Home Appliances Specs */}
                    {isAppliance && (
                      <>
                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Available Colors (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. Stainless Steel, Black, White"
                              className={styles.formInput}
                              value={productColors}
                              onChange={(e) => setProductColors(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Warranty & Guarantee</label>
                            <select
                              className={styles.formSelect}
                              value={productWarranty}
                              onChange={(e) => setProductWarranty(e.target.value)}
                            >
                              <option value="1 Year Warranty">1 Year Warranty</option>
                              <option value="2 Years Warranty">2 Years Warranty</option>
                              <option value="5 Years Warranty">5 Years Warranty</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Beauty & Care Specs */}
                    {isBeauty && (
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Target Audience / Gender</label>
                          <select
                            className={styles.formSelect}
                            value={productGender}
                            onChange={(e) => setProductGender(e.target.value)}
                          >
                            <option value="All / Unisex">All / Unisex</option>
                            <option value="Women">Women</option>
                            <option value="Men">Men</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Net Volume (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. 250ml, 100ml"
                            className={styles.formInput}
                            value={productMaterial}
                            onChange={(e) => setProductMaterial(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Groceries Specs */}
                    {isGrocery && (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Packaging Format (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Box of 12, Sachet, Bottle"
                          className={styles.formInput}
                          value={productMaterial}
                          onChange={(e) => setProductMaterial(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Product Description *
                </label>
                <textarea
                  required
                  placeholder="Describe your product specifications, sizing, and details..."
                  className={styles.formTextarea}
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                />
              </div>

              <div
                className={styles.modalFooter}
                style={{ padding: "16px 0 0" }}
              >
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  Next: Package Weight →
                </button>
              </div>
            </form>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* STEP 2: Dedicated Package Weight & Logistics Page        */}
          {/* ═════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <form
              onSubmit={handleStep2Submit}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              {/* Informative Guidance Banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "16px 18px",
                  borderRadius: "12px",
                  background: "rgba(99, 109, 33, 0.08)",
                  border: "1px solid rgba(99, 109, 33, 0.2)",
                }}
              >
                <span style={{ fontSize: "24px", lineHeight: 1 }}>🚚</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "var(--seller-text-primary)" }}>
                    Automated Courier Delivery Fee Calculation
                  </h4>
                  <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--seller-text-secondary)", lineHeight: 1.5 }}>
                    Beembai connects directly to <strong>GIG Logistics (GIGL)</strong> to compute real-time door delivery rates at customer checkout. Pick the closest weight category for your parcel, and specify the exact weight figure in kilograms.
                  </p>
                </div>
              </div>

              {/* Package Weight & Tier Selector Component */}
              <ProductWeightSelector
                selectedClassId={weightClassId}
                onSelectClass={setWeightClassId}
                weightValue={productWeight}
                onWeightChange={setProductWeight}
                error={weightError}
                setError={setWeightError}
              />

              {/* Delivery Packing Tips */}
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: "rgba(0,0,0,0.03)",
                  border: "1px dashed var(--seller-card-border, #e5e7eb)",
                  fontSize: "12px",
                  color: "var(--seller-text-secondary)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <span style={{ fontWeight: 700, color: "var(--seller-text-primary)" }}>
                  💡 Packaging & Handling Guidelines:
                </span>
                <span style={{ lineHeight: 1.45 }}>
                  • Package figures include the outer protective box or polymailer wrap.
                </span>
                <span style={{ lineHeight: 1.45 }}>
                  • For delicate or fragile products, factor in bubble wrap cushioning when estimating parcel weight.
                </span>
              </div>

              {/* Step 2 Footer */}
              <div
                className={styles.modalFooter}
                style={{ padding: "16px 0 0" }}
              >
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={() => setStep(1)}
                >
                  ← Back to Product Info
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  Next: Photos & Media →
                </button>
              </div>
            </form>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* STEP 3: Images, Media & Final Submit                     */}
          {/* ═════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--seller-text-primary)",
                    marginBottom: 4,
                  }}
                >
                  Product Catalog Images *
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--seller-text-secondary)",
                  }}
                >
                  Click an image thumbnail to set it as the **Primary
                  Main/Thumbnail** image.
                </p>
              </div>

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
              >
                <span style={{ fontSize: 24 }}>📁</span>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--seller-accent)",
                    marginTop: 8,
                  }}
                >
                  {isUploading
                    ? "Uploading to storage..."
                    : "Click to select product photos"}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--seller-text-secondary)",
                  }}
                >
                  Support JPG, PNG, or WEBP formats
                </p>
              </div>

              {uploadError && (
                <div
                  style={{
                    color: "var(--seller-danger)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  ⚠️ {uploadError}
                </div>
              )}

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
                        <img src={url} alt="" />
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
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  YouTube Video Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={styles.formInput}
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                />
              </div>

              {submitError && (
                <div
                  style={{
                    color: "var(--seller-danger)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  ⚠️ {submitError}
                </div>
              )}

              <div
                className={styles.modalFooter}
                style={{ padding: "16px 0 0" }}
              >
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={() => setStep(2)}
                  disabled={isSubmitting}
                >
                  ← Back to Weight
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={handleFinalSubmit}
                  disabled={
                    isSubmitting || isUploading || uploadedImages.length === 0
                  }
                >
                  {isSubmitting ? "Saving..." : productToEdit ? "Save Changes" : "Save & List Product"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
