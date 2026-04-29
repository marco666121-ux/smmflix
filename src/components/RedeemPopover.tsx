import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, X, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { useAdminSettings, findRedeemPercent } from "@/lib/adminSettings";
import { toast } from "@/hooks/use-toast";

type Applied = { code: string; percent: number };

type Props = {
  applied: Applied | null;
  onApply: (a: Applied) => void;
  onClear: () => void;
};

export const RedeemPopover = ({ applied, onApply, onClear }: Props) => {
  const { user, signOut } = useAuth();
  const settings = useAdminSettings();
  const [authOpen, setAuthOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");

  const handleClick = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setOpen((v) => !v);
  };

  const apply = () => {
    const pct = findRedeemPercent(settings.redeemCodes, code);
    if (!pct) {
      toast({ title: "Invalid code" });
      return;
    }
    const upper = code.trim().toUpperCase();
    onApply({ code: upper, percent: pct });
    toast({ title: "Code applied", description: `${pct}% off your order.` });
    setCode("");
    setOpen(false);
  };

  // Display phone (digits before "@") instead of synthetic email
  const displayName = user?.email?.split("@")[0] ?? "";

  return (
    <>
      <Popover open={open} onOpenChange={(o) => user && setOpen(o)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            className="relative h-10 px-3 grid place-items-center rounded border border-border hover:border-primary text-foreground hover:text-primary transition-colors gap-1.5 inline-flex"
            aria-label="Redeem code"
          >
            <Tag className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
              {applied ? `−${applied.percent}%` : "Redeem"}
            </span>
            {applied && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-black">
                ✓
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-[min(92vw,320px)] p-4 bg-popover border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground truncate max-w-[180px]">
              +{displayName}
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive flex items-center gap-1"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
          {applied ? (
            <div className="flex items-center justify-between rounded-sm border border-primary/40 bg-primary/10 px-3 py-2">
              <div className="text-sm">
                <span className="font-black text-primary">{applied.code}</span>
                <span className="text-muted-foreground ml-2 text-xs">−{applied.percent}%</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
                className="p-1 rounded text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="uppercase tracking-wider"
              />
              <Button
                onClick={apply}
                disabled={!code.trim()}
                className="w-full font-black uppercase tracking-widest text-xs rounded-sm"
              >
                Apply Code
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setOpen(true)}
      />
    </>
  );
};
