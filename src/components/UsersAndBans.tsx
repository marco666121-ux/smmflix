import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Users, Ban, Trash2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Profile = { id: string; email: string | null; display_name: string | null; last_ip: string | null; created_at: string };
type Usage = { id: string; email: string | null; code: string; percent: number | null; ip: string | null; used_at: string };
type BanRow = { id: string; email: string | null; ip: string | null; reason: string | null; created_at: string };

export const UsersAndBans = () => {
  const { user, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [usage, setUsage] = useState<Usage[]>([]);
  const [bans, setBans] = useState<BanRow[]>([]);
  const [banEmail, setBanEmail] = useState("");
  const [banIp, setBanIp] = useState("");
  const [banReason, setBanReason] = useState("");
  const [grantBusy, setGrantBusy] = useState(false);

  const refresh = async () => {
    const [p, u, b] = await Promise.all([
      supabase.from("profiles").select("id,email,display_name,last_ip,created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("redeem_usage").select("id,email,code,percent,ip,used_at").order("used_at", { ascending: false }).limit(200),
      supabase.from("bans").select("id,email,ip,reason,created_at").order("created_at", { ascending: false }),
    ]);
    setProfiles((p.data ?? []) as Profile[]);
    setUsage((u.data ?? []) as Usage[]);
    setBans((b.data ?? []) as BanRow[]);
  };

  useEffect(() => {
    refresh();
  }, [isAdmin]);

  const grantSelfAdmin = async () => {
    if (!user) {
      toast({ title: "Sign in first", description: "Use the Redeem button on the home page to sign in." });
      return;
    }
    setGrantBusy(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: "admin" as any });
    setGrantBusy(false);
    if (error && !String(error.message).includes("duplicate")) {
      toast({ title: "Failed", description: error.message });
      return;
    }
    toast({ title: "You are now an admin" });
    setTimeout(() => window.location.reload(), 600);
  };

  const addBan = async () => {
    if (!banEmail.trim() && !banIp.trim()) {
      toast({ title: "Enter an email or IP" });
      return;
    }
    const { error } = await supabase.from("bans").insert({
      email: banEmail.trim() || null,
      ip: banIp.trim() || null,
      reason: banReason.trim() || null,
    });
    if (error) {
      toast({ title: "Ban failed", description: error.message });
      return;
    }
    setBanEmail(""); setBanIp(""); setBanReason("");
    toast({ title: "Banned" });
    refresh();
  };

  const quickBan = async (email: string | null, ip: string | null) => {
    if (!email && !ip) return;
    await supabase.from("bans").insert({ email, ip, reason: "Quick-ban from admin" });
    toast({ title: `Banned ${email ?? ip}` });
    refresh();
  };

  const removeBan = async (id: string) => {
    await supabase.from("bans").delete().eq("id", id);
    refresh();
  };

  if (!user) {
    return (
      <section className="card-surface border border-border/60 rounded-md p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="display text-xl font-black tracking-wider text-primary">USERS & BANS</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Sign in with your account on the home page (top-right Redeem button → Sign in) to manage users, then come back and grant yourself admin.
        </p>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="card-surface border border-border/60 rounded-md p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="display text-xl font-black tracking-wider text-primary">USERS & BANS</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-bold text-foreground">{user.email}</span>. You don't have the admin role yet.
        </p>
        <Button onClick={grantSelfAdmin} disabled={grantBusy} className="font-black uppercase tracking-widest text-xs rounded-sm gap-2">
          <ShieldCheck className="h-4 w-4" /> Grant me admin
        </Button>
        <p className="text-[11px] text-muted-foreground">
          (One-time bootstrap — works for any signed-in user. Lock down later by removing other admins.)
        </p>
      </section>
    );
  }

  return (
    <section className="card-surface border border-border/60 rounded-md p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="display text-xl font-black tracking-wider text-primary">USERS & BANS</h2>
      </div>

      {/* Add ban */}
      <div className="space-y-2 border-l-2 border-destructive/40 pl-4">
        <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Add ban</div>
        <div className="grid sm:grid-cols-3 gap-2">
          <Input placeholder="Email" value={banEmail} onChange={(e) => setBanEmail(e.target.value)} />
          <Input placeholder="IP address" value={banIp} onChange={(e) => setBanIp(e.target.value)} />
          <Input placeholder="Reason (optional)" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
        </div>
        <Button onClick={addBan} variant="destructive" className="font-black uppercase tracking-widest text-xs rounded-sm gap-1.5">
          <Ban className="h-3.5 w-3.5" /> Ban
        </Button>
      </div>

      {/* Active bans */}
      <div>
        <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Active bans ({bans.length})</Label>
        <div className="mt-2 rounded-sm border border-border divide-y divide-border max-h-64 overflow-y-auto">
          {bans.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">No bans.</div>
          ) : (
            bans.map((b) => (
              <div key={b.id} className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate">{b.email ?? b.ip}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {b.email && b.ip ? `IP: ${b.ip} · ` : ""}
                    {b.reason ?? "—"}
                  </div>
                </div>
                <button onClick={() => removeBan(b.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Logged-in users */}
      <div>
        <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Logged-in users ({profiles.length})</Label>
        <div className="mt-2 rounded-sm border border-border divide-y divide-border max-h-72 overflow-y-auto">
          {profiles.map((p) => (
            <div key={p.id} className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold truncate">{p.email ?? "(no email)"}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  IP: {p.last_ip ?? "—"} · joined {new Date(p.created_at).toLocaleDateString()}
                </div>
              </div>
              <Button
                onClick={() => quickBan(p.email, p.last_ip)}
                variant="outline"
                size="sm"
                className="text-xs font-bold rounded-sm gap-1"
              >
                <Ban className="h-3 w-3" /> Ban
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Redeem usage */}
      <div>
        <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Redeem code usage ({usage.length})</Label>
        <div className="mt-2 rounded-sm border border-border divide-y divide-border max-h-72 overflow-y-auto">
          {usage.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">No redemptions yet.</div>
          ) : (
            usage.map((u) => (
              <div key={u.id} className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm">
                    <span className="font-black text-primary">{u.code}</span>
                    <span className="text-muted-foreground text-xs ml-2">−{u.percent ?? 0}%</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {u.email ?? "—"} · {new Date(u.used_at).toLocaleString()}
                  </div>
                </div>
                {u.email && (
                  <Button onClick={() => quickBan(u.email, null)} variant="outline" size="sm" className="text-xs font-bold rounded-sm gap-1">
                    <Ban className="h-3 w-3" /> Ban
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
