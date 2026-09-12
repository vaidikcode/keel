import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";

/**
 * Convex client for Next API routes that carries the caller's Clerk identity,
 * so Convex functions guarded by KEEL_REQUIRE_AUTH accept the request. Falls
 * back to an anonymous client when there is no session (demo, or Clerk off).
 */
export async function convexForRequest(): Promise<ConvexHttpClient | null> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim().split(/\s+/)[0];
  if (!url) return null;
  const client = new ConvexHttpClient(url);
  try {
    const session = await auth();
    const token = await session.getToken({ template: "convex" });
    if (token) client.setAuth(token);
  } catch {
    /* No Clerk middleware or no session: stay anonymous. */
  }
  return client;
}
