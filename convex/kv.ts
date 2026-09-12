import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { key: v.string() },
  returns: v.union(
    v.object({ value: v.any(), fetchedAt: v.number(), expiresAt: v.number() }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("kv")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .order("desc")
      .first();
    if (!row) return null;
    return { value: row.value, fetchedAt: row.fetchedAt, expiresAt: row.expiresAt };
  },
});

export const put = mutation({
  args: { key: v.string(), value: v.any(), ttlMs: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const key = args.key.trim().slice(0, 200);
    if (!key) return null;
    const now = Date.now();
    const doc = {
      key,
      value: args.value,
      fetchedAt: now,
      expiresAt: now + Math.max(1000, Math.min(args.ttlMs, 30 * 86400000)),
    };
    const existing = await ctx.db
      .query("kv")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (existing) await ctx.db.replace("kv", existing._id, doc);
    else await ctx.db.insert("kv", doc);
    return null;
  },
});
