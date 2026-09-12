import { after } from "next/server";
import { convexForRequest, withAuthHeader } from "@/lib/server/convexClient";
import { convexErrorResponse } from "@/lib/server/convexError";
import { api } from "@/convex/_generated/api";
import { migrateProfile, type Profile } from "@/lib/onboarding/questions";
import { assetById, CATEGORY_BY_ID, categoryOf } from "@/lib/market/categories";
import { ensureSnapshot } from "@/lib/market/refresh";
import { ensureDetails } from "@/lib/market/details";
import { rankSnapshot } from "@/lib/market/rank";
import { actionItems } from "@/lib/market/actionItems";
import { COMPONENT_EXPLANATIONS } from "@/lib/market/risk";
import type { AssetDetails, CategorySnapshot } from "@/lib/market/snapshotModel";
import { sampleProfile, sampleSnapshot } from "@/lib/dashboard/sample";

export const runtime = "nodejs";
export const maxDuration = 60;

function build(input: {
  id: string;
  snapshot: CategorySnapshot;
  details: AssetDetails | null;
  profile: Profile | null;
  sample: boolean;
  warnings: string[];
}) {
  const asset = assetById(input.id)!;
  const category = categoryOf(input.id)!;
  const { assets, capacity } = rankSnapshot(input.snapshot, input.profile);
  const ranked = assets.find((a) => a.id === input.id);
  const raw = input.snapshot.assets.find((a) => a.id === input.id);
  if (!ranked || !raw) return null;
  const peers = assets.filter((a) => a.id !== input.id).slice(0, 3);
  const broad = CATEGORY_BY_ID["broad-funds"].assets[0];
  return {
    sample: input.sample,
    asset: {
      id: asset.id,
      ticker: asset.ticker,
      name: asset.name,
      kind: asset.kind,
      description: asset.description,
      tradeoff: asset.tradeoff,
      url: asset.url,
      historySource: raw.historySource,
      price: raw.price,
      change1dPct: raw.change1dPct,
      change30dPct: raw.change30dPct,
      change1yPct: raw.change1yPct,
      history: raw.history,
      fundamentals: raw.fundamentals,
    },
    category: { id: category.id, label: category.label, short: category.short },
    benchmark: input.snapshot.benchmark,
    risk: raw.risk
      ? {
          ...raw.risk,
          explanations: COMPONENT_EXPLANATIONS,
        }
      : null,
    fit: ranked.fit,
    rank: ranked.rank,
    of: assets.length,
    capacity,
    details: input.details ?? { fetchedAt: 0, expiresAt: 0, news: [], secFacts: [], facts: [] },
    actionItems: actionItems({
      asset,
      category,
      profile: input.profile,
      risk: raw.risk,
      topBroadFund: asset.kind === "stocks" ? { ticker: broad.ticker, name: broad.name } : null,
    }),
    peers: peers.map((p) => ({ id: p.id, ticker: p.ticker, name: p.name, risk: p.risk?.score ?? null, fit: p.fit?.score ?? null, rank: p.rank })),
    fetchedAt: input.snapshot.fetchedAt,
    warnings: input.warnings,
  };
}

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await ctx.params;
  const id = rawId.toLowerCase().slice(0, 30);
  const asset = assetById(id);
  const category = categoryOf(id);
  if (!asset || !category)
    return Response.json({ error: "We couldn't find that option." }, { status: 404 });
  const sessionId = new URL(request.url).searchParams.get("sessionId")?.trim().slice(0, 80) ?? "";
  if (sessionId === "demo") {
    const body = build({ id, snapshot: sampleSnapshot(category.id), details: null, profile: sampleProfile, sample: true, warnings: ["sample"] });
    return Response.json(body);
  }
  const convex = await convexForRequest(request);
  if (!convex)
    return Response.json({ error: "Temporarily unavailable." }, { status: 503 });
  const { client, authState } = convex;
  try {
    const profileDoc = sessionId
      ? await client.query(api.profiles.getBySession, { sessionId })
      : null;
    const profile = profileDoc
      ? migrateProfile(profileDoc.profileV3 ?? profileDoc.profileV2 ?? profileDoc.answers)
      : null;
    const schedule = (task: () => Promise<void>) => after(task);
    const [{ snapshot, stale, refreshing }, details] = await Promise.all([
      ensureSnapshot(client, category.id, { schedule }),
      ensureDetails(client, asset, schedule),
    ]);
    if (!snapshot)
      return Response.json({ error: "Prices aren't available right now. Please try again shortly." }, { status: 503 });
    const body = build({
      id,
      snapshot,
      details,
      profile,
      sample: false,
      warnings: [...snapshot.warnings, ...(stale ? ["stale"] : []), ...(refreshing ? ["refreshing"] : [])],
    });
    if (!body) return Response.json({ error: "We couldn't find that option." }, { status: 404 });
    return withAuthHeader(Response.json(body), authState);
  } catch (error) {
    return withAuthHeader(convexErrorResponse(error, "We couldn't load this option. Please try again."), authState);
  }
}
