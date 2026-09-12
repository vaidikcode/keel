import {
  experienceFields,
  storedAnswersValidator,
} from "./experienceValidators";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const jargonValidator = v.object({
  term: v.string(),
  plain: v.string(),
});

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

const spreadPackValidator = v.object({
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

export default defineSchema({
  notes: defineTable({
    author: v.string(),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  profiles: defineTable({
    ...experienceFields,
    sessionId: v.string(),
    answers: storedAnswersValidator,
    spread: v.optional(spreadPackValidator),
    spreadAt: v.optional(v.number()),
    asks: v.optional(
      v.array(
        v.object({
          assetId: v.string(),
          question: v.string(),
          reply: v.string(),
        }),
      ),
    ),
    createdAt: v.number(),
  }).index("by_sessionId", ["sessionId"]),
});
