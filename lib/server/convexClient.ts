import { ConvexHttpClient } from "convex/browser";

/** Convex client for Next API routes. Auth is handled by Clerk at the page level. */
export function convexForRequest(): ConvexHttpClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim().split(/\s+/)[0];
  return url ? new ConvexHttpClient(url) : null;
}
