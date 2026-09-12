import { BENCHMARK, CATEGORY_BY_ID, CATEGORIES, historySourceFor, type CategoryId } from "../market/categories";
import { computeRisk } from "../market/risk";
import type { CategorySnapshot, Point, SnapshotAsset } from "../market/snapshotModel";
import { defaultProfile, type Profile } from "../onboarding/questions";

export const sampleProfile: Profile = {
  ...defaultProfile,
  interests: ["broad-funds", "large-stable"],
  goal: "wealth",
  horizon: "future",
  risk: "balanced",
  lossTolerance: 20,
  income: "stable",
  emergency: "yes",
  debt: "no",
  amount: 1000,
  monthly: 100,
};

/** Deterministic wobble so the demo never looks like real prices. */
function synthetic(seed: number, drift: number, wobble: number, days = 366): Point[] {
  const start = Date.UTC(2025, 8, 12);
  return Array.from({ length: days }, (_, day) => ({
    date: new Date(start + day * 86400000).toISOString().slice(0, 10),
    value:
      Math.round(
        (100 +
          day * drift +
          Math.sin(day / 17 + seed) * wobble -
          Math.exp(-(((day - 170) / 28) ** 2)) * wobble * 3 +
          Math.sin(day * 1.6 + seed) * wobble * 0.3) *
          100,
      ) / 100,
  }));
}

const KIND_PARAMS = {
  funds: { drift: 0.045, wobble: 4 },
  stocks: { drift: 0.07, wobble: 9 },
  crypto: { drift: 0.16, wobble: 22 },
} as const;

export function sampleSnapshot(categoryId: CategoryId): CategorySnapshot {
  const category = CATEGORY_BY_ID[categoryId];
  const benchmark = synthetic(1, 0.05, 4);
  const assets: SnapshotAsset[] = category.assets.map((a, i) => {
    const params = KIND_PARAMS[a.kind];
    const bondish = categoryId === "bond-cash";
    const history = synthetic(
      i + 2,
      bondish ? 0.008 : params.drift * (1 + (i % 3) * 0.2),
      bondish ? 1 : params.wobble * (1 + (i % 4) * 0.35),
    );
    const marketCapUsd = a.kind === "funds" ? null : a.kind === "crypto" ? 5e10 / (i + 1) : 8e11 / (i + 1);
    const last = history.at(-1)!.value,
      prev = history.at(-2)!.value;
    return {
      id: a.id,
      ticker: a.ticker,
      name: a.name,
      kind: a.kind,
      price: last,
      change1dPct: (last / prev - 1) * 100,
      change30dPct: (last / history.at(-31)!.value - 1) * 100,
      change1yPct: (last / history[0].value - 1) * 100,
      history,
      historySource: historySourceFor(a),
      fundamentals: { marketCapUsd, industry: null, website: null, rank: null },
      risk: computeRisk({ closes: history, benchmark, marketCapUsd, kind: a.kind }),
    };
  });
  return {
    fetchedAt: 0,
    expiresAt: 0,
    benchmark: { ticker: BENCHMARK.ticker, history: benchmark },
    assets,
    facts: [],
    factsQuery: undefined,
    warnings: ["sample"],
  };
}

export function sampleAllSnapshots(): Map<CategoryId, CategorySnapshot> {
  return new Map(CATEGORIES.map((c) => [c.id, sampleSnapshot(c.id)]));
}
