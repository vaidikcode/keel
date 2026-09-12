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
  country: v.union(
    v.literal("US"),
    v.literal("IN"),
    v.literal("GB"),
    v.literal("other"),
  ),
  currency: v.union(v.literal("USD"), v.literal("INR"), v.literal("GBP")),
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

const categoryIdValidator = v.union(
  v.literal("broad-funds"),
  v.literal("bond-cash"),
  v.literal("large-stable"),
  v.literal("growth-tech"),
  v.literal("dividend"),
  v.literal("crypto"),
  v.literal("international"),
);
export const profileV3 = v.object({
  version: v.literal(3),
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
  country: v.union(
    v.literal("US"),
    v.literal("IN"),
    v.literal("GB"),
    v.literal("other"),
  ),
  currency: v.union(v.literal("USD"), v.literal("INR"), v.literal("GBP")),
  experience: v.union(
    v.literal("new"),
    v.literal("some"),
    v.literal("experienced"),
  ),
  interests: v.array(categoryIdValidator),
  risk: v.union(
    v.literal("careful"),
    v.literal("balanced"),
    v.literal("comfortable"),
    v.literal("unknown"),
  ),
  lossTolerance: v.union(
    v.literal(5),
    v.literal(10),
    v.literal(20),
    v.literal(40),
    v.literal("unknown"),
  ),
  income: v.union(
    v.literal("stable"),
    v.literal("variable"),
    v.literal("none"),
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

/** Legacy Feed-vs-Filing pack. Production rows still carry it; never written anymore. */
const jargonValidator = v.object({ term: v.string(), plain: v.string() });
const beatsValidator = v.object({
  feed: v.string(),
  filing: v.string(),
  sleep: v.string(),
  twin: v.string(),
  jargon: v.string(),
  mismatch: v.string(),
});
const assetPackValidator = v.object({
  id: v.string(),
  title: v.string(),
  ticker: v.string(),
  kind: v.string(),
  feedLine: v.string(),
  filingLine: v.string(),
  sleepLine: v.string(),
  twinLine: v.string(),
  twinId: v.string(),
  twinTitle: v.string(),
  priceLabel: v.string(),
  nights: v.number(),
  maxDrawdownPct: v.number(),
  pulse: v.array(v.number()),
  jargon: v.array(jargonValidator),
  beats: beatsValidator,
  assetGreeting: v.string(),
});
export const legacySpreadValidator = v.object({
  greeting: v.string(),
  prompt: v.string(),
  promptOptions: v.array(
    v.object({
      id: v.union(v.literal("feed"), v.literal("filing")),
      label: v.string(),
    }),
  ),
  asks: v.array(v.string()),
  assets: v.array(assetPackValidator),
  source: v.union(v.literal("gateway"), v.literal("fallback")),
});
export const legacyAskValidator = v.object({
  assetId: v.string(),
  question: v.string(),
  reply: v.string(),
});

export const experienceFields = {
  profileV2: v.optional(profileV2),
  profileV3: v.optional(profileV3),
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
