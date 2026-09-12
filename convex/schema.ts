import {
  experienceFields,
  legacyAskValidator,
  legacySpreadValidator,
  storedAnswersValidator,
} from "./experienceValidators";
import { assetDetailsFields, categorySnapshotFields, keelThoughtsFields, kvFields } from "./marketValidators";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
    spread: v.optional(legacySpreadValidator),
    spreadAt: v.optional(v.number()),
    asks: v.optional(v.array(legacyAskValidator)),
    createdAt: v.number(),
  }).index("by_sessionId", ["sessionId"]),

  categorySnapshots: defineTable(categorySnapshotFields).index("by_category", [
    "categoryId",
  ]),
  assetDetails: defineTable(assetDetailsFields).index("by_asset", ["assetId"]),
  keelThoughts: defineTable(keelThoughtsFields).index("by_key", [
    "sessionId",
    "revision",
    "categoryId",
    "snapshotFetchedAt",
  ]),
  kv: defineTable(kvFields).index("by_key", ["key"]),
});
