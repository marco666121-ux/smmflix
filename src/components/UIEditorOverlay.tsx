import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Eye, Save, Send, Smartphone, Tablet, Monitor, Type, Image as ImageIcon,
  Paintbrush, Palette, MousePointer2, Layout, Move, Settings2, Check,
  LayoutDashboard, ShoppingCart, Package, FolderOpen, Users, Receipt, Ticket,
  BarChart3, Wand2, Puzzle, Code2, FileText, LogOut, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useSiteSettings, updateSiteSettings, type UiTheme } from "@/hooks/useSiteSettings";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import wordmark from "@/assets/smmflix-wordmark.png";

type Tab = "elements" | "theme" | "layout" | "advanced";
type Device = "mobile" | "tablet" | "desktop";
type SectionKey =
  | "hero" | "new_order" | "guidelines" | "feature_cards" | "footer"
  | "notification_bell" | "redeem_button" | "contact_button" | "featured_section"
  | "refill_button" | "status_button";

const SECTION_LABELS: Record<SectionKey, string> = {
  hero: "Hero Section",
  new_order: "New Order Card",
  guidelines: "Guidelines",
  feature_cards: "Feature Cards",
  footer: "Footer",
  notification_bell: "Notification Bell",
  redeem_button: "Redeem Button",
  contact_button: "Contact Button",
  featured_section: "Featured Row",
  refill_button: "Refill Button",
  status_button: "Status Button",
};

// Map a section to its associated text fields (which override site copy)
const SECTION_TEXT: Partial<Record<SectionKey, { key: string; label: string; placeholder: string; multiline?: boolean }[]>> = {
  hero: [
    { key: "hero_subtitle", label: "Sub Heading", placeholder: "PREMIUM SERVICES · PREMIUM RESULTS" },
  ],
  new_order: [
    { key: "new_order_title", label: "Card Title", placeholder: "NEW ORDER" },
    { key: "continue_label", label: "Continue Button Text", placeholder: "Continue to Payment" },
  ],
  footer: [
    { key: "footer_text", label: "Footer Text", placeholder: "Premium Services. Premium Results." },
  ],
  refill_button: [
    { key: "refill_label", label: "Button Text", placeholder: "Refill" },
  ],
  status_button: [
    { key: "status_label", label: "Button Text", placeholder: "Status" },
  ],
  contact_button: [
    { key: "logo_subtitle", label: "Logo Subtitle (header)", placeholder: "Premium Services. Premium Results." },
  ],
};

const COLOR_PRESETS: { name: string; hsl: string; hex: string }[] = [
  { name: "Red",     hsl: "0 84% 60%",   hex: "#ef4444" },
  { name: "Crimson", hsl: "346 87% 55%", hex: "#e11d48" },
  { name: "Orange",  hsl: "20 90% 55%",  hex: "#f97316" },
  { name: "Amber",   hsl: "38 92% 55%",  hex: "#f59e0b" },
  { name: "Emerald", hsl: "152 70% 45%", hex: "#10b981" },
  { name: "Cyan",    hsl: "190 90% 50%", hex: "#06b6d4" },
  { name: "Blue",    hsl: "217 91% 60%", hex: "#3b82f6" },
  { name: "Indigo",  hsl: "243 75% 60%", hex: "#6366f1" },
  { name: "Violet",  hsl: "270 80% 65%", hex: "#a855f7" },
  { name: "Pink",    hsl: "330 85% 60%", hex: "#ec4899" },
];

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: ShoppingCart, label: "Orders" },
  { icon: Package, label: "Services" },
  { icon: FolderOpen, label: "Categories" },
  { icon: Users, label: "Users" },
  { icon: Receipt, label: "Transactions" },
  { icon: Ticket, label: "Tickets" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Settings2, label: "Settings" },
  { icon: Wand2, label: "UI Editor", active: true },
  { icon: Layout, label: "Page Builder" },
  { icon: Puzzle, label: "Extensions" },
  { icon: Code2, label: "API" },
  { icon: FileText, label: "Logs" },
];

