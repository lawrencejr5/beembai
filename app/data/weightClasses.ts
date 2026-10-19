export type WeightClassId = "small" | "medium" | "heavy" | "bulky";

export interface WeightClassConfig {
  id: WeightClassId;
  name: string;
  rangeLabel: string;
  fullLabel: string;
  min: number;
  max: number;
  defaultWeight: number;
  examples: string;
  description: string;
  icon: string;
  badgeBg: string;
  badgeColor: string;
}

export const WEIGHT_CLASSES: WeightClassConfig[] = [
  {
    id: "small",
    name: "Small / Light",
    rangeLabel: "< 0.5 kg",
    fullLabel: "Small / Light (< 0.5 kg)",
    min: 0.01,
    max: 0.49,
    defaultWeight: 0.3,
    examples: "Phone accessories, clothing, cosmetics, jewelry",
    description: "Lightweight parcel under 0.5 kg",
    icon: "🪶",
    badgeBg: "rgba(16, 185, 129, 0.12)",
    badgeColor: "#059669",
  },
  {
    id: "medium",
    name: "Medium",
    rangeLabel: "0.5 kg – 2 kg",
    fullLabel: "Medium (0.5 kg – 2 kg)",
    min: 0.5,
    max: 2.0,
    defaultWeight: 1.0,
    examples: "Shoes, sneakers, irons, blenders, jeans",
    description: "Standard parcel between 0.5 kg and 2 kg",
    icon: "📦",
    badgeBg: "rgba(59, 130, 246, 0.12)",
    badgeColor: "#2563eb",
  },
  {
    id: "heavy",
    name: "Heavy",
    rangeLabel: "2 kg – 10 kg",
    fullLabel: "Heavy (2 kg – 10 kg)",
    min: 2.0,
    max: 10.0,
    defaultWeight: 5.0,
    examples: "Microwaves, air fryers, food processors, small speakers",
    description: "Heavy parcel between 2 kg and 10 kg",
    icon: "🏋️",
    badgeBg: "rgba(245, 158, 11, 0.12)",
    badgeColor: "#d97706",
  },
  {
    id: "bulky",
    name: "Bulky / Oversized",
    rangeLabel: "10 kg – 30 kg",
    fullLabel: "Bulky / Oversized (10 kg – 30 kg)",
    min: 10.0,
    max: 30.0,
    defaultWeight: 15.0,
    examples: "Generators, washing machines, small fridges, monitors",
    description: "Oversized freight between 10 kg and 30 kg",
    icon: "🚚",
    badgeBg: "rgba(239, 68, 68, 0.12)",
    badgeColor: "#dc2626",
  },
];

export function getWeightClassById(id?: string | null): WeightClassConfig | undefined {
  if (!id) return undefined;
  return WEIGHT_CLASSES.find((c) => c.id === id);
}

export function detectWeightClass(weight?: string | number | null): WeightClassConfig {
  if (weight === undefined || weight === null || weight === "") {
    return WEIGHT_CLASSES[1]; // default to Medium
  }
  const num = typeof weight === "number" ? weight : parseFloat(String(weight).replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return WEIGHT_CLASSES[1];

  if (num < 0.5) return WEIGHT_CLASSES[0]; // small
  if (num <= 2.0) return WEIGHT_CLASSES[1]; // medium
  if (num <= 10.0) return WEIGHT_CLASSES[2]; // heavy
  return WEIGHT_CLASSES[3]; // bulky
}

export function validateWeightValue(
  weightNum: number,
  classId: WeightClassId,
): { isValid: boolean; error?: string } {
  if (isNaN(weightNum)) {
    return { isValid: false, error: "Please enter a valid weight figure." };
  }

  const config = WEIGHT_CLASSES.find((c) => c.id === classId);
  if (!config) {
    return { isValid: true };
  }

  if (classId === "small") {
    if (weightNum <= 0) {
      return { isValid: false, error: "Weight must be greater than 0 kg." };
    }
    if (weightNum >= 0.5) {
      return {
        isValid: false,
        error: "Weight for Small / Light must be less than 0.5 kg (maximum 0.49 kg).",
      };
    }
    return { isValid: true };
  }

  if (classId === "medium") {
    if (weightNum < 0.5 || weightNum > 2.0) {
      return {
        isValid: false,
        error: "Weight for Medium must be between 0.5 kg and 2.0 kg.",
      };
    }
    return { isValid: true };
  }

  if (classId === "heavy") {
    if (weightNum < 2.0 || weightNum > 10.0) {
      return {
        isValid: false,
        error: "Weight for Heavy must be between 2.0 kg and 10.0 kg.",
      };
    }
    return { isValid: true };
  }

  if (classId === "bulky") {
    if (weightNum < 10.0 || weightNum > 30.0) {
      return {
        isValid: false,
        error: "Weight for Bulky / Oversized must be between 10.0 kg and 30.0 kg.",
      };
    }
    return { isValid: true };
  }

  return { isValid: true };
}
