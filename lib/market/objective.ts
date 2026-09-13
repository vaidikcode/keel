import type { RankedAsset } from "./snapshotModel";

/**
 * "Top 10" is deliberately not personalised: the same list for everyone.
 *
 * It cannot lean on the risk score, because the fit ranking already is one —
 * `fitFor()` maps risk to fit and nothing else, so any risk-led ordering here
 * would reproduce "You might be interested" almost exactly. Instead this
 * weighs what is objectively true of the asset itself: how big it is, how long
 * a record it has, how it has done over a year, and how deep its worst fall
 * was.
 *
 * Every input is ranked into a percentile across the set being sorted rather
 * than used raw, so the four can be mixed despite living on different scales.
 * Market cap in particular is absent for funds by design and for everything
 * when the fundamentals provider is off, so a missing value scores a neutral
 * 0.5 rather than sinking the asset.
 */
const WEIGHTS = { size: 0.35, tenure: 0.2, oneYear: 0.25, steadiness: 0.2 };

/** Position of each value within the set, 0 (lowest) to 1 (highest). */
function percentiles(values: (number | null)[]): number[] {
  const known = values.filter((v): v is number => v !== null).sort((a, b) => a - b);
  if (known.length < 2) return values.map(() => 0.5);
  return values.map((v) => {
    if (v === null) return 0.5;
    const below = known.findIndex((k) => k >= v);
    return below / (known.length - 1);
  });
}

export function rankObjectively(assets: RankedAsset[], limit = 10): RankedAsset[] {
  if (assets.length === 0) return [];
  // Log scale: market caps span four orders of magnitude, so the raw number
  // would make everything below the largest few indistinguishable.
  const size = percentiles(
    assets.map((a) => {
      const cap = a.risk?.raw.marketCapUsd ?? null;
      return cap !== null && cap > 0 ? Math.log10(cap) : null;
    }),
  );
  const tenure = percentiles(assets.map((a) => a.risk?.raw.observations ?? null));
  const oneYear = percentiles(assets.map((a) => a.change1yPct));
  // Negated: a shallower worst fall should score higher.
  const steadiness = percentiles(assets.map((a) => {
    const dd = a.risk?.raw.maxDrawdownPct;
    return dd === undefined ? null : -dd;
  }));

  return assets
    .map((asset, i) => ({
      asset,
      score:
        size[i] * WEIGHTS.size +
        tenure[i] * WEIGHTS.tenure +
        oneYear[i] * WEIGHTS.oneYear +
        steadiness[i] * WEIGHTS.steadiness,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ asset }, i) => ({ ...asset, rank: i + 1 }));
}
