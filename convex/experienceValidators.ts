import { v } from "convex/values";
export const profileV2 = v.object({
  version: v.literal(2),
  intent: v.union(
    v.literal("learn"),
    v.literal("choose"),
    v.literal("understand"),
  ),
  goal: v.union(
    v.literal("explore"),
    v.literal("purchase"),
    v.literal("wealth"),
    v.literal("retirement"),
  ),
  horizon: v.union(
    v.literal("soon"),
    v.literal("medium"),
    v.literal("long"),
    v.literal("future"),
    v.literal("unknown"),
  ),
  // Widened from a 3/4-literal union to a free string so the intake can offer
  // every ISO 3166 country and its ISO 4217 currency. Widening is safe for the
  // schema push: every stored value ("US", "USD", ...) is already a string.
  country: v.string(),
  currency: v.string(),
  experience: v.union(
    v.literal("new"),
    v.literal("some"),
    v.literal("experienced"),
  ),
  watch: v.union(
    v.literal("all"),
    v.literal("stocks"),
    v.literal("funds"),
    v.literal("crypto"),
  ),
  risk: v.union(
    v.literal("careful"),
    v.literal("balanced"),
    v.literal("comfortable"),
    v.literal("unknown"),
  ),
  amount: v.union(v.number(), v.null()),
  monthly: v.union(v.number(), v.null()),
  emergency: v.union(v.literal("yes"), v.literal("no"), v.literal("unknown")),
  debt: v.union(v.literal("yes"), v.literal("no"), v.literal("unknown")),
});
export const actionValidator = v.union(
  v.literal("none"),
  v.literal("compare"),
  v.literal("scenario"),
  v.literal("sources"),
  v.literal("profile"),
);
export const turnValidator = v.object({
  assetId: v.optional(v.string()),
  context: v.optional(v.string()),
  id: v.string(),
  question: v.string(),
  reply: v.string(),
  action: actionValidator,
  sourceIds: v.array(v.string()),
});
export const dashboardValidator = v.object({
  version: v.literal(2),
  sample: v.boolean(),
  generatedAt: v.number(),
  assets: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      ticker: v.string(),
      kind: v.union(
        v.literal("stocks"),
        v.literal("funds"),
        v.literal("crypto"),
      ),
      description: v.string(),
      tradeoff: v.string(),
      url: v.string(),
      history: v.array(v.object({ date: v.string(), value: v.number() })),
      historySource: v.string(),
      retrievedAt: v.number(),
      evidence: v.array(
        v.object({
          label: v.string(),
          url: v.string(),
          asOf: v.string(),
          text: v.string(),
        }),
      ),
    }),
  ),
});
export const answersValidator = v.object({
  watch: v.string(),
  noise: v.string(),
  sleep: v.string(),
  fog: v.array(v.string()),
  intent: v.string(),
});

/** Production still has Mind Over Money rows. Keep these so schema push can succeed. */
export const legacyAnswersValidator = v.object({
  experience: v.string(),
  goal: v.string(),
  assets: v.array(v.string()),
  risk: v.string(),
  confusions: v.array(v.string()),
  impulse: v.string(),
  horizon: v.string(),
});

export const storedAnswersValidator = v.union(
  answersValidator,
  legacyAnswersValidator,
);

export const keelValidator = v.object({
  line: v.string(),
  experience: v.string(),
  assets: v.array(v.string()),
  risk: v.string(),
  dashboard: v.array(
    v.object({
      id: v.string(),
      title: v.string(),
      summary: v.string(),
      kind: v.string(),
    }),
  ),
  glossary: v.array(
    v.object({
      term: v.string(),
      plain: v.string(),
    }),
  ),
  riskIndicator: v.object({
    id: v.string(),
    title: v.string(),
    level: v.string(),
    how: v.string(),
  }),
  decisionFlow: v.object({
    id: v.string(),
    title: v.string(),
    how: v.string(),
  }),
});

export const catalogSourceValidator = v.union(
  v.literal("gateway"),
  v.literal("fallback"),
);

/**
 * The five fixed intake answers, identical for every user.
 *
 * Deliberately a sibling of `profileV2` rather than new fields inside it:
 * `profileV2` is a v.object whose members are all required, so adding to it
 * would invalidate every stored document that already has a v2 profile. As an
 * optional sibling, documents of every generation (legacy Mind Over Money,
 * current, v2) keep validating untouched.
 */
export const intakeValidator = v.object({
  version: v.literal(1),
  vehicle: v.union(
    v.literal("trading"),
    v.literal("stocks"),
    v.literal("crypto"),
    v.literal("unsure"),
  ),
  timescale: v.union(
    v.literal("days"),
    v.literal("months"),
    v.literal("years"),
    v.literal("decade"),
  ),
  country: v.string(),
  currency: v.string(),
  budgetLow: v.union(v.number(), v.null()),
  budgetHigh: v.union(v.number(), v.null()),
  riskBand: v.union(
    v.literal("high"),
    v.literal("balanced"),
    v.literal("low"),
    v.literal("veryLow"),
  ),
});

/**
 * Inference derived from `intake` by lib/onboarding/signals.ts. Read by the
 * personalisation engine and the Keel companion; never re-derived downstream,
 * so intake wording can change without shifting what consumers see.
 */
export const signalsValidator = v.object({
  v: v.literal(1),
  capturedAt: v.number(),
  revision: v.number(),
  incomeShareCap: v.number(),
  volatilityTolerance: v.union(
    v.literal("high"),
    v.literal("moderate"),
    v.literal("low"),
    v.literal("none"),
  ),
  preferredKinds: v.array(v.string()),
  horizonDays: v.number(),
  cadence: v.union(
    v.literal("day"),
    v.literal("month"),
    v.literal("year"),
    v.literal("decade"),
  ),
  intradayIntent: v.boolean(),
  overexposureFlag: v.boolean(),
  balancedPortfolioRequired: v.boolean(),
  confidence: v.union(
    v.literal("stated"),
    v.literal("inferred"),
    v.literal("default"),
  ),
});

export const experienceFields = {
  profileV2: v.optional(profileV2),
  intake: v.optional(intakeValidator),
  signals: v.optional(signalsValidator),
  revision: v.optional(v.number()),
  dashboard: v.optional(dashboardValidator),
  savedAssets: v.optional(v.array(v.string())),
  conversation: v.optional(v.array(turnValidator)),
  generation: v.optional(
    v.object({
      startedAt: v.number(),
      requests: v.array(
        v.object({
          id: v.string(),
          status: v.union(
            v.literal("pending"),
            v.literal("done"),
            v.literal("failed"),
          ),
        }),
      ),
    }),
  ),
  keel: v.optional(keelValidator),
  catalogSource: v.optional(catalogSourceValidator),
};
