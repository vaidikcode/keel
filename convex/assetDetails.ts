import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assetDetailsFields } from "./marketValidators";

const detailsDoc = v.object({
  ...assetDetailsFields,
  _id: v.id("assetDetails"),
  _creationTime: v.number(),
});

export const get = query({
  args: { assetId: v.string() },
  returns: v.union(detailsDoc, v.null()),
  handler: async (ctx, args) =>
    await ctx.db
      .query("assetDetails")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .order("desc")
      .first(),
});

export const put = mutation({
  args: {
    assetId: v.string(),
    details: v.object({
      fetchedAt: v.number(),
      expiresAt: v.number(),
      news: assetDetailsFields.news,
      secFacts: assetDetailsFields.secFacts,
      facts: assetDetailsFields.facts,
      coin: assetDetailsFields.coin,
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.details.news.length > 12 || args.details.facts.length > 8)
      throw new Error("Too many detail rows");
    const doc = { assetId: args.assetId, ...args.details };
    const row = await ctx.db
      .query("assetDetails")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .order("desc")
      .first();
    if (row) await ctx.db.replace("assetDetails", row._id, doc);
    else await ctx.db.insert("assetDetails", doc);
    return null;
  },
});
