import type { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { fetchCompanyNews } from "../dashboard/sources/finnhub";
import { fetchFinancialEvidence } from "../dashboard/sources/evidence";
import { fetchCoinFiling } from "../dashboard/sources/coingecko";
import { searchYahoo } from "../dashboard/sources/yahoo";
import type { Asset } from "./categories";
import { cachedTavily, cikCache } from "./kvCache";
import type { AssetDetails, NewsItem } from "./snapshotModel";

const NEWS_TTL = 30 * 60_000;

async function newsFor(asset: Asset): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
  if (asset.kind === "stocks") {
    for (const n of await fetchCompanyNews(asset.ticker)) {
      if (!n.url) continue;
      items.push({
        headline: n.headline.slice(0, 200),
        url: n.url,
        asOf: n.datetime > 0 ? new Date(n.datetime * 1000).toISOString().slice(0, 10) : "",
        source: "Finnhub",
      });
    }
  }
  if (items.length < 3) {
    const yahoo = await searchYahoo(asset.kind === "crypto" ? asset.name : asset.ticker);
    for (const n of yahoo.news)
      items.push({ headline: n.title, url: n.url, asOf: n.asOf ?? "", source: n.publisher ?? "Yahoo Finance" });
  }
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.url) ? false : (seen.add(i.url), true))).slice(0, 8);
}

export async function refreshDetails(client: ConvexHttpClient, asset: Asset): Promise<AssetDetails> {
  const [news, secFacts, coinLines, tavily] = await Promise.all([
    newsFor(asset),
    asset.kind === "stocks" ? fetchFinancialEvidence(asset.ticker, cikCache(client)) : Promise.resolve([]),
    asset.kind === "crypto" && asset.coinId ? fetchCoinFiling(asset.coinId) : Promise.resolve([]),
    cachedTavily(client, `${asset.name} ${asset.ticker} risks and recent news`),
  ]);
  const fetchedAt = Date.now();
  const details: AssetDetails = {
    fetchedAt,
    expiresAt: fetchedAt + NEWS_TTL,
    news,
    secFacts: secFacts.map((e) => ({ label: e.label, text: e.text, asOf: e.asOf, url: e.url })),
    facts: tavily.facts,
    coin: coinLines.length
      ? {
          description: coinLines[0] ?? "",
          circulatingSupply: null,
          marketCapUsd: null,
        }
      : undefined,
  };
  await client.mutation(api.assetDetails.put, { assetId: asset.id, details }).catch(() => {});
  return details;
}

export async function ensureDetails(
  client: ConvexHttpClient,
  asset: Asset,
  schedule?: (task: () => Promise<void>) => void,
): Promise<AssetDetails> {
  const existing = await client.query(api.assetDetails.get, { assetId: asset.id }).catch(() => null);
  if (existing && existing.expiresAt > Date.now()) return existing;
  if (existing && schedule) {
    schedule(async () => {
      await refreshDetails(client, asset).catch(() => {});
    });
    return existing;
  }
  return refreshDetails(client, asset);
}
