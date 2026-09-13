import {
  dashboardValidator,
  experienceFields,
  intakeValidator,
  legacyAskValidator,
  legacySpreadValidator,
  profileV2,
  profileV3,
  storedAnswersValidator,
  turnValidator,
  analyzedAssetValidator,
} from "./experienceValidators";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { migrateProfile, profileSchema } from "../lib/onboarding/questions";
import { ALL_ASSET_IDS } from "../lib/market/categories";
import { deriveSignals, intakeFromProfile, intakeSchema } from "../lib/onboarding/signals";
import { analyzedAssetSchema } from "../lib/dashboard/analyzedAsset";

const MAX_SESSION = 80;

const profileValidator = v.object({
  ...experienceFields,
  _id: v.id("profiles"),
  _creationTime: v.number(),
  sessionId: v.string(),
  answers: storedAnswersValidator,
  spread: v.optional(legacySpreadValidator),
  spreadAt: v.optional(v.number()),
  asks: v.optional(v.array(legacyAskValidator)),
  createdAt: v.number(),
});

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error("Text is required");
  }
  if (trimmed.length > max) {
    return trimmed.slice(0, max);
  }
  return trimmed;
}

export const getBySession = query({
  args: { sessionId: v.string() },
  returns: v.union(profileValidator, v.null()),
  handler: async (ctx, args) => {
    const sessionId = args.sessionId.trim();
    if (sessionId.length === 0 || sessionId.length > MAX_SESSION) {
      return null;
    }
    return await ctx.db
      .query("profiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .order("desc")
      .first();
  },
});

export const saveExperience = mutation({
  args: {
    sessionId: v.string(),
    profile: v.union(profileV2, profileV3),
    intake: v.optional(intakeValidator),
  },
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    const sessionId = clip(args.sessionId, MAX_SESSION);
    const profile = profileSchema.parse(migrateProfile(args.profile));
    // Intake mirrors the profile so the teammate's signals stay populated.
    const intake = args.intake ? intakeSchema.parse(args.intake) : intakeFromProfile(profile);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .first();
    const answers = {
      watch: profile.interests.includes("crypto")
        ? "crypto"
        : profile.interests.some((id) =>
              ["large-stable", "growth-tech", "dividend"].includes(id),
            )
          ? "stocks"
          : "funds",
      noise: "headlines",
      sleep:
        profile.risk === "careful"
          ? "steady"
          : profile.risk === "comfortable"
            ? "spicy"
            : "balanced",
      fog: ["jargon"],
      intent: "learn",
    };
    if (existing) {
      const revision = (existing.revision ?? 0) + 1;
      await ctx.db.patch("profiles", existing._id, {
        profileV3: profile,
        profileV2: undefined,
        answers,
        revision,
        intake,
        signals: deriveSignals(intake, revision),
        dashboard: undefined,
        spread: undefined,
        spreadAt: undefined,
        conversation: [],
        keel: undefined,
        catalogSource: undefined,
      });
      return existing._id;
    }
    return await ctx.db.insert("profiles", {
      sessionId,
      profileV3: profile,
      answers,
      revision: 1,
      intake,
      signals: deriveSignals(intake, 1),
      createdAt: Date.now(),
    });
  },
});
/**
 * Saving answers from the account page, without the collateral damage.
 *
 * `saveExperience` clears the conversation, the cached dashboard, the keel pack
 * and the catalog source, because it exists for finishing onboarding. Editing
 * one answer later must not throw away someone's chat history, so this writes
 * only the profile and the things derived from it. The revision still moves —
 * rankings and signals depend on the answers, and consumers key off it.
 */
export const updateProfile = mutation({
  args: { sessionId: v.string(), profile: profileV3 },
  returns: v.union(v.number(), v.null()),
  handler: async (ctx, args) => {
    const sessionId = clip(args.sessionId, MAX_SESSION);
    const profile = profileSchema.parse(migrateProfile(args.profile));
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .first();
    if (!existing) return null;
    const revision = (existing.revision ?? 0) + 1;
    // Intake mirrors the profile, the same way saveExperience keeps them in step.
    const intake = intakeFromProfile(profile);
    await ctx.db.patch("profiles", existing._id, {
      profileV3: profile,
      profileV2: undefined,
      revision,
      intake,
      signals: deriveSignals(intake, revision),
    });
    return revision;
  },
});

