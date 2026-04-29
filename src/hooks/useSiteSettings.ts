import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  id: string;
  qr_payment_enabled: boolean;
  upi_id: string;
  payee_name: string;
  support_whatsapp: string;
};

const DEFAULT: SiteSettings = {
  id: "",
  qr_payment_enabled: true,
  upi_id: "yourname@upi",
  payee_name: "SMMFLIX",
  support_whatsapp: "918848490476",
};

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
    cache = data as SiteSettings;
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
  const { data, error } = await supabase
    .from("site_settings")
    .update(patch)
    .eq("id", cache.id)
    .select()
    .single();
  if (!error && data) {
    cache = data as SiteSettings;
    subs.forEach((cb) => cb(cache!));
  }
  return { error: error?.message };
};
