import { z } from "zod";
import { convexForRequest } from "@/lib/server/convexClient";
import { api } from "@/convex/_generated/api";
import { DEMO_ASK_REPLY } from "@/lib/ai/demo";

export const runtime = "nodejs";

const contextSchema = z.object({
  page: z.string().max(40).default("dashboard"),
  categoryId: z.string().max(30).optional(),
  assetIds: z.array(z.string().max(30)).max(6).default([]),
  note: z.string().max(300).default(""),
});
const inputSchema = z.object({
  sessionId: z.string().min(1).max(80),
  requestId: z.string().min(1).max(160),
  question: z.string().trim().min(1).max(500),
  assetId: z.string().max(30).optional(),
  mode: z.enum(["prepare", "guidance", "ask"]).default("ask"),
  context: contextSchema.default({ page: "dashboard", assetIds: [], note: "" }),
});

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { error: "Please enter a question of up to 500 characters." },
      { status: 400 },
    );
  const body = parsed.data;
  const client = convexForRequest();
  if (!client)
    return Response.json(
      {
        error:
          "Keel is temporarily unavailable. You can still explore the charts.",
      },
      { status: 503 },
    );
  let reserved = false,
    revision = 0;
  try {
    const profile = await client.query(api.profiles.getBySession, {
      sessionId: body.sessionId,
    });
    if (!profile)
      return Response.json(
        { error: "Please tell Keel about your goals first." },
        { status: 404 },
      );
    revision = profile.revision ?? 0;
    const id =
      body.mode === "ask" ? body.requestId : `${body.mode}:${revision}`;
    body.requestId = id;
    const contextKey = JSON.stringify(body.context);
    const previous = profile.conversation?.find((t) => t.id === id);
    if (previous) {
      if (
        previous.question !== body.question ||
        (previous.context && previous.context !== contextKey)
      )
        return Response.json(
          { error: "This request was already used for a different question." },
          { status: 409 },
        );
      return Response.json({ ...previous, text: previous.reply });
    }
    const reservation = await client.mutation(api.profiles.reserveGeneration, {
      sessionId: body.sessionId,
      requestId: id,
      revision,
    });
    if (reservation.status !== "reserved")
      return Response.json(
        {
          error:
            reservation.status === "changed"
              ? "Your answers changed. Refresh to continue."
              : "This answer is already being prepared. Please wait a moment.",
        },
        { status: reservation.status === "changed" ? 409 : 429 },
      );
    reserved = true;
    const reply = DEMO_ASK_REPLY;
    const turn = {
      assetId: body.context.assetIds[0] ?? body.assetId,
      context: contextKey,
      id,
      question: body.question,
      reply: reply.text,
      action: reply.action,
      sourceIds: reply.sourceIds,
    };
    const saved = await client.mutation(api.profiles.finishGeneration, {
      sessionId: body.sessionId,
      requestId: id,
      revision,
      turn,
    });
    if (!saved)
      return Response.json(
        { error: "Your answers changed while I was replying. Please refresh." },
        { status: 409 },
      );
    return Response.json({ ...reply, id });
  } catch {
    if (reserved)
      await client
        .mutation(api.profiles.finishGeneration, {
          sessionId: body.sessionId,
          requestId: body.requestId,
          revision,
          turn: null,
        })
        .catch(() => {});
    return Response.json(
      {
        error:
          "I couldn't finish that answer. Your charts and previous conversation are still available.",
      },
      { status: 503 },
    );
  }
}
