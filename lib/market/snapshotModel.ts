import { z } from "zod";
import type { Risk } from "./risk";
import type { AssetKind } from "./categories";

export type Point = { date: string; value: number };
export type TavilyFact = {
  title: string;
  url: string;
  snippet: string;
  publishedAt: string | null;
  source: "tavily";
};
export type SnapshotAsset = {
  id: string;
  ticker: string;
  name: string;
  kind: AssetKind;
  price: number | null;
  change1dPct: number | null;
  change30dPct: number | null;
  change1yPct: number | null;
  history: Point[];
  historySource: string;
  fundamentals: {
    marketCapUsd: number | null;
    industry: string | null;
    website: string | null;
    rank: number | null;
  };
  risk: Risk | null;
};
export type CategorySnapshot = {
  fetchedAt: number;
  expiresAt: number;
  benchmark: { ticker: string; history: Point[] };
  assets: SnapshotAsset[];
  facts: TavilyFact[];
  factsQuery?: string;
  warnings: string[];
};
export type NewsItem = { headline: string; url: string; asOf: string; source: string };
export type SecFact = { label: string; text: string; asOf: string; url: string };
export type AssetDetails = {
  fetchedAt: number;
  expiresAt: number;
  news: NewsItem[];
  secFacts: SecFact[];
  facts: TavilyFact[];
  coin?: { description: string; circulatingSupply: number | null; marketCapUsd: number | null };
};

/** What the dashboard receives per asset: minimal, plus a short sparkline. */
export const rankedAssetSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  name: z.string(),
  kind: z.enum(["funds", "stocks", "crypto"]),
  price: z.number().nullable(),
  change1dPct: z.number().nullable(),
  change30dPct: z.number().nullable(),
  change1yPct: z.number().nullable(),
  spark: z.array(z.number()),
  risk: z
    .object({
      score: z.number(),
      label: z.enum(["low", "moderate", "high", "very-high"]),
      components: z.record(z.string(), z.number()),
      raw: z.object({
        annualVol: z.number(),
        maxDrawdownPct: z.number(),
        downsideDev: z.number(),
        worst30Pct: z.number(),
        beta: z.number().nullable(),
        marketCapUsd: z.number().nullable(),
        observations: z.number(),
      }),
    })
    .nullable(),
  fit: z.object({ score: z.number(), reasons: z.array(z.string()) }).nullable(),
  rank: z.number(),
  oneLiner: z.string(),
});
export type RankedAsset = z.infer<typeof rankedAssetSchema>;

export const factSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  publishedAt: z.string().nullable(),
});
export const thoughtsSchema = z.object({
  paragraphs: z.array(z.string()),
  because: z.array(z.object({ field: z.string(), text: z.string() })),
  sourceIds: z.array(z.string()),
});
export type Thoughts = z.infer<typeof thoughtsSchema>;
export const trendingItemSchema = z.object({
  assetId: z.string(),
  ticker: z.string(),
  name: z.string(),
  categoryId: z.string(),
  change1dPct: z.number().nullable(),
  spark: z.array(z.number()),
  reason: z.string(),
});
export type TrendingItem = z.infer<typeof trendingItemSchema>;
export const categoryResponseSchema = z.object({
  category: z.object({ id: z.string(), label: z.string(), short: z.string(), blurb: z.string() }),
  fetchedAt: z.number(),
  stale: z.boolean(),
  refreshing: z.boolean(),
  sample: z.boolean().default(false),
  capacity: z
    .object({
      score: z.number(),
      contributions: z.array(z.object({ field: z.string(), delta: z.number(), text: z.string() })),
    })
    .nullable(),
  assets: z.array(rankedAssetSchema),
  facts: z.array(factSchema),
  thoughts: thoughtsSchema.nullable(),
  trending: z.array(trendingItemSchema),
  warnings: z.array(z.string()),
});
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;

/** Downsample a history to at most `n` evenly spaced values. */
export function sparkline(history: Point[], n = 60): number[] {
  if (history.length <= n) return history.map((p) => p.value);
  const step = (history.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => history[Math.round(i * step)].value);
}
