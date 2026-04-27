import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  ADMIN_PASSWORD,
  FEATURED_MAX,
  applyMarkup,
  getSettings,
  saveSettings,
  type AdminSettings,
} from "@/lib/adminSettings";
import { useApiServices } from "@/hooks/useApiServices";
import wordmark from "@/assets/smmflix-wordmark.png";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Search,
  Megaphone,
  Percent,
  CreditCard,
  BarChart3,
  FileText,
  Copy,
  Check,
} from "lucide-react";

const Admin = () => {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>(getSettings);
  const { categories, newServices } = useApiServices();
  const [visSearch, setVisSearch] = useState("");
  const [featSearch, setFeatSearch] = useState("");
  const [fmtSearch, setFmtSearch] = useState("");
  const [fmtSelectedId, setFmtSelectedId] = useState<string | null>(null);
  const [fmtCopied, setFmtCopied] = useState(false);

  const allServices = useMemo(
    () =>
      categories.flatMap((c) =>
        c.services.map((s) => ({ ...s, _categoryId: c.id, _categoryName: c.name }))
      ),
    [categories]
  );

  const biggest = useMemo(() => {
    let best: { name: string; count: number } | null = null;
    for (const c of categories) {
      if (!best || c.services.length > best.count) {
        best = { name: c.name, count: c.services.length };
      }
    }
    return best;
  }, [categories]);

  const visMatches = useMemo(() => {
    const q = visSearch.trim().toLowerCase();
    if (!q) return [];
    return allServices
      .filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s._categoryName.toLowerCase().includes(q)
      )
      .slice(0, 25);
  }, [visSearch, allServices]);

  const featMatches = useMemo(() => {
    const q = featSearch.trim().toLowerCase();
    if (!q) return [];
    return allServices
      .filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s._categoryName.toLowerCase().includes(q)
      )
      .slice(0, 25);
  }, [featSearch, allServices]);

  const fmtMatches = useMemo(() => {
    const q = fmtSearch.trim().toLowerCase();
    if (!q) return [];
    return allServices
      .filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s._categoryName.toLowerCase().includes(q)
      )
      .slice(0, 25);
  }, [fmtSearch, allServices]);

  const fmtSelected = useMemo(
    () => (fmtSelectedId ? allServices.find((s) => s.id === fmtSelectedId) ?? null : null),
    [fmtSelectedId, allServices]
  );

  const fmtText = useMemo(() => {
    if (!fmtSelected) return "";
    const TIERS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 5000, 10000];
    const rate = applyMarkup(fmtSelected.rate, settings.priceMarkupPercent);
    // API rate is per 1000 units.
    const lines: string[] = [];
    lines.push(`SERVICE ID : ${fmtSelected.id}`);
    lines.push("");
    lines.push(fmtSelected.name);
    if (fmtSelected.description && fmtSelected.description.trim()) {
      lines.push("");
      lines.push(fmtSelected.description.trim());
    }
    lines.push("");
    const unit = guessUnit(fmtSelected.name);
    for (const qty of TIERS) {
      if (qty < fmtSelected.min || qty > fmtSelected.max) continue;
      const price = (rate * qty) / 1000;
      lines.push(`${qty} ${unit} - ₹ ${price.toFixed(2)}`);
    }
    return lines.join("\n");
  }, [fmtSelected, settings.priceMarkupPercent]);

  const copyFmt = async () => {
    try {
      await navigator.clipboard.writeText(fmtText);
      setFmtCopied(true);
      setTimeout(() => setFmtCopied(false), 1500);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Copy failed" });
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-4">
        <div className="card-surface border border-border/60 rounded-sm p-8 max-w-sm w-full space-y-5">
          <div className="flex flex-col items-center gap-2">
            <img src={wordmark} alt="SMMFLIX" className="h-12 object-contain drop-shadow-[0_0_18px_hsl(var(--primary)/0.45)]" />
            <div className="display text-sm font-black tracking-[0.3em] text-primary">ADMIN PANEL</div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (password === ADMIN_PASSWORD) {
                setAuthed(true);
              } else {
                toast({ title: "Wrong password" });
              }
            }}
            className="space-y-3"
          >
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
              Password
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="bg-input border-border focus-visible:ring-primary rounded-sm"
            />
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest rounded-sm"
            >
              Unlock
            </Button>
          </form>

          <Link to="/" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to site
          </Link>
        </div>
      </div>
    );
  }

  const update = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  };

  const updateBanner = (patch: Partial<AdminSettings["banner"]>) => {
    update("banner", { ...settings.banner, ...patch });
  };

  // Stats
  const totalCategories = categories.length;
  const totalServices = allServices.length;
  const hiddenCount =
    settings.hiddenCategoryIds.length + settings.hiddenServiceIds.length;
  const todayMs = Date.now() - 24 * 60 * 60 * 1000;
  const newToday = newServices.filter((n) => n.detectedAt >= todayMs).length;

  const toggleCategory = (id: string) => {
    const set = new Set(settings.hiddenCategoryIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    update("hiddenCategoryIds", Array.from(set));
  };

  const toggleService = (id: string) => {
    const set = new Set(settings.hiddenServiceIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    update("hiddenServiceIds", Array.from(set));
  };

  const toggleFeatured = (id: string) => {
    const list = settings.featuredServiceIds.slice();
    const idx = list.indexOf(id);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      if (list.length >= FEATURED_MAX) {
        toast({
          title: `Featured limit reached`,
          description: `You can feature up to ${FEATURED_MAX} services.`,
        });
        return;
      }
      list.push(id);
    }
    update("featuredServiceIds", list);
  };

  const featuredItems = settings.featuredServiceIds
    .map((id) => allServices.find((s) => s.id === id))
    .filter(Boolean) as typeof allServices;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img src={wordmark} alt="SMMFLIX" className="h-8 object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.45)]" />
            <div className="display text-sm font-black tracking-[0.3em] text-primary">
              ADMIN
            </div>
          </div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="container py-10 max-w-3xl space-y-6">
        {/* Stats */}
        <section className="card-surface border border-border/60 rounded-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="display text-xl font-black tracking-wider text-primary">STATS</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Categories" value={totalCategories} />
            <Stat label="Services" value={totalServices} />
            <Stat label="New (24h)" value={newToday} />
            <Stat label="Hidden" value={hiddenCount} />
          </div>
          {biggest && (
            <div className="mt-4 text-xs text-muted-foreground">
              Biggest category:{" "}
              <span className="text-foreground font-bold">{biggest.name}</span> · {biggest.count} services
            </div>
          )}
        </section>

        {/* Payment & Contact */}
        <section className="card-surface border border-border/60 rounded-sm p-6 space-y-5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="display text-xl font-black tracking-wider text-primary">PAYMENT & CONTACT</h2>
          </div>

          <div className="flex items-center justify-between border border-border bg-muted/30 p-4 rounded-sm">
            <div>
              <div className="font-bold text-foreground">QR Payment Flow</div>
              <div className="text-xs text-muted-foreground">
                {settings.qrPaymentEnabled
                  ? "ON — Customers pay via UPI QR, then submit UTR."
                  : "OFF — Customers go directly to WhatsApp with order details."}
              </div>
            </div>
            <Switch
              checked={settings.qrPaymentEnabled}
              onCheckedChange={(v) => update("qrPaymentEnabled", v)}
            />
          </div>

          <Field label="UPI ID">
            <Input
              value={settings.upiId}
              onChange={(e) => update("upiId", e.target.value)}
              placeholder="yourname@okaxis"
              className="bg-input border-border focus-visible:ring-primary rounded-sm"
            />
          </Field>

          <Field label="Payee Name">
            <Input
              value={settings.payeeName}
              onChange={(e) => update("payeeName", e.target.value)}
              placeholder="SMMFLIX"
              className="bg-input border-border focus-visible:ring-primary rounded-sm"
            />
          </Field>

          <Field label="Support WhatsApp Number">
            <Input
              value={settings.supportWhatsapp}
              onChange={(e) =>
                update("supportWhatsapp", e.target.value.replace(/[^\d]/g, ""))
              }
              placeholder="918848490476"
              inputMode="numeric"
              className="bg-input border-border focus-visible:ring-primary rounded-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Country code + number, no + or spaces. Example: 918848490476
            </p>
          </Field>
        </section>

        {/* Banner */}
        <section className="card-surface border border-border/60 rounded-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <h2 className="display text-xl font-black tracking-wider text-primary">HOMEPAGE BANNER</h2>
          </div>

          <div className="flex items-center justify-between border border-border bg-muted/30 p-4 rounded-sm">
            <div>
              <div className="font-bold text-foreground">Banner</div>
              <div className="text-xs text-muted-foreground">
                {settings.banner.enabled ? "ON — Showing on homepage." : "OFF — Hidden."}
              </div>
            </div>
            <Switch
              checked={settings.banner.enabled}
              onCheckedChange={(v) => updateBanner({ enabled: v })}
            />
          </div>

          <Field label="Banner Text">
            <Textarea
              value={settings.banner.text}
              onChange={(e) => updateBanner({ text: e.target.value })}
              placeholder="🎉 Holiday sale — 20% off all services this weekend!"
              rows={2}
              className="bg-input border-border focus-visible:ring-primary rounded-sm"
            />
          </Field>

          <Field label="Optional Link (https://...)">
            <Input
              value={settings.banner.link}
              onChange={(e) => updateBanner({ link: e.target.value })}
              placeholder="https://t.me/yourchannel"
              className="bg-input border-border focus-visible:ring-primary rounded-sm"
            />
          </Field>
        </section>

        {/* Pricing markup */}
        <section className="card-surface border border-border/60 rounded-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            <h2 className="display text-xl font-black tracking-wider text-primary">PRICING MARKUP</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Global markup added on top of every API rate shown to customers. Set 0 to disable.
          </p>
          <Field label={`Markup % (currently ${settings.priceMarkupPercent}%)`}>
            <Input
              type="number"
              min={0}
              max={500}
              step={1}
              value={settings.priceMarkupPercent}
              onChange={(e) =>
                update("priceMarkupPercent", Math.max(0, Number(e.target.value) || 0))
              }
              className="bg-input border-border focus-visible:ring-primary rounded-sm"
            />
          </Field>
          <div className="text-xs text-muted-foreground border border-border bg-muted/30 p-3 rounded-sm">
            Example: API rate ₹10 → customer sees{" "}
            <span className="text-primary font-bold">
              ₹{applyMarkup(10, settings.priceMarkupPercent).toFixed(2)}
            </span>
          </div>
        </section>

        {/* Visibility */}
        <section className="card-surface border border-border/60 rounded-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-primary" />
            <h2 className="display text-xl font-black tracking-wider text-primary">VISIBILITY</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Hide entire categories or specific services from the storefront. Hidden items disappear from search and lists.
          </p>

          {/* Categories toggle list */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
              Categories ({categories.length})
            </Label>
            <div className="mt-2 max-h-72 overflow-y-auto overscroll-contain border border-border rounded-sm divide-y divide-border bg-card">
              {categories.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">Loading…</div>
              )}
              {categories.map((c) => {
                const hidden = settings.hiddenCategoryIds.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleCategory(c.id)}
                    className={`w-full flex items-center justify-between gap-3 p-3 text-left transition-colors ${
                      hidden ? "bg-destructive/10" : "hover:bg-primary/5"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold leading-snug break-words">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                        {c.services.length} services
                      </div>
                    </div>
                    {hidden ? (
                      <EyeOff className="h-4 w-4 text-destructive shrink-0" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service search & toggle */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
              Hide individual services
            </Label>
            <div className="relative mt-2">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={visSearch}
                onChange={(e) => setVisSearch(e.target.value)}
                placeholder="Search by ID, name, or category"
                className="pl-9 bg-input border-border focus-visible:ring-primary rounded-sm"
              />
            </div>
            {visSearch && (
              <div className="mt-2 max-h-72 overflow-y-auto overscroll-contain border border-border rounded-sm divide-y divide-border bg-card">
                {visMatches.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground">No matches.</div>
                )}
                {visMatches.map((s) => {
                  const hidden = settings.hiddenServiceIds.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleService(s.id)}
                      className={`w-full flex items-center justify-between gap-3 p-3 text-left transition-colors ${
                        hidden ? "bg-destructive/10" : "hover:bg-primary/5"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] font-black text-primary uppercase tracking-widest">#{s.id}</div>
                        <div className="text-sm font-semibold leading-snug break-words">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground break-words">{s._categoryName}</div>
                      </div>
                      {hidden ? (
                        <EyeOff className="h-4 w-4 text-destructive shrink-0" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {settings.hiddenServiceIds.length > 0 && (
              <div className="mt-2 text-[11px] text-muted-foreground">
                {settings.hiddenServiceIds.length} service(s) hidden.{" "}
                <button
                  type="button"
                  onClick={() => update("hiddenServiceIds", [])}
                  className="text-primary hover:underline font-bold"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Featured */}
        <section className="card-surface border border-border/60 rounded-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="display text-xl font-black tracking-wider text-primary">FEATURED SERVICES</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Pick up to {FEATURED_MAX} services to highlight at the top of the homepage.
            ({settings.featuredServiceIds.length}/{FEATURED_MAX})
          </p>

          {featuredItems.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                Currently featured
              </Label>
              <div className="border border-border rounded-sm divide-y divide-border bg-card">
                {featuredItems.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black text-primary uppercase tracking-widest">#{s.id}</div>
                      <div className="text-sm font-semibold leading-snug break-words">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground break-words">{s._categoryName}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFeatured(s.id)}
                      className="p-2 rounded hover:bg-destructive/10 text-primary hover:text-destructive transition-colors shrink-0"
                      aria-label="Remove from featured"
                    >
                      <StarOff className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
              Add featured
            </Label>
            <div className="relative mt-2">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={featSearch}
                onChange={(e) => setFeatSearch(e.target.value)}
                placeholder="Search by ID, name, or category"
                className="pl-9 bg-input border-border focus-visible:ring-primary rounded-sm"
              />
            </div>
            {featSearch && (
              <div className="mt-2 max-h-72 overflow-y-auto overscroll-contain border border-border rounded-sm divide-y divide-border bg-card">
                {featMatches.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground">No matches.</div>
                )}
                {featMatches.map((s) => {
                  const isFeatured = settings.featuredServiceIds.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleFeatured(s.id)}
                      className={`w-full flex items-center justify-between gap-3 p-3 text-left transition-colors ${
                        isFeatured ? "bg-primary/10" : "hover:bg-primary/5"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] font-black text-primary uppercase tracking-widest">#{s.id}</div>
                        <div className="text-sm font-semibold leading-snug break-words">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground break-words">{s._categoryName}</div>
                      </div>
                      {isFeatured ? (
                        <Star className="h-4 w-4 text-primary fill-primary shrink-0" />
                      ) : (
                        <StarOff className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <p className="text-xs text-primary text-center">✓ All changes save automatically.</p>
      </main>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
      {label}
    </Label>
    {children}
  </div>
);

const Stat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="border border-border bg-muted/30 rounded-sm p-3 text-center">
    <div className="text-2xl font-black text-primary display">{value}</div>
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">{label}</div>
  </div>
);

export default Admin;
