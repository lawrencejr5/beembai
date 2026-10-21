"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  WEIGHT_CLASSES,
  WeightClassConfig,
  WeightClassId,
  getWeightClassById,
  detectWeightClass,
  validateWeightValue,
} from "@/app/data/weightClasses";

// ─── 1. ProductWeightSelector ──────────────────────────────────────
// Used in the product creation / editing form
export function ProductWeightSelector({
  selectedClassId,
  onSelectClass,
  weightValue,
  onWeightChange,
  error,
  setError,
}: {
  selectedClassId: WeightClassId;
  onSelectClass: (classId: WeightClassId) => void;
  weightValue: string;
  onWeightChange: (val: string) => void;
  error?: string | null;
  setError?: (err: string | null) => void;
}) {
  const currentConfig = getWeightClassById(selectedClassId) || WEIGHT_CLASSES[1];

  const handleCardClick = (config: WeightClassConfig) => {
    onSelectClass(config.id);
    const newWeightStr = String(config.defaultWeight);
    onWeightChange(newWeightStr);
    if (setError) setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onWeightChange(val);

    if (!val || val.trim() === "") {
      if (setError) setError("Weight figure is required.");
      return;
    }

    const num = parseFloat(val);
    const validation = validateWeightValue(num, selectedClassId);
    if (setError) {
      setError(validation.isValid ? null : validation.error || "Invalid weight figure.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "18px 20px",
        borderRadius: "14px",
        background: "rgba(99, 109, 33, 0.04)",
        border: "1px solid rgba(99, 109, 33, 0.18)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <label style={{ fontSize: "14px", fontWeight: 750, color: "var(--seller-text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>⚖️</span> Package Weight Class & Value <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <p style={{ fontSize: "12.5px", color: "var(--seller-text-secondary)", margin: "3px 0 0" }}>
            Select the standard package tier to determine live GIGL courier shipping fees accurately.
          </p>
        </div>
      </div>

      {/* Tier Selection Cards (4 classes) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "12px",
        }}
      >
        {WEIGHT_CLASSES.map((config) => {
          const isSelected = selectedClassId === config.id;
          return (
            <div
              key={config.id}
              onClick={() => handleCardClick(config)}
              style={{
                borderRadius: "12px",
                padding: "14px 16px",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                border: isSelected
                  ? "2px solid #636d21"
                  : "1.5px solid var(--seller-card-border, #e5e7eb)",
                background: isSelected
                  ? "rgba(99, 109, 33, 0.12)"
                  : "var(--seller-card-bg, #ffffff)",
                boxShadow: isSelected
                  ? "0 4px 12px rgba(99, 109, 33, 0.15)"
                  : "0 1px 3px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                position: "relative",
              }}
            >
              {/* Top Row: Icon + Name + Range Tag */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>{config.icon}</span>
                  <span
                    style={{
                      fontSize: "13.5px",
                      fontWeight: isSelected ? 800 : 700,
                      color: isSelected ? "#3b4214" : "var(--seller-text-primary, #111827)",
                    }}
                  >
                    {config.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 750,
                    padding: "3px 8px",
                    borderRadius: "99px",
                    background: config.badgeBg,
                    color: config.badgeColor,
                    whiteSpace: "nowrap",
                  }}
                >
                  {config.rangeLabel}
                </span>
              </div>

              {/* Examples */}
              <p
                style={{
                  fontSize: "11.5px",
                  lineHeight: "1.45",
                  color: isSelected ? "#2d3310" : "var(--seller-text-secondary, #6b7280)",
                  margin: 0,
                  fontStyle: "normal",
                }}
              >
                {config.examples}
              </p>

              {/* Default Weight indicator + Selection radio check */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "auto",
                  paddingTop: "6px",
                  borderTop: isSelected ? "1px dashed rgba(99, 109, 33, 0.3)" : "1px dashed rgba(0,0,0,0.06)",
                }}
              >
                <span style={{ fontSize: "11px", color: isSelected ? "#4d5519" : "var(--seller-text-secondary, #9ca3af)" }}>
                  Default: <strong>{config.defaultWeight} kg</strong>
                </span>

                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    border: isSelected ? "5px solid #636d21" : "2px solid #d1d5db",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Editable Weight Figure Input for the Selected Class */}
      <div
        style={{
          background: "var(--seller-card-bg, #ffffff)",
          border: "1px solid var(--seller-card-border, #e5e7eb)",
          borderRadius: "10px",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <label
              htmlFor="product-weight-input"
              style={{ fontSize: "13px", fontWeight: 700, color: "var(--seller-text-primary, #111827)" }}
            >
              Exact Weight for this Listing (kg)
            </label>
            <p style={{ fontSize: "11.5px", color: "var(--seller-text-secondary, #6b7280)", margin: "2px 0 0" }}>
              Must be within <strong>{currentConfig.rangeLabel}</strong> for {currentConfig.name} class.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ position: "relative", width: "130px" }}>
              <input
                id="product-weight-input"
                type="number"
                step="0.01"
                min={currentConfig.min}
                max={currentConfig.max}
                value={weightValue}
                onChange={handleInputChange}
                required
                placeholder={String(currentConfig.defaultWeight)}
                style={{
                  width: "100%",
                  padding: "8px 32px 8px 12px",
                  fontSize: "14px",
                  fontWeight: 700,
                  borderRadius: "8px",
                  border: error ? "2px solid #ef4444" : "1.5px solid var(--seller-input-border, #d1d5db)",
                  outline: "none",
                  color: "var(--seller-text-primary, #111827)",
                  background: "var(--seller-input-bg, #ffffff)",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--seller-text-secondary, #6b7280)",
                  pointerEvents: "none",
                }}
              >
                kg
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onWeightChange(String(currentConfig.defaultWeight));
                if (setError) setError(null);
              }}
              title="Reset to class default"
              style={{
                fontSize: "11.5px",
                padding: "8px 10px",
                borderRadius: "8px",
                background: "rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.08)",
                cursor: "pointer",
                color: "var(--seller-text-primary)",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Reset ({currentConfig.defaultWeight}kg)
            </button>
          </div>
        </div>

        {/* Live Validation Alert */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "#dc2626",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 2. QuickUpdateWeightModal ─────────────────────────────────────
// Allows sellers to instantly update a product's weight from the catalog table or detail page
export function QuickUpdateWeightModal({
  product,
  onClose,
  onSuccess,
}: {
  product: {
    _id: Id<"products">;
    title: string;
    weight?: string;
    weightClass?: string;
    image?: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const initialClass =
    (product.weightClass as WeightClassId) ||
    detectWeightClass(product.weight).id;

  const initialWeight = product.weight
    ? String(product.weight).replace(/[^0-9.]/g, "")
    : String(detectWeightClass(product.weight).defaultWeight);

  const [selectedClassId, setSelectedClassId] = useState<WeightClassId>(initialClass);
  const [weightValue, setWeightValue] = useState<string>(initialWeight);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const updateWeightMut = useMutation(api.products.updateProductWeight);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightValue || isNaN(parseFloat(weightValue))) {
      setError("Please provide a valid weight number.");
      return;
    }

    const num = parseFloat(weightValue);
    const validation = validateWeightValue(num, selectedClassId);
    if (!validation.isValid) {
      setError(validation.error || "Weight figure is outside allowed bounds.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await updateWeightMut({
        productId: product._id,
        weight: String(num),
        weightClass: selectedClassId,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to update product weight.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--seller-card-bg, #ffffff)",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          border: "1px solid var(--seller-card-border, #e5e7eb)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--seller-card-border, #e5e7eb)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "var(--seller-text-primary, #111827)" }}>
              Update Package Weight
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--seller-text-secondary, #6b7280)", maxWidth: "480px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Listing: <strong>{product.title}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "22px",
              cursor: "pointer",
              color: "var(--seller-text-secondary, #6b7280)",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <ProductWeightSelector
            selectedClassId={selectedClassId}
            onSelectClass={setSelectedClassId}
            weightValue={weightValue}
            onWeightChange={setWeightValue}
            error={error}
            setError={setError}
          />

          {submitError && (
            <div
              style={{
                color: "#dc2626",
                fontSize: "12.5px",
                fontWeight: 700,
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              ⚠️ {submitError}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "12px", borderTop: "1px solid var(--seller-card-border, #e5e7eb)" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "10px 18px",
                fontSize: "13.5px",
                fontWeight: 600,
                borderRadius: "8px",
                background: "none",
                border: "1px solid var(--seller-card-border, #d1d5db)",
                color: "var(--seller-text-primary, #374151)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!error}
              style={{
                padding: "10px 22px",
                fontSize: "13.5px",
                fontWeight: 750,
                borderRadius: "8px",
                background: error ? "#9ca3af" : "#636d21",
                border: "none",
                color: "#ffffff",
                cursor: error ? "not-allowed" : "pointer",
                boxShadow: "0 2px 6px rgba(99, 109, 33, 0.25)",
              }}
            >
              {isSubmitting ? "Saving..." : "Save Product Weight"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── 3. ProductWeightBadge ─────────────────────────────────────────
// Displays weight badge with class tag in table or card
export function ProductWeightBadge({
  weight,
  weightClass,
  onEditClick,
}: {
  weight?: string | number | null;
  weightClass?: string | null;
  onEditClick?: () => void;
}) {
  const hasWeight = weight !== undefined && weight !== null && weight !== "";
  const num = hasWeight
    ? typeof weight === "number"
      ? weight
      : parseFloat(String(weight).replace(/[^0-9.]/g, ""))
    : NaN;

  const config = !isNaN(num)
    ? getWeightClassById(weightClass) || detectWeightClass(num)
    : null;

  if (!config || isNaN(num)) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "99px",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#dc2626",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}
        >
          ⚠️ Not Set
        </span>
        {onEditClick && (
          <button
            type="button"
            onClick={onEditClick}
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: "4px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#2563eb",
              cursor: "pointer",
            }}
          >
            + Add
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
      <span
        style={{
          fontSize: "12px",
          fontWeight: 800,
          color: "var(--seller-text-primary, #111827)",
        }}
      >
        {num} kg
      </span>
      <span
        title={config.examples}
        style={{
          fontSize: "10.5px",
          fontWeight: 750,
          padding: "2px 7px",
          borderRadius: "99px",
          background: config.badgeBg,
          color: config.badgeColor,
          whiteSpace: "nowrap",
        }}
      >
        {config.icon} {config.name}
      </span>
      {onEditClick && (
        <button
          type="button"
          onClick={onEditClick}
          title="Update weight"
          style={{
            background: "none",
            border: "none",
            padding: "2px",
            cursor: "pointer",
            fontSize: "12px",
            color: "var(--seller-text-secondary, #6b7280)",
            lineHeight: 1,
          }}
        >
          ✏️
        </button>
      )}
    </div>
  );
}
