export interface BankOption {
  key: string;
  label: string;
}

export const NIGERIAN_BANKS: BankOption[] = [
  { key: "058", label: "GTBank" },
  { key: "044", label: "Access Bank" },
  { key: "057", label: "Zenith Bank" },
  { key: "033", label: "UBA" },
  { key: "011", label: "First Bank" },
  { key: "070", label: "Fidelity" },
  { key: "076", label: "Polaris" },
  { key: "035", label: "Wema" },
  { key: "232", label: "Sterling" },
  { key: "032", label: "Union Bank" },
  { key: "50515", label: "Moniepoint MFB" },
  { key: "999992", label: "Opay (Paycom)" },
  { key: "999991", label: "PalmPay" },
  { key: "50211", label: "Kuda" },
];

export function getBankByKey(key: string): BankOption | undefined {
  return NIGERIAN_BANKS.find((b) => b.key === key);
}

export function getBankByLabel(label: string): BankOption | undefined {
  return NIGERIAN_BANKS.find((b) => b.label.toLowerCase() === label.toLowerCase());
}
