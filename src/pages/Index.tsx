import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApiServices } from "@/hooks/useApiServices";
import Guidelines from "@/components/Guidelines";
import { PaymentModal } from "@/components/PaymentModal";
import { applyMarkup, findRedeemPercent } from "@/lib/adminSettings";
import wordmark from "@/assets/smmflix-wordmark.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "@/hooks/use-toast";
import { Zap, ShieldCheck, Rocket, Search, ChevronsUpDown, Check, Bell, Sparkles, Star, Megaphone, TrendingDown, TrendingUp, ArrowUp, ArrowDown, Clock, History, Link2, Sun, Moon, LineChart, RefreshCw, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RedeemPopover } from "@/components/RedeemPopover";
import { ContactDropdown } from "@/components/ContactDropdown";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTheme } from "@/hooks/useTheme";
import { UIEditorOverlay } from "@/components/UIEditorOverlay";
import { ADMIN_PASSWORD } from "@/lib/adminSettings";

const Index = () => {
  const [categoryId, setCategoryId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [showCheapest, setShowCheapest] = useState<boolean>(false);
  const [appliedRedeem, setAppliedRedeem] = useState<{ code: string; percent: number } | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const siteSettings = useSiteSettings();
  const { theme, toggleTheme } = useTheme();
  const { categories: rawCategories, loading, error, updates, clearUpdates } = useApiServices();
  const [notifOpen, setNotifOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  // Apply persisted UI theme overrides (primary color)
  useEffect(() => {
    const root = document.documentElement;
    if (siteSettings.ui_theme?.primary_hsl) {
      root.style.setProperty("--primary", siteSettings.ui_theme.primary_hsl);
    } else {
      root.style.removeProperty("--primary");
    }
  }, [siteSettings.ui_theme?.primary_hsl]);

  const t = siteSettings.ui_text || {};
  const txt = (k: string, def: string) => (t[k]?.trim() ? t[k] : def);

  const openEditor = () => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("smmflix.admin") === "1") {
      setEditorOpen(true);
      return;
    }
    const pw = window.prompt("Admin password");
    if (pw == null) return;
    if (pw === ADMIN_PASSWORD) {
      try { localStorage.setItem("smmflix.admin", "1"); } catch {}
      setEditorOpen(true);
    } else {
      toast({ title: "Wrong password" });
    }
  };

  const markup = siteSettings.price_markup_percent;
  const supportWa = `https://wa.me/${siteSettings.support_whatsapp || "918848490476"}`;

  // Apply markup + hide filters to the source-of-truth list
  const categories = useMemo(() => {
    const hiddenCats = new Set(siteSettings.hidden_category_ids);
    const hiddenSvcs = new Set(siteSettings.hidden_service_ids);
    return rawCategories
      .filter((c) => !hiddenCats.has(c.id))
      .map((c) => ({
        ...c,
        services: c.services
          .filter((s) => !hiddenSvcs.has(s.id))
          .map((s) => ({ ...s, rate: applyMarkup(s.rate, markup) }))
          .sort((a, b) => a.rate - b.rate),
      }))
      .filter((c) => c.services.length > 0);
  }, [rawCategories, siteSettings.hidden_category_ids, siteSettings.hidden_service_ids, markup]);

  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );
  const service = useMemo(
    () => category?.services.find((s) => s.id === serviceId),
    [category, serviceId]
  );

  // Global search across all (post-filter, post-markup) services
  const allServices = useMemo(
    () =>
      categories.flatMap((c) =>
        c.services.map((s) => ({ ...s, _categoryId: c.id, _categoryName: c.name }))
      ),
    [categories]
  );

  // Featured items (preserve admin order, filter out hidden / missing)
  const featuredItems = useMemo(() => {
    return siteSettings.featured_service_ids
      .map((id) => allServices.find((s) => s.id === id))
      .filter(Boolean) as typeof allServices;
  }, [siteSettings.featured_service_ids, allServices]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const filtered = allServices.filter((s) => {
      if (q === "cheap" || q === "premium") return true;
      return (
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s._categoryName.toLowerCase().includes(q) ||
        String(s.rate).includes(q)
      );
    });
    if (q.includes("premium")) filtered.sort((a, b) => b.rate - a.rate);
    else filtered.sort((a, b) => a.rate - b.rate);
    return filtered.slice(0, 50);
  }, [search, allServices]);

  // Top 30 cheapest services across the whole site
  const cheapestList = useMemo(
    () => [...allServices].filter((s) => s.rate > 0).sort((a, b) => a.rate - b.rate).slice(0, 30),
    [allServices]
  );

  const qty = Number(quantity) || 0;
  const subtotal = service ? (qty / 1000) * service.rate : 0;
  const discount = appliedRedeem ? subtotal * (appliedRedeem.percent / 100) : 0;
  const total = Math.max(0, subtotal - discount);

  // Pick up deep-link preselect (set by /service/:id)
  useEffect(() => {
    const pre = sessionStorage.getItem("smmflix.preselectServiceId");
    if (!pre || allServices.length === 0) return;
    const found = allServices.find((s) => s.id === pre);
    if (found) {
      setCategoryId(found._categoryId);
      setServiceId(found.id);
      sessionStorage.removeItem("smmflix.preselectServiceId");
      setTimeout(() => {
        document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [allServices]);

  const clearRedeem = () => setAppliedRedeem(null);

  const copyServiceLink = async (id: string) => {
    const url = `${window.location.origin}/service/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: url });
    } catch {
      toast({ title: "Copy failed", description: url });
    }
  };

  const sendWhatsappOrder = (utr?: string) => {
    if (!service) return;
    const lines = [
      `New order request ✋🏻:`,
      ``,
      `🔹 Service ID: ${service.id}`,
      `🔹 Service: ${service.name}`,
      `🔹 Category: ${category?.name ?? ""}`,
      `🔹 Quantity: ${qty}`,
      `🔹 Link: ${link}`,
      `🔹 Subtotal: ₹ ${subtotal.toFixed(2)}`,
    ];
    if (appliedRedeem) {
      lines.push(`🔹 Code: ${appliedRedeem.code} (-${appliedRedeem.percent}%)`);
      lines.push(`🔹 Discount: -₹ ${discount.toFixed(2)}`);
    }
    lines.push(`🔹 Total: ₹ ${total.toFixed(2)}`);
    if (utr) lines.push(`🔹 UTR: ${utr}`, `🔹 Status: PAID ✅`);
    const message = encodeURIComponent(lines.join("\n"));
    window.open(`${supportWa}?text=${message}`, "_blank");
  };

  const validateOrder = () => {
    if (!service) {
      toast({ title: "Select a service first" });
      return false;
    }
    if (qty < service.min || qty > service.max) {
      toast({
        title: "Quantity out of range",
        description: `Min ${service.min} · Max ${service.max}`,
      });
      return false;
    }
    if (!/^https?:\/\//.test(link)) {
      toast({ title: "Enter a valid link" });
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOrder()) return;
    if (siteSettings.qr_payment_enabled) {
      setPaymentOpen(true);
    } else {
      sendWhatsappOrder();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Netflix-style header */}
      <header className="border-b border-border/40 backdrop-blur-xl sticky top-0 z-40 bg-background/80">
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center">
            <div className="leading-none">
              <img
                src={wordmark}
                alt="SMMFLIX"
                className={cn("h-9 sm:h-11 object-contain", theme === "dark" && "drop-shadow-[0_0_18px_hsl(var(--primary)/0.45)]")}
              />
              <div className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase mt-1">
                Premium Services. Premium Results.
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {updates.length > 0 && !siteSettings.ui_visibility?.notification_bell && (
            <Popover
              open={notifOpen}
              onOpenChange={(o) => setNotifOpen(o)}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Service Updates"
                  className="relative h-10 w-10 grid place-items-center rounded-full border border-border bg-muted/40 text-foreground hover:bg-muted hover:border-foreground/40 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-black shadow-[0_0_10px_hsl(var(--primary)/0.7)]">
                    {updates.length > 99 ? "99+" : updates.length}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[min(94vw,380px)] p-0 bg-popover border-border rounded-2xl overflow-hidden shadow-2xl"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">Service Updates</span>
                  </div>
                  {updates.length > 0 && (
                    <button
                      type="button"
                      onClick={clearUpdates}
                      className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="max-h-[60vh] overflow-y-auto overscroll-contain divide-y divide-border [-webkit-overflow-scrolling:touch]">
                  {updates.map((u) => {
                      const date = new Date(u.detectedAt);
                      const dateLabel = date.toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      });
                      const isNew = u.kind === "new";
                      const isUp = u.kind === "increase";
                      const arrowColor = isNew
                        ? "bg-blue-500/15 text-blue-400 border-blue-500/40"
                        : isUp
                        ? "bg-rose-500/15 text-rose-400 border-rose-500/40"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/40";
                      const priceColor = isNew
                        ? "text-blue-400"
                        : isUp
                        ? "text-rose-400"
                        : "text-emerald-400";
                      const idColor = isNew
                        ? "text-blue-400"
                        : isUp
                        ? "text-rose-400"
                        : "text-emerald-400";
                      const displayNew = applyMarkup(u.newRate, markup);
                      const displayOld = u.oldRate != null ? applyMarkup(u.oldRate, markup) : null;
                      return (
                        <div key={`${u.id}-${u.detectedAt}`} className="px-3 py-3">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                            <Clock className="h-3 w-3" />
                            <span>{dateLabel}</span>
                          </div>
                          <div className="flex gap-3">
                            <div className={cn("h-9 w-9 shrink-0 grid place-items-center rounded-full border", arrowColor)}>
                              {isNew ? (
                                <Sparkles className="h-4 w-4" />
                              ) : isUp ? (
                                <ArrowUp className="h-4 w-4" strokeWidth={3} />
                              ) : (
                                <ArrowDown className="h-4 w-4" strokeWidth={3} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={cn("text-sm font-black mb-0.5", idColor)}>#{u.id}</div>
                              <div className="text-[13px] font-semibold leading-snug text-foreground break-words">
                                {u.name}
                              </div>
                              <div className={cn("mt-1.5 text-[13px] font-bold flex items-center gap-1.5 flex-wrap", priceColor)}>
                                {isNew ? (
                                  <>
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span>₹{displayNew.toFixed(4)}</span>
                                  </>
                                ) : (
                                  <>
                                    {isUp ? (
                                      <ArrowUp className="h-3.5 w-3.5" strokeWidth={3} />
                                    ) : (
                                      <ArrowDown className="h-3.5 w-3.5" strokeWidth={3} />
                                    )}
                                    <span>₹{(displayOld ?? 0).toFixed(4)}</span>
                                    <span className="opacity-70">→</span>
                                    <span>₹{displayNew.toFixed(4)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="px-4 py-2 text-[10px] text-center text-muted-foreground uppercase tracking-widest border-t border-border bg-card/40">
                  Updates are kept for 24 hours
                </div>
              </PopoverContent>
            </Popover>
            )}
            {!siteSettings.ui_visibility?.redeem_button && (
              <RedeemPopover
                applied={appliedRedeem}
                onApply={(a) => setAppliedRedeem(a)}
                onClear={clearRedeem}
              />
            )}
            {!siteSettings.ui_visibility?.contact_button && (
              <ContactDropdown
                label={siteSettings.contact_label}
                color={siteSettings.contact_button_color}
                links={siteSettings.contact_links}
                fallbackUrl={supportWa}
              />
            )}
          </div>
        </div>
      </header>

      {/* Banner */}
      {siteSettings.banner_enabled && siteSettings.banner_text.trim() && (
        <div className="border-b border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15">
          <div className="container py-2.5 flex items-center gap-2 justify-center text-center">
            <Megaphone className="h-4 w-4 text-primary shrink-0" />
            {siteSettings.banner_link ? (
              <a
                href={siteSettings.banner_link}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold text-foreground hover:text-primary underline-offset-4 hover:underline break-words"
              >
                {siteSettings.banner_text}
              </a>
            ) : (
              <span className="text-sm font-bold text-foreground break-words">
                {siteSettings.banner_text}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Netflix-style hero */}
      {!siteSettings.minimal_mode && !siteSettings.ui_visibility?.hero && (
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="container relative pt-16 pb-12 text-center flex flex-col items-center">
          <img
            src={wordmark}
            alt="SMMFLIX"
            className={cn("h-20 sm:h-32 object-contain mb-4", theme === "dark" && "drop-shadow-[0_0_40px_hsl(var(--primary)/0.6)]")}
          />
          <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg uppercase tracking-[0.15em] font-medium">
            Premium Services · Premium Results
          </p>
        </div>
      </section>
      )}

      {/* Featured row */}
      {!siteSettings.minimal_mode && !siteSettings.ui_visibility?.featured_section && featuredItems.length > 0 && (
        <section className="container pb-10">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-primary fill-primary" />
            <h2 className="display text-2xl font-black tracking-wider">FEATURED</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {featuredItems.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setCategoryId(s._categoryId);
                  setServiceId(s.id);
                  setSearch("");
                  document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="card-surface border border-border/60 rounded-sm p-4 text-left hover:border-primary/60 transition-all hover:scale-[1.02] group"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">#{s.id}</span>
                  <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                </div>
                <div className="text-sm font-semibold leading-snug mb-2 line-clamp-2">{s.name}</div>
                <div className="text-lg font-black text-foreground">
                  ₹ {s.rate.toFixed(2)}
                  <span className="text-[10px] text-muted-foreground font-normal ml-1">/ 1000</span>
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 line-clamp-1">
                  {s._categoryName}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Order form */}
      <section id="order-form" className="container pb-16 scroll-mt-24">
        <form
          onSubmit={handleSubmit}
          className="card-surface border border-border/60 rounded-md p-6 sm:p-8 max-w-2xl mx-auto space-y-5 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-10 bg-primary rounded-full" />
            <h2 className="display text-3xl font-black tracking-wide">NEW ORDER</h2>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="ml-auto h-9 w-9 grid place-items-center rounded-full border border-border bg-card hover:border-primary hover:text-primary transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>


          {/* Search + Cheapest */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Search Services</Label>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                {loading ? "Syncing…" : error ? <span className="text-destructive">Offline</span> : `${categories.reduce((n, c) => n + c.services.length, 0)} services live`}
              </span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (e.target.value) setShowCheapest(false);
                  }}
                  placeholder="Search by name, ID, category…"
                  className="pl-9 bg-input border-border focus-visible:ring-primary rounded-sm"
                />
              </div>
              <Button
                type="button"
                onClick={() => {
                  setShowCheapest((v) => !v);
                  setSearch("");
                }}
                variant={showCheapest ? "default" : "outline"}
                className={cn(
                  "shrink-0 font-black uppercase tracking-widest text-xs rounded-sm gap-1.5",
                  showCheapest && "shadow-[0_0_18px_hsl(var(--primary)/0.5)]"
                )}
              >
                <TrendingDown className="h-4 w-4" />
                Cheapest
              </Button>
            </div>
            {(search || showCheapest) && (
              <div className="rounded-sm border border-border divide-y divide-border max-h-80 overflow-y-auto overscroll-contain bg-card [-webkit-overflow-scrolling:touch] scroll-smooth">
                {(() => {
                  const list = showCheapest ? cheapestList : searchResults;
                  if (list.length === 0) {
                    return <div className="p-4 text-sm text-muted-foreground">No services found.</div>;
                  }
                  return list.map((s) => (
                    <div
                      key={`${s._categoryId}-${s.id}`}
                      className="w-full p-3 hover:bg-primary/10 transition-colors flex items-start gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryId(s._categoryId);
                          setServiceId(s.id);
                          setSearch("");
                          setShowCheapest(false);
                        }}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-black text-primary">#{s.id}</span>
                          <span className="text-sm font-black text-foreground">₹ {s.rate.toFixed(2)}</span>
                        </div>
                        <div className="text-sm font-semibold leading-snug mb-1 break-words">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wider break-words">{s._categoryName}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => copyServiceLink(s.id)}
                        aria-label="Copy share link"
                        title="Copy share link"
                        className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                      >
                        <Link2 className="h-4 w-4" />
                      </button>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Category</Label>
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  className="w-full flex items-start justify-between gap-2 bg-input border border-border rounded-sm px-3 py-2 min-h-10 text-sm hover:border-primary/60 transition-colors"
                >
                  <span className={cn("text-left leading-snug", !category && "text-muted-foreground")}>
                    {category ? category.name : loading ? "Loading categories…" : "Select category"}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0 mt-0.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[min(92vw,520px)] p-0 bg-popover border-border"
                align="start"
                sideOffset={6}
              >
                <Command shouldFilter={false}>
                  <CommandList className="max-h-[60vh] overscroll-contain">
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup>
                      {categories.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.name}
                          onSelect={() => {
                            setCategoryId(c.id);
                            setServiceId("");
                            setCategoryOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              categoryId === c.id ? "opacity-100 text-primary" : "opacity-0"
                            )}
                          />
                          <span className="leading-snug whitespace-normal break-words">{c.name}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-wider">
                            {c.services.length}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {category && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Service</Label>
              <div className="rounded-sm border border-border divide-y divide-border overflow-y-auto overscroll-contain bg-card max-h-[60vh] [-webkit-overflow-scrolling:touch] scroll-smooth">
                {category.services.map((s) => {
                  const selected = s.id === serviceId;
                  return (
                    <div
                      key={s.id}
                      className={`relative w-full transition-colors border-l-2 ${
                        selected
                          ? "bg-primary/15 border-l-primary"
                          : "border-l-transparent hover:bg-muted/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setServiceId(s.id)}
                        className="w-full text-left p-3 pr-10"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2 mb-0.5">
                              <span className="text-[10px] font-black text-primary shrink-0 mt-0.5">#{s.id}</span>
                              <span className="text-sm font-semibold leading-snug break-words">{s.name}</span>
                            </div>
                            {selected && (
                              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground uppercase tracking-wider mt-1">
                                <span>MIN <span className="text-foreground font-bold">{s.min}</span></span>
                                <span>MAX <span className="text-foreground font-bold">{s.max}</span></span>
                              </div>
                            )}
                          </div>
                          <div className="text-sm font-black text-foreground shrink-0">
                            ₹ {s.rate.toFixed(2)}
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); copyServiceLink(s.id); }}
                        aria-label="Copy share link to this service"
                        title="Copy share link"
                        className="absolute top-3 right-3 p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Link2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected service info card (reference layout) */}
          {service && (
            <div className="rounded-md border border-border bg-card overflow-hidden">
              <div className="flex items-start justify-between gap-3 p-4 border-b border-border/60">
                <h3 className="text-base sm:text-lg font-black leading-snug break-words flex-1">
                  {service.name}
                </h3>
                <span className="shrink-0 text-[10px] font-black tracking-widest uppercase border border-primary/40 bg-primary/10 text-primary rounded-sm px-2 py-1">
                  ID {service.id}
                </span>
              </div>
              {service.description && service.description.trim() && (
                <pre className="px-4 py-3 text-[12px] text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed border-b border-border/60 break-words">
                  {service.description.trim()}
                </pre>
              )}
              <div className="grid grid-cols-2 gap-2 p-3">
                <div className="rounded-sm border border-border bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span className="text-muted-foreground">↓ MIN</span>
                  <span className="text-foreground font-black">{service.min}</span>
                </div>
                <div className="rounded-sm border border-border bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span className="text-muted-foreground">↑ MAX</span>
                  <span className="text-foreground font-black">{service.max}</span>
                </div>
              </div>
            </div>
          )}

          {(() => {
            const v = siteSettings.ui_visibility || {};
            const minimalGate = siteSettings.minimal_mode && !service;
            const showQty = !minimalGate && !(v.progressive_quantity && !service);
            const showLink = !minimalGate && !(v.progressive_link && !service);
            const showTotal = !minimalGate && !(v.progressive_total && !service);
            const showContinue = !minimalGate && !(v.progressive_continue && !service);
            return (
              <>
                {showQty && (
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Quantity</Label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder={service ? `min ${service.min}, max ${service.max}` : "Select a service first"}
                      className="bg-input border-border focus-visible:ring-primary rounded-sm"
                    />
                  </div>
                )}

                {showLink && (
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">🔗 Profile / Post Link</Label>
                    <Input
                      type="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="Enter your profile or post link"
                      className="bg-input border-border focus-visible:ring-primary rounded-sm"
                    />
                  </div>
                )}

                {showTotal && (
                  <div className="rounded-sm border border-primary/40 bg-primary/10 px-4 py-3 space-y-1.5">
                    {appliedRedeem && (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="uppercase tracking-widest text-muted-foreground font-bold">Subtotal</span>
                          <span className="font-bold text-foreground">₹ {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="uppercase tracking-widest text-muted-foreground font-bold">Discount</span>
                          <span className="font-bold text-primary">−₹ {discount.toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-border/60 my-1" />
                      </>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Total</span>
                      <span className="text-3xl font-black text-primary display">
                        ₹{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {showContinue && (
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-black tracking-widest uppercase bg-primary text-primary-foreground hover:bg-primary/90 transition-all rounded-sm shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
                  >
                    Continue to Payment
                  </Button>
                )}
              </>
            );
          })()}
        </form>
      </section>

      {!siteSettings.minimal_mode && !siteSettings.ui_visibility?.guidelines && <Guidelines />}

      {/* Features — Netflix card style */}
      {!siteSettings.minimal_mode && !siteSettings.ui_visibility?.feature_cards && (
      <section className="container pb-20 grid sm:grid-cols-3 gap-4">
        {[
          { icon: Rocket, title: "FAST DELIVERY", desc: "Orders start within minutes." },
          { icon: ShieldCheck, title: "SAFE & PRIVATE", desc: "No password ever required." },
          { icon: Zap, title: "BEST PRICES", desc: "Wholesale rates for everyone." },
        ].map((f) => (
          <div
            key={f.title}
            className="card-surface border border-border/60 rounded-sm p-6 hover:border-primary/60 transition-all hover:scale-[1.02] group"
          >
            <div className="h-10 w-10 rounded-sm bg-primary/15 grid place-items-center mb-4 group-hover:bg-primary/30 transition-colors">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="display font-black text-lg tracking-wider mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>
      )}

      {!siteSettings.ui_visibility?.footer && (
      <footer className="border-t border-border/40 py-6 pb-28 text-center text-xs text-muted-foreground uppercase tracking-widest">
        © {new Date().getFullYear()} <span className="text-primary font-black">SMMFLIX</span> · Premium Services. Premium Results. <Link to="/admin" className="ml-2 hover:text-primary">Admin</Link>
      </footer>
      )}

      {service && (
        <PaymentModal
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          amount={total}
          upiId={siteSettings.upi_id}
          payeeName={siteSettings.payee_name}
          onConfirm={(utr) => {
            setPaymentOpen(false);
            sendWhatsappOrder(utr);
          }}
        />
      )}

      {/* Floating Refill + Status bar */}
      {(!siteSettings.ui_visibility?.refill_button || !siteSettings.ui_visibility?.status_button) && (
      <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="container max-w-md flex items-center gap-3 pointer-events-auto">
          {!siteSettings.ui_visibility?.refill_button && (
          <Link
            to="/refill"
            className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full border border-primary/60 bg-background/80 backdrop-blur-md text-primary font-black tracking-wider uppercase text-sm shadow-[0_0_24px_hsl(var(--primary)/0.35)] hover:bg-primary/10 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refill
          </Link>
          )}
          {!siteSettings.ui_visibility?.status_button && (
          <Link
            to="/status"
            className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full border border-primary/60 bg-background/80 backdrop-blur-md text-primary font-black tracking-wider uppercase text-sm shadow-[0_0_24px_hsl(var(--primary)/0.35)] hover:bg-primary/10 transition-colors"
          >
            <LineChart className="h-4 w-4" />
            Status
          </Link>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default Index;
