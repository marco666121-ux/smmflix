import { useEffect, useState } from "react";

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
};

const KEY = "smmflix-admin-settings-v2";

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
};

export const FEATURED_MAX = 6;

const merge = (raw: any): AdminSettings => ({
  ...DEFAULTS,
  ...raw,
  banner: { ...DEFAULTS.banner, ...(raw?.banner ?? {}) },
  hiddenCategoryIds: Array.isArray(raw?.hiddenCategoryIds) ? raw.hiddenCategoryIds : [],
  hiddenServiceIds: Array.isArray(raw?.hiddenServiceIds) ? raw.hiddenServiceIds : [],
  featuredServiceIds: Array.isArray(raw?.featuredServiceIds) ? raw.featuredServiceIds : [],
});

export const getSettings = (): AdminSettings => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      // One-time migration from old key
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

export const ADMIN_PASSWORD = "2689";

// Apply markup to a base rate
export const applyMarkup = (rate: number, markupPercent: number): number => {
  if (!markupPercent) return rate;
  return rate * (1 + markupPercent / 100);
};
