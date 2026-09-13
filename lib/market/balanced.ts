import { percentiles } from "./objective";
import type { RankedAsset } from "./snapshotModel";

/**
 * The ten most balanced things Keel follows, across all three asset classes.
 *
 * "Balanced" is not "best" and not "safest". It means an asset that does no one
 * thing to an extreme: middling risk rather than the calmest or the wildest, a
 * year behind it that is positive without being a spike, a shallow worst fall,
 * and enough history to have been measured properly. Something that only ever
 * sits still scores no better here than something that only ever lurches.
 *
 * The same list for everyone — it reads nothing from the reader's answers, so
 * it is a description of the assets, not a suggestion for a person.
 */

/** Distance from the middle of a 0-100 band, folded so 0 is dead centre. */
function centredness(score: number | null, middle = 45): number | null {
  if (score === null) return null;
  return -Math.abs(score - middle);
}

export function rankBalanced(assets: RankedAsset[], limit = 10): RankedAsset[] {
  if (assets.length === 0) return [];

  // Risk near the middle of the range, not at either end.
  const middling = percentiles(assets.map((a) => centredness(a.risk?.score ?? null)));
  // A year that went up, but a spike is not balance — closeness to a steady
  // double-digit year beats both a crash and a moonshot.
  const steadyYear = percentiles(
    assets.map((a) => (a.change1yPct === null ? null : -Math.abs(a.change1yPct - 12))),
  );
  // Shallow worst falls.
  const shallow = percentiles(
    assets.map((a) => (a.risk ? -a.risk.raw.maxDrawdownPct : null)),
  );
  // Long enough to have been measured.
  const tenure = percentiles(assets.map((a) => a.risk?.raw.observations ?? null));

  const WEIGHTS = { middling: 0.4, steadyYear: 0.25, shallow: 0.2, tenure: 0.15 };
  return assets
    .map((asset, i) => ({
      asset,
      score:
        middling[i] * WEIGHTS.middling +
        steadyYear[i] * WEIGHTS.steadyYear +
        shallow[i] * WEIGHTS.shallow +
        tenure[i] * WEIGHTS.tenure,
      // An asset with no risk reading has not been measured, so it cannot be
      // called balanced. It sorts last rather than being dropped silently.
      measured: asset.risk !== null,
    }))
    .sort((a, b) => {
      if (a.measured !== b.measured) return a.measured ? -1 : 1;
      return b.score - a.score;
    })
    .slice(0, limit)
    .map(({ asset }, i) => ({ ...asset, rank: i + 1 }));
}
