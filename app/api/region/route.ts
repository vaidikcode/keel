import { NextResponse } from "next/server";
import {
  DEFAULT_COUNTRY,
  currencyFor,
  isSupportedCountry,
} from "@/lib/onboarding/regions";

export const runtime = "nodejs";

/**
 * Best-effort country for prefilling the intake, from the hosting platform's
 * own edge header. No third-party geolocation service is contacted, so the
 * visitor's IP never leaves the infrastructure already serving them.
 *
 * Absent locally and on hosts that don't set it — the client then falls back to
 * its timezone, and finally to US/USD. Always editable by the user.
 */
export async function GET(request: Request) {
  const header =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    "";
  const country = header.toUpperCase();
  const resolved = isSupportedCountry(country) ? country : DEFAULT_COUNTRY;
  return NextResponse.json(
    {
      country: resolved,
      currency: currencyFor(resolved),
      detected: isSupportedCountry(country),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
