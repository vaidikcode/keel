import {
  debtLabels,
  emergencyLabels,
  experienceLabels,
  goalLabels,
  horizonLabels,
  incomeLabels,
  intentLabels,
  lossToleranceLabel,
  riskLabels,
  type Profile,
} from "../onboarding/questions";

export type Contribution = { field: keyof Profile | "amountRatio"; delta: number; text: string };
export type Capacity = { score: number; contributions: Contribution[] };
export type Fit = { score: number; reasons: string[] };

const RISK: Record<Profile["risk"], number> = { careful: -20, balanced: 0, comfortable: 15, unknown: -5 };
const LOSS: Record<string, number> = { "5": -20, "10": -8, "20": 5, "40": 15, unknown: -5 };
const HORIZON: Record<Profile["horizon"], number> = { soon: -20, medium: -8, long: 5, future: 12, unknown: -5 };
const EMERGENCY: Record<Profile["emergency"], number> = { yes: 5, no: -15, unknown: -5 };
const DEBT: Record<Profile["debt"], number> = { yes: -10, no: 3, unknown: -3 };
const INCOME: Record<Profile["income"], number> = { stable: 5, variable: -5, none: -12, unknown: -3 };
const EXPERIENCE: Record<Profile["experience"], number> = { new: -8, some: 0, experienced: 6 };
const GOAL: Record<Profile["goal"], number> = { retirement: 4, wealth: 2, explore: 0, purchase: -6 };
const INTENT: Record<Profile["intent"], number> = { learn: -3, choose: 0, understand: 0 };

export const CAPACITY_TABLE = { RISK, LOSS, HORIZON, EMERGENCY, DEBT, INCOME, EXPERIENCE, GOAL, INTENT };

function amountRatioDelta(profile: Profile): { delta: number; text: string } | null {
  if (profile.amount === null) return null;
  if (profile.monthly !== null && profile.monthly > 0) {
    const r = profile.amount / profile.monthly;
    if (r <= 6) return { delta: 4, text: "the amount is small next to what you can add each month" };
    if (r <= 24) return { delta: 0, text: "the amount is in line with what you add each month" };
    return { delta: -6, text: "the amount is large compared with what you add each month" };
  }
  if (profile.amount >= 10000) return { delta: -3, text: "you shared a sizeable amount without a monthly plan" };
  return { delta: 0, text: "you shared an amount you're considering" };
}

/** How much risk this person can comfortably carry, 0-100. Starts at 50. */
export function capacityFor(profile: Profile): Capacity {
  const contributions: Contribution[] = [
    { field: "risk", delta: RISK[profile.risk], text: riskLabels[profile.risk] },
    { field: "lossTolerance", delta: LOSS[String(profile.lossTolerance)] ?? -5, text: lossToleranceLabel(profile.lossTolerance) },
    { field: "horizon", delta: HORIZON[profile.horizon], text: horizonLabels[profile.horizon] },
    { field: "emergency", delta: EMERGENCY[profile.emergency], text: emergencyLabels[profile.emergency] },
    { field: "debt", delta: DEBT[profile.debt], text: debtLabels[profile.debt] },
    { field: "income", delta: INCOME[profile.income], text: incomeLabels[profile.income] },
    { field: "experience", delta: EXPERIENCE[profile.experience], text: experienceLabels[profile.experience] },
    { field: "goal", delta: GOAL[profile.goal], text: goalLabels[profile.goal] },
    { field: "intent", delta: INTENT[profile.intent], text: intentLabels[profile.intent] },
  ];
  const ratio = amountRatioDelta(profile);
  if (ratio) contributions.push({ field: "amountRatio", ...ratio });
  const raw = 50 + contributions.reduce((s, c) => s + c.delta, 0);
  return { score: Math.round(Math.min(100, Math.max(0, raw))), contributions };
}

/** Too-risky is penalised ~3x harder than too-calm on purpose. */
export function fitScore(assetRisk: number, capacity: number): number {
  const gap = assetRisk - capacity;
  const fit = gap > 0 ? 100 - 1.6 * gap : 100 - 0.6 * -gap;
  return Math.round(Math.max(0, Math.min(100, fit)));
}

export function fitFor(assetRisk: number, capacity: Capacity): Fit {
  const reasons = [...capacity.contributions]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3)
    .map((c) => `Because you said: ${c.text}`);
  return { score: fitScore(assetRisk, capacity.score), reasons };
}

/** Sort by fit desc, then lower risk first, then id for determinism. */
export function rankByFit<T extends { id: string; riskScore: number | null; fitScore: number | null }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const fa = a.fitScore ?? -1,
      fb = b.fitScore ?? -1;
    if (fb !== fa) return fb - fa;
    const ra = a.riskScore ?? 101,
      rb = b.riskScore ?? 101;
    if (ra !== rb) return ra - rb;
    return a.id.localeCompare(b.id);
  });
}
