import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_NOTES = 50;
const MAX_AUTHOR_LENGTH = 40;
const MAX_BODY_LENGTH = 280;

const noteValidator = v.object({
  _id: v.id("notes"),
  _creationTime: v.number(),
  author: v.string(),
  body: v.string(),
  createdAt: v.number(),
});

function normalizeAuthor(author: string): string {
  const trimmed = author.trim();
  if (trimmed.length === 0) {
    throw new Error("Name is required");
  }
  if (trimmed.length > MAX_AUTHOR_LENGTH) {
    throw new Error(`Name must be ${MAX_AUTHOR_LENGTH} characters or fewer`);
  }
  return trimmed;
}

function normalizeBody(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    throw new Error("Note cannot be empty");
  }
  if (trimmed.length > MAX_BODY_LENGTH) {
    throw new Error(`Note must be ${MAX_BODY_LENGTH} characters or fewer`);
  }
  return trimmed;
}

export const list = query({
  args: {},
  returns: v.array(noteValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_createdAt")
      .order("desc")
      .take(MAX_NOTES);
  },
});

export const create = mutation({
  args: {
    author: v.string(),
    body: v.string(),
  },
  returns: v.id("notes"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("notes", {
      author: normalizeAuthor(args.author),
      body: normalizeBody(args.body),
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    noteId: v.id("notes"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const note = await ctx.db.get("notes", args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }
    await ctx.db.delete("notes", args.noteId);
    return null;
  },
});
