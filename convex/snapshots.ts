import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { categorySnapshotFields, snapshotStatusV } from "./marketValidators";
import { requireSignedIn } from "./access";

const LOCK_MS = 90_000;
const MAX_ASSETS = 12;
const MAX_POINTS = 400;

const snapshotDoc = v.object({
  ...categorySnapshotFields,
  _id: v.id("categorySnapshots"),
  _creationTime: v.number(),
});

export const getMany = query({
  args: { categoryIds: v.array(v.string()) },
  returns: v.array(snapshotDoc),
  handler: async (ctx, args) => {
    const out = [];
    for (const categoryId of args.categoryIds.slice(0, 7)) {
      const row = await ctx.db
        .query("categorySnapshots")
        .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
        .order("desc")
        .first();
      if (row) out.push(row);
    }
    return out;
  },
});

/**
 * Claim the right to refresh a category. Mirrors reserveGeneration: only one
 * refresher at a time; stale locks (older than 90s) can be taken over.
 */
export const claimRefresh = mutation({
  args: { categoryId: v.string(), now: v.number(), force: v.optional(v.boolean()) },
  returns: v.union(v.literal("claimed"), v.literal("fresh"), v.literal("busy")),
  handler: async (ctx, args) => {
    await requireSignedIn(ctx);
    const row = await ctx.db
      .query("categorySnapshots")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .order("desc")
      .first();
    if (!row) {
      await ctx.db.insert("categorySnapshots", {
        categoryId: args.categoryId,
        fetchedAt: 0,
        expiresAt: 0,
        status: "refreshing",
        lockedAt: args.now,
        benchmark: { ticker: "VOO", history: [] },
        assets: [],
        facts: [],
        warnings: [],
      });
      return "claimed";
    }
    const locked =
      row.status === "refreshing" &&
      typeof row.lockedAt === "number" &&
      args.now - row.lockedAt < LOCK_MS;
    if (locked) return "busy";
    const fresh = row.status === "ready" && row.expiresAt > args.now;
    if (fresh && !args.force) return "fresh";
    await ctx.db.patch("categorySnapshots", row._id, {
      status: "refreshing",
      lockedAt: args.now,
    });
    return "claimed";
  },
});

export const put = mutation({
  args: {
    categoryId: v.string(),
    snapshot: v.object({
      fetchedAt: v.number(),
      expiresAt: v.number(),
      benchmark: categorySnapshotFields.benchmark,
      assets: categorySnapshotFields.assets,
      facts: categorySnapshotFields.facts,
      factsQuery: categorySnapshotFields.factsQuery,
      warnings: categorySnapshotFields.warnings,
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireSignedIn(ctx);
    const s = args.snapshot;
    if (s.assets.length > MAX_ASSETS) throw new Error("Too many assets");
    if (
      s.assets.some((a) => a.history.length > MAX_POINTS) ||
      s.benchmark.history.length > MAX_POINTS
    )
      throw new Error("Too much chart data");
    const doc = {
      categoryId: args.categoryId,
      status: "ready" as const,
      lockedAt: undefined,
      ...s,
    };
    const row = await ctx.db
      .query("categorySnapshots")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .order("desc")
      .first();
    if (row) await ctx.db.replace("categorySnapshots", row._id, doc);
    else await ctx.db.insert("categorySnapshots", doc);
    return null;
  },
});

export const release = mutation({
  args: { categoryId: v.string(), status: snapshotStatusV, warning: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireSignedIn(ctx);
    const row = await ctx.db
      .query("categorySnapshots")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .order("desc")
      .first();
    if (!row) return null;
    // A failed refresh keeps the previous data (if any) but drops the lock.
    await ctx.db.patch("categorySnapshots", row._id, {
      status: row.assets.length ? "ready" : args.status,
      lockedAt: undefined,
      warnings: args.warning
        ? [...row.warnings, args.warning].slice(-10)
        : row.warnings,
    });
    return null;
  },
});
