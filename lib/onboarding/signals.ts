import { z } from "zod";
import type { Profile } from "./questions";

/**
 * The five fixed intake answers. Every user answers exactly these, so the
 * result is a comparable basis across the whole user base rather than a
 * branch-dependent subset.
 */
export const intakeSchema = z.object({
  version: z.literal(1),
  vehicle: z.enum(["trading", "stocks", "crypto", "unsure"]),
  timescale: z.enum(["days", "months", "years", "decade"]),
  country: z.string().min(2).max(2),
  currency: z.string().min(3).max(3),
  budgetLow: z.number().min(0).max(1e9).nullable(),
  budgetHigh: z.number().min(0).max(1e9).nullable(),
  riskBand: z.enum(["high", "balanced", "low", "veryLow"]),
});
export type Intake = z.infer<typeof intakeSchema>;

export const defaultIntake: Intake = {
  version: 1,
  vehicle: "unsure",
  timescale: "years",
  country: "US",
  currency: "USD",
  budgetLow: null,
  budgetHigh: null,
  riskBand: "balanced",
};

export type Signals = {
  v: 1;
  capturedAt: number;
  revision: number;
  incomeShareCap: number;
  volatilityTolerance: "high" | "moderate" | "low" | "none";
  preferredKinds: string[];
  horizonDays: number;
  cadence: "day" | "month" | "year" | "decade";
  intradayIntent: boolean;
  overexposureFlag: boolean;
  balancedPortfolioRequired: boolean;
  confidence: "stated" | "inferred" | "default";
};

/**
 * Risk bands carry two separate ideas: how much of their income a person puts
 * in, and how much price movement they can live with. The label the user picks
 * describes the second; the share cap is the unstated consequence of the first.
 */
const RISK = {
  high: { cap: 0.25, tolerance: "high", balanced: false },
  balanced: { cap: 0.4, tolerance: "moderate", balanced: true },
  low: { cap: 0.6, tolerance: "low", balanced: true },
  veryLow: { cap: 1.0, tolerance: "none", balanced: true },
} as const;

const HORIZON = {
  days: { days: 1, cadence: "day" },
  months: { days: 30, cadence: "month" },
  years: { days: 365, cadence: "year" },
  decade: { days: 3650, cadence: "decade" },
} as const;

/** What a person can plausibly be shown, given what they picked and how long they hold it. */
function preferredKinds(intake: Intake): string[] {
  if (intake.vehicle === "crypto") return ["crypto"];
  if (intake.vehicle === "trading") return ["stocks", "crypto"];
  if (intake.vehicle === "stocks")
    return intake.timescale === "days" ? ["stocks"] : ["stocks", "funds"];
  return intake.timescale === "days"
    ? ["stocks", "crypto"]
    : ["stocks", "funds", "crypto"];
}

/**
 * The single contract for personalisation. Consumers read the stored `signals`
 * object; they must not re-derive meaning from question wording, which changes.
 */
export function deriveSignals(intake: Intake, revision = 0): Signals {
  const risk = RISK[intake.riskBand];
  const horizon = HORIZON[intake.timescale];
  const stated = intake.budgetLow !== null || intake.budgetHigh !== null;
  return {
    v: 1,
    capturedAt: Date.now(),
    revision,
    incomeShareCap: risk.cap,
    volatilityTolerance: risk.tolerance,
    preferredKinds: preferredKinds(intake),
    horizonDays: horizon.days,
    cadence: horizon.cadence,
    intradayIntent: intake.timescale === "days",
    overexposureFlag: intake.riskBand === "veryLow",
    balancedPortfolioRequired: risk.balanced,
    confidence: stated
      ? "stated"
      : intake.vehicle === "unsure"
        ? "default"
        : "inferred",
  };
}

/**
 * Keep the v2 profile populated from intake so every existing consumer
 * (catalogFor, nextStep, the spread route, the dashboard) keeps working
 * without knowing the intake exists.
 */
export function applyIntakeToProfile(profile: Profile, intake: Intake): Profile {
  const watch =
    intake.vehicle === "crypto"
      ? "crypto"
      : intake.vehicle === "stocks" || intake.vehicle === "trading"
        ? "stocks"
        : "all";
  const horizon =
    intake.timescale === "days"
      ? "soon"
      : intake.timescale === "months"
        ? "medium"
        : intake.timescale === "years"
          ? "long"
          : "future";
  const risk =
    intake.riskBand === "high"
      ? "comfortable"
      : intake.riskBand === "balanced"
        ? "balanced"
        : "careful";
  return {
    ...profile,
    watch,
    horizon,
    risk,
    country: intake.country,
    currency: intake.currency,
    amount: intake.budgetLow,
    monthly: intake.timescale === "months" ? intake.budgetLow : profile.monthly,
  };
}

/** "per day" / "in crypto" — the interpolated bits of the budget question. */
export const cadenceLabel: Record<Intake["timescale"], string> = {
  days: "per day",
  months: "per month",
  years: "per year",
  decade: "per decade",
};

export const assetLabel: Record<Intake["vehicle"], string> = {
  trading: "trading",
  stocks: "stocks",
  crypto: "crypto",
  unsure: "assets",
};
