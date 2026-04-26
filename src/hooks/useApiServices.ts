import { useEffect, useState } from "react";
import type { Category, Service } from "@/data/services";

const API_URL = "https://www.prime-spot.store/api/services";

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

type State = {
  categories: Category[];
  loading: boolean;
  error: string | null;
};

function normalize(list: ApiService[]): Category[] {
  const order: string[] = [];
  const map = new Map<string, Service[]>();
  for (const s of list) {
    const cat = s.category ?? "Other";
    if (!map.has(cat)) {
      order.push(cat);
      map.set(cat, []);
    }
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
  return order.map((name, i) => ({
    id: `cat-${i + 1}`,
    name,
    services: map.get(name)!,
  }));
}

export function useApiServices(): State {
  const [state, setState] = useState<State>({
    categories: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ApiService[] = await res.json();
        if (cancelled) return;
        setState({
          categories: normalize(data),
          loading: false,
          error: null,
        });
      } catch (e: any) {
        if (cancelled) return;
        setState({
          categories: [],
          loading: false,
          error: e?.message ?? "Failed to load services",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export const supportWhatsapp = "https://wa.me/918848490476";
