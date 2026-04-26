import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { ADMIN_PASSWORD, getSettings, saveSettings } from "@/lib/adminSettings";
import logo from "@/assets/prime-smm-logo.png";
import { ArrowLeft } from "lucide-react";

const Admin = () => {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [settings, setSettings] = useState(getSettings);

  if (!authed) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-4">
        <div className="card-surface border border-border/60 rounded-sm p-8 max-w-sm w-full space-y-5">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SMMFLIX" className="h-10 w-10 object-contain" />
            <div>
              <div className="display text-xl font-black tracking-wider text-primary">ADMIN PANEL</div>
              <div className="text-xs text-muted-foreground">SMMFLIX</div>
            </div>
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

  const update = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SMMFLIX" className="h-9 w-9 object-contain" />
            <div className="display text-xl font-black tracking-wider">
              <span className="text-primary">PRIME</span> SMM · ADMIN
            </div>
          </div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="container py-10 max-w-2xl space-y-6">
        {/* Payment mode toggle */}
        <section className="card-surface border border-border/60 rounded-sm p-6 space-y-5">
          <div>
            <h2 className="display text-xl font-black tracking-wider text-primary mb-1">PAYMENT MODE</h2>
            <p className="text-sm text-muted-foreground">
              Toggle between QR (UPI) payment flow and direct WhatsApp order.
            </p>
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
        </section>

        {/* UPI settings */}
        <section className="card-surface border border-border/60 rounded-sm p-6 space-y-4">
          <div>
            <h2 className="display text-xl font-black tracking-wider text-primary mb-1">UPI DETAILS</h2>
            <p className="text-sm text-muted-foreground">Used to generate the QR code.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
              UPI ID
            </Label>
            <Input
              value={settings.upiId}
              onChange={(e) => update("upiId", e.target.value)}
              placeholder="yourname@okaxis"
              className="bg-input border-border focus-visible:ring-primary rounded-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
              Payee Name
            </Label>
            <Input
              value={settings.payeeName}
              onChange={(e) => update("payeeName", e.target.value)}
              placeholder="SMMFLIX"
              className="bg-input border-border focus-visible:ring-primary rounded-sm"
            />
          </div>

          <p className="text-xs text-primary">✓ Settings save automatically.</p>
        </section>
      </main>
    </div>
  );
};

export default Admin;
