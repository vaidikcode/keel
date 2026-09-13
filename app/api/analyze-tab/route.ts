import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { analyzedAssetSchema } from "@/lib/dashboard/analyzedAsset";
import { demoAnalyzedAsset } from "@/lib/ai/demo";
import { convexForRequest } from "@/lib/server/convexClient";

export const runtime = "nodejs";

const inputSchema = z.object({
  sessionId: z.string().min(1).max(80),
  question: z.string().trim().min(1).max(500),
  image: z
    .string()
    .max(2_000_000)
    .refine((value) => /^data:image\/(jpeg|png);base64,/.test(value), "Invalid image"),
});

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { error: "Share a clear stock page and enter a question of up to 500 characters." },
      { status: 400 },
    );
  const client = convexForRequest();
  if (!client)
    return Response.json({ error: "Keel is temporarily unavailable." }, { status: 503 });

  const body = parsed.data;
  const profile = await client.query(api.profiles.getBySession, {
    sessionId: body.sessionId,
  });
  if (!profile)
    return Response.json({ error: "Please tell Keel about your goals first." }, { status: 404 });

  try {
    const asset = analyzedAssetSchema.parse(demoAnalyzedAsset(body.question));
    await client.mutation(api.profiles.recordAnalyzedAsset, {
      sessionId: body.sessionId,
      asset,
    });
    return Response.json({ asset, confidence: 1 });
  } catch {
    return Response.json(
      { error: "I couldn't analyze that tab just now. Keep the stock page visible and try again." },
      { status: 503 },
    );
  }
}
