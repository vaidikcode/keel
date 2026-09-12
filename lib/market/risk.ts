import type { Point } from "../dashboard/model";
import { drawdown } from "../dashboard/model";
import type { AssetKind } from "./categories";

export type RiskLabel = "low" | "moderate" | "high" | "very-high";
export type RiskComponents = {
  volatility: number;
  maxDrawdown: number;
  downside: number;
  worst30: number;
  beta: number;
  size: number;
  concentration: number;
};
export type RiskRaw = {
  annualVol: number;
  maxDrawdownPct: number;
  downsideDev: number;
  worst30Pct: number;
  beta: number | null;
  marketCapUsd: number | null;
  observations: number;
};
export type Risk = {
  score: number;
  label: RiskLabel;
  components: RiskComponents;
  raw: RiskRaw;
};

export const RISK_WEIGHTS: Record<keyof RiskComponents, number> = {
  volatility: 0.3,
  maxDrawdown: 0.2,
  downside: 0.15,
  worst30: 0.1,
  beta: 0.05,
  size: 0.1,
  concentration: 0.1,
};
export const MIN_OBSERVATIONS = 120;
const MIN_BETA_OVERLAP = 60;

export const COMPONENT_EXPLANATIONS: Record<keyof RiskComponents, string> = {
  volatility: "How much the price jumps around from day to day.",
  maxDrawdown: "The biggest fall from a high point to a low point in the last year.",
  downside: "How often and how hard the bad days hit.",
  worst30: "The worst any 30-day stretch went in the last year.",
  beta: "How much it tends to move when the whole US market moves.",
  size: "Smaller or less established things can be pushed around more easily.",
  concentration: "Whether your money rides on one thing or is spread across many.",
};

export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}
/** Map x in [lo, hi] onto 0-100, clamped. */
export function scale(x: number, lo: number, hi: number): number {
  return clamp01((x - lo) / (hi - lo)) * 100;
}
export function logReturns(points: Point[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1].value,
      b = points[i].value;
    if (a > 0 && b > 0) out.push(Math.log(b / a));
  }
  return out;
}
function mean(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}
function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}
/** Align two daily series on shared dates; returns paired log returns. */
export function alignedReturns(a: Point[], b: Point[]): [number[], number[]] {
  const mb = new Map(b.map((p) => [p.date, p.value]));
  const shared = a.filter((p) => mb.has(p.date));
  const pa = logReturns(shared);
  const pb = logReturns(shared.map((p) => ({ date: p.date, value: mb.get(p.date)! })));
  return [pa, pb];
}
export function betaOf(asset: Point[], benchmark: Point[]): number | null {
  const [ra, rb] = alignedReturns(asset, benchmark);
  if (ra.length < MIN_BETA_OVERLAP) return null;
  const ma = mean(ra),
    mb = mean(rb);
  let cov = 0,
    varB = 0;
  for (let i = 0; i < ra.length; i += 1) {
    cov += (ra[i] - ma) * (rb[i] - mb);
    varB += (rb[i] - mb) ** 2;
  }
  if (varB === 0) return null;
  return cov / varB;
}
export function worst30(points: Point[]): number {
  let worst = 0;
  for (let i = 0; i + 30 < points.length; i += 1) {
    const change = (points[i + 30].value / points[i].value - 1) * 100;
    if (change < worst) worst = change;
  }
  return worst;
}
export function riskLabel(score: number): RiskLabel {
  if (score < 25) return "low";
  if (score < 50) return "moderate";
  if (score < 75) return "high";
  return "very-high";
}
export const riskLabelText: Record<RiskLabel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  "very-high": "Very high",
};

export function sizeScore(kind: AssetKind, marketCapUsd: number | null): number {
  if (kind === "funds") return 10;
  if (marketCapUsd === null || marketCapUsd <= 0) return 60;
  // >= $200B -> 0, $1B -> 100
  return scale(Math.log10(2e11) - Math.log10(marketCapUsd), 0, 2.3);
}
export function concentrationScore(kind: AssetKind): number {
  return kind === "funds" ? 0 : kind === "stocks" ? 60 : 100;
}

export function computeRisk(input: {
  closes: Point[];
  benchmark: Point[];
  marketCapUsd: number | null;
  kind: AssetKind;
}): Risk | null {
  const { closes, benchmark, marketCapUsd, kind } = input;
  if (closes.length < MIN_OBSERVATIONS) return null;
  const periods = kind === "crypto" ? 365 : 252;
  const returns = logReturns(closes);
  const annualVol = stdev(returns) * Math.sqrt(periods);
  const maxDrawdownPct = drawdown(closes) ?? 0;
  const negatives = returns.map((r) => Math.min(r, 0));
  const downsideDev =
    Math.sqrt(mean(negatives.map((r) => r * r))) * Math.sqrt(periods);
  const worst30Pct = worst30(closes);
  const beta = betaOf(closes, benchmark);
  const components: RiskComponents = {
    volatility: scale(annualVol, 0.05, 0.8),
    maxDrawdown: scale(maxDrawdownPct, 0, 60),
    downside: scale(downsideDev, 0, 0.5),
    worst30: scale(-worst30Pct, 0, 50),
    beta: beta === null ? 40 : scale(Math.max(beta, 0), 0, 2.5),
    size: sizeScore(kind, marketCapUsd),
    concentration: concentrationScore(kind),
  };
  const score = Math.round(
    (Object.keys(RISK_WEIGHTS) as Array<keyof RiskComponents>).reduce(
      (sum, key) => sum + RISK_WEIGHTS[key] * components[key],
      0,
    ),
  );
  return {
    score,
    label: riskLabel(score),
    components: Object.fromEntries(
      Object.entries(components).map(([k, v]) => [k, Math.round(v)]),
    ) as RiskComponents,
    raw: {
      annualVol,
      maxDrawdownPct,
      downsideDev,
      worst30Pct,
      beta,
      marketCapUsd,
      observations: closes.length,
    },
  };
}

/** Percent change between the last close and the close `days` earlier (calendar days). */
export function changeOver(points: Point[], days: number): number | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1];
  const target = Date.parse(last.date) - days * 86400000;
  let base: Point | null = null;
  for (const p of points) {
    if (Date.parse(p.date) <= target) base = p;
    else break;
  }
  // A history that spans (almost) the whole window starts at the base point.
  if (!base) {
    const span = Date.parse(last.date) - Date.parse(points[0].date);
    if (span >= days * 86400000 * 0.9) base = points[0];
  }
  if (!base) return null;
  return (last.value / base.value - 1) * 100;
}
export function change1d(points: Point[]): number | null {
  if (points.length < 2) return null;
  const a = points[points.length - 2].value,
    b = points[points.length - 1].value;
  return a > 0 ? (b / a - 1) * 100 : null;
}
