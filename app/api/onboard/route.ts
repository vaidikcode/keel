import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Catalog-on-Start is retired. Universe is static; assemble uses /api/spread. */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      reason: "retired",
      message: "Use /api/spread after onboarding. Start does not call the LLM.",
    },
    { status: 410 },
  );
}
