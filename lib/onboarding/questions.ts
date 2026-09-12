import { z } from "zod";

export const profileSchema = z.object({
  version: z.literal(2),
  intent: z.enum(["learn", "choose", "understand"]),
  goal: z.enum(["explore", "purchase", "wealth", "retirement"]),
  horizon: z.enum(["soon", "medium", "long", "future", "unknown"]),
  // ISO 3166-1 alpha-2 and ISO 4217. Widened from enums so the intake can
  // offer every country; mirrors convex/experienceValidators.ts.
  country: z.string().min(2).max(2),
  currency: z.string().min(3).max(3),
  experience: z.enum(["new", "some", "experienced"]),
  watch: z.enum(["all", "stocks", "funds", "crypto"]),
  risk: z.enum(["careful", "balanced", "comfortable", "unknown"]),
  amount: z.number().min(0).max(1e9).nullable(),
  monthly: z.number().min(0).max(1e7).nullable(),
  emergency: z.enum(["yes", "no", "unknown"]),
  debt: z.enum(["yes", "no", "unknown"]),
});
export type Profile = z.infer<typeof profileSchema>;
export const defaultProfile: Profile = {
  version: 2,
  intent: "learn",
  goal: "explore",
  horizon: "unknown",
  country: "US",
  currency: "USD",
  experience: "new",
  watch: "all",
  risk: "unknown",
  amount: null,
  monthly: null,
  emergency: "unknown",
  debt: "unknown",
};
export const goalLabels = {
  explore: "Finding your first step",
  purchase: "Saving for something important",
  wealth: "Building long-term savings",
  retirement: "Planning for retirement",
};
export const horizonLabels = {
  soon: "Within a year",
  medium: "1–3 years",
  long: "3–5 years",
  future: "More than 5 years",
  unknown: "Not sure yet",
};
export const riskLabels = {
  careful: "Smaller price changes",
  balanced: "Some price changes",
  comfortable: "Larger price changes",
  unknown: "Still exploring risk",
};
export const currencyFormat = (amount: number, currency = "USD") => {
  // Intl throws RangeError on an unknown currency code. Now that any ISO 4217
  // code can reach this, fall back to a plain number rather than crashing.
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(amount)} ${currency}`;
  }
};

export function migrateProfile(raw: unknown): Profile {
  const parsed = profileSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const old = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    ...defaultProfile,
    watch: ["stocks", "funds", "crypto"].includes(String(old.watch))
      ? (old.watch as Profile["watch"])
      : "all",
    risk:
      old.sleep === "steady"
        ? "careful"
        : old.sleep === "balanced"
          ? "balanced"
          : old.sleep === "spicy"
            ? "comfortable"
            : "unknown",
  };
}
export function nextStep(profile: Profile): string {
  if (profile.horizon === "unknown")
    return "Choose a time frame to make your comparisons more useful.";
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
