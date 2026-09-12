import { generateText, Output } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  buildFallbackPack,
  llmAssetPayload,
  PACK_PROMPT,
  spreadPackSchema,
  type SourceAnswers,
  type SpreadPack,
} from "@/lib/dashboard/pack";
import { gatherFacts } from "@/lib/dashboard/sources/gather";
import type { AssetKind } from "@/lib/dashboard/universe";

export const runtime = "nodejs";
export const maxDuration = 30;

const CACHE_MS = 15 * 60 * 1000;

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

function parseAnswers(raw: unknown): SourceAnswers | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const body = raw as Record<string, unknown>;
  const watch = body.watch;
  const noise = body.noise;
  const sleep = body.sleep;
  const intent = body.intent;
  const fog = body.fog;
  if (
    (watch !== "stocks" && watch !== "funds" && watch !== "crypto") ||
    typeof noise !== "string" ||
    typeof sleep !== "string" ||
    typeof intent !== "string" ||
    !Array.isArray(fog) ||
    !fog.every((item) => typeof item === "string")
  ) {
    return null;
  }
  return {
    watch: watch as AssetKind,
    noise,
    sleep,
    fog: fog as string[],
    intent,
  };
}

function mergePulse(pack: SpreadPack, facts: Awaited<ReturnType<typeof gatherFacts>>): SpreadPack {
  return {
    ...pack,
    greeting: pack.greeting.trim() || "I am Keel. Tap a pane.",
    prompt: pack.prompt.trim() || "Headline or the filing?",
    asks:
      pack.asks.filter((item) => item.trim().length > 0).length > 0
        ? pack.asks
        : ["What is this?", "How jumpy?", "Show the twin"],
    assets: pack.assets.map((asset, index) => {
      const fact = facts[index];
      const beats = {
        feed: asset.beats.feed.trim() || "This is the noise side.",
        filing: asset.beats.filing.trim() || "This is the document.",
        sleep: asset.beats.sleep.trim() || "Match your sleep chip.",
        twin: asset.beats.twin.trim() || "Try the boring twin.",
        jargon: asset.beats.jargon.trim() || "Tap a word for plain English.",
        mismatch:
          asset.beats.mismatch.trim() ||
          "Your chip and this bar disagree.",
      };
      return {
        ...asset,
        feedLine: asset.feedLine.trim() || fact?.headlines[0] || "Quiet on the feed.",
        filingLine:
          asset.filingLine.trim() ||
          fact?.filingFacts[0] ||
          "See the document side.",
        sleepLine: asset.sleepLine.trim() || "Check the nights bar.",
        twinLine: asset.twinLine.trim() || "Compare to the boring twin.",
        twinTitle: asset.twinTitle.trim() || "Twin",
        priceLabel: fact?.priceLabel || asset.priceLabel || "—",
        nights: fact?.nights ?? asset.nights,
        maxDrawdownPct: fact?.maxDrawdownPct ?? asset.maxDrawdownPct,
        pulse: fact && fact.pulse.length > 0 ? fact.pulse : asset.pulse,
        jargon:
          asset.jargon.length > 0
            ? asset.jargon.map((item) => ({
                term: item.term.trim() || "Term",
                plain: item.plain.trim() || "Plain English.",
              }))
            : [
                {
                  term: "Volatility",
                  plain: "How wildly the price jumps.",
                },
              ],
        beats,
        assetGreeting:
          asset.assetGreeting.trim() ||
          "Tap left for noise, right for the document.",
      };
    }),
  };
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const sessionId =
    "sessionId" in body && typeof body.sessionId === "string"
      ? body.sessionId.trim()
      : "";
  if (!sessionId) {
    return Response.json({ error: "sessionId required" }, { status: 400 });
  }

  const client = convexClient();
  if (!client) {
    return Response.json({ error: "Convex URL missing" }, { status: 500 });
  }

  const profile = await client.query(api.profiles.getBySession, { sessionId });
  if (!profile) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  if (
    profile.spread &&
    profile.spreadAt &&
    Date.now() - profile.spreadAt < CACHE_MS
  ) {
    return Response.json({ pack: profile.spread, cached: true });
  }

  const answers =
    parseAnswers(profile.answers) ??
    parseAnswers("answers" in body ? body.answers : null);
  if (!answers) {
    return Response.json({ error: "Invalid answers" }, { status: 400 });
  }

  const facts = await gatherFacts(answers);
  let pack = buildFallbackPack(answers, facts);

  if (canReachGateway()) {
    try {
      const result = await generateText({
        model: "openai/gpt-4o-mini",
        output: Output.object({
          schema: spreadPackSchema.omit({ source: true }),
          name: "keelSpreadPack",
          description: "Keel Feed vs Filing mascot pack",
        }),
        prompt: `${PACK_PROMPT}

User answers:
${JSON.stringify(answers)}

Asset facts (do not invent numbers beyond these):
${JSON.stringify(facts.map(llmAssetPayload))}
`,
      });
      const parsed = spreadPackSchema.omit({ source: true }).safeParse(result.output);
      if (parsed.success) {
        pack = mergePulse(
          { ...parsed.data, source: "gateway" },
          facts,
        );
      }
    } catch (error) {
      console.error("Keel spread pack failed", error);
    }
  }

  try {
    await client.mutation(api.profiles.saveSpread, {
      sessionId,
      spread: pack,
    });
  } catch (error) {
    console.error("Could not cache spread", error);
  }

  return Response.json({ pack, cached: false });
}
