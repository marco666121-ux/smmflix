import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageCircle, ExternalLink, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
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

type Props = {
  label: string;
  color: ContactColor;
  links: ContactLink[];
  fallbackUrl?: string;
};

export const ContactDropdown = ({ label, color, links, fallbackUrl }: Props) => {
  const [open, setOpen] = useState(false);
  const colorClass = COLOR_CLASSES[color] ?? COLOR_CLASSES.emerald;

  // No links configured but a fallback exists → behave as a single link button
  if (links.length === 0) {
    if (!fallbackUrl) return null;
    return (
      <a
        href={fallbackUrl}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "inline-flex items-center gap-1.5 h-10 px-3 sm:px-4 rounded border transition-colors text-sm font-bold",
          colorClass,
        )}
      >
        <MessageCircle className="h-4 w-4" />
        {label}
      </a>
    );
  }

  // Single link → direct link, no dropdown chevron
  if (links.length === 1) {
    return (
      <a
        href={links[0].url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "inline-flex items-center gap-1.5 h-10 px-3 sm:px-4 rounded border transition-colors text-sm font-bold",
          colorClass,
        )}
      >
        <MessageCircle className="h-4 w-4" />
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
            "inline-flex items-center gap-1.5 h-10 px-3 sm:px-4 rounded border transition-colors text-sm font-bold",
            colorClass,
          )}
        >
          <MessageCircle className="h-4 w-4" />
          {label}
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(90vw,260px)] p-1 bg-popover border-border rounded-lg overflow-hidden"
      >
        {links.map((l, i) => (
          <a
            key={`${l.url}-${i}`}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-md text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <span className="truncate">{l.name}</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-60 shrink-0" />
          </a>
        ))}
      </PopoverContent>
    </Popover>
  );
};
