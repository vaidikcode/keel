import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";

export type ConvexForRequest = { client: ConvexHttpClient; authState: string };

/**
 * Convex client for Next API routes that carries the caller's Clerk identity,
 * so Convex functions guarded by KEEL_REQUIRE_AUTH accept the request.
 * Prefers a Bearer token the browser minted itself (the same template token
 * the client-side Convex provider uses), then falls back to Clerk's server
 * session, then to anonymous (demo mode). `authState` is exposed on responses
 * as `x-keel-auth` for debugging.
 */
export async function convexForRequest(request?: Request): Promise<ConvexForRequest | null> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim().split(/\s+/)[0];
  if (!url) return null;
  const client = new ConvexHttpClient(url);
  const header = request?.headers.get("authorization") ?? "";
  const bearer = /^Bearer\s+(.+)$/i.exec(header)?.[1]?.trim();
  if (bearer && bearer.length < 4096) {
    client.setAuth(bearer);
    return { client, authState: "header" };
  }
  try {
    const session = await auth();
    const token = await session.getToken({ template: "convex" });
    if (token) {
      client.setAuth(token);
      return { client, authState: "server" };
    }
    return { client, authState: session.userId ? "server-no-token" : "anon" };
  } catch (error) {
    return {
      client,
      authState: `error:${error instanceof Error ? error.message.slice(0, 60) : "unknown"}`,
    };
  }
}

export function withAuthHeader(response: Response, authState: string): Response {
  response.headers.set("x-keel-auth", authState.replace(/[^\x20-\x7e]/g, ""));
  return response;
}
