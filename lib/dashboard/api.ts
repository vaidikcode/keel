import { z } from "zod";
export {
  categoryResponseSchema,
  rankedAssetSchema,
  thoughtsSchema,
  trendingItemSchema,
  type CategoryResponse,
  type RankedAsset,
  type Thoughts,
  type TrendingItem,
} from "../market/snapshotModel";

export const pointSchema = z.object({ date: z.string(), value: z.number() });
export const assetResponseSchema = z.object({
  sample: z.boolean(),
  asset: z.object({
    id: z.string(),
    ticker: z.string(),
    name: z.string(),
    kind: z.enum(["funds", "stocks", "crypto"]),
    description: z.string(),
    tradeoff: z.string(),
    url: z.string(),
    historySource: z.string(),
    price: z.number().nullable(),
    change1dPct: z.number().nullable(),
    change30dPct: z.number().nullable(),
    change1yPct: z.number().nullable(),
    history: z.array(pointSchema),
    fundamentals: z.object({
      marketCapUsd: z.number().nullable(),
      industry: z.string().nullable(),
      website: z.string().nullable(),
      rank: z.number().nullable(),
    }),
  }),
  category: z.object({ id: z.string(), label: z.string(), short: z.string() }),
  benchmark: z.object({ ticker: z.string(), history: z.array(pointSchema) }),
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
      explanations: z.record(z.string(), z.string()),
    })
    .nullable(),
  fit: z.object({ score: z.number(), reasons: z.array(z.string()) }).nullable(),
  rank: z.number(),
  of: z.number(),
  details: z.object({
    news: z.array(z.object({ headline: z.string(), url: z.string(), asOf: z.string(), source: z.string() })),
    secFacts: z.array(z.object({ label: z.string(), text: z.string(), asOf: z.string(), url: z.string() })),
    facts: z.array(z.object({ title: z.string(), url: z.string(), snippet: z.string(), publishedAt: z.string().nullable() })),
    coin: z.object({ description: z.string() }).partial().optional(),
  }),
  actionItems: z.array(z.object({ id: z.string(), kind: z.string(), title: z.string(), detail: z.string() })),
  peers: z.array(z.object({ id: z.string(), ticker: z.string(), name: z.string(), risk: z.number().nullable(), fit: z.number().nullable(), rank: z.number() })),
  fetchedAt: z.number(),
  warnings: z.array(z.string()),
});
export type AssetResponse = z.infer<typeof assetResponseSchema>;

export type KeelAskContext = {
  page: "dashboard" | `asset:${string}`;
  categoryId?: string;
  assetIds: string[];
  note?: string;
};

export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
export function formatPrice(value: number | null, kind: "funds" | "stocks" | "crypto"): string {
  if (value === null) return "—";
  const digits = kind === "crypto" && value < 1 ? 4 : 2;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits }).format(value);
}
export function formatPct(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(digits)}%`;
}

/**
 * First sentence of a paragraph. Keel's written view opens with a plain
 * definition of the category; that opening sentence is all the buddy says.
 */
export function splitLead(text: string): [string, string] {
  const match = text.match(/^(.+?[.!?])(\s+|$)([\s\S]*)$/);
  if (!match) return [text, ""];
  return [match[1], match[3] ?? ""];
}
