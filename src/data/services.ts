import raw from "./services.json";

export type Service = {
  id: string;
  name: string;
  category: string;
  rate: number; // INR per 1000
  min: number;
  max: number;
  description: string;
};

export type Category = {
  id: string;
  name: string;
  services: Service[];
};

const all = raw as Service[];

// Group services by category, preserving first-seen original order as fallback
const originalOrder: string[] = [];
const map = new Map<string, Service[]>();
for (const s of all) {
  if (!map.has(s.category)) {
    originalOrder.push(s.category);
    map.set(s.category, []);
  }
  map.get(s.category)!.push(s);
}

// Normalize a string for fuzzy matching: convert mathematical bold letters
// to plain ASCII, lowercase, strip non-alphanumerics. This way the user's
// stylised list matches the stylised category names in the source data.
const normalize = (str: string): string => {
  let out = "";
  for (const ch of str) {
    const cp = ch.codePointAt(0)!;
    // Mathematical Bold A-Z (U+1D400-U+1D419) -> A-Z
    if (cp >= 0x1d400 && cp <= 0x1d419) out += String.fromCharCode(65 + (cp - 0x1d400));
    // Mathematical Bold a-z (U+1D41A-U+1D433) -> a-z
    else if (cp >= 0x1d41a && cp <= 0x1d433) out += String.fromCharCode(97 + (cp - 0x1d41a));
    // Mathematical Bold digits 0-9 (U+1D7CE-U+1D7D7)
    else if (cp >= 0x1d7ce && cp <= 0x1d7d7) out += String.fromCharCode(48 + (cp - 0x1d7ce));
    // Mathematical Sans-Serif Bold A-Z (U+1D5D4-U+1D5ED) -> A-Z
    else if (cp >= 0x1d5d4 && cp <= 0x1d5ed) out += String.fromCharCode(65 + (cp - 0x1d5d4));
    // Mathematical Sans-Serif Bold a-z (U+1D5EE-U+1D607) -> a-z
    else if (cp >= 0x1d5ee && cp <= 0x1d607) out += String.fromCharCode(97 + (cp - 0x1d5ee));
    else out += ch;
  }
  return out.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// User-defined display order (from the Winter Sale list)
const desiredOrderRaw = [
  "Winter Sale",
  "IG Followers 100% Old Account+ 15 Post ( Non - Drop ) ( Updated on 25/1/2026 )",
  "IG Followers Old Accounts Emergency Update ( One Click Done )",
  "Instagram Followers ( Ultra Cheap )",
  "Instagram Followers ( Almost No Drop ) One Click Done",
  "Instagram Followers ( Available Only On S S )",
  "Instagram Followers ( Big Base Profiles Accepted )",
  "Instagram Followers ( ULTRA CHEAP ) Big base profiles Accepted",
  "Instagram Followers 100% Indian",
  "Instagram Followers 100% Old Accounts",
  "Instagram Followers 100% Old Accounts ( No/Low Drop )",
  "Instagram Followers 100% Real Accounts ( One Click Done )",
  "Instagram Followers 100% Real App Data",
  "Instagram Followers Cheapest ( Cheapest )",
  "Instagram Followers Old Accounts ( One Click Done )",
  "Instagram Followers Updated",
  "Instagram Likes ( 100% Indian )",
  "Instagram Likes ( 100% Indian )",
  "Instagram Likes ( Cheapest )",
  "Instagram Likes [ One Click Done )",
  "Instagram Likes 100% Indian ( Non -Drop )",
  "Instagram Likes 100% Indian ( Power Likes )",
  "Instagram Likes 100% Indian Quality",
  "Instagram Likes Old Accounts",
  "IG Reels Views [ Cheap ]",
  "Instagram Reels Views ( Updated )",
  "Instagram [ DM Services ]",
  "Instagram 100% Indian ( One Click Done ) Updated",
  "Instagram Comments ( INDIAN )",
  "Instagram Comments ( New )",
  "Instagram Comments [ Non~Drop ]",
  "Instagram live Video views [ NoN~Drop ]",
  "Instagram Poll Votes [ Working ]",
  "Instagram Post Save [ Indian ]",
  "Instagram Post Shares [ Indian ]",
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
  "YouTube Views ( Adwords ) New",
  "YouTube Views ( Non - Drop )",
  "YouTube Views Fast ( Non -Drop )",
  "YouTube Views Native Ads ( 100% Indian )",
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
  "Facebook Post Reactions Cheapest",
  "Facebook Post Share ( Ultra Fast )",
  "Facebook Post Shares ( ULTRA FAST )",
  "Facebook Reels/ Video Views [ Non-Drop ]",
  "Facebook Services [ One click Done ]",
  "Facebook Services [ One Click Done ] Indian Mix",
  "Facebook Services [ Working Update ]",
  "Facebook Story Reactions ( One Click Done )",
  "Facebook Story Views ( One Click Done )",
  "Facebook Updated Services",
  "Facebook Video/ Reels Views ( Non -Drop )",
  "Google Maps Reviews",
  "New Arrivals",
  "Tik tok Followers New ( Ultra Fast ) No Drop",
  "WhatsApp Channel Members [ Fast ]",
  "Youtube views ( Cheapest )",
];

// Build ordered list: matched categories first (in user order), then the rest
const usedKeys = new Set<string>();
const orderedCategories: string[] = [];
const normalizedMap = new Map<string, string>();
for (const cat of originalOrder) normalizedMap.set(normalize(cat), cat);

for (const desired of desiredOrderRaw) {
  const key = normalize(desired);
  const actual = normalizedMap.get(key);
  if (actual && !usedKeys.has(actual)) {
    orderedCategories.push(actual);
    usedKeys.add(actual);
  }
}
for (const cat of originalOrder) {
  if (!usedKeys.has(cat)) orderedCategories.push(cat);
}

export const categories: Category[] = orderedCategories.map((name, i) => ({
  id: `cat-${i + 1}`,
  name,
  services: map.get(name)!,
}));

export const supportWhatsapp = "https://wa.me/918848490476";
