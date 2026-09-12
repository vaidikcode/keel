import { sleepFromCloses } from "./coingecko";

export async function fetchYahooSleep(ticker: string): Promise<{
  nights: number;
  maxDrawdownPct: number;
  pulse: number[];
} | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker,
  )}?range=1y&interval=1d`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Keel/1.0",
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as {
      chart?: {
        result?: Array<{
          indicators?: {
            quote?: Array<{ close?: Array<number | null> }>;
          };
        }>;
      };
    };
    const closes =
      body.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(
        (value): value is number => typeof value === "number" && value > 0,
      ) ?? [];
    if (closes.length < 10) {
      return null;
    }
    return sleepFromCloses(closes);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
