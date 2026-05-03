import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import type { ContactColor, ContactLink } from "@/hooks/useSiteSettings";

const COLOR_CLASSES: Record<ContactColor, string> = {
  emerald:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300",
  red:
    "border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300",
  blue:
    "border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300",
  purple:
    "border-purple-500/40 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300",
  amber:
    "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300",
  slate:
    "border-border bg-muted/40 text-foreground hover:bg-muted hover:text-foreground",
};

const ITEM_ACCENT: Record<ContactColor, string> = {
  emerald: "border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/10",
  red: "border-rose-500/60 text-rose-400 hover:bg-rose-500/10",
  blue: "border-blue-500/60 text-blue-400 hover:bg-blue-500/10",
  purple: "border-purple-500/60 text-purple-400 hover:bg-purple-500/10",
  amber: "border-amber-500/60 text-amber-400 hover:bg-amber-500/10",
  slate: "border-border text-foreground hover:bg-muted",
};

type Props = {
  label: string;
  color: ContactColor;
  links: ContactLink[];
  fallbackUrl?: string;
};

export const ContactDropdown = ({ label, color, links, fallbackUrl }: Props) => {
  const [open, setOpen] = useState(false);
  const colorClass = COLOR_CLASSES[color] ?? COLOR_CLASSES.emerald;
  const itemClass = ITEM_ACCENT[color] ?? ITEM_ACCENT.emerald;

  // No links configured but a fallback exists → behave as a single link button
  if (links.length === 0) {
    if (!fallbackUrl) return null;
    return (
      <a
        href={fallbackUrl}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "inline-flex items-center gap-2 h-10 px-4 rounded-full border transition-colors text-sm font-bold",
          colorClass,
        )}
      >
        <WhatsAppIcon className="h-4 w-4" />
        {label}
      </a>
    );
  }

  if (links.length === 1) {
    return (
      <a
        href={links[0].url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "inline-flex items-center gap-2 h-10 px-4 rounded-full border transition-colors text-sm font-bold",
          colorClass,
        )}
      >
        <WhatsAppIcon className="h-4 w-4" />
        {label}
      </a>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 h-10 px-4 rounded-full border transition-colors text-sm font-bold",
            colorClass,
          )}
        >
          <WhatsAppIcon className="h-4 w-4" />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(90vw,260px)] p-2 bg-popover border-border rounded-2xl space-y-2"
      >
        {links.map((l, i) => (
          <a
            key={`${l.url}-${i}`}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center justify-center gap-2 h-11 rounded-full border bg-card transition-colors text-sm font-bold",
              itemClass,
            )}
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span className="truncate">{l.name}</span>
          </a>
        ))}
      </PopoverContent>
    </Popover>
  );
};
