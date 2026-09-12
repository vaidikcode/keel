/**
 * Turn a Convex/route failure into a response the UI can act on. Auth
 * rejections from KEEL_REQUIRE_AUTH become a 401 with a clear message instead
 * of the generic retry copy, so a signed-out session is not mistaken for a
 * data outage.
 */
export function convexErrorResponse(error: unknown, fallback: string): Response {
  const message = error instanceof Error ? error.message : String(error);
  if (/Sign in to continue|belongs to another account/i.test(message))
    return Response.json(
      { error: "Your sign-in didn't reach Keel's data. Please sign out and back in, then try again.", code: "auth" },
      { status: 401 },
    );
  console.error("[keel] route failure:", message.slice(0, 300));
  return Response.json({ error: fallback }, { status: 503 });
}
