import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Save, Rocket, Type, Eye, Palette, MousePointer2, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSiteSettings, updateSiteSettings, type UiTheme } from "@/hooks/useSiteSettings";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Tab = "text" | "visibility" | "colors" | "theme";

const TEXT_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "logo_subtitle", label: "Logo subtitle", placeholder: "Premium Services. Premium Results." },
  { key: "hero_subtitle", label: "Hero subtitle", placeholder: "Premium Services · Premium Results" },
  { key: "new_order_title", label: "New Order title", placeholder: "NEW ORDER" },
  { key: "footer_text", label: "Footer text", placeholder: "Premium Services. Premium Results." },
  { key: "refill_label", label: "Refill button text", placeholder: "Refill" },
  { key: "status_label", label: "Status button text", placeholder: "Status" },
  { key: "continue_label", label: "Continue button text", placeholder: "Continue to Payment" },
];

const VISIBILITY_FIELDS: { key: string; label: string }[] = [
  { key: "notification_bell", label: "Notification bell" },
  { key: "redeem_button", label: "Redeem button" },
  { key: "contact_button", label: "Contact button" },
  { key: "hero", label: "Hero section" },
  { key: "featured_section", label: "Featured row" },
  { key: "guidelines", label: "Guidelines section" },
  { key: "feature_cards", label: "Feature cards" },
  { key: "footer", label: "Footer" },
  { key: "refill_button", label: "Refill button (floating)" },
  { key: "status_button", label: "Status button (floating)" },
];

const COLOR_PRESETS: { name: string; hsl: string }[] = [
  { name: "Red", hsl: "0 84% 60%" },
  { name: "Crimson", hsl: "346 87% 55%" },
  { name: "Orange", hsl: "20 90% 55%" },
  { name: "Amber", hsl: "38 92% 55%" },
  { name: "Emerald", hsl: "152 70% 45%" },
  { name: "Cyan", hsl: "190 90% 50%" },
  { name: "Blue", hsl: "217 91% 60%" },
  { name: "Indigo", hsl: "243 75% 60%" },
  { name: "Violet", hsl: "270 80% 65%" },
  { name: "Pink", hsl: "330 85% 60%" },
];

type Props = { open: boolean; onClose: () => void };

export const UIEditorOverlay = ({ open, onClose }: Props) => {
  const settings = useSiteSettings();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("text");

  // Local draft state — only commits on Save / Publish
  const [text, setText] = useState<Record<string, string>>({});
  const [vis, setVis] = useState<Record<string, boolean>>({});
  const [themeDraft, setThemeDraft] = useState<UiTheme>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setText({ ...settings.ui_text });
      setVis({ ...settings.ui_visibility });
      setThemeDraft({ ...settings.ui_theme });
    }
  }, [open]); // eslint-disable-line

  // Live preview: temporarily inject CSS var override on <html>
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
      ui_text: text,
      ui_visibility: vis,
      ui_theme: themeDraft,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error });
      return;
    }
    toast({ title: publish ? "Published 🚀" : "Saved 💾" });
    if (publish) onClose();
  };

  const tabs: { id: Tab; icon: typeof Type; label: string }[] = [
    { id: "text", icon: Type, label: "Text" },
    { id: "visibility", icon: Eye, label: "Visibility" },
    { id: "colors", icon: Palette, label: "Colors" },
    { id: "theme", icon: Sparkles, label: "Theme" },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-md">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-background/90">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onClose}
            aria-label="Exit editor"
            className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-muted shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold leading-none">UI Editor</div>
            <div className="text-xs font-black tracking-wider text-primary mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              LIVE PREVIEW
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => commit(false)}
            className="h-9 gap-1.5 font-black tracking-wider uppercase text-xs"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={() => commit(true)}
            className="h-9 gap-1.5 font-black tracking-wider uppercase text-xs bg-primary text-primary-foreground"
          >
            <Rocket className="h-3.5 w-3.5" /> Publish
          </Button>
        </div>
      </div>

      {/* Bottom-sheet edit panel */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-32">
        {tab === "text" && (
          <div className="max-w-xl mx-auto space-y-4">
            <h3 className="display text-lg font-black tracking-wider">EDIT TEXT</h3>
            {TEXT_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{f.label}</Label>
                <Input
                  value={text[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setText({ ...text, [f.key]: e.target.value })}
                  className="bg-input border-border rounded-sm"
                />
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">Leave a field empty to use the default text.</p>
          </div>
        )}

        {tab === "visibility" && (
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="display text-lg font-black tracking-wider mb-3">SHOW / HIDE ELEMENTS</h3>
            {VISIBILITY_FIELDS.map((f) => {
              const visible = !vis[f.key];
              return (
                <div
                  key={f.key}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3"
                >
                  <span className="text-sm font-semibold">{f.label}</span>
                  <Switch
                    checked={visible}
                    onCheckedChange={(c) => setVis({ ...vis, [f.key]: !c })}
                  />
                </div>
              );
            })}
          </div>
        )}

        {tab === "colors" && (
          <div className="max-w-xl mx-auto space-y-4">
            <h3 className="display text-lg font-black tracking-wider">PRIMARY COLOR</h3>
            <div className="grid grid-cols-5 gap-3">
              {COLOR_PRESETS.map((c) => {
                const active = (themeDraft.primary_hsl ?? "") === c.hsl;
                return (
                  <button
                    key={c.hsl}
                    type="button"
                    onClick={() => setThemeDraft({ ...themeDraft, primary_hsl: c.hsl })}
                    className={cn(
                      "aspect-square rounded-full border-2 grid place-items-center transition-all",
                      active ? "border-foreground scale-110" : "border-border hover:scale-105"
                    )}
                    style={{ backgroundColor: `hsl(${c.hsl})` }}
                    aria-label={c.name}
                  >
                    {active && <Check className="h-5 w-5 text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setThemeDraft({ ...themeDraft, primary_hsl: undefined })}
              className="font-black uppercase tracking-wider text-xs"
            >
              Reset to default
            </Button>
            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Preview</p>
              <Button className="w-full font-black tracking-wider uppercase">Sample Button</Button>
            </div>
          </div>
        )}

        {tab === "theme" && (
          <div className="max-w-xl mx-auto space-y-4">
            <h3 className="display text-lg font-black tracking-wider">THEME OPTIONS</h3>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Dark mode</div>
                <div className="text-xs text-muted-foreground">Switch the entire site</div>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Hero gradient</div>
                <div className="text-xs text-muted-foreground">Glowing background on hero section</div>
              </div>
              <Switch
                checked={themeDraft.hero_gradient !== false}
                onCheckedChange={(c) => setThemeDraft({ ...themeDraft, hero_gradient: c })}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Button glow</div>
                <div className="text-xs text-muted-foreground">Neon shadow on primary buttons</div>
              </div>
              <Switch
                checked={themeDraft.button_glow !== false}
                onCheckedChange={(c) => setThemeDraft({ ...themeDraft, button_glow: c })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-xl">
        <div className="grid grid-cols-4 max-w-xl mx-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_hsl(var(--primary))]")} />
                <span className="text-[10px] uppercase tracking-widest font-black">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
};
