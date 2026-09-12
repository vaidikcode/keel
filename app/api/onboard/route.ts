import { generateText, Output } from "ai";
import {
  CATALOG_PROMPT,
  FALLBACK_CATALOG,
  catalogSchema,
  type Catalog,
} from "@/lib/onboarding/catalog";

export const runtime = "nodejs";
export const maxDuration = 30;

function canReachGateway(): boolean {
  if (process.env.AI_GATEWAY_API_KEY?.trim()) {
    return true;
  }
  return Boolean(process.env.VERCEL);
}

export async function POST() {
  if (!canReachGateway()) {
    return Response.json({
      catalog: FALLBACK_CATALOG,
      source: "fallback" as const,
      reason: "missing-key",
    });
  }

  try {
    const result = await generateText({
      model: "openai/gpt-4o-mini",
      output: Output.object({
        schema: catalogSchema,
        name: "keelCatalog",
        description: "Mind Over Money onboarding catalog for Keel",
      }),
      prompt: CATALOG_PROMPT,
    });

    const catalog: Catalog = catalogSchema.parse(result.output);

    return Response.json({
      catalog,
      source: "gateway" as const,
    });
  } catch (error) {
    console.error("Keel onboard catalog failed", error);
    return Response.json({
      catalog: FALLBACK_CATALOG,
      source: "fallback" as const,
      reason: "gateway-error",
    });
  }
}
