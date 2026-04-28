import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert } from "lucide-react";

type BanRow = { email: string | null; ip: string | null; reason: string | null };

let cachedIp: string | null = null;
const fetchIp = async (): Promise<string | null> => {
  if (cachedIp) return cachedIp;
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const j = await r.json();
    cachedIp = j.ip ?? null;
    return cachedIp;
  } catch {
    return null;
  }
};

export const BanGate = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState<BanRow | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const ip = await fetchIp();
      const { data } = await supabase.from("bans").select("email,ip,reason");
      if (!alive) return;
      const rows = (data ?? []) as BanRow[];
      const hit = rows.find(
        (b) =>
          (user?.email && b.email && b.email.toLowerCase() === user.email.toLowerCase()) ||
          (ip && b.ip && b.ip === ip)
      );
      setBlocked(hit ?? null);
      setChecked(true);
    })();
    return () => {
      alive = false;
    };
  }, [user?.email]);

  if (!checked) return <>{children}</>;
  if (!blocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background grid place-items-center p-6">
      <div className="card-surface border border-destructive/40 rounded-md p-8 max-w-md text-center">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="display text-3xl font-black tracking-wider mb-2">ACCESS BLOCKED</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Your access to this site has been restricted.
        </p>
        {blocked.reason && (
          <p className="text-xs text-muted-foreground italic">Reason: {blocked.reason}</p>
        )}
      </div>
    </div>
  );
};
