import { useQuery } from "@tanstack/react-query";
import type { Category, Service } from "@/data/services";
import { categories as fallbackCategories } from "@/data/services";

const API_URL = "https://www.prime-spot.store/api/services";

// Markup multiplier applied to upstream rate (set to 1 for no markup)
export const PRICE_MARKUP = 1.5;

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

const toNum = (v: string | number) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const buildCategories = (raw: ApiService[]): Category[] => {
  const order: string[] = [];
  const map = new Map<string, Service[]>();
  for (const s of raw) {
    const cat = s.category || "Uncategorized";
    if (!map.has(cat)) {
      order.push(cat);
      map.set(cat, []);
    }
    map.get(cat)!.push({
      id: String(s.service),
      name: s.name,
      category: cat,
      rate: +(toNum(s.rate) * PRICE_MARKUP).toFixed(4),
      min: toNum(s.min),
      max: toNum(s.max),
      description: s.description || s.desc || "",
    });
  }
  return order.map((name, i) => ({
    id: `cat-${i + 1}`,
    name,
    services: map.get(name)!,
  }));
};

const fetchServices = async (): Promise<Category[]> => {
  const res = await fetch(API_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = (await res.json()) as ApiService[];
  if (!Array.isArray(data) || data.length === 0) throw new Error("Empty");
  return buildCategories(data);
};

export const useLiveServices = () => {
  const query = useQuery({
    queryKey: ["live-services"],
    queryFn: fetchServices,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    categories: query.data ?? fallbackCategories,
    isLoading: query.isLoading,
    isError: query.isError,
    isLive: !!query.data,
    refetch: query.refetch,
  };
};
