import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_LIST = 6;
const MAX_SESSION = 80;
const MAX_TEXT = 400;

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

const answersValidator = v.object({
  watch: v.string(),
  noise: v.string(),
  sleep: v.string(),
  fog: v.array(v.string()),
  intent: v.string(),
});

const askValidator = v.object({
  assetId: v.string(),
  question: v.string(),
  reply: v.string(),
});

const profileValidator = v.object({
  _id: v.id("profiles"),
  _creationTime: v.number(),
  sessionId: v.string(),
  answers: answersValidator,
  spread: v.optional(spreadPackValidator),
  spreadAt: v.optional(v.number()),
  asks: v.optional(v.array(askValidator)),
  createdAt: v.number(),
});

type SpreadInput = {
  greeting: string;
  prompt: string;
  promptOptions: Array<{ id: "feed" | "filing"; label: string }>;
  asks: string[];
  assets: Array<{
    id: string;
    title: string;
    ticker: string;
    kind: string;
    feedLine: string;
    filingLine: string;
    sleepLine: string;
    twinLine: string;
    twinId: string;
    twinTitle: string;
    priceLabel: string;
    nights: number;
    maxDrawdownPct: number;
    pulse: number[];
    jargon: Array<{ term: string; plain: string }>;
    beats: {
      feed: string;
      filing: string;
      sleep: string;
      twin: string;
      jargon: string;
      mismatch: string;
    };
    assetGreeting: string;
  }>;
  source: "gateway" | "fallback";
};

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

function softClip(value: string, max: number, fallback: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return fallback;
  }
  if (trimmed.length > max) {
    return trimmed.slice(0, max);
  }
  return trimmed;
}

function clipList(values: string[], maxItems: number, maxLen: number): string[] {
  return values
    .slice(0, maxItems)
    .map((value) => softClip(value, maxLen, "—"))
    .filter((value) => value.length > 0);
}

function clipSpread(spread: SpreadInput) {
  const asks = clipList(spread.asks, 3, 120);
  return {
    greeting: softClip(spread.greeting, MAX_TEXT, "I am Keel. Tap a pane."),
    prompt: softClip(spread.prompt, MAX_TEXT, "Headline or the filing?"),
    promptOptions: spread.promptOptions.slice(0, 2).map((option) => ({
      id: option.id,
      label: softClip(option.label, 80, option.id),
    })),
    asks: asks.length > 0 ? asks : ["What is this?", "How jumpy?", "Show the twin"],
    source: spread.source,
    assets: spread.assets.slice(0, 3).map((asset) => ({
      id: softClip(asset.id, 80, "asset"),
      title: softClip(asset.title, 80, "Asset"),
      ticker: softClip(asset.ticker, 40, "—"),
      kind: softClip(asset.kind, 40, "stocks"),
      feedLine: softClip(asset.feedLine, MAX_TEXT, "Quiet on the feed."),
      filingLine: softClip(asset.filingLine, MAX_TEXT, "See the document side."),
      sleepLine: softClip(asset.sleepLine, MAX_TEXT, "Check the nights bar."),
      twinLine: softClip(asset.twinLine, MAX_TEXT, "Compare to the boring twin."),
      twinId: softClip(asset.twinId, 80, "voo"),
      twinTitle: softClip(asset.twinTitle, 80, "Twin"),
      priceLabel: softClip(asset.priceLabel, 80, "—"),
      nights: Number.isFinite(asset.nights) ? asset.nights : 0,
      maxDrawdownPct: Number.isFinite(asset.maxDrawdownPct)
        ? asset.maxDrawdownPct
        : 0,
      pulse: asset.pulse.slice(0, 24),
      jargon: asset.jargon.slice(0, MAX_LIST).map((item) => ({
        term: softClip(item.term, 80, "Term"),
        plain: softClip(item.plain, MAX_TEXT, "Plain English."),
      })),
      beats: {
        feed: softClip(asset.beats.feed, MAX_TEXT, "This is the noise side."),
        filing: softClip(asset.beats.filing, MAX_TEXT, "This is the document."),
        sleep: softClip(asset.beats.sleep, MAX_TEXT, "Match your sleep chip."),
        twin: softClip(asset.beats.twin, MAX_TEXT, "Try the boring twin."),
        jargon: softClip(asset.beats.jargon, MAX_TEXT, "Tap a word for plain English."),
        mismatch: softClip(
          asset.beats.mismatch,
          MAX_TEXT,
          "Your chip and this bar disagree.",
        ),
      },
      assetGreeting: softClip(
        asset.assetGreeting,
        MAX_TEXT,
        "Tap left for noise, right for the document.",
      ),
    })),
  };
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
      watch: clip(args.answers.watch, 40),
      noise: clip(args.answers.noise, 40),
      sleep: clip(args.answers.sleep, 40),
      fog: clipList(args.answers.fog, 3, 40),
      intent: clip(args.answers.intent, 40),
    };

    if (existing) {
      await ctx.db.patch("profiles", existing._id, {
        answers,
        createdAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("profiles", {
      sessionId,
      answers,
      createdAt: Date.now(),
    });
  },
});

export const saveSpread = mutation({
  args: {
    sessionId: v.string(),
    spread: spreadPackValidator,
  },
  returns: v.union(v.id("profiles"), v.null()),
  handler: async (ctx, args) => {
    const sessionId = clip(args.sessionId, MAX_SESSION);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .order("desc")
      .first();
    if (!existing) {
      return null;
    }
    await ctx.db.patch("profiles", existing._id, {
      spread: clipSpread(args.spread),
      spreadAt: Date.now(),
    });
    return existing._id;
  },
});

export const saveAsk = mutation({
  args: {
    sessionId: v.string(),
    assetId: v.string(),
    question: v.string(),
    reply: v.string(),
  },
  returns: v.union(v.id("profiles"), v.null()),
  handler: async (ctx, args) => {
    const sessionId = clip(args.sessionId, MAX_SESSION);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .order("desc")
      .first();
    if (!existing) {
      return null;
    }
    const prior = existing.asks ?? [];
    if (prior.some((item) => item.assetId === args.assetId)) {
      return existing._id;
    }
    const next = [
      ...prior,
      {
        assetId: clip(args.assetId, 80),
        question: clip(args.question, 200),
        reply: clip(args.reply, MAX_TEXT),
      },
    ].slice(0, 6);
    await ctx.db.patch("profiles", existing._id, { asks: next });
    return existing._id;
  },
});
