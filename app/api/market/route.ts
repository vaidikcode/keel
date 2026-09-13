import { z } from "zod";
import { convexForRequest } from "@/lib/server/convexClient";
import { kvGet, kvPut } from "@/lib/market/kvCache";
import { indexFor } from "@/lib/market/marketIndex";
import { fetchSpark } from "@/lib/market/sources/spark";
import { searchYahoo } from "@/lib/dashboard/sources/yahoo";
import { assetById } from "@/lib/market/categories";
import { changeOver, change1d } from "@/lib/market/risk";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * The reader's home market index, and headlines for what they have saved.
 *
 * Deliberately spends no model tokens at all. Both halves come from Yahoo's
 * keyless endpoints and are cached in the shared kv table, so a page view costs
 * at most two outbound requests and usually none. Headlines are passed through
 * verbatim with their publisher — Keel does not summarise them, which is what
 * would have made this expensive.
 */
const INDEX_TTL = 45 * 60_000;
const NEWS_TTL = 30 * 60_000;
/** Headlines are a sideline on this page, so the fan-out stays small. */
const MAX_TICKERS = 3;

const inputSchema = z.object({
  country: z.string().max(5).default("US"),
  assetIds: z.array(z.string().max(40)).max(12).default([]),
});

type IndexPayload = {
  symbol: string;
  name: string;
  isLocal: boolean;
  price: number | null;
  change1dPct: number | null;
  change30dPct: number | null;
  change1yPct: number | null;
  /** Dated closes, so the overview can draw the same chart as an asset page. */
  history: { date: string; value: number }[];
};

type NewsPayload = {
  ticker: string;
  name: string;
  headline: string;
  url: string;
  publisher: string | null;
  asOf: string | null;
};

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad request." }, { status: 400 });
  const { country, assetIds } = parsed.data;
  const client = convexForRequest();
  if (!client) return Response.json({ error: "Keel is temporarily unavailable." }, { status: 503 });

  const { index, isLocal } = indexFor(country);

  const indexKey = `index:v2:${index.symbol}`;
  let payload = await kvGet<IndexPayload>(client, indexKey);
  if (!payload) {
    const series = await fetchSpark([index.symbol]).catch(() => new Map());
    const history = series.get(index.symbol.toUpperCase()) ?? series.get(index.symbol) ?? [];
    if (history.length) {
      payload = {
        symbol: index.symbol,
        name: index.name,
        isLocal,
        price: history.at(-1)?.value ?? null,
        change1dPct: change1d(history),
        change30dPct: changeOver(history, 30),
        change1yPct: changeOver(history, 365),
        history,
      };
      await kvPut(client, indexKey, payload, INDEX_TTL);
    }
  }
  // `isLocal` depends on who is asking, not on the cached index itself.
  const marketIndex = payload ? { ...payload, name: index.name, isLocal } : null;

  const tickers = assetIds
    .map((id) => assetById(id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .slice(0, MAX_TICKERS);

  const news: NewsPayload[] = [];
  for (const asset of tickers) {
    const key = `news:${asset.ticker}`;
    const cached = await kvGet<NewsPayload[]>(client, key);
    let items = cached;
    if (!items) {
      const found = await searchYahoo(`${asset.ticker} ${asset.name}`).catch(() => null);
      items = (found?.news ?? []).slice(0, 2).map((n) => ({
        ticker: asset.ticker,
        name: asset.name,
        headline: n.title,
        url: n.url,
        publisher: n.publisher,
        asOf: n.asOf,
      }));
      await kvPut(client, key, items, NEWS_TTL);
    }
    news.push(...items);
  }

  return Response.json({ index: marketIndex, news: news.slice(0, 6) });
}
