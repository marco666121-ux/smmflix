import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Loader2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import wordmark from "@/assets/smmflix-wordmark.png";

type StatusResponse = Record<string, any> & {
  error?: string;
  charge?: string;
  status?: string;
  start_count?: string | number;
  remains?: string | number;
  quantity?: string | number;
  currency?: string;
  markup_percent?: number;
};

const FIELDS: { key: string; label: string }[] = [
  { key: "status", label: "Status" },
  { key: "charge", label: "Charge" },
  { key: "start_count", label: "Start Count" },
  { key: "remains", label: "Remains" },
  { key: "quantity", label: "Quantity" },
  { key: "currency", label: "Currency" },
];

const Status = () => {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StatusResponse | null>(null);

  const check = async (id?: string) => {
    const oid = (id ?? orderId).trim();
    if (!oid) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("order-status", {
        body: { orderId: oid },
      });
      if (error) {
        setResult({ error: error.message ?? "Request failed" });
      } else {
        setResult(data as StatusResponse);
      }
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  // Live re-fetch every 15s while a valid result is shown
  // (lightweight polling; users see updated status without refresh)
  // Using setInterval inside an effect tied to orderId/result
  // Implemented inline for simplicity:
  if (typeof window !== "undefined") {
    (window as any).__orderStatusPoll && clearInterval((window as any).__orderStatusPoll);
    if (result && !result.error && orderId.trim()) {
      (window as any).__orderStatusPoll = setInterval(() => {
        check(orderId);
      }, 15000);
    }
  }

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
            <Package className="h-6 w-6 text-primary" />
          </div>
          <h1 className="display text-2xl font-black tracking-wider text-primary">
            ORDER STATUS
          </h1>
          <p className="text-xs text-muted-foreground">
            Enter your order ID to check live status.
          </p>
        </div>

        <div className="card-surface border border-border/60 rounded-sm p-5 space-y-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.replace(/[^\d]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") check();
              }}
              placeholder="Enter Order ID"
              inputMode="numeric"
              className="pl-9 bg-input border-border focus-visible:ring-primary rounded-sm h-11"
            />
          </div>
          <Button
            onClick={() => check()}
            disabled={loading || !orderId.trim()}
            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest rounded-sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Checking…
              </>
            ) : (
              "Check Status"
            )}
          </Button>
        </div>

        {result && (
          <div className="card-surface border border-border/60 rounded-sm p-5 space-y-3">
            {result.error ? (
              <div className="text-sm text-destructive font-bold text-center py-4">
                {result.error}
              </div>
            ) : (
              <>
                <div className="text-[10px] uppercase tracking-widest font-black text-primary">
                  Order #{orderId}
                </div>
                <div className="divide-y divide-border border border-border rounded-sm bg-card">
                  {FIELDS.map((f) => {
                    const val = (result as any)[f.key];
                    if (val == null || val === "") return null;
                    const display =
                      f.key === "charge" ? `₹ ${val}` : String(val);
                    return (
                      <div
                        key={f.key}
                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                      >
                        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                          {f.label}
                        </span>
                        <span
                          className={`text-sm font-black ${
                            f.key === "charge"
                              ? "text-primary"
                              : "text-foreground"
                          }`}
                        >
                          {display}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">
                  Auto-refreshing every 15s · live
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Status;
