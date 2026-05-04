import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import wordmark from "@/assets/smmflix-wordmark.png";

type RefillResponse = Record<string, any> & { error?: string; refill?: string | number };

const Refill = () => {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RefillResponse | null>(null);

  const submit = async () => {
    const oid = orderId.trim();
    if (!oid) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("order-refill", {
        body: { orderId: oid },
      });
      if (error) setResult({ error: error.message ?? "Request failed" });
      else setResult(data as RefillResponse);
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <img
            src={wordmark}
            alt="SMMFLIX"
            className="h-8 object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.45)]"
          />
          <div className="w-12" />
        </div>
      </header>

      <main className="flex-1 container max-w-md py-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 border border-primary/30">
            <RefreshCw className="h-6 w-6 text-primary" />
          </div>
          <h1 className="display text-2xl font-black tracking-wider text-primary">REFILL ORDER</h1>
          <p className="text-xs text-muted-foreground">Enter your order ID to submit a refill request.</p>
        </div>

        <div className="card-surface border border-border/60 rounded-sm p-5 space-y-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.replace(/[^\d]/g, ""))}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="Enter Order ID"
              inputMode="numeric"
              className="pl-9 bg-input border-border focus-visible:ring-primary rounded-sm h-11"
            />
          </div>
          <Button
            onClick={submit}
            disabled={loading || !orderId.trim()}
            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest rounded-sm"
          >
            {loading ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting…</>) : "Submit Refill"}
          </Button>
        </div>

        {result && (
          <div className="card-surface border border-border/60 rounded-sm p-5 space-y-3">
            {(() => {
              const isError = !!result.error;
              const status = String(result.status ?? (isError ? "Failed" : "Success"));
              const message =
                result.error ??
                result.message ??
                (result.refill ? `Refill ID: ${result.refill}` : "Refill request submitted.");
              const ok = !isError && /success/i.test(status);
              return (
                <>
                  <div className="text-[10px] uppercase tracking-widest font-black text-primary">
                    Order #{orderId}
                  </div>
                  <div
                    className={`border rounded-sm bg-card px-4 py-4 text-center space-y-2 ${
                      ok ? "border-emerald-500/50" : "border-destructive/50"
                    }`}
                  >
                    <div
                      className={`text-[11px] uppercase tracking-widest font-black ${
                        ok ? "text-emerald-400" : "text-destructive"
                      }`}
                    >
                      {ok ? "Success" : "Failed"}
                    </div>
                    <div className="text-sm font-bold text-foreground">{message}</div>
                    {result.refill && (
                      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        Refill ID: <span className="text-primary font-black">{result.refill}</span>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
};

export default Refill;
