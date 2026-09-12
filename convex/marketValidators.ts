import { v } from "convex/values";

export const pointV = v.object({ date: v.string(), value: v.number() });
export const kindV = v.union(
  v.literal("funds"),
  v.literal("stocks"),
  v.literal("crypto"),
);
export const riskLabelV = v.union(
  v.literal("low"),
  v.literal("moderate"),
  v.literal("high"),
  v.literal("very-high"),
);
export const riskV = v.object({
  score: v.number(),
  label: riskLabelV,
  components: v.object({
    volatility: v.number(),
    maxDrawdown: v.number(),
    downside: v.number(),
    worst30: v.number(),
    beta: v.number(),
    size: v.number(),
    concentration: v.number(),
  }),
  raw: v.object({
    annualVol: v.number(),
    maxDrawdownPct: v.number(),
    downsideDev: v.number(),
    worst30Pct: v.number(),
    beta: v.union(v.number(), v.null()),
    marketCapUsd: v.union(v.number(), v.null()),
    observations: v.number(),
  }),
});
export const snapshotAssetV = v.object({
  id: v.string(),
  ticker: v.string(),
  name: v.string(),
  kind: kindV,
  price: v.union(v.number(), v.null()),
  change1dPct: v.union(v.number(), v.null()),
  change30dPct: v.union(v.number(), v.null()),
  change1yPct: v.union(v.number(), v.null()),
  history: v.array(pointV),
  historySource: v.string(),
  fundamentals: v.object({
    marketCapUsd: v.union(v.number(), v.null()),
    industry: v.union(v.string(), v.null()),
    website: v.union(v.string(), v.null()),
    rank: v.union(v.number(), v.null()),
  }),
  risk: v.union(riskV, v.null()),
});
export const factV = v.object({
  title: v.string(),
  url: v.string(),
  snippet: v.string(),
  publishedAt: v.union(v.string(), v.null()),
  source: v.literal("tavily"),
});
export const snapshotStatusV = v.union(
  v.literal("ready"),
  v.literal("refreshing"),
  v.literal("failed"),
);
export const categorySnapshotFields = {
  categoryId: v.string(),
  fetchedAt: v.number(),
  expiresAt: v.number(),
  status: snapshotStatusV,
  lockedAt: v.optional(v.number()),
  benchmark: v.object({ ticker: v.string(), history: v.array(pointV) }),
  assets: v.array(snapshotAssetV),
  facts: v.array(factV),
  factsQuery: v.optional(v.string()),
  warnings: v.array(v.string()),
};
export const newsItemV = v.object({
  headline: v.string(),
  url: v.string(),
  asOf: v.string(),
  source: v.string(),
});
export const secFactV = v.object({
  label: v.string(),
  text: v.string(),
  asOf: v.string(),
  url: v.string(),
});
export const assetDetailsFields = {
  assetId: v.string(),
  fetchedAt: v.number(),
  expiresAt: v.number(),
  news: v.array(newsItemV),
  secFacts: v.array(secFactV),
  facts: v.array(factV),
  coin: v.optional(
    v.object({
      description: v.string(),
      circulatingSupply: v.union(v.number(), v.null()),
      marketCapUsd: v.union(v.number(), v.null()),
    }),
  ),
};
export const keelThoughtsFields = {
  sessionId: v.string(),
  revision: v.number(),
  categoryId: v.string(),
  snapshotFetchedAt: v.number(),
  paragraphs: v.array(v.string()),
  because: v.array(v.object({ field: v.string(), text: v.string() })),
  sourceIds: v.array(v.string()),
  createdAt: v.number(),
};
export const kvFields = {
  key: v.string(),
  value: v.any(),
  fetchedAt: v.number(),
  expiresAt: v.number(),
};
