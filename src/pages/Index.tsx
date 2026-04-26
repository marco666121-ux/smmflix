import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { categories as fallbackCategories, supportWhatsapp } from "@/data/services";
import { useLiveServices } from "@/hooks/useLiveServices";
import Guidelines from "@/components/Guidelines";
import { PaymentModal } from "@/components/PaymentModal";
import { useAdminSettings } from "@/lib/adminSettings";
import logo from "@/assets/prime-smm-logo.png";
import wordmark from "@/assets/smmflix-wordmark.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Zap, ShieldCheck, Rocket, Search } from "lucide-react";

const Index = () => {
  const [categoryId, setCategoryId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const adminSettings = useAdminSettings();
  const { categories, isLoading: servicesLoading, isLive } = useLiveServices();

  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );
  const service = useMemo(
    () => category?.services.find((s) => s.id === serviceId),
    [category, serviceId]
  );

  // Global search across all services
  const allServices = useMemo(
    () =>
      categories.flatMap((c) =>
        c.services.map((s) => ({ ...s, _categoryId: c.id, _categoryName: c.name }))
      ),
    [categories]
  );

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    // Sort by rate keywords
    const sortByRate = q.includes("cheap") || q.includes("premium");
    const filtered = allServices.filter((s) => {
      if (q === "cheap" || q === "premium") return true;
      return (
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s._categoryName.toLowerCase().includes(q) ||
        String(s.rate).includes(q)
      );
    });
    if (q.includes("cheap")) filtered.sort((a, b) => a.rate - b.rate);
    else if (q.includes("premium")) filtered.sort((a, b) => b.rate - a.rate);
    return filtered.slice(0, 50);
  }, [search, allServices]);

  const qty = Number(quantity) || 0;
  const total = service ? (qty / 1000) * service.rate : 0;

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
      `🔹 Price: ₹ ${total.toFixed(2)}`,
    ];
    if (utr) lines.push(`🔹 UTR: ${utr}`, `🔹 Status: PAID ✅`);
    const message = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/918848490476?text=${message}`, "_blank");
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
    if (adminSettings.qrPaymentEnabled) {
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
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="SMMFLIX symbol" className="h-10 w-10 object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.5)]" />
            <div className="leading-none">
              <img
                src={wordmark}
                alt="SMMFLIX"
                className="h-7 sm:h-8 object-contain drop-shadow-[0_0_18px_hsl(var(--primary)/0.45)]"
              />
              <div className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase mt-1">
                Premium Services. Premium Results.
              </div>
            </div>
          </Link>
          <a
            href={supportWhatsapp}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-4 py-2 rounded border border-border hover:border-primary"
          >
            Support
          </a>
        </div>
      </header>

      {/* Netflix-style hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="container relative pt-20 pb-12 text-center">
          <h1 className="display text-6xl sm:text-8xl font-black leading-[0.9] mb-4 tracking-tight">
            <span className="text-primary drop-shadow-[0_0_30px_hsl(var(--primary)/0.6)]">PRIME</span>{" "}
            <span className="text-foreground">SMM</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg uppercase tracking-[0.15em] font-medium">
            Premium Services · Premium Results
          </p>
        </div>
      </section>

      {/* Order form */}
      <section className="container pb-16">
        <form
          onSubmit={handleSubmit}
          className="card-surface border border-border/60 rounded-md p-6 sm:p-8 max-w-2xl mx-auto space-y-5 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-10 bg-primary rounded-full" />
            <h2 className="display text-3xl font-black tracking-wide">NEW ORDER</h2>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Search Services</Label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID, category, 'cheap' or 'premium'"
                className="pl-9 bg-input border-border focus-visible:ring-primary rounded-sm"
              />
            </div>
            {search && (
              <div className="rounded-sm border border-border divide-y divide-border overflow-hidden max-h-80 overflow-y-auto bg-card">
                {searchResults.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">No services found.</div>
                )}
                {searchResults.map((s) => (
                  <button
                    type="button"
                    key={`${s._categoryId}-${s.id}`}
                    onClick={() => {
                      setCategoryId(s._categoryId);
                      setServiceId(s.id);
                      setSearch("");
                    }}
                    className="w-full text-left p-3 hover:bg-primary/10 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-black text-primary">#{s.id}</span>
                      <span className="text-sm font-black text-foreground">₹ {s.rate.toFixed(2)}</span>
                    </div>
                    <div className="text-sm font-semibold leading-snug mb-1">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{s._categoryName}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Category</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v);
                setServiceId("");
              }}
            >
              <SelectTrigger className="bg-input border-border rounded-sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {category && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Service</Label>
              <div className="rounded-sm border border-border divide-y divide-border overflow-hidden bg-card">
                {category.services.map((s) => {
                  const selected = s.id === serviceId;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setServiceId(s.id)}
                      className={`w-full text-left p-4 transition-colors border-l-2 ${
                        selected
                          ? "bg-primary/15 border-l-primary"
                          : "border-l-transparent hover:bg-muted/40"
                      }`}
                    >
                      <div className="text-xs font-black text-primary mb-1">
                        #{s.id}
                      </div>
                      <div className="text-sm font-semibold leading-snug mb-2">
                        {s.name}
                      </div>
                      <div className="text-base font-black text-foreground mb-2">
                        ₹ {s.rate.toFixed(2)}
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                          / 1000
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground uppercase tracking-wider">
                        <span>MIN <span className="text-foreground font-bold">{s.min}</span></span>
                        <span>MAX <span className="text-foreground font-bold">{s.max}</span></span>
                      </div>
                      {s.description && (
                        <pre className="mt-2 text-[11px] text-muted-foreground whitespace-pre-wrap font-sans">{s.description}</pre>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="rounded-sm border border-border bg-muted/30 px-3 py-2 uppercase tracking-wider">
              MIN <span className="text-foreground font-bold">{service?.min ?? 0}</span>
            </div>
            <div className="rounded-sm border border-border bg-muted/30 px-3 py-2 uppercase tracking-wider">
              MAX <span className="text-foreground font-bold">{service?.max ?? 0}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Quantity</Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 1000"
              className="bg-input border-border focus-visible:ring-primary rounded-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Profile / Post Link</Label>
            <Input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://instagram.com/username"
              className="bg-input border-border focus-visible:ring-primary rounded-sm"
            />
          </div>

          <div className="flex items-center justify-between rounded-sm border border-primary/40 bg-primary/10 px-4 py-3">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Total</span>
            <span className="text-3xl font-black text-primary display">
              ₹{total.toFixed(2)}
            </span>
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
          upiId={adminSettings.upiId}
          payeeName={adminSettings.payeeName}
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
