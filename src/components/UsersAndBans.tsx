import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Ban, ShieldX, Trash2, Users } from "lucide-react";

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  last_ip: string | null;
  last_seen_at: string;
};

type Usage = {
  id: string;
  email: string | null;
  code: string;
  percent: number | null;
  ip: string | null;
  used_at: string;
  user_id: string | null;
};

type BanRow = {
  id: string;
  email: string | null;
  ip: string | null;
  reason: string | null;
  created_at: string;
};

export const UsersAndBans = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [usage, setUsage] = useState<Usage[]>([]);
  const [bans, setBans] = useState<BanRow[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [reason, setReason] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualIp, setManualIp] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: p }, { data: u }, { data: b }] = await Promise.all([
      supabase.from("profiles").select("*").order("last_seen_at", { ascending: false }).limit(200),
      supabase.from("redeem_usage").select("*").order("used_at", { ascending: false }).limit(500),
      supabase.from("bans").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setProfiles((p as Profile[]) ?? []);
    setUsage((u as Usage[]) ?? []);
    setBans((b as BanRow[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const ban = async (email: string | null, ip: string | null, why: string) => {
    if (!email && !ip) {
      toast({ title: "Need an email or IP to ban" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("bans").insert({ email, ip, reason: why || null });
    setBusy(false);
    if (error) {
      toast({ title: "Ban failed", description: error.message });
      return;
    }
    toast({ title: "User banned" });
    setSelected(null);
    setReason("");
    setManualEmail("");
    setManualIp("");
    load();
  };

  const unban = async (id: string) => {
    setBusy(true);
    const { error } = await supabase.from("bans").delete().eq("id", id);
    setBusy(false);
    if (error) {
      toast({ title: "Unban failed", description: error.message });
      return;
    }
    toast({ title: "Ban removed" });
    load();
  };

  const usageFor = (email: string | null) =>
    email ? usage.filter((u) => u.email === email) : [];

  return (
    <section className="card-surface border border-border/60 rounded-sm p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="display text-xl font-black tracking-wider text-primary">USERS & BANS</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        See logged-in accounts, the redeem codes they used, and ban by email or IP.
      </p>

      {/* Users list */}
      <div>
        <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
          Logged-in users ({profiles.length})
        </Label>
        <div className="mt-2 max-h-72 overflow-y-auto overscroll-contain border border-border rounded-sm divide-y divide-border bg-card">
          {profiles.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">No users yet.</div>
          )}
          {profiles.map((p) => {
            const active = selected?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(active ? null : p)}
                className={`w-full text-left p-3 transition-colors ${
                  active ? "bg-primary/10" : "hover:bg-primary/5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-snug break-all">
                      {p.email ?? "(no email)"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      IP: <span className="text-foreground font-mono">{p.last_ip ?? "—"}</span> · Last seen{" "}
                      {new Date(p.last_seen_at).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold shrink-0">
                    {usageFor(p.email).length} codes
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail / ban panel */}
      {selected && (
        <div className="border border-primary/40 bg-primary/5 rounded-sm p-4 space-y-3">
          <div className="text-xs font-black uppercase tracking-widest text-primary">
            Detail · {selected.email}
          </div>
          <div className="text-[11px] text-muted-foreground">
            IP: <span className="text-foreground font-mono">{selected.last_ip ?? "—"}</span>
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
              Redeem history
            </div>
            <div className="border border-border rounded-sm divide-y divide-border bg-card max-h-40 overflow-y-auto">
              {usageFor(selected.email).length === 0 && (
                <div className="p-2 text-xs text-muted-foreground">No codes used.</div>
              )}
              {usageFor(selected.email).map((u) => (
                <div key={u.id} className="p-2 text-xs flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground">{u.code}</span>
                  <span className="text-muted-foreground">{u.percent ?? 0}% off</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(u.used_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="bg-input border-border focus-visible:ring-primary rounded-sm text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={() => ban(selected.email, null, reason)}
              variant="destructive"
              className="font-black uppercase tracking-widest text-xs rounded-sm gap-1"
            >
              <Ban className="h-3.5 w-3.5" /> Ban Email
            </Button>
            <Button
              type="button"
              disabled={busy || !selected.last_ip}
              onClick={() => ban(null, selected.last_ip, reason)}
              variant="destructive"
              className="font-black uppercase tracking-widest text-xs rounded-sm gap-1"
            >
              <Ban className="h-3.5 w-3.5" /> Ban IP
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => ban(selected.email, selected.last_ip, reason)}
              variant="destructive"
              className="font-black uppercase tracking-widest text-xs rounded-sm gap-1"
            >
              <ShieldX className="h-3.5 w-3.5" /> Ban Both
            </Button>
          </div>
        </div>
      )}

      {/* Manual ban */}
      <div className="border border-border rounded-sm p-4 space-y-2 bg-muted/20">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Manual ban
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          <Input
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            placeholder="email@example.com"
            className="bg-input border-border focus-visible:ring-primary rounded-sm text-sm"
          />
          <Input
            value={manualIp}
            onChange={(e) => setManualIp(e.target.value)}
            placeholder="123.45.67.89"
            className="bg-input border-border focus-visible:ring-primary rounded-sm text-sm"
          />
        </div>
        <Button
          type="button"
          disabled={busy}
          onClick={() => ban(manualEmail.trim() || null, manualIp.trim() || null, reason)}
          variant="destructive"
          className="font-black uppercase tracking-widest text-xs rounded-sm gap-1"
        >
          <Ban className="h-3.5 w-3.5" /> Add Ban
        </Button>
      </div>

      {/* Active bans */}
      <div>
        <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
          Active bans ({bans.length})
        </Label>
        <div className="mt-2 border border-border rounded-sm divide-y divide-border bg-card max-h-72 overflow-y-auto">
          {bans.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">No bans.</div>
          )}
          {bans.map((b) => (
            <div key={b.id} className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold break-all">
                  {b.email ?? "—"}{" "}
                  {b.ip && (
                    <span className="text-[11px] text-muted-foreground font-mono ml-1">
                      ({b.ip})
                    </span>
                  )}
                </div>
                {b.reason && (
                  <div className="text-[11px] text-muted-foreground break-words">
                    {b.reason}
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground">
                  {new Date(b.created_at).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => unban(b.id)}
                className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label="Remove ban"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
