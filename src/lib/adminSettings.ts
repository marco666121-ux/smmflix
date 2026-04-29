import { useEffect, useState } from "react";

export type RedeemCode = {
  code: string;
  percent: number; // 0-100 discount %
};

export type TierMode = "manual" | "step" | "count";

export type AdminSettings = {
  qrPaymentEnabled: boolean;
  upiId: string;
  payeeName: string;
  supportWhatsapp: string; // E.164 digits, no plus, e.g. "918848490476"
  banner: {
    enabled: boolean;
    text: string;
    link: string; // optional URL
  };
  priceMarkupPercent: number; // e.g. 20 = +20%
  hiddenCategoryIds: string[]; // category ids from useApiServices
  hiddenServiceIds: string[]; // service ids
  featuredServiceIds: string[]; // up to 6 ids, displayed in order
  formatterTiers: number[]; // resolved tiers used by service formatter
  tierMode: TierMode; // how formatterTiers is generated
  tierMin: number; // for "step" / "count" modes
  tierMax: number; // for "step" / "count" modes
  tierStep: number; // for "step" mode
  tierCount: number; // for "count" mode
  redeemCodes: RedeemCode[]; // discount codes
};

const KEY = "smmflix-admin-settings-v2";

export const DEFAULT_FORMATTER_TIERS = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 5000, 10000,
];

const DEFAULTS: AdminSettings = {
  qrPaymentEnabled: true,
  upiId: "yourname@upi",
  payeeName: "SMMFLIX",
  supportWhatsapp: "918848490476",
  banner: {
    enabled: false,
    text: "",
    link: "",
  },
  priceMarkupPercent: 0,
  hiddenCategoryIds: [],
  hiddenServiceIds: [],
  featuredServiceIds: [],
  formatterTiers: DEFAULT_FORMATTER_TIERS,
  tierMode: "manual",
  tierMin: 100,
  tierMax: 10000,
  tierStep: 100,
  tierCount: 10,
  redeemCodes: [],
};

export const FEATURED_MAX = 6;

const sanitizeCodes = (raw: any): RedeemCode[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => ({
      code: String(c?.code ?? "").trim().toUpperCase(),
      percent: Math.max(0, Math.min(100, Number(c?.percent) || 0)),
    }))
    .filter((c) => c.code.length > 0);
};

const merge = (raw: any): AdminSettings => ({
  ...DEFAULTS,
  ...raw,
  banner: { ...DEFAULTS.banner, ...(raw?.banner ?? {}) },
  hiddenCategoryIds: Array.isArray(raw?.hiddenCategoryIds) ? raw.hiddenCategoryIds : [],
  hiddenServiceIds: Array.isArray(raw?.hiddenServiceIds) ? raw.hiddenServiceIds : [],
  featuredServiceIds: Array.isArray(raw?.featuredServiceIds) ? raw.featuredServiceIds : [],
  formatterTiers:
    Array.isArray(raw?.formatterTiers) && raw.formatterTiers.length
      ? raw.formatterTiers.filter((n: any) => Number.isFinite(n) && n > 0)
      : DEFAULT_FORMATTER_TIERS,
  tierMode: (["manual", "step", "count"].includes(raw?.tierMode) ? raw.tierMode : "manual") as TierMode,
  tierMin: Number.isFinite(raw?.tierMin) ? Number(raw.tierMin) : DEFAULTS.tierMin,
  tierMax: Number.isFinite(raw?.tierMax) ? Number(raw.tierMax) : DEFAULTS.tierMax,
  tierStep: Number.isFinite(raw?.tierStep) && raw.tierStep > 0 ? Number(raw.tierStep) : DEFAULTS.tierStep,
  tierCount: Number.isFinite(raw?.tierCount) && raw.tierCount > 1 ? Number(raw.tierCount) : DEFAULTS.tierCount,
  redeemCodes: sanitizeCodes(raw?.redeemCodes),
});

export const getSettings = (): AdminSettings => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const old = localStorage.getItem("prime-smm-admin-settings");
      if (old) return merge(JSON.parse(old));
      return DEFAULTS;
    }
    return merge(JSON.parse(raw));
  } catch {
    return DEFAULTS;
  }
};

export const saveSettings = (s: AdminSettings) => {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("admin-settings-change"));
};

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings>(getSettings);
  useEffect(() => {
    const handler = () => setSettings(getSettings());
    window.addEventListener("admin-settings-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("admin-settings-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return settings;
};

export const ADMIN_PASSWORD = "admin@123";

// Apply markup to a base rate
export const applyMarkup = (rate: number, markupPercent: number): number => {
  if (!markupPercent) return rate;
  return rate * (1 + markupPercent / 100);
};

// Compute the resolved tier list from current settings
export const resolveTiers = (s: AdminSettings): number[] => {
  if (s.tierMode === "manual") {
    return Array.isArray(s.formatterTiers) && s.formatterTiers.length
      ? [...s.formatterTiers].sort((a, b) => a - b)
      : DEFAULT_FORMATTER_TIERS;
  }
  const min = Math.max(1, Math.floor(s.tierMin));
  const max = Math.max(min, Math.floor(s.tierMax));
  if (s.tierMode === "step") {
    const step = Math.max(1, Math.floor(s.tierStep));
    const out: number[] = [];
    for (let v = min; v <= max && out.length < 200; v += step) out.push(v);
    if (out[out.length - 1] !== max) out.push(max);
    return out;
  }
  // count
  const count = Math.max(2, Math.min(100, Math.floor(s.tierCount)));
  if (count === 1) return [min];
  const step = (max - min) / (count - 1);
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(Math.round(min + step * i));
  return Array.from(new Set(out));
};

// Lookup discount % for a code (case-insensitive); 0 if not found.
export const findRedeemPercent = (codes: RedeemCode[], input: string): number => {
  const k = input.trim().toUpperCase();
  if (!k) return 0;
  const hit = codes.find((c) => c.code === k);
  return hit ? hit.percent : 0;
};
