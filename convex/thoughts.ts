import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { keelThoughtsFields } from "./marketValidators";
import { requireOwner } from "./access";

const keyArgs = {
  sessionId: v.string(),
  revision: v.number(),
  categoryId: v.string(),
  snapshotFetchedAt: v.number(),
};
const thoughtsDoc = v.object({
  ...keelThoughtsFields,
  _id: v.id("keelThoughts"),
  _creationTime: v.number(),
});

export const get = query({
  args: keyArgs,
  returns: v.union(thoughtsDoc, v.null()),
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.sessionId);
    return await ctx.db
      .query("keelThoughts")
      .withIndex("by_key", (q) =>
        q
          .eq("sessionId", args.sessionId)
          .eq("revision", args.revision)
          .eq("categoryId", args.categoryId)
          .eq("snapshotFetchedAt", args.snapshotFetchedAt),
      )
      .first();
  },
});

/** Insert-if-absent so two concurrent generations keep the first answer. */
export const put = mutation({
  args: {
    ...keyArgs,
    paragraphs: v.array(v.string()),
    because: v.array(v.object({ field: v.string(), text: v.string() })),
    sourceIds: v.array(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.sessionId);
    const existing = await ctx.db
      .query("keelThoughts")
      .withIndex("by_key", (q) =>
        q
          .eq("sessionId", args.sessionId)
          .eq("revision", args.revision)
          .eq("categoryId", args.categoryId)
          .eq("snapshotFetchedAt", args.snapshotFetchedAt),
      )
      .first();
    if (existing) return false;
    await ctx.db.insert("keelThoughts", {
      sessionId: args.sessionId.slice(0, 80),
      revision: args.revision,
      categoryId: args.categoryId,
      snapshotFetchedAt: args.snapshotFetchedAt,
      paragraphs: args.paragraphs.slice(0, 4).map((p) => p.slice(0, 500)),
      because: args.because.slice(0, 5),
      sourceIds: args.sourceIds.slice(0, 4),
      createdAt: Date.now(),
    });
    return true;
  },
});