export const saveDashboard = mutation({
  args: {
    sessionId: v.string(),
    revision: v.number(),
    dashboard: dashboardValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const p = await ctx.db
      .query("profiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (!p || (p.revision ?? 0) !== args.revision) return false;
    if (
      args.dashboard.assets.length > 12 ||
      args.dashboard.assets.some((a) => a.history.length > 400)
    )
      throw new Error("Too much chart data");
    await ctx.db.patch("profiles", p._id, { dashboard: args.dashboard });
    return true;
  },
});
export const reserveGeneration = mutation({
  args: { sessionId: v.string(), requestId: v.string(), revision: v.number() },
  returns: v.object({
    status: v.union(
      v.literal("reserved"),
      v.literal("duplicate"),
      v.literal("limit"),
      v.literal("changed"),
    ),
    remaining: v.number(),
  }),
  handler: async (ctx, args) => {
    const p = await ctx.db
      .query("profiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (!p || (p.revision ?? 0) !== args.revision)
      return { status: "changed" as const, remaining: 0 };
    const generation = p.generation ?? { startedAt: Date.now(), requests: [] };
    if (generation.requests.some((r) => r.id === args.requestId))
      return { status: "duplicate" as const, remaining: 1 };
    await ctx.db.patch("profiles", p._id, {
      generation: {
        ...generation,
        requests: [
          ...generation.requests,
          { id: clip(args.requestId, 160), status: "pending" as const },
        ].slice(-40),
      },
    });
    return { status: "reserved" as const, remaining: 1 };
  },
});
export const finishGeneration = mutation({
  args: {
    sessionId: v.string(),
    requestId: v.string(),
    revision: v.number(),
    turn: v.union(turnValidator, v.null()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const p = await ctx.db
      .query("profiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (!p?.generation || (p.revision ?? 0) !== args.revision) return false;
    const request = p.generation.requests.find((r) => r.id === args.requestId);
    if (!request || request.status !== "pending") return false;
    const requests = p.generation.requests.map((r) =>
      r.id === args.requestId
        ? { ...r, status: args.turn ? ("done" as const) : ("failed" as const) }
        : r,
    );
    const conversation = args.turn
      ? [
          ...(p.conversation ?? []),
          {
            ...args.turn,
            question: args.turn.question.slice(0, 500),
            reply: args.turn.reply.slice(0, 700),
          },
        ].slice(-20)
      : (p.conversation ?? []);
    await ctx.db.patch("profiles", p._id, {
      generation: { ...p.generation, requests },
      conversation,
    });
    return true;
  },
});
export const newConversation = mutation({
  args: { sessionId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const p = await ctx.db
      .query("profiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (!p) return false;
    await ctx.db.patch("profiles", p._id, {
      generation: { startedAt: Date.now(), requests: [] },
      conversation: [],
    });
    return true;
  },
});
export const toggleSaved = mutation({
  args: { sessionId: v.string(), assetId: v.string() },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const p = await ctx.db
      .query("profiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (
      !p ||
      !ALL_ASSET_IDS.includes(args.assetId)
    )
      return [];
    const saved = p.savedAssets ?? [];
    const next = saved.includes(args.assetId)
      ? saved.filter((id) => id !== args.assetId)
      : [...saved, args.assetId].slice(0, 24);
    await ctx.db.patch("profiles", p._id, { savedAssets: next });
    return next;
  },
});

export const recordAnalyzedAsset = mutation({
  args: {
    sessionId: v.string(),
    asset: analyzedAssetValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const sessionId = clip(args.sessionId, MAX_SESSION);
    const asset = analyzedAssetSchema.parse(args.asset);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .first();
    if (!profile) return false;
    const previous = (profile.analyzedAssets ?? []).filter(
      (item) => item.id !== asset.id,
    );
    await ctx.db.patch("profiles", profile._id, {
      analyzedAssets: [asset, ...previous].slice(0, 12),
    });
    return true;
  },
});
