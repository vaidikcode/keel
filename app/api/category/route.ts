import { after } from "next/server";
import { z } from "zod";
import { convexForRequest } from "@/lib/server/convexClient";
import { api } from "@/convex/_generated/api";
import { migrateProfile } from "@/lib/onboarding/questions";
import { CATEGORY_BY_ID, CATEGORY_IDS, isCategoryId } from "@/lib/market/categories";
import { ensureSnapshot, type SnapshotDoc } from "@/lib/market/refresh";
import { rankSnapshot, trendingFrom } from "@/lib/market/rank";
import { categoryResponseSchema, type CategoryResponse } from "@/lib/market/snapshotModel";
import { sampleAllSnapshots, sampleProfile } from "@/lib/dashboard/sample";

export const runtime = "nodejs";
export const maxDuration = 60;

const inputSchema = z.object({
  sessionId: z.string().min(1).max(80),
  categoryId: z.string().refine(isCategoryId, "Unknown category"),
  force: z.boolean().optional(),
});

function sampleResponse(categoryId: (typeof CATEGORY_IDS)[number]): CategoryResponse {
  const all = sampleAllSnapshots();
  const snapshot = all.get(categoryId)!;
  const { assets, capacity } = rankSnapshot(snapshot, sampleProfile);
  const category = CATEGORY_BY_ID[categoryId];
  return categoryResponseSchema.parse({
    category: { id: category.id, label: category.label, short: category.short, blurb: category.blurb },
    fetchedAt: 0,
    stale: false,
    refreshing: false,
    sample: true,
    capacity,
    assets,
    facts: [],
    thoughts: {
      paragraphs: [
        `This is an example of how Keel ranks ${category.label.toLowerCase()}. The prices are made up, so the numbers only show the shape of the idea.`,
        "Options that fit your answers rank higher. Calmer ones sit near the top for someone who said they could sit through a drop of about 20%.",
      ],
      because: [
        { field: "horizon", text: "More than 5 years" },
        { field: "lossTolerance", text: "A drop of about 20%" },
      ],
      sourceIds: [],
    },
    trending: trendingFrom([...all.entries()].map(([id, s]) => ({ categoryId: id, snapshot: s })), 6),
    warnings: ["sample"],
  });
}

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "Choose a category to explore." }, { status: 400 });
  const body = parsed.data;
  const categoryId = body.categoryId as (typeof CATEGORY_IDS)[number];
  if (body.sessionId === "demo") return Response.json(sampleResponse(categoryId));

  const client = await convexForRequest();
  if (!client)
    return Response.json({ error: "Your dashboard is temporarily unavailable." }, { status: 503 });
  try {
    const profileDoc = await client.query(api.profiles.getBySession, { sessionId: body.sessionId });
    if (!profileDoc)
      return Response.json({ error: "Please tell Keel about your goals first." }, { status: 404 });
    const profile = migrateProfile(profileDoc.profileV3 ?? profileDoc.profileV2 ?? profileDoc.answers);

    const { snapshot, stale, refreshing } = await ensureSnapshot(client, categoryId, {
      force: body.force === true,
      schedule: (task) => after(task),
    });
    if (!snapshot)
      return Response.json(
        { error: "Prices for this category aren't available right now. Please try again shortly." },
        { status: 503 },
      );
    const { assets, capacity } = rankSnapshot(snapshot, profile);
    const [others, thoughts] = await Promise.all([
      client.query(api.snapshots.getMany, { categoryIds: [...CATEGORY_IDS] }),
      client.query(api.thoughts.get, {
        sessionId: body.sessionId,
        revision: profileDoc.revision ?? 0,
        categoryId,
        snapshotFetchedAt: snapshot.fetchedAt,
      }),
    ]);
    const category = CATEGORY_BY_ID[categoryId];
    const response: CategoryResponse = categoryResponseSchema.parse({
      category: { id: category.id, label: category.label, short: category.short, blurb: category.blurb },
      fetchedAt: snapshot.fetchedAt,
      stale,
      refreshing,
      sample: false,
      capacity,
      assets,
      facts: snapshot.facts.map(({ title, url: u, snippet, publishedAt }) => ({ title, url: u, snippet, publishedAt })),
      thoughts: thoughts
        ? { paragraphs: thoughts.paragraphs, because: thoughts.because, sourceIds: thoughts.sourceIds }
        : null,
      trending: trendingFrom(
        (others as SnapshotDoc[])
          .filter((s) => s.assets.length)
          .map((s) => ({ categoryId: s.categoryId, snapshot: s })),
      ),
      warnings: snapshot.warnings,
    });
    return Response.json(response);
  } catch {
    return Response.json(
      { error: "We couldn't load this category. Your answers are saved; please try again." },
      { status: 503 },
    );
  }
}
