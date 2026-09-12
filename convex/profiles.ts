import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_LIST = 6;
const MAX_SESSION = 80;
const MAX_TEXT = 280;

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

const profileValidator = v.object({
  _id: v.id("profiles"),
  _creationTime: v.number(),
  sessionId: v.string(),
  answers: answersValidator,
  keel: keelValidator,
  catalogSource: v.union(v.literal("gateway"), v.literal("fallback")),
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

function clipList(values: string[], maxItems: number, maxLen: number): string[] {
  return values.slice(0, maxItems).map((value) => clip(value, maxLen));
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

export const save = mutation({
  args: {
    sessionId: v.string(),
    answers: answersValidator,
    keel: keelValidator,
    catalogSource: v.union(v.literal("gateway"), v.literal("fallback")),
  },
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    const sessionId = clip(args.sessionId, MAX_SESSION);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .order("desc")
      .first();

    const answers = {
      experience: clip(args.answers.experience, 40),
      goal: clip(args.answers.goal, 40),
      assets: clipList(args.answers.assets, 4, 40),
      risk: clip(args.answers.risk, 40),
      confusions: clipList(args.answers.confusions, 3, 40),
      impulse: clip(args.answers.impulse, 40),
      horizon: clip(args.answers.horizon, 40),
    };

    const keel = {
      line: clip(args.keel.line, 400),
      experience: clip(args.keel.experience, 40),
      assets: clipList(args.keel.assets, 4, 40),
      risk: clip(args.keel.risk, 40),
      dashboard: args.keel.dashboard.slice(0, 3).map((item) => ({
        id: clip(item.id, 80),
        title: clip(item.title, 80),
        summary: clip(item.summary, MAX_TEXT),
        kind: clip(item.kind, 40),
      })),
      glossary: args.keel.glossary.slice(0, MAX_LIST).map((item) => ({
        term: clip(item.term, 80),
        plain: clip(item.plain, MAX_TEXT),
      })),
      riskIndicator: {
        id: clip(args.keel.riskIndicator.id, 80),
        title: clip(args.keel.riskIndicator.title, 80),
        level: clip(args.keel.riskIndicator.level, 80),
        how: clip(args.keel.riskIndicator.how, MAX_TEXT),
      },
      decisionFlow: {
        id: clip(args.keel.decisionFlow.id, 80),
        title: clip(args.keel.decisionFlow.title, 80),
        how: clip(args.keel.decisionFlow.how, MAX_TEXT),
      },
    };

    if (existing) {
      await ctx.db.patch("profiles", existing._id, {
        answers,
        keel,
        catalogSource: args.catalogSource,
        createdAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("profiles", {
      sessionId,
      answers,
      keel,
      catalogSource: args.catalogSource,
      createdAt: Date.now(),
    });
  },
});
