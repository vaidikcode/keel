import type { Point } from "../snapshotModel";
import { fetchJson } from "../../http/fetchJson";
import { fetchHistory } from "../../dashboard/sources/history";
import { pLimit } from "../../http/fetchJson";

type SparkRow = { timestamp?: unknown; close?: unknown; symbol?: unknown };
type SparkV8 = Record<string, SparkRow>;
type SparkWrapped = {
  spark?: {
    result?: Array<{
      symbol?: string;
      response?: Array<{
        timestamp?: unknown;
        indicators?: { quote?: Array<{ close?: unknown }> };
      }>;
    }>;
  };
};

function toPoints(timestamps: unknown, closes: unknown): Point[] {
  if (!Array.isArray(timestamps) || !Array.isArray(closes)) return [];
  const points: Point[] = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    const stamp = timestamps[i],
      close = closes[i];
    if (
      typeof stamp === "number" &&
      Number.isFinite(stamp) &&
      typeof close === "number" &&
      Number.isFinite(close) &&
      close > 0
    )
      points.push({
        date: new Date(stamp * 1000).toISOString().slice(0, 10),
        value: close,
      });
  }
  return [...new Map(points.map((p) => [p.date, p])).values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

/** Accepts both spark payload shapes Yahoo has served. */
export function parseSpark(body: unknown): Map<string, Point[]> {
  const out = new Map<string, Point[]>();
  if (!body || typeof body !== "object") return out;
  const wrapped = body as SparkWrapped;
  if (Array.isArray(wrapped.spark?.result)) {
    for (const row of wrapped.spark.result) {
      const r = row.response?.[0];
      if (!row.symbol || !r) continue;
      const points = toPoints(r.timestamp, r.indicators?.quote?.[0]?.close);
      if (points.length) out.set(row.symbol.toUpperCase(), points);
    }
    return out;
  }
  for (const [symbol, row] of Object.entries(body as SparkV8)) {
    if (!row || typeof row !== "object") continue;
    const points = toPoints(row.timestamp, row.close);
    if (points.length) out.set(symbol.toUpperCase(), points);
  }
  return out;
}

export function missingSymbols(requested: string[], parsed: Map<string, Point[]>): string[] {
  return requested.filter((s) => !parsed.has(s.toUpperCase()));
}

export async function fetchSpark(symbols: string[]): Promise<Map<string, Point[]>> {
  if (!symbols.length) return new Map();
  const url = new URL("https://query1.finance.yahoo.com/v8/finance/spark");
  url.searchParams.set("symbols", symbols.join(","));
  url.searchParams.set("range", "1y");
  url.searchParams.set("interval", "1d");
  const body = await fetchJson<unknown>(url.toString(), {
    headers: { "User-Agent": "Keel/3.0" },
    timeoutMs: 9000,
    retries: 1,
  });
  return parseSpark(body);
}

/**
 * One batched call for every symbol, then per-symbol chart fallback for
 * anything Yahoo silently dropped. Crypto fallback goes to CoinGecko.
 */
export async function fetchBatchHistory(
  symbols: Array<{ symbol: string; coinId?: string }>,
): Promise<{ series: Map<string, Point[]>; warnings: string[]; source: Map<string, string> }> {
  const warnings: string[] = [];
  const source = new Map<string, string>();
  const series = await fetchSpark(symbols.map((s) => s.symbol));
  for (const key of series.keys()) source.set(key, "yahoo-spark");
  const missing = symbols.filter((s) => !series.has(s.symbol.toUpperCase()));
  if (!series.size) warnings.push("spark:unavailable");
  else if (missing.length)
    warnings.push(`spark:missing ${missing.map((m) => m.symbol).join(",")}`);
  if (missing.length) {
    const filled = await pLimit(missing, 4, async (m) => {
      await new Promise((r) => setTimeout(r, Math.random() * 300));
      const points = await fetchHistory(m.symbol, m.coinId);
      return [m, points] as const;
    });
    for (const [m, points] of filled) {
      if (points.length) {
        series.set(m.symbol.toUpperCase(), points);
        source.set(m.symbol.toUpperCase(), m.coinId ? "coingecko" : "yahoo-chart");
      } else warnings.push(`history:none ${m.symbol}`);
    }
  }
  return { series, warnings, source };
}