const QUICK_TOOLS: { id: Tab; icon: typeof Type; label: string }[] = [
  { id: "elements", icon: Type, label: "Text Editor" },
  { id: "elements", icon: ImageIcon, label: "Logo Editor" },
  { id: "theme", icon: Paintbrush, label: "Color Theme" },
  { id: "theme", icon: Palette, label: "Background" },
  { id: "elements", icon: MousePointer2, label: "Buttons" },
  { id: "layout", icon: Layout, label: "Layout" },
  { id: "layout", icon: Move, label: "Spacing" },
  { id: "advanced", icon: Settings2, label: "Advanced" },
];

type Props = { open: boolean; onClose: () => void };

export const UIEditorOverlay = ({ open, onClose }: Props) => {
  const settings = useSiteSettings();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("elements");
  const [device, setDevice] = useState<Device>("mobile");
  const [selected, setSelected] = useState<SectionKey>("hero");

  const [text, setText] = useState<Record<string, string>>({});
  const [vis, setVis] = useState<Record<string, boolean>>({});
  const [themeDraft, setThemeDraft] = useState<UiTheme>({});
  const [borderRadius, setBorderRadius] = useState(12);
  const [glowIntensity, setGlowIntensity] = useState(70);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setText({ ...settings.ui_text });
      setVis({ ...settings.ui_visibility });
      setThemeDraft({ ...settings.ui_theme });
    }
  }, [open]); // eslint-disable-line

  // Live primary color preview on the host document while editor is open
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.getPropertyValue("--primary");
    if (themeDraft.primary_hsl) root.style.setProperty("--primary", themeDraft.primary_hsl);
    return () => {
      if (prev) root.style.setProperty("--primary", prev);
      else root.style.removeProperty("--primary");
    };
  }, [open, themeDraft.primary_hsl]);

  if (!open) return null;

  const commit = async (publish: boolean) => {
    setSaving(true);
    const { error } = await updateSiteSettings({
      ui_text: text, ui_visibility: vis, ui_theme: themeDraft,
    });
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error });
    toast({ title: publish ? "Published 🚀" : "Saved 💾" });
    if (publish) onClose();
  };

  const previewSrc = `${window.location.origin}/?_editor_preview=1`;
  const deviceWidth = device === "mobile" ? 390 : device === "tablet" ? 768 : 1280;
  const activePreset = COLOR_PRESETS.find((c) => c.hsl === themeDraft.primary_hsl);

  const sectionKeys: SectionKey[] = [
    "hero", "new_order", "guidelines", "feature_cards", "footer",
    "notification_bell", "redeem_button", "contact_button", "featured_section",
    "refill_button", "status_button",
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-background text-foreground">
      {/* TOP BAR */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-3 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden h-9 w-9 grid place-items-center rounded-md border border-border hover:bg-muted shrink-0"
            aria-label="Menu"
          >
            <LayoutDashboard className="h-4 w-4" />
          </button>
          <img src={wordmark} alt="SMMFLIX" className="hidden sm:block h-7 object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.5)]" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="display text-base sm:text-xl font-black tracking-wider">UI EDITOR</h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Live Preview
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-muted-foreground mt-0.5">
              Edit your website in real-time. Tap any element to customize.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            type="button" variant="outline" size="sm"
            className="h-9 gap-1.5 font-bold text-xs hidden sm:inline-flex"
            onClick={() => window.open(previewSrc, "_blank")}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </Button>
          <Button
            type="button" variant="outline" size="sm" disabled={saving}
            className="h-9 gap-1.5 font-bold text-xs"
            onClick={() => commit(false)}
          >
            <Save className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Save Changes</span><span className="sm:hidden">Save</span>
          </Button>
          <Button
            type="button" size="sm" disabled={saving}
            className="h-9 gap-1.5 font-bold text-xs bg-primary text-primary-foreground"
            onClick={() => commit(true)}
          >
            <Send className="h-3.5 w-3.5" /> Publish
          </Button>
          <button
            onClick={onClose}
            aria-label="Exit editor"
            className="h-9 w-9 grid place-items-center rounded-md border border-border hover:bg-muted shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[220px_1fr_340px]">
        {/* LEFT SIDEBAR (drawer on mobile) */}
        <aside
          className={cn(
            "border-r border-border bg-card/40 overflow-y-auto",
            "lg:block",
            sidebarOpen ? "fixed inset-y-0 left-0 top-0 z-50 w-64 bg-background block pt-16" : "hidden",
          )}
        >
          <nav className="p-3 space-y-1">
            {SIDEBAR_ITEMS.map((it) => {
              const Icon = it.icon;
              return (
                <div
                  key={it.label}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold cursor-default",
                    it.active
                      ? "bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.5)]"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{it.label}</span>
                </div>
              );
            })}
          </nav>
          <div className="p-3 mt-2 border-t border-border">
            <button
              onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Exit Editor
            </button>
          </div>
        </aside>

        {/* CENTER: PREVIEW */}
        <section className="overflow-y-auto bg-gradient-to-b from-background via-background to-card/20 p-3 sm:p-6">
          {/* Device toggle */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {([
              { id: "mobile" as Device, icon: Smartphone, label: "Mobile" },
              { id: "tablet" as Device, icon: Tablet, label: "Tablet" },
              { id: "desktop" as Device, icon: Monitor, label: "Desktop" },
            ]).map((d) => {
              const Icon = d.icon;
              const active = device === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDevice(d.id)}
                  className={cn(
                    "h-10 px-4 rounded-md border flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_0_18px_hsl(var(--primary)/0.45)]"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {d.label}
                </button>
              );
            })}
          </div>

          {/* Phone frame with iframe preview */}
          <div className="flex justify-center">
            <div
              className={cn(
                "relative bg-card rounded-[40px] border-[10px] border-foreground/10 shadow-2xl overflow-hidden",
                device === "mobile" && "w-full max-w-[400px] h-[680px]",
                device === "tablet" && "w-full max-w-[700px] h-[760px] rounded-[28px]",
                device === "desktop" && "w-full max-w-[1100px] h-[720px] rounded-[18px]",
              )}
            >
              <iframe
                src={previewSrc}
                title="Site preview"
                className="w-full h-full bg-background"
                style={{ width: deviceWidth, transform: device === "mobile" ? "none" : undefined }}
              />
              {/* Element overlay markers (clickable selection) */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-3 right-3 pointer-events-auto">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-lg">
                    {SECTION_LABELS[selected]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section selector chips (so user can pick which element to edit) */}
          <div className="mt-5 max-w-3xl mx-auto">
            <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">Select element to edit</div>
            <div className="flex flex-wrap gap-2">
              {sectionKeys.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelected(k)}
                  className={cn(
                    "h-8 px-3 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-colors",
                    selected === k
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
                  )}
                >
                  {SECTION_LABELS[k]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT: PROPERTY PANEL */}
        <aside className="border-t lg:border-t-0 lg:border-l border-border bg-card/30 overflow-y-auto">
          {/* Tabs */}
          <div className="grid grid-cols-4 border-b border-border sticky top-0 bg-card/80 backdrop-blur z-10">
            {(["elements", "theme", "layout", "advanced"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "py-3 text-[11px] font-black uppercase tracking-widest transition-colors relative",
                  tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
                {tab === t && <span className="absolute left-3 right-3 bottom-0 h-0.5 bg-primary rounded-full" />}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-5 pb-32">
            {tab === "elements" && (
              <>
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-black text-primary mb-2">
                    Editing: {SECTION_LABELS[selected]}
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                    <div>
                      <div className="text-sm font-bold">Visibility</div>
                      <div className="text-[11px] text-muted-foreground">Show on website</div>
                    </div>
                    <Switch
                      checked={!vis[selected]}
                      onCheckedChange={(c) => setVis({ ...vis, [selected]: !c })}
                    />
                  </div>
                </div>

                {SECTION_TEXT[selected] && (
                  <div className="space-y-3">
                    <div className="text-[10px] uppercase tracking-widest font-black text-primary">Content</div>
                    {SECTION_TEXT[selected]!.map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">{f.label}</Label>
                        <Input
                          value={text[f.key] ?? ""}
                          placeholder={f.placeholder}
                          onChange={(e) => setText({ ...text, [f.key]: e.target.value })}
                          className="bg-background border-border rounded-md h-10"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-widest font-black text-primary">Style</div>
                  <Row label="Text Color">
                    <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 h-10 w-40">
                      <span className="h-4 w-4 rounded-sm" style={{ background: `hsl(${themeDraft.primary_hsl ?? "0 84% 60%"})` }} />
                      <span className="text-xs font-mono">{activePreset?.hex.toUpperCase() ?? "#FF1E1E"}</span>
                    </div>
                  </Row>
                </div>
              </>
            )}

            {tab === "theme" && (
              <>
                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-widest font-black text-primary">Primary Color</div>
                  <div className="grid grid-cols-5 gap-2">
                    {COLOR_PRESETS.map((c) => {
                      const active = themeDraft.primary_hsl === c.hsl;
                      return (
                        <button
                          key={c.hsl}
                          type="button"
                          onClick={() => setThemeDraft({ ...themeDraft, primary_hsl: c.hsl })}
                          className={cn(
                            "aspect-square rounded-full border-2 grid place-items-center transition-all",
                            active ? "border-foreground scale-110" : "border-border hover:scale-105",
                          )}
                          style={{ backgroundColor: c.hex }}
                          aria-label={c.name}
                        >
                          {active && <Check className="h-4 w-4 text-white drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-widest font-black text-primary">Background</div>
                  <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                    <div>
                      <div className="text-sm font-bold">Dark mode</div>
                      <div className="text-[11px] text-muted-foreground">Switch the entire site</div>
                    </div>
                    <Switch checked={theme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                    <div>
                      <div className="text-sm font-bold">Background Glow</div>
                      <div className="text-[11px] text-muted-foreground">Hero gradient halo</div>
                    </div>
                    <Switch
                      checked={themeDraft.hero_gradient !== false}
                      onCheckedChange={(c) => setThemeDraft({ ...themeDraft, hero_gradient: c })}
                    />
                  </div>
                  <Row label="Glow Intensity">
                    <div className="flex-1 flex items-center gap-2">
                      <Slider value={[glowIntensity]} onValueChange={(v) => setGlowIntensity(v[0])} min={0} max={100} />
                      <span className="text-xs font-mono text-muted-foreground w-10 text-right">{glowIntensity}%</span>
                    </div>
                  </Row>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-widest font-black text-primary">Border & Shadow</div>
                  <Row label="Border Radius">
                    <div className="flex-1 flex items-center gap-2">
                      <Slider value={[borderRadius]} onValueChange={(v) => setBorderRadius(v[0])} min={0} max={32} />
                      <span className="text-xs font-mono text-muted-foreground w-10 text-right">{borderRadius}px</span>
                    </div>
                  </Row>
                  <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                    <div>
                      <div className="text-sm font-bold">Button Glow</div>
                      <div className="text-[11px] text-muted-foreground">Neon shadow on primary</div>
                    </div>
                    <Switch
                      checked={themeDraft.button_glow !== false}
                      onCheckedChange={(c) => setThemeDraft({ ...themeDraft, button_glow: c })}
                    />
                  </div>
                </div>
              </>
            )}

            {tab === "layout" && (
              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-widest font-black text-primary">Sections Visibility</div>
                {sectionKeys.map((k) => (
                  <div key={k} className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                    <span className="text-sm font-semibold">{SECTION_LABELS[k]}</span>
                    <Switch
                      checked={!vis[k]}
                      onCheckedChange={(c) => setVis({ ...vis, [k]: !c })}
                    />
                  </div>
                ))}
              </div>
            )}

            {tab === "advanced" && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Advanced layout/CSS controls coming soon. For now, use Theme & Elements tabs to customize the live site.
                </p>
                <Button variant="outline" className="w-full font-black uppercase tracking-wider text-xs gap-2" onClick={() => {
                  setText({}); setVis({}); setThemeDraft({});
                  toast({ title: "Reset to defaults — remember to Publish." });
                }}>
                  Reset all customizations
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* BOTTOM: QUICK EDIT TOOLS */}
      <div className="border-t border-border bg-background/95 backdrop-blur-xl">
        <div className="px-3 sm:px-5 py-2.5">
          <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">Quick Edit Tools</div>
          <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
            {QUICK_TOOLS.map((q, i) => {
              const Icon = q.icon;
              const active = tab === q.id;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTab(q.id)}
                  className={cn(
                    "shrink-0 w-[90px] sm:w-[110px] h-[68px] rounded-md border flex flex-col items-center justify-center gap-1.5 transition-colors",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_0_16px_hsl(var(--primary)/0.5)]"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-center leading-tight">{q.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2.5">
    <span className="text-xs font-bold text-muted-foreground">{label}</span>
    <div className="flex items-center">{children}</div>
  </div>
);
