import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert } from "lucide-react";

const getClientIp = async (): Promise<string | null> => {
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const j = await r.json();
    return j.ip ?? null;
  } catch {
    return null;
  }
};

export const BanGate = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [banned, setBanned] = useState<{ reason?: string } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const ip = await getClientIp();
      const email = user?.email ?? null;
      const { data } = await supabase
        .from("bans")
        .select("ip,email,reason")
        .or(
          [
            ip ? `ip.eq.${ip}` : null,
            email ? `email.eq.${email}` : null,
          ]
            .filter(Boolean)
            .join(",") || "ip.is.null"
        );
      if (cancelled) return;
      const hit = (data ?? []).find(
        (b: any) => (ip && b.ip === ip) || (email && b.email === email)
      );
      setBanned(hit ? { reason: hit.reason } : null);
      setChecked(true);
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  if (!checked) return <>{children}</>;
  if (!banned) return <>{children}</>;

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="max-w-md w-full text-center border border-destructive/50 rounded-md bg-destructive/10 p-8 space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-destructive/20 grid place-items-center">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="display text-2xl font-black tracking-widest text-destructive">
          ACCESS BLOCKED
        </h1>
        <p className="text-sm text-muted-foreground">
          Your access to this site has been restricted by the administrator.
        </p>
        {banned.reason && (
          <p className="text-xs text-foreground border border-border bg-muted/30 rounded-sm px-3 py-2 break-words">
            Reason: {banned.reason}
          </p>
        )}
      </div>
    </div>
  );
};
