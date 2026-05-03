import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UPSTREAM = "https://www.prime-spot.store/api/status";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.orderId ?? body?.order ?? "").trim();
    if (!orderId) {
      return json({ error: "Order ID required" }, 400);
    }

    // Get markup % from site_settings
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: settings } = await supabase
      .from("site_settings")
      .select("price_markup_percent")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const markup = Number(settings?.price_markup_percent) || 0;

    // Forward to upstream
    const upstreamRes = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: orderId }),
    });
    const data = await upstreamRes.json().catch(() => ({}));

    // Apply markup to charge fields
    const out: Record<string, unknown> = { ...data };
    const applyTo = (key: string) => {
      const raw = out[key];
      if (raw == null) return;
      const num = Number(String(raw).replace(/[^\d.\-]/g, ""));
      if (!Number.isFinite(num)) return;
      const adjusted = num * (1 + markup / 100);
      out[key] = adjusted.toFixed(2);
    };
    applyTo("charge");
    applyTo("price");
    out.markup_percent = markup;

    return json(out, upstreamRes.status);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return json({ error: msg }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
