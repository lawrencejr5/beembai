"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "../../admin.module.css";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Add/Edit Product Modal Component ──────────────────────────────────────────
export function ProductModal({
  onClose,
  productToEdit,
}: {
  onClose: () => void;
  productToEdit?: any;
}) {
  const [step, setStep] = useState(1);

  // Step 1 Form fields
  const [title, setTitle] = useState(productToEdit?.title || "");
  const [categoryName, setCategoryName] = useState(productToEdit?.categoryName || "Phones & Tablets");
  const [price, setPrice] = useState(productToEdit?.price ? String(productToEdit.price) : "");
  const [originalPrice, setOriginalPrice] = useState(productToEdit?.originalPrice ? String(productToEdit.originalPrice) : "");
  const [description, setDescription] = useState(productToEdit?.description || "");
  const [condition, setCondition] = useState(productToEdit?.condition || "New");
  const [colors, setColors] = useState(productToEdit?.colors ? productToEdit.colors.join(", ") : "");
  const [sizes, setSizes] = useState(productToEdit?.sizes ? productToEdit.sizes.join(", ") : "");
  const [gender, setGender] = useState(productToEdit?.gender || "All / Unisex");
  const [material, setMaterial] = useState(productToEdit?.material || "");
  const [warranty, setWarranty] = useState(productToEdit?.warranty || "No Warranty");
  const [weight, setWeight] = useState(productToEdit?.weight || "");
  const [ram, setRam] = useState(productToEdit?.ram || "");
  const [storage, setStorage] = useState(productToEdit?.storage || "");
  const [batteryCapacity, setBatteryCapacity] = useState(productToEdit?.batteryCapacity || "");
  const [screenSize, setScreenSize] = useState(productToEdit?.screenSize || "");
  const [displayType, setDisplayType] = useState(productToEdit?.displayType || "");
  const [stock, setStock] = useState(productToEdit?.stock ? String(productToEdit.stock) : "10");

  // Step 2 Upload fields
  const [uploadedImages, setUploadedImages] = useState<string[]>(productToEdit?.images || (productToEdit?.image ? [productToEdit.image] : []));
  const [mainImage, setMainImage] = useState<string>(productToEdit?.image || "");
  const [youtubeLink, setYoutubeLink] = useState(productToEdit?.youtubeLink || "");
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutations/Queries
  const generateUploadUrl = useMutation(api.store.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.products.resolveStorageUrl);
  const createProduct = useMutation(api.beembaiStore.adminCreateProduct);
  const updateProduct = useMutation(api.beembaiStore.adminUpdateProduct);
  const categories = useQuery(api.products.getCategories);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price.trim()) return;
    setStep(2);
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

        if (!uploadResponse.ok) throw new Error("Failed to upload image to storage");
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
      setUploadError(err.message || "Failed to upload images. Please try again.");
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
      const colorsArr = colors
        ? colors.split(",").map((c: string) => c.trim()).filter((c: string) => c.length > 0)
        : [];
      const sizesArr = sizes
        ? sizes.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0)
        : [];

      const categoryLower = (categoryName || "").toLowerCase();
      const isTech = categoryLower.includes("phone") || categoryLower.includes("gadget") || categoryLower.includes("tablet") || categoryLower.includes("electronics");
      const isFashion = categoryLower.includes("apparel") || categoryLower.includes("fashion") || categoryLower.includes("cloth");
      const isFurniture = categoryLower.includes("furniture") || categoryLower.includes("living");
      const isAppliance = categoryLower.includes("appliance") || categoryLower.includes("home");
      const isBeauty = categoryLower.includes("beauty") || categoryLower.includes("care");
      const isGrocery = categoryLower.includes("grocery") || categoryLower.includes("groceries") || categoryLower.includes("food");

      const payload = {
        title,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        categoryName,
        description: description || undefined,
        condition: condition || undefined,
        colors: (isFashion || isTech || isFurniture || isAppliance) && colorsArr.length > 0 ? colorsArr : undefined,
        sizes: isFashion && sizesArr.length > 0 ? sizesArr : undefined,
        gender: (isFashion || isBeauty) && gender ? gender : undefined,
        material: (isFashion || isFurniture) && material ? material : undefined,
        warranty: (isTech || isAppliance || isFurniture) && warranty ? warranty : undefined,
        weight: (isFurniture || isAppliance || isBeauty || isGrocery) && weight ? weight : undefined,
        ram: isTech && ram ? ram : undefined,
        storage: isTech && storage ? storage : undefined,
        batteryCapacity: isTech && batteryCapacity ? batteryCapacity : undefined,
        screenSize: isTech && screenSize ? screenSize : undefined,
        displayType: isTech && displayType ? displayType : undefined,
        stock: parseInt(stock, 10),
        image: mainImage,
        images: uploadedImages,
        youtubeLink: youtubeLink || undefined,
      };

      if (productToEdit) {
        await updateProduct({
          productId: productToEdit._id,
          ...payload,
        });
      } else {
        await createProduct({
          ...payload,
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: 600 }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {productToEdit ? "Edit Product Details" : "List New Product"}
          </h3>
          <button className={styles.modalClose} onClick={onClose} type="button">×</button>
        </div>
        <div className={styles.modalBody}>
          {step === 1 ? (
            <form onSubmit={handleNextStep} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              {/* Category Selector placed at top */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Product Category *</label>
                <select
                  className={styles.formSelect}
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                >
                  {categories?.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  )) || (
                    <>
                      <option value="Phones & Tablets">Phones & Tablets</option>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Product Name / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google Pixel 10 Pro 5G"
                    className={styles.formInput}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Condition Status</label>
                  <select
                    className={styles.formSelect}
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    <option value="New">Brand New</option>
                    <option value="Refurbished">Refurbished / Certified</option>
                    <option value="Used">Used / Vintage</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Price (₦) *</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    className={styles.formInput}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Original Price (Compare at ₦)</label>
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
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>

              {/* Dynamic Category Specifications Section */}
              {(() => {
                const cat = (categoryName || "").toLowerCase();
                const isTech = cat.includes("phone") || cat.includes("gadget") || cat.includes("tablet") || cat.includes("electronics");
                const isFashion = cat.includes("apparel") || cat.includes("fashion") || cat.includes("cloth");
                const isFurniture = cat.includes("furniture") || cat.includes("living");
                const isAppliance = cat.includes("appliance") || cat.includes("home");
                const isBeauty = cat.includes("beauty") || cat.includes("care");
                const isGrocery = cat.includes("grocery") || cat.includes("groceries") || cat.includes("food");

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, borderTop: "1px dashed var(--admin-card-border, #e2e8f0)", paddingTop: 16, marginTop: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--admin-accent, #3b6b48)", margin: 0 }}>
                      📋 {categoryName} Specifications
                    </p>

                    {/* Phones, Tablets & Tech Specs */}
                    {isTech && (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>RAM / Memory</label>
                            <select
                              className={styles.formSelect}
                              value={ram}
                              onChange={(e) => setRam(e.target.value)}
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
                              value={storage}
                              onChange={(e) => setStorage(e.target.value)}
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

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Battery Capacity</label>
                            <input
                              type="text"
                              placeholder="e.g. 5000 mAh, 4500 mAh"
                              className={styles.formInput}
                              value={batteryCapacity}
                              onChange={(e) => setBatteryCapacity(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Screen Size (inches)</label>
                            <input
                              type="text"
                              placeholder='e.g. 6.7", 6.1", 11"'
                              className={styles.formInput}
                              value={screenSize}
                              onChange={(e) => setScreenSize(e.target.value)}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Display Technology</label>
                            <select
                              className={styles.formSelect}
                              value={displayType}
                              onChange={(e) => setDisplayType(e.target.value)}
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
                              value={warranty}
                              onChange={(e) => setWarranty(e.target.value)}
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
                            value={colors}
                            onChange={(e) => setColors(e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {/* Apparel & Fashion Specs */}
                    {isFashion && (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Available Sizes (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. S, M, L, XL, XXL or 38, 40, 42, 14"
                              className={styles.formInput}
                              value={sizes}
                              onChange={(e) => setSizes(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Available Colors (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. Black, White, Navy Blue"
                              className={styles.formInput}
                              value={colors}
                              onChange={(e) => setColors(e.target.value)}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Target Audience / Gender</label>
                            <select
                              className={styles.formSelect}
                              value={gender}
                              onChange={(e) => setGender(e.target.value)}
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
                              value={material}
                              onChange={(e) => setMaterial(e.target.value)}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Furniture & Living Specs */}
                    {isFurniture && (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Available Colors (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. Walnut, Oak, Beige, Charcoal"
                              className={styles.formInput}
                              value={colors}
                              onChange={(e) => setColors(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Material / Finish</label>
                            <input
                              type="text"
                              placeholder="e.g. Solid Oak Wood, Genuine Leather, Velvet"
                              className={styles.formInput}
                              value={material}
                              onChange={(e) => setMaterial(e.target.value)}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Warranty & Guarantee</label>
                            <select
                              className={styles.formSelect}
                              value={warranty}
                              onChange={(e) => setWarranty(e.target.value)}
                            >
                              <option value="No Warranty">No Warranty</option>
                              <option value="1 Year Warranty">1 Year Warranty</option>
                              <option value="2 Years Warranty">2 Years Warranty</option>
                              <option value="5 Years Warranty">5 Years Warranty</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Item Weight</label>
                            <input
                              type="text"
                              placeholder="e.g. 18 kg, 35 kg"
                              className={styles.formInput}
                              value={weight}
                              onChange={(e) => setWeight(e.target.value)}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Home Appliances Specs */}
                    {isAppliance && (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Available Colors (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. Stainless Steel, Black, White"
                              className={styles.formInput}
                              value={colors}
                              onChange={(e) => setColors(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Warranty & Guarantee</label>
                            <select
                              className={styles.formSelect}
                              value={warranty}
                              onChange={(e) => setWarranty(e.target.value)}
                            >
                              <option value="1 Year Warranty">1 Year Warranty</option>
                              <option value="2 Years Warranty">2 Years Warranty</option>
                              <option value="5 Years Warranty">5 Years Warranty</option>
                            </select>
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Item Weight</label>
                          <input
                            type="text"
                            placeholder="e.g. 6.5 kg, 25 kg"
                            className={styles.formInput}
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {/* Beauty & Care Specs */}
                    {isBeauty && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Target Audience / Gender</label>
                          <select
                            className={styles.formSelect}
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                          >
                            <option value="All / Unisex">All / Unisex</option>
                            <option value="Women">Women</option>
                            <option value="Men">Men</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Net Volume / Weight</label>
                          <input
                            type="text"
                            placeholder="e.g. 250ml, 500g, 100ml"
                            className={styles.formInput}
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Groceries Specs */}
                    {isGrocery && (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Pack Weight / Net Quantity</label>
                        <input
                          type="text"
                          placeholder="e.g. 1 kg, 5 kg bag, 10 Litres"
                          className={styles.formInput}
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Product Description *</label>
                <textarea
                  required
                  placeholder="Describe your product specifications, sizing, and details..."
                  className={styles.formTextarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className={styles.modalFooter} style={{ padding: "16px 0 0" }}>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                  Next: Upload Images
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text-primary)", marginBottom: 4 }}>
                  Product Catalog Images *
                </p>
                <p style={{ fontSize: 12, color: "var(--admin-text-secondary)" }}>
                  Click an image thumbnail to set it as the **Primary Main/Thumbnail** image.
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
                <p style={{ fontWeight: 700, fontSize: 13, color: "var(--admin-accent)", marginTop: 8 }}>
                  {isUploading ? "Uploading to storage..." : "Click to select product photos"}
                </p>
                <p style={{ fontSize: 11, color: "var(--admin-text-secondary)" }}>
                  Support JPG, PNG, or WEBP formats
                </p>
              </div>

              {uploadError && (
                <div style={{ color: "var(--admin-danger)", fontSize: 12, fontWeight: 700 }}>
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
                        {isMain && <span className={styles.mainImageBadgeTag}>Main</span>}
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
                <label className={styles.formLabel}>YouTube Video Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={styles.formInput}
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                />
              </div>

              {submitError && (
                <div style={{ color: "var(--admin-danger)", fontSize: 12, fontWeight: 700 }}>
                  ⚠️ {submitError}
                </div>
              )}

              <div className={styles.modalFooter} style={{ padding: "16px 0 0" }}>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setStep(1)} disabled={isSubmitting}>
                  Back
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting || isUploading || uploadedImages.length === 0}
                >
                  {isSubmitting ? "Saving..." : "Save & List"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BeembaiProductsPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);

  const deleteProduct = useMutation(api.beembaiStore.adminDeleteProduct);

  const { results: products, status, loadMore } = usePaginatedQuery(
    api.beembaiStore.getBeembaiStoreProducts,
    {},
    { initialNumItems: 15 }
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status !== "CanLoadMore") return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(15); },
      { threshold: 0.1 }
    );
    const el = loadMoreRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [status, loadMore]);

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: Id<"products">; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    const list = products ?? [];
    // Hide scraped products
    const beembaiLocal = list.filter((p) => p.categorySlug !== "foreign-import");
    
    const term = search.toLowerCase().trim();
    if (!term) return beembaiLocal;
    return beembaiLocal.filter((p) =>
      p.title.toLowerCase().includes(term) ||
      (p.brand && p.brand.toLowerCase().includes(term)) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(term))
    );
  }, [products, search]);

  return (
    <div className={styles.adminContent}>
      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirmTarget(null)}>
          <div className={styles.modal} style={{ maxWidth: 440, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#fef2f2",
                border: "1px solid #fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "#dc2626"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1900", margin: "0 0 8px" }}>
                Delete Product Listing?
              </h3>
              <p style={{ fontSize: 13, color: "#6b6540", margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>"{deleteConfirmTarget.title}"</strong>? This action cannot be undone.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={isDeleting}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                disabled={isDeleting}
                style={{ flex: 1, backgroundColor: "#dc2626", color: "#ffffff", borderColor: "#dc2626" }}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteProduct({ productId: deleteConfirmTarget.id });
                    setDeleteConfirmTarget(null);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <ProductModal
          onClose={() => {
            setShowModal(false);
            setEditProduct(null);
          }}
          productToEdit={editProduct}
        />
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Products (Beembai) 🛍️</h1>
          <p className={styles.pageSubtitle}>Manage products listed directly on the Beembai Official Store</p>
        </div>
        <div>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => {
              setEditProduct(null);
              setShowModal(true);
            }}
            id="add-beembai-product-btn"
          >
            + List Product
          </button>
        </div>
      </div>

      <div className={styles.adminCard}>
        <div className={styles.adminCardHeader}>
          <div className={styles.searchBox} style={{ maxWidth: 300 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by title or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="beembai-products-search"
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {status === "LoadingFirstPage" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 24px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div className={styles.skeleton} style={{ width: 44, height: 44, borderRadius: 8 }} />
                  <div style={{ flex: 1 }}><div className={styles.skeleton} style={{ width: "40%", height: 14 }} /></div>
                  <div className={styles.skeleton} style={{ width: 80, height: 14 }} />
                  <div className={styles.skeleton} style={{ width: 60, height: 20, borderRadius: 100 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🛍️</div>
              <h3 className={styles.emptyStateTitle}>No products listed</h3>
              <p className={styles.emptyStateText}>Click "+ List Product" to list a product on Beembai Store.</p>
            </div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <Link
                        href={`/admin/beembai/products/${product._id}`}
                        style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}
                      >
                        <img src={product.image} alt="" className={styles.productThumb} />
                        <div>
                          <div style={{ fontWeight: 600, color: "#282600", fontSize: 13, maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer" }}>
                            {product.title}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: "#6b6540" }}>{product.categoryName}</span>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: 13 }}>
                      {formatCurrency(product.price)}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${(product.stock ?? 0) > 0 ? styles.approved : styles.rejected}`}>
                        {(product.stock ?? 0) > 0 ? `${product.stock} units` : "Out of Stock"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.flexRow}>
                        <button
                          onClick={() => {
                            setEditProduct(product);
                            setShowModal(true);
                          }}
                          type="button"
                          title="Edit Product"
                          style={{
                            background: "#eff6ff",
                            border: "1px solid #dbeafe",
                            borderRadius: 8,
                            padding: "6px 10px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmTarget({ id: product._id, title: product.title })}
                          type="button"
                          title="Delete Product"
                          style={{
                            background: "#fef2f2",
                            border: "1px solid #fee2e2",
                            borderRadius: 8,
                            padding: "6px 10px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {status === "CanLoadMore" && <div ref={loadMoreRef} style={{ height: 20, margin: "16px 0" }} />}
        </div>
      </div>
    </div>
  );
}