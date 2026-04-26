import { useEffect, useState } from "react";
import type { Category, Service } from "@/data/services";

const API_URL = "https://www.prime-spot.store/api/services";
const SEEN_KEY = "smmflix.seenServiceIds.v1";
const NEW_KEY = "smmflix.newServices.v1";

type ApiService = {
  service: string | number;
  name: string;
  category: string;
  rate: string | number;
  min: string | number;
  max: string | number;
  description?: string;
  desc?: string;
};

export type NewServiceEntry = {
  id: string;
  name: string;
  category: string;
  rate: number;
  detectedAt: number;
};

type State = {
  categories: Category[];
  loading: boolean;
  error: string | null;
  newServices: NewServiceEntry[];
};

// Normalize stylized unicode (mathematical bold etc.) into plain ASCII for
// stable alphabetical sorting.
const toPlain = (str: string): string => {
  let out = "";
  for (const ch of str) {
    const cp = ch.codePointAt(0)!;
    if (cp >= 0x1d400 && cp <= 0x1d419) out += String.fromCharCode(65 + (cp - 0x1d400));
    else if (cp >= 0x1d41a && cp <= 0x1d433) out += String.fromCharCode(97 + (cp - 0x1d41a));
    else if (cp >= 0x1d5d4 && cp <= 0x1d5ed) out += String.fromCharCode(65 + (cp - 0x1d5d4));
    else if (cp >= 0x1d5ee && cp <= 0x1d607) out += String.fromCharCode(97 + (cp - 0x1d5ee));
    else if (cp >= 0x1d7ce && cp <= 0x1d7d7) out += String.fromCharCode(48 + (cp - 0x1d7ce));
    else out += ch;
  }
  return out;
};

const sortKey = (str: string) => toPlain(str).toLowerCase().trim();

function normalize(list: ApiService[]): Category[] {
  const map = new Map<string, Service[]>();
  for (const s of list) {
    const cat = s.category ?? "Other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push({
      id: String(s.service),
      name: s.name,
      category: cat,
      rate: Number(s.rate) || 0,
      min: Number(s.min) || 0,
      max: Number(s.max) || 0,
      description: s.description ?? s.desc ?? "",
    });
  }
  // Alphabetical category order
  const names = Array.from(map.keys()).sort((a, b) =>
    sortKey(a).localeCompare(sortKey(b))
  );
  return names.map((name, i) => ({
    id: `cat-${i + 1}`,
    name,
    services: map.get(name)!,
  }));
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function detectNew(
  cats: Category[],
  prevSeen: string[],
  prevNew: NewServiceEntry[]
): { newServices: NewServiceEntry[]; allIds: string[] } {
  const allIds: string[] = [];
  const flat: Service[] = [];
  for (const c of cats) {
    for (const s of c.services) {
      allIds.push(s.id);
      flat.push(s);
    }
  }
  // First load: don't flood with hundreds of "new" items.
  if (prevSeen.length === 0) {
    return { newServices: prevNew, allIds };
  }
  const seenSet = new Set(prevSeen);
  const now = Date.now();
  const additions: NewServiceEntry[] = flat
    .filter((s) => !seenSet.has(s.id))
    .map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      rate: s.rate,
      detectedAt: now,
    }));
  // Merge with existing unread, dedupe by id, cap to 50, newest first
  const merged = [...additions, ...prevNew];
  const dedup = new Map<string, NewServiceEntry>();
  for (const n of merged) if (!dedup.has(n.id)) dedup.set(n.id, n);
  const newServices = Array.from(dedup.values())
    .sort((a, b) => b.detectedAt - a.detectedAt)
    .slice(0, 50);
  return { newServices, allIds };
}

export function useApiServices(): State & { clearNewServices: () => void } {
  const [state, setState] = useState<State>({
    categories: [],
    loading: true,
    error: null,
    newServices: readJSON<NewServiceEntry[]>(NEW_KEY, []),
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ApiService[] = await res.json();
        if (cancelled) return;
        const cats = normalize(data);
        const prevSeen = readJSON<string[]>(SEEN_KEY, []);
        const prevNew = readJSON<NewServiceEntry[]>(NEW_KEY, []);
        const { newServices, allIds } = detectNew(cats, prevSeen, prevNew);
        writeJSON(SEEN_KEY, allIds);
        writeJSON(NEW_KEY, newServices);
        setState({
          categories: cats,
          loading: false,
          error: null,
          newServices,
        });
      } catch (e: any) {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: e?.message ?? "Failed to load",
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearNewServices = () => {
    writeJSON(NEW_KEY, []);
    setState((s) => ({ ...s, newServices: [] }));
  };

  return { ...state, clearNewServices };
}

export const supportWhatsapp = "https://wa.me/918848490476";
