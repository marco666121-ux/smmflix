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
  DEFAULT_FORMATTER_TIERS,
  FEATURED_MAX,
  applyMarkup,
  resolveTiers,
  type RedeemCode,
  type TierMode,
} from "@/lib/adminSettings";
import { useApiServices } from "@/hooks/useApiServices";
import wordmark from "@/assets/smmflix-wordmark.png";
import { useSiteSettings, updateSiteSettings, type SiteSettings } from "@/hooks/useSiteSettings";
import { UsersAndBans } from "@/components/UsersAndBans";
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
  TrendingDown,
  Tag,
  Trash2,
  Plus,
} from "lucide-react";

const Admin = () => {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const settings = useSiteSettings();
  const siteSettings = settings; // alias for existing JSX
  const { categories, newServices } = useApiServices();
  const [visSearch, setVisSearch] = useState("");
  const [featSearch, setFeatSearch] = useState("");
  const [fmtSearch, setFmtSearch] = useState("");
  const [fmtSelectedId, setFmtSelectedId] = useState<string | null>(null);
  const [fmtCopied, setFmtCopied] = useState(false);
  const [tiersInput, setTiersInput] = useState("");
  const [tiersInited, setTiersInited] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newCodePct, setNewCodePct] = useState<string>("10");

  // Initialize the editable tiers input from the live settings once.
  if (!tiersInited && settings.formatter_tiers && settings.formatter_tiers.length) {
    setTiersInput(settings.formatter_tiers.join(", "));
    setTiersInited(true);
  }

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

  // Top cheapest services (by raw provider rate, ascending)
  const cheapestServices = useMemo(() => {
    return [...allServices]
      .filter((s) => Number.isFinite(s.rate) && s.rate > 0)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 15);
  }, [allServices]);

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

  // Tiers actually used by formatter (depends on tierMode)
  const resolvedTiers = useMemo(() => resolveTiers(settings), [settings]);

  const fmtText = useMemo(() => {
    if (!fmtSelected) return "";
    const TIERS = resolvedTiers;
    const rate = applyMarkup(fmtSelected.rate, settings.price_markup_percent);
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
  }, [fmtSelected, settings.price_markup_percent, resolvedTiers]);

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

  const update = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    updateSiteSettings({ [key]: value } as Partial<SiteSettings>);
  };

  const updateBanner = (patch: { enabled?: boolean; text?: string; link?: string }) => {
    const p: Partial<SiteSettings> = {};
    if (patch.enabled !== undefined) p.banner_enabled = patch.enabled;
    if (patch.text !== undefined) p.banner_text = patch.text;
    if (patch.link !== undefined) p.banner_link = patch.link;
    updateSiteSettings(p);
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

        {/* Cheapest Services */}
        <section className="card-surface border border-border/60 rounded-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            <h2 className="display text-xl font-black tracking-wider text-primary">CHEAPEST SERVICES</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Top 15 lowest-priced services. <span className="text-foreground font-bold">Your rate</span> includes the {settings.priceMarkupPercent}% markup; <span className="text-foreground font-bold">Provider</span> is the raw API cost.
          </p>
          <div className="border border-border rounded-sm divide-y divide-border bg-card max-h-96 overflow-y-auto overscroll-contain">
            {cheapestServices.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            )}
            {cheapestServices.map((s, i) => {
              const yourRate = applyMarkup(s.rate, settings.priceMarkupPercent);
              const margin = yourRate - s.rate;
              return (
                <div key={s.id} className="p-3 flex items-start gap-3">
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest w-6 shrink-0 pt-0.5">
                    #{i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest">#{s.id}</div>
                    <div className="text-sm font-semibold leading-snug break-words">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground break-words mb-1.5">{s._categoryName}</div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="border border-border bg-muted/30 rounded-sm px-2 py-1">
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Provider</div>
                        <div className="text-foreground font-black">₹ {s.rate.toFixed(2)}</div>
                      </div>
                      <div className="border border-primary/40 bg-primary/10 rounded-sm px-2 py-1">
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Your Rate</div>
                        <div className="text-primary font-black">₹ {yourRate.toFixed(2)}</div>
                      </div>
                      <div className="border border-border bg-muted/30 rounded-sm px-2 py-1">
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Margin</div>
                        <div className="text-foreground font-black">₹ {margin.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
                {siteSettings.qr_payment_enabled
                  ? "ON — Customers pay via UPI QR, then submit UTR."
                  : "OFF — Customers go directly to WhatsApp with order details."}
              </div>
              <div className="text-[10px] text-primary mt-1 uppercase tracking-widest font-bold">
                Synced live to all visitors
              </div>
            </div>
            <Switch
              checked={siteSettings.qr_payment_enabled}
              onCheckedChange={async (v) => {
                const { error } = await updateSiteSettings({ qr_payment_enabled: v });
                if (error) toast({ title: "Update failed", description: error });
              }}
            />
          </div>

          <Field label="UPI ID">
            <Input
              value={siteSettings.upi_id}
              onChange={(e) => updateSiteSettings({ upi_id: e.target.value })}
              placeholder="yourname@okaxis"
              className="bg-input border-border focus-visible:ring-primary rounded-sm"
            />
          </Field>

          <Field label="Payee Name">
            <Input
              value={siteSettings.payee_name}
              onChange={(e) => updateSiteSettings({ payee_name: e.target.value })}
              placeholder="SMMFLIX"
              className="bg-input border-border focus-visible:ring-primary rounded-sm"
            />
          </Field>

          <Field label="Support WhatsApp Number">
            <Input
              value={siteSettings.support_whatsapp}
              onChange={(e) =>
                updateSiteSettings({ support_whatsapp: e.target.value.replace(/[^\d]/g, "") })
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

        {/* Users & Bans */}
        <UsersAndBans />

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

        {/* Redeem Codes */}
        <section className="card-surface border border-border/60 rounded-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <h2 className="display text-xl font-black tracking-wider text-primary">REDEEM CODES</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Create discount codes that customers can apply at checkout. Codes are case-insensitive.
          </p>

          <div className="grid grid-cols-[1fr_110px_auto] gap-2 items-end">
            <Field label="Code">
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="WELCOME10"
                className="bg-input border-border focus-visible:ring-primary rounded-sm uppercase tracking-wider"
              />
            </Field>
            <Field label="% off">
              <Input
                type="number"
                min={1}
                max={100}
                value={newCodePct}
                onChange={(e) => setNewCodePct(e.target.value)}
                className="bg-input border-border focus-visible:ring-primary rounded-sm"
              />
            </Field>
            <Button
              type="button"
              onClick={() => {
                const code = newCode.trim().toUpperCase();
                const pct = Math.max(1, Math.min(100, Number(newCodePct) || 0));
                if (!code) {
                  toast({ title: "Enter a code" });
                  return;
                }
                if (!pct) {
                  toast({ title: "Enter a discount %" });
                  return;
                }
                if (settings.redeemCodes.some((c) => c.code === code)) {
                  toast({ title: "Code exists", description: "That code is already in the list." });
                  return;
                }
                update("redeemCodes", [...settings.redeemCodes, { code, percent: pct }]);
                setNewCode("");
                setNewCodePct("10");
                toast({ title: "Code added", description: `${code} — ${pct}% off` });
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest text-xs rounded-sm h-10 gap-1"
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>

          {settings.redeemCodes.length === 0 ? (
            <div className="text-xs text-muted-foreground border border-dashed border-border rounded-sm p-3 text-center">
              No codes yet.
            </div>
          ) : (
            <div className="border border-border rounded-sm divide-y divide-border bg-card">
              {settings.redeemCodes.map((c) => (
                <div key={c.code} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-black text-primary tracking-wider">{c.code}</div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{c.percent}% off</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      update(
                        "redeemCodes",
                        settings.redeemCodes.filter((x) => x.code !== c.code)
                      );
                    }}
                    className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    aria-label="Delete code"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Service Formatter */}
        <section className="card-surface border border-border/60 rounded-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="display text-xl font-black tracking-wider text-primary">SERVICE FORMATTER</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Search a service, click it, and get a ready-to-share message with tiered pricing using your current markup.
          </p>

          <Field label="Tier mode">
            <div className="grid grid-cols-3 gap-2">
              {(["manual", "step", "count"] as TierMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => update("tierMode", m)}
                  className={`text-[11px] font-black uppercase tracking-widest rounded-sm py-2 border transition-colors ${
                    settings.tierMode === m
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "manual" ? "Manual list" : m === "step" ? "Min·Max·Step" : "Min·Max·Count"}
                </button>
              ))}
            </div>
          </Field>

          {settings.tierMode === "manual" && (
            <Field label="Quantity tiers (comma-separated)">
              <Input
                value={tiersInput}
                onChange={(e) => {
                  setTiersInput(e.target.value);
                  const parsed = e.target.value
                    .split(/[,\s]+/)
                    .map((t) => Number(t.trim()))
                    .filter((n) => Number.isFinite(n) && n > 0);
                  if (parsed.length) update("formatterTiers", parsed);
                }}
                placeholder="100, 200, 500, 1000, 5000"
                className="bg-input border-border focus-visible:ring-primary rounded-sm"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Tiers outside a service's min/max are skipped automatically.</span>
                <button
                  type="button"
                  onClick={() => {
                    setTiersInput(DEFAULT_FORMATTER_TIERS.join(", "));
                    update("formatterTiers", DEFAULT_FORMATTER_TIERS);
                  }}
                  className="text-primary hover:underline font-bold uppercase tracking-wider"
                >
                  Reset
                </button>
              </div>
            </Field>
          )}

          {settings.tierMode === "step" && (
            <div className="grid grid-cols-3 gap-2">
              <Field label="Min">
                <Input
                  type="number"
                  value={settings.tierMin}
                  onChange={(e) => update("tierMin", Math.max(1, Number(e.target.value) || 1))}
                  className="bg-input border-border focus-visible:ring-primary rounded-sm"
                />
              </Field>
              <Field label="Max">
                <Input
                  type="number"
                  value={settings.tierMax}
                  onChange={(e) => update("tierMax", Math.max(1, Number(e.target.value) || 1))}
                  className="bg-input border-border focus-visible:ring-primary rounded-sm"
                />
              </Field>
              <Field label="Step">
                <Input
                  type="number"
                  value={settings.tierStep}
                  onChange={(e) => update("tierStep", Math.max(1, Number(e.target.value) || 1))}
                  className="bg-input border-border focus-visible:ring-primary rounded-sm"
                />
              </Field>
            </div>
          )}

          {settings.tierMode === "count" && (
            <div className="grid grid-cols-3 gap-2">
              <Field label="Min">
                <Input
                  type="number"
                  value={settings.tierMin}
                  onChange={(e) => update("tierMin", Math.max(1, Number(e.target.value) || 1))}
                  className="bg-input border-border focus-visible:ring-primary rounded-sm"
                />
              </Field>
              <Field label="Max">
                <Input
                  type="number"
                  value={settings.tierMax}
                  onChange={(e) => update("tierMax", Math.max(1, Number(e.target.value) || 1))}
                  className="bg-input border-border focus-visible:ring-primary rounded-sm"
                />
              </Field>
              <Field label="Count">
                <Input
                  type="number"
                  value={settings.tierCount}
                  onChange={(e) => update("tierCount", Math.max(2, Math.min(100, Number(e.target.value) || 2)))}
                  className="bg-input border-border focus-visible:ring-primary rounded-sm"
                />
              </Field>
            </div>
          )}

          <div className="text-[11px] text-muted-foreground border border-border bg-muted/30 p-2 rounded-sm break-words">
            <span className="font-bold uppercase tracking-widest text-foreground">Resolved tiers ({resolvedTiers.length}):</span>{" "}
            {resolvedTiers.slice(0, 30).join(", ")}{resolvedTiers.length > 30 ? "…" : ""}
          </div>


          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={fmtSearch}
              onChange={(e) => setFmtSearch(e.target.value)}
              placeholder="Search by ID, name, or category"
              className="pl-9 bg-input border-border focus-visible:ring-primary rounded-sm"
            />
          </div>

          {fmtSearch && (
            <div className="max-h-72 overflow-y-auto overscroll-contain border border-border rounded-sm divide-y divide-border bg-card">
              {fmtMatches.length === 0 && (
                <div className="p-3 text-sm text-muted-foreground">No matches.</div>
              )}
              {fmtMatches.map((s) => {
                const active = fmtSelectedId === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setFmtSelectedId(s.id)}
                    className={`w-full flex items-center justify-between gap-3 p-3 text-left transition-colors ${
                      active ? "bg-primary/10" : "hover:bg-primary/5"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-black text-primary uppercase tracking-widest">#{s.id}</div>
                      <div className="text-sm font-semibold leading-snug break-words">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground break-words">{s._categoryName}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {fmtSelected && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                  Formatted message
                </Label>
                <Button
                  type="button"
                  size="sm"
                  onClick={copyFmt}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-widest rounded-sm h-8 gap-1"
                >
                  {fmtCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {fmtCopied ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre className="bg-input border border-border rounded-sm p-4 text-sm whitespace-pre-wrap break-words font-mono leading-relaxed max-h-96 overflow-y-auto">
{fmtText}
              </pre>
            </div>
          )}
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

// Pick a sensible unit word from the service name (followers / likes / views ...).
function guessUnit(name: string): string {
  const n = name.toLowerCase();
  const map: Array<[RegExp, string]> = [
    [/follower/, "followers"],
    [/subscriber/, "subscribers"],
    [/member/, "members"],
    [/like/, "likes"],
    [/reaction/, "reactions"],
    [/comment/, "comments"],
    [/share/, "shares"],
    [/save/, "saves"],
    [/repost/, "reposts"],
    [/vote/, "votes"],
    [/review/, "reviews"],
    [/impression/, "impressions"],
    [/reach/, "reach"],
    [/view/, "views"],
  ];
  for (const [re, word] of map) if (re.test(n)) return word;
  return "units";
}

export default Admin;
