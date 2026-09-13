import type { Profile } from "../onboarding/questions";
import { CATEGORY_BY_ID, type CategoryId } from "./categories";
import { capacityFor, fitFor, rankByFit, type Capacity } from "./fit";
import type { CategorySnapshot, RankedAsset, TrendingItem } from "./snapshotModel";
import { sparkline } from "./snapshotModel";
import { priceIndicators } from "./indicators";

export function rankSnapshot(
  snapshot: CategorySnapshot,
  profile: Profile | null,
): { assets: RankedAsset[]; capacity: Capacity | null } {
  const capacity = profile ? capacityFor(profile) : null;
  const scored = snapshot.assets.map((a) => {
    const fit = a.risk && capacity ? fitFor(a.risk.score, capacity) : null;
    return {
      id: a.id,
      riskScore: a.risk?.score ?? null,
      fitScore: fit?.score ?? (a.risk ? 100 - a.risk.score : null),
      asset: a,
      fit,
    };
  });
  const description = (id: string) =>
    CATEGORY_BY_ID[
      (Object.keys(CATEGORY_BY_ID) as CategoryId[]).find((c) =>
        CATEGORY_BY_ID[c].assets.some((x) => x.id === id),
      ) ?? "broad-funds"
    ].assets.find((x) => x.id === id)?.description ?? "";
  const assets = rankByFit(scored).map((row, index) => ({
    id: row.asset.id,
    ticker: row.asset.ticker,
    name: row.asset.name,
    kind: row.asset.kind,
    price: row.asset.price,
    change1dPct: row.asset.change1dPct,
    change30dPct: row.asset.change30dPct,
    change1yPct: row.asset.change1yPct,
    spark: sparkline(row.asset.history, 60),
    risk: row.asset.risk,
    fit: row.fit,
    rank: index + 1,
    oneLiner: description(row.asset.id),
    historySource: row.asset.historySource,
    // Indicators have to be computed here, against the stored history. `spark`
    // is 60 points spread across a year, so consecutive values sit about six
    // trading days apart — a 50-day average cannot be recovered from it, and a
    // 14-period RSI over it would silently be an 84-day one.
    metrics: {
      ...priceIndicators(row.asset.history.map((p) => p.value)),
      marketCapUsd: row.asset.fundamentals.marketCapUsd,
      industry: row.asset.fundamentals.industry,
      coinRank: row.asset.fundamentals.rank,
      financials: row.asset.financials ?? null,
      coinStats: row.asset.coinStats ?? null,
    },
  }));
  return { assets, capacity };
}

/** Biggest one-day moves across whatever snapshots are already cached. */
export function trendingFrom(
  snapshots: Array<{ categoryId: string; snapshot: CategorySnapshot }>,
  limit = 8,
): TrendingItem[] {
  return snapshots
    .flatMap(({ categoryId, snapshot }) =>
      snapshot.assets
        .filter((a) => a.change1dPct !== null && a.history.length > 5)
        .map((a) => ({
          assetId: a.id,
          ticker: a.ticker,
          name: a.name,
          categoryId,
          change1dPct: a.change1dPct,
          spark: sparkline(a.history.slice(-30), 20),
          reason: (a.change1dPct ?? 0) >= 0 ? "Biggest rise today" : "Biggest fall today",
        })),
    )
    .sort((a, b) => Math.abs(b.change1dPct ?? 0) - Math.abs(a.change1dPct ?? 0))
    .slice(0, limit);
}
