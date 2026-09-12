import { generateText } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";
export const maxDuration = 30;

function canReachGateway(): boolean {
  if (process.env.AI_GATEWAY_API_KEY?.trim()) {
    return true;
  }
  return Boolean(process.env.VERCEL);
}

function convexClient(): ConvexHttpClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim().split(/\s+/)[0];
  if (!url) {
    return null;
  }
  return new ConvexHttpClient(url);
}

const WAIT_LINE =
  "One live question per asset. Tap a pane or a suggestion chip — I already packed those.";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const sessionId =
    "sessionId" in body && typeof body.sessionId === "string"
      ? body.sessionId.trim()
      : "";
  const assetId =
    "assetId" in body && typeof body.assetId === "string"
      ? body.assetId.trim()
      : "";
  const question =
    "question" in body && typeof body.question === "string"
      ? body.question.trim()
      : "";

  if (!sessionId || !assetId || !question) {
    return Response.json(
      { error: "sessionId, assetId, and question required" },
      { status: 400 },
    );
  }
  if (question.length > 200) {
    return Response.json({ error: "Question too long" }, { status: 400 });
  }

  const client = convexClient();
  if (!client) {
    return Response.json({ error: "Convex URL missing" }, { status: 500 });
  }

  const profile = await client.query(api.profiles.getBySession, { sessionId });
  if (!profile?.spread) {
    return Response.json({ error: "Spread not ready" }, { status: 404 });
  }

  const prior = profile.asks?.find((item) => item.assetId === assetId);
  if (prior) {
    return Response.json({ reply: prior.reply, cached: true, capped: true });
  }

  const asset = profile.spread.assets.find((item) => item.id === assetId);
  if (!asset) {
    return Response.json({ error: "Asset not found" }, { status: 404 });
  }

  let reply = WAIT_LINE;
  if (canReachGateway()) {
    try {
      const result = await generateText({
        model: "openai/gpt-4o-mini",
        prompt: `You are Keel, a sticker mascot for first-time investors. Answer in 1-2 short sentences. No return promises. Use only these facts.

Asset: ${asset.title} (${asset.ticker})
Feed: ${asset.feedLine}
Filing: ${asset.filingLine}
Sleep: ${asset.sleepLine}
Twin: ${asset.twinLine}
Price: ${asset.priceLabel}

User question: ${question}

Reply as Keel:`,
      });
      const text = result.text.trim();
      if (text.length > 0) {
        reply = text.slice(0, 400);
      }
    } catch (error) {
      console.error("Keel ask failed", error);
      reply =
        "I could not reach the gateway. Tap Feed or Filing — those lines are already packed.";
    }
  } else {
    reply =
      "Gateway is offline. Tap a pane or a suggestion chip for packed answers.";
  }

  try {
    await client.mutation(api.profiles.saveAsk, {
      sessionId,
      assetId,
      question,
      reply,
    });
  } catch (error) {
    console.error("Could not save ask", error);
  }

  return Response.json({ reply, cached: false, capped: false });
}
