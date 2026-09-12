import type { Investment, Dashboard } from "./model";
import type { Profile } from "../onboarding/questions";
import {
  CATEGORIES,
  historySourceFor,
  type Asset,
} from "../market/categories";
type CatalogEntry = Omit<Investment, "history" | "retrievedAt" | "evidence"> & {
  coinId?: string;
};
function toEntry(asset: Asset): CatalogEntry {
  return {
    id: asset.id,
    name: asset.name,
    ticker: asset.ticker,
    kind: asset.kind,
    coinId: asset.coinId,
    description: asset.description,
    tradeoff: asset.tradeoff,
    url: asset.url,
    historySource: historySourceFor(asset),
  };
}
/** Flat list of every asset Keel knows, derived from the category universes. */
export const CATALOG: CatalogEntry[] = CATEGORIES.flatMap((c) =>
  c.assets.map(toEntry),
);
/** Ordered so the demo picks a calm mix: VTI, VOO, BND, AAPL, NVDA, BTC. */
const SAMPLE_IDS = ["vti", "voo", "bnd", "aapl", "nvda", "btc"];
export function catalogFor(profile: Profile) {
  const wanted = new Set(
    profile.interests.flatMap(
      (id) => CATEGORIES.find((c) => c.id === id)?.assets.map((a) => a.id) ?? [],
    ),
  );
  if (!wanted.size) return CATALOG.filter((a) => SAMPLE_IDS.includes(a.id));
  return CATALOG.filter((a) => wanted.has(a.id)).slice(0, 12);
}
export function sampleDashboard(): Dashboard {
  const start = Date.UTC(2025, 8, 12);
  const assets = SAMPLE_IDS.map((id) => CATALOG.find((a) => a.id === id)!).map((a, index) => ({
    ...a,
    retrievedAt: 0,
    evidence: [],
    history: Array.from({ length: 366 }, (_, day) => ({
      date: new Date(start + day * 86400000).toISOString().slice(0, 10),
      value:
        Math.round(
          (100 +
            day * [0.045, 0.055, 0.009, 0.07, 0.11, 0.16][index] +
            Math.sin(day / 17 + index) * (index === 2 ? 1.8 : 5 + index) -
            Math.exp(-(((day - 170) / 28) ** 2)) *
              (index === 2 ? 2 : 16 + index * 3) +
            Math.sin(day * 1.6) * (index === 2 ? 0.3 : 1.4)) *
            100,
        ) / 100,
    })),
  }));
  return { version: 2, assets, generatedAt: 0, sample: true };
}
