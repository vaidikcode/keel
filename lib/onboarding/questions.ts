import { z } from "zod";
import { CATEGORY_IDS, type CategoryId } from "../market/categories";

const categoryIdSchema = z.enum(CATEGORY_IDS);
const lossToleranceSchema = z.union([
  z.literal(5),
  z.literal(10),
  z.literal(20),
  z.literal(40),
  z.literal("unknown"),
]);

const sharedFields = {
  intent: z.enum(["learn", "choose", "understand"]),
  goal: z.enum(["explore", "purchase", "wealth", "retirement"]),
  horizon: z.enum(["soon", "medium", "long", "future", "unknown"]),
  // ISO 3166-1 alpha-2 and ISO 4217, widened from enums so any country works.
  country: z.string().min(2).max(5),
  currency: z.string().min(3).max(3),
  experience: z.enum(["new", "some", "experienced"]),
  risk: z.enum(["careful", "balanced", "comfortable", "unknown"]),
  amount: z.number().min(0).max(1e9).nullable(),
  monthly: z.number().min(0).max(1e7).nullable(),
  emergency: z.enum(["yes", "no", "unknown"]),
  debt: z.enum(["yes", "no", "unknown"]),
};

/** Previous onboarding shape, kept only so saved drafts and rows migrate. */
export const profileV2Schema = z.object({
  version: z.literal(2),
  ...sharedFields,
  watch: z.enum(["all", "stocks", "funds", "crypto"]),
});
export type ProfileV2 = z.infer<typeof profileV2Schema>;

export const profileSchema = z.object({
  version: z.literal(3),
  ...sharedFields,
  interests: z.array(categoryIdSchema).max(7),
  lossTolerance: lossToleranceSchema,
  income: z.enum(["stable", "variable", "none", "unknown"]),
  // Where this person already reads about money. Optional on both sides: Zod
  // strips unknown keys, so a field missing here would be dropped on write.
  newsSources: z.array(z.string().min(1).max(60)).max(8).optional(),
});
export type Profile = z.infer<typeof profileSchema>;
export type LossTolerance = Profile["lossTolerance"];

export const defaultProfile: Profile = {
  version: 3,
  intent: "learn",
  goal: "explore",
  horizon: "unknown",
  country: "US",
  currency: "USD",
  experience: "new",
  interests: [],
  risk: "unknown",
  lossTolerance: "unknown",
  income: "unknown",
  amount: null,
  monthly: null,
  emergency: "unknown",
  debt: "unknown",
};

