import type { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { fetchBasicFinancials, fetchCompanyProfile } from "../dashboard/sources/finnhub";
import { pLimit } from "../http/fetchJson";
import { BENCHMARK, CATEGORY_BY_ID, historySourceFor, type CategoryId } from "./categories";
import { cachedTavily } from "./kvCache";
import { change1d, changeOver, computeRisk } from "./risk";
import type { CategorySnapshot, SnapshotAsset } from "./snapshotModel";
import { fetchBatchHistory } from "./sources/spark";
import { fetchCoinMarkets } from "./sources/geckoMarkets";

const FRESH_MS = 45 * 60_000;
const OFF_HOURS_MS = 3 * 3600_000;
export const STALE_OK_MS = 24 * 3600_000;

/** Rough US market session in UTC (09:30–16:30 ET spans 13:30–21:30 UTC across DST). */
export function isUsMarketOpen(now = new Date()): boolean {
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return false;
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  return minutes >= 13 * 60 && minutes <= 21 * 60 + 30;
}

export function ttlFor(categoryId: CategoryId, now = new Date()): number {
  if (categoryId === "crypto") return FRESH_MS;
  return isUsMarketOpen(now) ? FRESH_MS : OFF_HOURS_MS;
}

function monthLabel(now = new Date()): string {
  return now.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Fetch, score and store one category. Throws on total failure. */
export async function refreshCategory(
  client: ConvexHttpClient,
  categoryId: CategoryId,
): Promise<CategorySnapshot> {
  const category = CATEGORY_BY_ID[categoryId];
  const warnings: string[] = [];
  const symbols: Array<{ symbol: string; coinId?: string }> = category.assets.map((a) => ({
    symbol: a.yahooSymbol,
    coinId: a.coinId,
  }));
  if (!category.assets.some((a) => a.yahooSymbol === BENCHMARK.yahooSymbol))
    symbols.push({ symbol: BENCHMARK.yahooSymbol });

  const [{ series, warnings: historyWarnings }, coins] = await Promise.all([
    fetchBatchHistory(symbols),
    fetchCoinMarkets(category.assets.flatMap((a) => (a.coinId ? [a.coinId] : []))),
  ]);
  warnings.push(...historyWarnings);
  const benchmark = series.get(BENCHMARK.yahooSymbol) ?? [];
  if (!benchmark.length) warnings.push("benchmark:missing");

  const stocks = category.assets.filter((a) => a.kind === "stocks");
  // Both Finnhub calls for a symbol ride in the same task, so concurrency stays
  // at six rather than doubling. Funds are never asked: most ETFs answer the
  // financials endpoint with an empty object, and it would burn the budget.
  const company = await pLimit(
    stocks,
    6,
    async (a) =>
      [a.id, await fetchCompanyProfile(a.ticker), await fetchBasicFinancials(a.ticker)] as const,
  );
  const profiles = new Map(company.filter(([, p]) => p !== null).map(([id, p]) => [id, p]));
  const financials = new Map(company.filter(([, , f]) => f !== null).map(([id, , f]) => [id, f]));
  if (stocks.length && !profiles.size) warnings.push("finnhub:off");
  if (stocks.length && !financials.size) warnings.push("finnhub:metrics-off");

  const assets: SnapshotAsset[] = category.assets.map((a) => {
    const history = series.get(a.yahooSymbol.toUpperCase()) ?? [];
    const coin = a.coinId ? coins.get(a.coinId) : undefined;
    const profile = profiles.get(a.id) ?? null;
    const marketCapUsd =
      coin?.marketCapUsd ??
      (profile?.marketCapMillions ? profile.marketCapMillions * 1_000_000 : null);
    const risk = computeRisk({ closes: history, benchmark, marketCapUsd, kind: a.kind });
    const last = history.at(-1)?.value ?? null;
    return {
      id: a.id,
      ticker: a.ticker,
      name: a.name,
      kind: a.kind,
      price: coin?.price ?? last,
      change1dPct: coin?.change24hPct ?? change1d(history),
      change30dPct: coin?.change30dPct ?? changeOver(history, 30),
      change1yPct: coin?.change1yPct ?? changeOver(history, 365),
      history,
      historySource: historySourceFor(a),
      fundamentals: {
        marketCapUsd,
        industry: profile?.industry ?? null,
        website: profile?.website ?? null,
        rank: coin?.rank ?? null,
      },
      risk,
      // Spread conditionally: the validator is `v.optional()`, which accepts an
      // absent key but rejects an explicit undefined.
      ...(financials.get(a.id) ? { financials: { ...financials.get(a.id)!, asOf: Date.now() } } : {}),
      ...(coin ? { coinStats: { ...coin.stats, asOf: Date.now() } } : {}),
    };
  });
  if (!assets.some((a) => a.history.length)) throw new Error("No price history came back.");

  const movers = [...assets]
    .filter((a) => a.change1dPct !== null)
    .sort((a, b) => Math.abs(b.change1dPct!) - Math.abs(a.change1dPct!))
    .slice(0, 5)
    .map((a) => a.ticker);
  const factsQuery = `${category.label} risks and recent news ${movers.join(" ")} ${monthLabel()}`;
  const tavily = await cachedTavily(client, factsQuery);
  if (!tavily.available) warnings.push("tavily:off");

  const fetchedAt = Date.now();
  const snapshot: CategorySnapshot = {
    fetchedAt,
    expiresAt: fetchedAt + ttlFor(categoryId),
    benchmark: { ticker: BENCHMARK.ticker, history: benchmark.slice(-370) },
    assets: assets.map((a) => ({ ...a, history: a.history.slice(-370) })),
    facts: tavily.facts,
    factsQuery,
    warnings: [...new Set(warnings)].slice(0, 10),
  };
  await client.mutation(api.snapshots.put, { categoryId, snapshot });
  return snapshot;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type SnapshotDoc = CategorySnapshot & { status: "ready" | "refreshing" | "failed"; categoryId: string };

/**
 * Get a usable snapshot: fresh from cache, or stale-while-revalidate, or a
 * locked inline refresh. `schedule` runs the background refresh (Next's after()).
 */
export async function ensureSnapshot(
  client: ConvexHttpClient,
  categoryId: CategoryId,
  options: { force?: boolean; schedule?: (task: () => Promise<void>) => void } = {},
): Promise<{ snapshot: CategorySnapshot | null; stale: boolean; refreshing: boolean }> {
  const now = Date.now();
  const [existing] = await client.query(api.snapshots.getMany, { categoryIds: [categoryId] });
  const usable = existing && existing.assets.length > 0 ? (existing as SnapshotDoc) : null;
  if (usable && !options.force && usable.expiresAt > now)
    return { snapshot: usable, stale: false, refreshing: false };

  // Serve stale up to a day and refresh in the background.
  if (usable && !options.force && now - usable.fetchedAt < STALE_OK_MS && options.schedule) {
    options.schedule(async () => {
      const claim = await client.mutation(api.snapshots.claimRefresh, { categoryId, now: Date.now() });
      if (claim !== "claimed") return;
      try {
        await refreshCategory(client, categoryId);
      } catch (error) {
        await client.mutation(api.snapshots.release, {
          categoryId,
          status: "failed",
          warning: `refresh:${error instanceof Error ? error.message.slice(0, 80) : "failed"}`,
        });
      }
    });
    return { snapshot: usable, stale: true, refreshing: true };
  }

  const claim = await client.mutation(api.snapshots.claimRefresh, {
    categoryId,
    now,
    force: options.force === true,
  });
  if (claim === "claimed") {
    try {
      const snapshot = await refreshCategory(client, categoryId);
      return { snapshot, stale: false, refreshing: false };
    } catch (error) {
      await client.mutation(api.snapshots.release, {
        categoryId,
        status: "failed",
        warning: `refresh:${error instanceof Error ? error.message.slice(0, 80) : "failed"}`,
      });
      return { snapshot: usable, stale: Boolean(usable), refreshing: false };
    }
  }
  if (claim === "fresh") {
    const [row] = await client.query(api.snapshots.getMany, { categoryIds: [categoryId] });
    return { snapshot: (row as SnapshotDoc) ?? usable, stale: false, refreshing: false };
  }
  // busy: another request is refreshing; wait a little for it.
  for (let i = 0; i < 4; i += 1) {
    await sleep(1500);
    const [row] = await client.query(api.snapshots.getMany, { categoryIds: [categoryId] });
    if (row && row.status === "ready" && row.assets.length)
      return { snapshot: row as SnapshotDoc, stale: row.expiresAt < Date.now(), refreshing: false };
  }
  return { snapshot: usable, stale: Boolean(usable), refreshing: true };
}
