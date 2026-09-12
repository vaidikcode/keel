import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { migrateProfile } from "@/lib/onboarding/questions";
import { catalogFor } from "@/lib/dashboard/catalog";
import {
  fetchEvidence,
  fetchFinancialEvidence,
} from "@/lib/dashboard/sources/evidence";
import { fetchHistory } from "@/lib/dashboard/sources/history";
import { dashboardSchema } from "@/lib/dashboard/model";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      typeof body.sessionId !== "string" ||
      body.sessionId.length > 80 ||
      !body.sessionId
    )
      return Response.json(
        { error: "Please start with your goals." },
        { status: 400 },
      );
    const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim().split(/\s+/)[0];
    if (!url)
      return Response.json(
        { error: "Your dashboard is temporarily unavailable." },
        { status: 503 },
      );
    const client = new ConvexHttpClient(url);
    const profile = await client.query(api.profiles.getBySession, {
      sessionId: body.sessionId,
    });
    if (!profile)
      return Response.json(
        { error: "Please tell Keel about your goals first." },
        { status: 404 },
      );
    const cached = dashboardSchema.safeParse(profile.dashboard);
    if (
      body.force !== true &&
      cached.success &&
      Date.now() - cached.data.generatedAt < 900000 &&
      cached.data.assets.some((a) => a.history.length > 1)
    )
      return Response.json({ dashboard: cached.data });
    const assets = await Promise.all(
      catalogFor(migrateProfile(profile.profileV2 ?? profile.answers)).map(
        async ({ coinId, ...asset }) => {
          const [history, news, financials] = await Promise.all([
            fetchHistory(asset.ticker, coinId),
            coinId ? Promise.resolve([]) : fetchEvidence(asset.ticker),
            fetchFinancialEvidence(asset.ticker),
          ]);
          return {
            ...asset,
            history,
            retrievedAt: Date.now(),
            evidence: [
              ...news,
              ...financials,
              ...(history.length
                ? [
                    {
                      label: "Price history",
                      url: asset.historySource,
                      asOf: history.at(-1)!.date,
                      text: "Daily prices in USD. Dividends, fees and taxes are not included.",
                    },
                  ]
                : []),
            ],
          };
        },
      ),
    );
    const dashboard = dashboardSchema.parse({
      version: 2,
      assets,
      sample: false,
      generatedAt: Date.now(),
    });
    const saved = await client.mutation(api.profiles.saveDashboard, {
      sessionId: body.sessionId,
      revision: profile.revision ?? 0,
      dashboard,
    });
    if (!saved)
      return Response.json(
        { error: "Your answers changed. Please refresh your dashboard." },
        { status: 409 },
      );
    return Response.json({ dashboard });
  } catch {
    return Response.json(
      {
        error:
          "We couldn't load your dashboard. Your answers are saved; please try again.",
      },
      { status: 503 },
    );
  }
}
