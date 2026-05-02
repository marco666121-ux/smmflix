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
import { Zap, ShieldCheck, Rocket, Search, ChevronsUpDown, Check, Bell, Sparkles, Star, Megaphone, TrendingDown, TrendingUp, ArrowUp, ArrowDown, Clock, History, Link2, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RedeemPopover } from "@/components/RedeemPopover";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTheme } from "@/hooks/useTheme";

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
                className="h-9 sm:h-11 object-contain drop-shadow-[0_0_18px_hsl(var(--primary)/0.45)]"
              />
              <div className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase mt-1">
                Premium Services. Premium Results.
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Popover
              open={notifOpen}
              onOpenChange={(o) => {
                setNotifOpen(o);
                if (!o && newServices.length > 0) clearNewServices();
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="What's new"
                  className="relative h-10 w-10 grid place-items-center rounded border border-border hover:border-primary text-foreground hover:text-primary transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {newServices.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-black shadow-[0_0_10px_hsl(var(--primary)/0.7)]">
                      {newServices.length > 99 ? "99+" : newServices.length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[min(92vw,360px)] p-0 bg-popover border-border"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest">What's New</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    {newServices.length} update{newServices.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="max-h-[60vh] overflow-y-auto overscroll-contain divide-y divide-border [-webkit-overflow-scrolling:touch]">
                  {newServices.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      You're all caught up.
                    </div>
                  ) : (
                    newServices.map((n) => (
                      <div key={n.id} className="p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">New service</span>
                          <span className="text-xs font-black text-foreground">₹ {n.rate.toFixed(2)}</span>
                        </div>
                        <div className="text-sm font-semibold leading-snug mb-1 break-words">{n.name}</div>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wider break-words">{n.category}</div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <RedeemPopover
              applied={appliedRedeem}
              onApply={(a) => setAppliedRedeem(a)}
              onClear={clearRedeem}
            />
            <a
              href={supportWa}
              target="_blank"
              rel="noreferrer"
              aria-label="Contact on WhatsApp"
              className="inline-flex items-center gap-1.5 h-10 px-3 sm:px-4 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors text-sm font-bold"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
              Contact
            </a>
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="container relative pt-16 pb-12 text-center flex flex-col items-center">
          <img
            src={wordmark}
            alt="SMMFLIX"
            className="h-20 sm:h-32 object-contain mb-4 drop-shadow-[0_0_40px_hsl(var(--primary)/0.6)]"
          />
          <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg uppercase tracking-[0.15em] font-medium">
            Premium Services · Premium Results
          </p>
        </div>
      </section>

      {/* Featured row */}
      {featuredItems.length > 0 && (
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

          {/* Quantity */}
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

          <Button
            type="submit"
            className="w-full h-12 text-base font-black tracking-widest uppercase bg-primary text-primary-foreground hover:bg-primary/90 transition-all rounded-sm shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
          >
            Continue to Payment
          </Button>
        </form>
      </section>

      <Guidelines />

      {/* Features — Netflix card style */}
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

      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground uppercase tracking-widest">
        © {new Date().getFullYear()} <span className="text-primary font-black">SMMFLIX</span> · Premium Services. Premium Results. <Link to="/admin" className="ml-2 hover:text-primary">Admin</Link>
      </footer>

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
    </div>
  );
};

export default Index;
