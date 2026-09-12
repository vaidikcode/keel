import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const keelValidator = v.object({
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

const answersValidator = v.object({
  experience: v.string(),
  goal: v.string(),
  assets: v.array(v.string()),
  risk: v.string(),
  confusions: v.array(v.string()),
  impulse: v.string(),
  horizon: v.string(),
});

export default defineSchema({
  notes: defineTable({
    author: v.string(),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  profiles: defineTable({
    sessionId: v.string(),
    answers: answersValidator,
    keel: keelValidator,
    catalogSource: v.union(v.literal("gateway"), v.literal("fallback")),
    createdAt: v.number(),
  }).index("by_sessionId", ["sessionId"]),
});
