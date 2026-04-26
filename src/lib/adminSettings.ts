import { useEffect, useState } from "react";

export type AdminSettings = {
  qrPaymentEnabled: boolean;
  upiId: string;
  payeeName: string;
};

const KEY = "prime-smm-admin-settings";
const DEFAULTS: AdminSettings = {
  qrPaymentEnabled: true,
  upiId: "yourname@upi",
  payeeName: "PRIME SMM",
};

export const getSettings = (): AdminSettings => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
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
