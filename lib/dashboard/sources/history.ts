import type { Point } from "../model";
export async function fetchHistory(
  ticker: string,
  coinId?: string,
): Promise<Point[]> {
  const url = coinId
    ? `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=365`
    : `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1y&interval=1d`;
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "Keel/2.0",
    };
    if (coinId && process.env.COINGECKO_API_KEY)
      headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const body = await response.json();
    const points: Point[] = [];
    if (coinId) {
      for (const row of body.prices ?? [])
        if (
          Array.isArray(row) &&
          Number.isFinite(row[0]) &&
          Number.isFinite(row[1]) &&
          row[1] > 0
        )
          points.push({
            date: new Date(row[0]).toISOString().slice(0, 10),
            value: row[1],
          });
    } else {
      const result = body.chart?.result?.[0];
      const closes = result?.indicators?.quote?.[0]?.close ?? [];
      for (const [i, stamp] of (result?.timestamp ?? []).entries())
        if (
          Number.isFinite(stamp) &&
          Number.isFinite(closes[i]) &&
          closes[i] > 0
        )
          points.push({
            date: new Date(stamp * 1000).toISOString().slice(0, 10),
            value: closes[i],
          });
    }
    return [...new Map(points.map((p) => [p.date, p])).values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  } catch {
    return [];
  }
}
