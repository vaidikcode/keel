import { generateText, Output } from "ai";
import { z } from "zod";
import { convexForRequest, withAuthHeader } from "@/lib/server/convexClient";
import { convexErrorResponse } from "@/lib/server/convexError";
import { api } from "@/convex/_generated/api";
import { KEEL_MODEL } from "@/lib/ai/model";
import { migrateProfile } from "@/lib/onboarding/questions";
import { CATEGORY_BY_ID, isCategoryId, type CategoryId } from "@/lib/market/categories";
import { rankSnapshot } from "@/lib/market/rank";
import type { SnapshotDoc } from "@/lib/market/refresh";
import { THOUGHTS_SYSTEM, thoughtsInput, thoughtsOutputSchema } from "@/lib/market/thoughtsPrompt";
import { isHttpsUrl } from "@/lib/dashboard/marketLookup";

export const runtime = "nodejs";
export const maxDuration = 60;

const inputSchema = z.object({
  sessionId: z.string().min(1).max(80),
  categoryId: z.string().refine(isCategoryId, "Unknown category"),
});

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Choose a category first." }, { status: 400 });
  const { sessionId } = parsed.data;
  const categoryId = parsed.data.categoryId as CategoryId;
  if (sessionId === "demo")
    return Response.json({ error: "Keel's thoughts are only written for your own answers." }, { status: 400 });
  const convex = await convexForRequest(request);
  if (!convex)
    return Response.json({ error: "Keel is temporarily unavailable." }, { status: 503 });
  const { client, authState } = convex;
  try {
    const [profileDoc, [snapshot]] = await Promise.all([
      client.query(api.profiles.getBySession, { sessionId }),
      client.query(api.snapshots.getMany, { categoryIds: [categoryId] }),
    ]);
    if (!profileDoc) return Response.json({ error: "Please tell Keel about your goals first." }, { status: 404 });
    if (!snapshot || !snapshot.assets.length)
      return Response.json({ error: "Let the category finish loading first." }, { status: 409 });
    const revision = profileDoc.revision ?? 0;
    const key = { sessionId, revision, categoryId, snapshotFetchedAt: snapshot.fetchedAt };
    const cached = await client.query(api.thoughts.get, key);
    if (cached)
      return Response.json({
        thoughts: { paragraphs: cached.paragraphs, because: cached.because, sourceIds: cached.sourceIds },
        cached: true,
      });
    if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL)
      return Response.json({ error: "Keel can't write new thoughts right now." }, { status: 503 });

    const profile = migrateProfile(profileDoc.profileV3 ?? profileDoc.profileV2 ?? profileDoc.answers);
    const { assets, capacity } = rankSnapshot(snapshot as SnapshotDoc, profile);
    if (!capacity) throw new Error("No capacity");
    const category = CATEGORY_BY_ID[categoryId];
    const allowed = new Set(snapshot.facts.map((f) => f.url).filter(isHttpsUrl));
    const result = await generateText({
      model: KEEL_MODEL,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(25000),
      output: Output.object({ schema: thoughtsOutputSchema }),
      system: THOUGHTS_SYSTEM,
      prompt: JSON.stringify(thoughtsInput({ category, assets, capacity, profile, facts: snapshot.facts })),
    });
    const out = thoughtsOutputSchema.safeParse(result.output);
    if (!out.success) throw new Error("Model returned unusable thoughts.");
    const thoughts = {
      paragraphs: out.data.paragraphs,
      because: out.data.because,
      sourceIds: out.data.sourceIds.filter((id) => allowed.has(id)),
    };
    await client.mutation(api.thoughts.put, { ...key, ...thoughts });
    return withAuthHeader(Response.json({ thoughts, cached: false }), authState);
  } catch (error) {
    return withAuthHeader(convexErrorResponse(error, "Keel couldn't finish writing. The ranking still works."), authState);
  }
}
