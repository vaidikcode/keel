import { z } from "zod";
import { convexForRequest } from "@/lib/server/convexClient";
import { api } from "@/convex/_generated/api";
import { demoThoughts } from "@/lib/ai/demo";
import { migrateProfile } from "@/lib/onboarding/questions";
import { isCategoryId, type CategoryId } from "@/lib/market/categories";

export const runtime = "nodejs";

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
  const client = convexForRequest();
  if (!client)
    return Response.json({ error: "Keel is temporarily unavailable." }, { status: 503 });
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
    const profile = migrateProfile(profileDoc.profileV3 ?? profileDoc.profileV2 ?? profileDoc.answers);
    const thoughts = demoThoughts(profile);
    await client.mutation(api.thoughts.put, { ...key, ...thoughts });
    return Response.json({ thoughts, cached: false });
  } catch {
    return Response.json({ error: "Keel couldn't finish writing. The ranking still works." }, { status: 503 });
  }
}