export const intentLabels: Record<Profile["intent"], string> = {
  learn: "Learn the basics",
  choose: "Explore investments for me",
  understand: "Understand an investment",
};
export const goalLabels: Record<Profile["goal"], string> = {
  explore: "Finding your first step",
  purchase: "Saving for something important",
  wealth: "Building long-term savings",
  retirement: "Planning for retirement",
};
export const horizonLabels: Record<Profile["horizon"], string> = {
  soon: "Within a year",
  medium: "1–3 years",
  long: "3–5 years",
  future: "More than 5 years",
  unknown: "Not sure yet",
};
const knownCountries: Record<string, string> = {
  US: "United States",
  IN: "India",
  GB: "United Kingdom",
  other: "Somewhere else",
};
export function countryLabel(code: string): string {
  if (knownCountries[code]) return knownCountries[code];
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
export const experienceLabels: Record<Profile["experience"], string> = {
  new: "Completely new to investing",
  some: "Tried a little",
  experienced: "Invest regularly",
};
export const riskLabels: Record<Profile["risk"], string> = {
  careful: "Smaller price changes",
  balanced: "Some price changes",
  comfortable: "Larger price changes",
  unknown: "Still exploring risk",
};
export const lossToleranceLabels: Record<string, string> = {
  "5": "A drop of about 5%",
  "10": "A drop of about 10%",
  "20": "A drop of about 20%",
  "40": "A drop of 40% or more",
  unknown: "Not sure how big a drop I could sit through",
};
export const incomeLabels: Record<Profile["income"], string> = {
  stable: "Steady income",
  variable: "Income varies month to month",
  none: "No income right now",
  unknown: "Prefer not to say",
};
export const emergencyLabels: Record<Profile["emergency"], string> = {
  yes: "Has money set aside for surprises",
  no: "No cash buffer yet",
  unknown: "Not sure about a cash buffer",
};
export const debtLabels: Record<Profile["debt"], string> = {
  yes: "Has high-interest borrowing",
  no: "No expensive debt",
  unknown: "Not sure about debt",
};
export const interestLabels: Record<CategoryId, string> = {
  "broad-funds": "Broad-market funds",
  "bond-cash": "Bond and cash funds",
  "large-stable": "Large, established companies",
  "growth-tech": "Growth and technology",
  dividend: "Dividend payers",
  crypto: "Crypto",
  international: "International funds",
};

export function lossToleranceLabel(value: LossTolerance): string {
  return lossToleranceLabels[String(value)] ?? lossToleranceLabels.unknown;
}

/** Every answer as a plain label, for summaries, chips and prompts. */
export function profileAnswers(profile: Profile): Record<string, string> {
  return {
    intent: intentLabels[profile.intent],
    interests: profile.interests.length
      ? profile.interests.map((id) => interestLabels[id]).join(", ")
      : "Help me explore",
    goal: goalLabels[profile.goal],
    horizon: horizonLabels[profile.horizon],
    country: countryLabel(profile.country),
    currency: profile.currency,
    experience: experienceLabels[profile.experience],
    risk: riskLabels[profile.risk],
    lossTolerance: lossToleranceLabel(profile.lossTolerance),
    amount:
      profile.amount === null
        ? "Amount not shared"
        : currencyFormat(profile.amount, profile.currency),
    monthly:
      profile.monthly === null
        ? "Monthly amount not shared"
        : `${currencyFormat(profile.monthly, profile.currency)} a month`,
    income: incomeLabels[profile.income],
    emergency: emergencyLabels[profile.emergency],
    debt: debtLabels[profile.debt],
  };
}

export const currencyFormat = (amount: number, currency = "USD") => {
  // Intl throws RangeError on an unknown currency code; fall back to a plain number.
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
  }
};

const watchToInterests: Record<ProfileV2["watch"], CategoryId[]> = {
  all: ["broad-funds", "bond-cash", "large-stable"],
  stocks: ["large-stable", "growth-tech", "dividend"],
  funds: ["broad-funds", "bond-cash", "international"],
  crypto: ["crypto", "broad-funds"],
};
const riskToLoss: Record<ProfileV2["risk"], LossTolerance> = {
  careful: 10,
  balanced: 20,
  comfortable: 40,
  unknown: "unknown",
};

export function migrateProfile(raw: unknown): Profile {
  const v3 = profileSchema.safeParse(raw);
  if (v3.success) return v3.data;
  const v2 = profileV2Schema.safeParse(raw);
  if (v2.success) {
    const { watch, ...rest } = v2.data;
    return {
      ...rest,
      version: 3,
      interests: watchToInterests[watch],
      lossTolerance: riskToLoss[rest.risk],
      income: "unknown",
    };
  }
  const old = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const watch = ["stocks", "funds", "crypto"].includes(String(old.watch))
    ? (old.watch as ProfileV2["watch"])
    : "all";
  const risk: Profile["risk"] =
    old.sleep === "steady"
      ? "careful"
      : old.sleep === "balanced"
        ? "balanced"
        : old.sleep === "spicy"
          ? "comfortable"
          : "unknown";
  return {
    ...defaultProfile,
    interests: raw && typeof raw === "object" && "watch" in old ? watchToInterests[watch] : [],
    risk,
    lossTolerance: riskToLoss[risk],
  };
}

export function nextStep(profile: Profile): string {
  if (profile.horizon === "unknown")
    return "Choose a time frame to make your comparisons more useful.";
  if (profile.lossTolerance === "unknown")
    return "Tell me how big a drop you could sit through, and I'll rank your options around it.";
  if (profile.intent !== "choose")
    return "Start with two options. Notice how differently their prices move.";
  if (
    profile.emergency === "unknown" ||
    profile.debt === "unknown" ||
    profile.amount === null
  )
    return "Tell me a little about your finances before we narrow down your options.";
  if (profile.emergency === "no" || profile.debt === "yes")
    return "Review your cash needs and borrowing costs before choosing investments.";
  if (profile.horizon === "soon")
    return "Compare how easily you can access your money and how much its value can change.";
  return "Compare diversification, costs and price changes alongside your goal.";
}
