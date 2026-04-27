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

// Manual category order requested by admin. Match is done on the normalized
// (plain-ASCII, lowercased, trimmed) name so stylized unicode variants in the
// API still line up with these entries.
const MANUAL_CATEGORY_ORDER: string[] = [
  "Winter Sale 🥶",
  "IG Followers 100% Old Account+ 15 Post ( Non - Drop ) ( Updated on 25/1/2026 )",
  "IG Followers Old Accounts Emergency Update ( One Click Done )",
  "Instagram Followers ( Ultra Cheap )",
  "Instagram Followers ( Almost No Drop ) One Click Done",
  "Instagram Followers ( Available Only On S S )",
  "Instagram Followers ( Big Base Profiles Accepted )",
  "Instagram Followers ( ULTRA CHEAP ) Big base profiles Accepted",
  "Instagram Followers 100% Indian 🇮🇳",
  "Instagram Followers 100% Old Accounts",
  "Instagram Followers 100% Old Accounts ( No/Low Drop )",
  "Instagram Followers 100% Real Accounts ( One Click Done )",
  "Instagram Followers 100% Real App Data",
  "Instagram Followers Cheapest ( Cheapest )",
  "Instagram Followers Old Accounts ( One Click Done )",
  "Instagram Followers Updated",
  "Instagram Likes ( 100% Indian ) 🇮🇳",
  "Instagram Likes ( 100% Indian 🇮🇳 )",
  "Instagram Likes ( Cheapest )",
  "Instagram Likes [ One Click Done )",
  "Instagram Likes 100% Indian 🇮🇳 ( Non -Drop )",
  "Instagram Likes 100% Indian 🇮🇳 ( Power Likes )",
  "Instagram Likes 100% Indian Quality 💞",
  "Instagram Likes Old Accounts",
  "IG Reels Views [ Cheap ]",
  "Instagram Reels Views ( Updated )",
  "Instagram [ DM Services ]",
  "Instagram 100% Indian ( One Click Done ) Updated",
  "Instagram Comments ( INDIAN 🇮🇳 )",
  "Instagram Comments ( New )",
  "Instagram Comments [ Non~Drop ]",
  "Instagram live Video views [ NoN~Drop ]",
  "Instagram Poll Votes [ Working ]",
  "Instagram Post Save [ Indian 🇮🇳 ]",
  "Instagram Post Shares [ Indian 🇮🇳 ]",
  "Instagram Post/ Photos Views",
  "Instagram Reach + Impression/Post Shares",
  "Instagram Repost Services ( Cheapest )",
  "YouTube Adwords Views ( ULTRA CHEAP )",
  "YouTube Comments ( New )",
  "YouTube Comments Likes ( One Click Done )",
  "YouTube Comments Reply Likes ( One Click Done )",
  "YouTube Likes ( Non -Drop )",
  "YouTube Likes ( Non-Drop )",
  "YouTube Likes ( One Click Done )",
  "YouTube Live Chat Comments Custom (( One Click Done ))",
  "YouTube Live Stream Likes (( 0% Drop Provider ))",
  "YouTube Live stream Views",
  "YouTube Live Stream Views ( Cheapest In The World )",
  "YouTube Live Stream Views + Likes [ 100% Concurrent ]",
  "YouTube Services ( ULTRA CHEAP )",
  "YouTube Social Ads Views [ Instant ]",
  "YouTube Subscribers ( Working Update )",
  "YouTube Views ( One Click Done)",
  "YouTube Views ( Adwords ) New 🆕",
  "YouTube Views ( Non - Drop )",
  "YouTube Views Fast ( Non -Drop )",
  "YouTube Views Native Ads ( 100% Indian 🇮🇳 )",
  "YouTube Views Native Ads ( One Click Done SERVER )",
  "Cheapest In The World",
  "Facebook Comments ( New )",
  "Facebook Comments ( Ultra Fast )",
  "Facebook Comments ( ULTRA FAST )",
  "Facebook Followers ( One Click Done )",
  "Facebook Followers ( Ultra Cheap )",
  "Facebook Followers New [ Non- Drop ]",
  "Facebook Group Members ( New )",
  "Facebook Group Members ( ULTRA FAST )",
  "Facebook Group Members [ Fast ]",
  "Facebook Group Members [ NoN~Drop ]",
  "Facebook Live Stream Viewers (100% Concurrent )",
  "Facebook Livestream ( Ultra Fast )",
  "Facebook Page Like + Followers [ S-3 ] Ultra Fast",
  "Facebook Page Likes Followers",
  "Facebook Page Likes + Followers Ultra Fast ( S -4 )",
  "Facebook Page Likes + Followers ( Updated )",
  "Facebook Page Likes+ Followers ( S-1 )",
  "Facebook Page Likes+ Followers ( S-2 ) ULTRA FAST",
  "Facebook Post Likes ( New )",
  "Facebook Post Likes ( Non -Drop )",
  "Facebook Post Likes ( One Click Done )",
  "Facebook Post Likes [ ULTRA FAST ]",
  "Facebook Post Reactions ( Cheapest )",
  "Facebook Post Reactions ( S -1 )",
  "Facebook Post Reactions ( ULTRA FAST )",
  "Facebook Post Reactions [ Fast ]",
  "Facebook Post Reactions [ ULTRA FAST ]",
  "Facebook Post Reactions [ Updated ]",
  "Facebook Post Reactions [ Working Update ]",
  "Facebook Post Reactions Cheapest 🚀",
  "Facebook Post Share ( Ultra Fast )",
  "Facebook Post Shares ( ULTRA FAST )",
  "Facebook Reels/ Video Views [ Non-Drop ]",
  "Facebook Services [ One click Done ]",
  "Facebook Services [ One Click Done ] Indian Mix 🇮🇳",
  "Facebook Services [ Working Update ]",
  "Facebook Story Reactions ( One Click Done )",
  "Facebook Story Views ( One Click Done )",
  "Facebook Updated Services",
  "Facebook Video/ Reels Views ( Non -Drop )",
  "Google Maps Reviews",
  "New Arrivals",
  "Tik tok Followers New ( Ultra Fast ) No Drop",
  "WhatsApp Channel Members [ Fast ] 🆕",
  "Youtube views ( Cheapest )",
];

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
  // Build a rank lookup from the manual order using the normalized key.
  const rank = new Map<string, number>();
  MANUAL_CATEGORY_ORDER.forEach((n, i) => rank.set(sortKey(n), i));
  const names = Array.from(map.keys()).sort((a, b) => {
    const ra = rank.get(sortKey(a));
    const rb = rank.get(sortKey(b));
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    // Anything not in the manual list goes to the end, alphabetically.
    return sortKey(a).localeCompare(sortKey(b));
  });
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
