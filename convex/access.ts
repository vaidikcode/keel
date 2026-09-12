import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Optional ownership check. Inert until the Convex env var KEEL_REQUIRE_AUTH is
 * "true", so production can flip it on once the Clerk JWT template "convex"
 * exists. When on, the caller must be signed in and match the sessionId.
 */
export async function requireOwner(ctx: QueryCtx | MutationCtx, sessionId: string): Promise<void> {
  if (process.env.KEEL_REQUIRE_AUTH !== "true") return;
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Sign in to continue.");
  if (identity.subject !== sessionId) throw new Error("This profile belongs to another account.");
}

/** Shared cache writes only need some signed-in identity when enforcement is on. */
export async function requireSignedIn(ctx: QueryCtx | MutationCtx): Promise<void> {
  if (process.env.KEEL_REQUIRE_AUTH !== "true") return;
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Sign in to continue.");
}
