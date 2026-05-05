import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RedeemCode = { code: string; percent: number };
export type TierMode = "manual" | "step" | "count";
export type ContactLink = { name: string; url: string };
export type ContactColor = "emerald" | "red" | "blue" | "purple" | "amber" | "slate";

export type SiteSettings = {
  id: string;
  qr_payment_enabled: boolean;
  upi_id: string;
  payee_name: string;
  support_whatsapp: string;
  // global admin settings (shared across all devices)
  price_markup_percent: number;
  banner_enabled: boolean;
  banner_text: string;
  banner_link: string;
  hidden_category_ids: string[];
  hidden_service_ids: string[];
  featured_service_ids: string[];
  formatter_tiers: number[];
  tier_mode: TierMode;
  tier_min: number;
  tier_max: number;
  tier_step: number;
  tier_count: number;
  redeem_codes: RedeemCode[];
  contact_label: string;
  contact_button_color: ContactColor;
  contact_links: ContactLink[];
  minimal_mode: boolean;
  ui_visibility: Record<string, boolean>; // key -> hidden(true)/visible(false|undef)
};

export const DEFAULT_FORMATTER_TIERS = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 5000, 10000,
];

const DEFAULT: SiteSettings = {
  id: "",
  qr_payment_enabled: true,
  upi_id: "yourname@upi",
  payee_name: "SMMFLIX",
  support_whatsapp: "918848490476",
  price_markup_percent: 0,
  banner_enabled: false,
  banner_text: "",
  banner_link: "",
  hidden_category_ids: [],
  hidden_service_ids: [],
  featured_service_ids: [],
  formatter_tiers: DEFAULT_FORMATTER_TIERS,
  tier_mode: "manual",
  tier_min: 100,
  tier_max: 10000,
  tier_step: 100,
  tier_count: 10,
  redeem_codes: [],
  contact_label: "Contact",
  contact_button_color: "emerald",
  contact_links: [{ name: "WhatsApp Chat", url: "https://wa.me/918848490476" }],
  minimal_mode: false,
  ui_visibility: {},
};

const asArr = <T,>(v: any, fallback: T[]): T[] =>
  Array.isArray(v) ? (v as T[]) : fallback;

const normalize = (raw: any): SiteSettings => ({
  ...DEFAULT,
  ...raw,
  hidden_category_ids: asArr<string>(raw?.hidden_category_ids, []),
  hidden_service_ids: asArr<string>(raw?.hidden_service_ids, []),
  featured_service_ids: asArr<string>(raw?.featured_service_ids, []),
  formatter_tiers:
    Array.isArray(raw?.formatter_tiers) && raw.formatter_tiers.length
      ? raw.formatter_tiers.filter((n: any) => Number.isFinite(Number(n)) && Number(n) > 0).map(Number)
      : DEFAULT_FORMATTER_TIERS,
  redeem_codes: asArr<any>(raw?.redeem_codes, [])
    .map((c) => ({
      code: String(c?.code ?? "").trim().toUpperCase(),
      percent: Math.max(0, Math.min(100, Number(c?.percent) || 0)),
    }))
    .filter((c) => c.code.length > 0),
  tier_mode: (["manual", "step", "count"].includes(raw?.tier_mode) ? raw.tier_mode : "manual") as TierMode,
  price_markup_percent: Number(raw?.price_markup_percent) || 0,
  contact_label: typeof raw?.contact_label === "string" && raw.contact_label.trim() ? raw.contact_label : "Contact",
  contact_button_color: (["emerald", "red", "blue", "purple", "amber", "slate"].includes(raw?.contact_button_color)
    ? raw.contact_button_color
    : "emerald") as ContactColor,
  contact_links: asArr<any>(raw?.contact_links, [])
    .map((c) => ({
      name: String(c?.name ?? "").trim(),
      url: String(c?.url ?? "").trim(),
    }))
    .filter((c) => c.name && c.url),
  minimal_mode: !!raw?.minimal_mode,
  ui_visibility: (raw?.ui_visibility && typeof raw.ui_visibility === "object" && !Array.isArray(raw.ui_visibility))
    ? (raw.ui_visibility as Record<string, boolean>)
    : {},
});

let cache: SiteSettings | null = null;
const subs = new Set<(s: SiteSettings) => void>();

const fetchOnce = async () => {
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) {
    cache = normalize(data);
    subs.forEach((cb) => cb(cache!));
  }
};

let realtimeStarted = false;
const startRealtime = () => {
  if (realtimeStarted) return;
  realtimeStarted = true;
  supabase
    .channel("site_settings_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site_settings" },
      () => {
        fetchOnce();
      }
    )
    .subscribe();
};

export const useSiteSettings = (): SiteSettings => {
  const [s, setS] = useState<SiteSettings>(cache ?? DEFAULT);
  useEffect(() => {
    subs.add(setS);
    if (!cache) fetchOnce();
    else setS(cache);
    startRealtime();
    return () => {
      subs.delete(setS);
    };
  }, []);
  return s;
};

export const updateSiteSettings = async (patch: Partial<SiteSettings>) => {
  if (!cache?.id) {
    await fetchOnce();
  }
  if (!cache?.id) return { error: "No site settings row" };
  // Optimistic local update so UI reflects instantly even before realtime arrives
  cache = normalize({ ...cache, ...patch });
  subs.forEach((cb) => cb(cache!));
  const { data, error } = await supabase
    .from("site_settings")
    .update(patch as any)
    .eq("id", cache.id)
    .select()
    .single();
  if (!error && data) {
    cache = normalize(data);
    subs.forEach((cb) => cb(cache!));
  }
  return { error: error?.message };
};

// Helpers reused across the app
export const applyMarkup = (rate: number, markupPercent: number): number => {
  if (!markupPercent) return rate;
  return rate * (1 + markupPercent / 100);
};

export const findRedeemPercent = (codes: RedeemCode[], input: string): number => {
  const k = input.trim().toUpperCase();
  if (!k) return 0;
  const hit = codes.find((c) => c.code === k);
  return hit ? hit.percent : 0;
};

export const resolveTiers = (s: SiteSettings): number[] => {
  if (s.tier_mode === "manual") {
    return Array.isArray(s.formatter_tiers) && s.formatter_tiers.length
      ? [...s.formatter_tiers].sort((a, b) => a - b)
      : DEFAULT_FORMATTER_TIERS;
  }
  const min = Math.max(1, Math.floor(s.tier_min));
  const max = Math.max(min, Math.floor(s.tier_max));
  if (s.tier_mode === "step") {
    const step = Math.max(1, Math.floor(s.tier_step));
    const out: number[] = [];
    for (let v = min; v <= max && out.length < 200; v += step) out.push(v);
    if (out[out.length - 1] !== max) out.push(max);
    return out;
  }
  const count = Math.max(2, Math.min(100, Math.floor(s.tier_count)));
  if (count === 1) return [min];
  const step = (max - min) / (count - 1);
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(Math.round(min + step * i));
  return Array.from(new Set(out));
};

export const FEATURED_MAX = 6;
