import { fetchJson } from "../../http/fetchJson";

export type CoinMarket = {
  id: string;
  marketCapUsd: number | null;
  rank: number | null;
  price: number | null;
  change24hPct: number | null;
  change30dPct: number | null;
  change1yPct: number | null;
  /** Already in this response; keeping it costs no extra request. */
  stats: {
    volume24hUsd: number | null;
    circulatingSupply: number | null;
    totalSupply: number | null;
    maxSupply: number | null;
    fullyDilutedValuationUsd: number | null;
    ath: number | null;
    athChangePct: number | null;
    atl: number | null;
    atlChangePct: number | null;
  };
};

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parseCoinMarkets(body: unknown): Map<string, CoinMarket> {
  const out = new Map<string, CoinMarket>();
  if (!Array.isArray(body)) return out;
  for (const row of body) {
    if (!row || typeof row !== "object" || typeof row.id !== "string") continue;
    out.set(row.id, {
      id: row.id,
      marketCapUsd: num(row.market_cap),
      rank: num(row.market_cap_rank),
      price: num(row.current_price),
      change24hPct: num(row.price_change_percentage_24h_in_currency ?? row.price_change_percentage_24h),
      change30dPct: num(row.price_change_percentage_30d_in_currency),
      change1yPct: num(row.price_change_percentage_1y_in_currency),
      stats: {
        volume24hUsd: num(row.total_volume),
        circulatingSupply: num(row.circulating_supply),
        totalSupply: num(row.total_supply),
        maxSupply: num(row.max_supply),
        fullyDilutedValuationUsd: num(row.fully_diluted_valuation),
        ath: num(row.ath),
        athChangePct: num(row.ath_change_percentage),
        atl: num(row.atl),
        atlChangePct: num(row.atl_change_percentage),
      },
    });
  }
  return out;
}

/** One call for every coin in a category. */
export async function fetchCoinMarkets(coinIds: string[]): Promise<Map<string, CoinMarket>> {
  if (!coinIds.length) return new Map();
  const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("ids", coinIds.join(","));
  url.searchParams.set("price_change_percentage", "24h,30d,1y");
  url.searchParams.set("per_page", "50");
  const headers: Record<string, string> = {};
  const key = process.env.COINGECKO_API_KEY?.trim();
  if (key) headers["x-cg-demo-api-key"] = key;
  const body = await fetchJson<unknown>(url.toString(), { headers, retries: 1 });
  return parseCoinMarkets(body);
}

export async function fetchTrendingCoins(): Promise<Array<{ id: string; symbol: string; name: string }>> {
  const headers: Record<string, string> = {};
  const key = process.env.COINGECKO_API_KEY?.trim();
  if (key) headers["x-cg-demo-api-key"] = key;
  const body = await fetchJson<{ coins?: Array<{ item?: { id?: string; symbol?: string; name?: string } }> }>(
    "https://api.coingecko.com/api/v3/search/trending",
    { headers, retries: 0 },
  );
  return (body?.coins ?? [])
    .flatMap((c) =>
      c.item?.id && c.item.symbol && c.item.name
        ? [{ id: c.item.id, symbol: c.item.symbol.toUpperCase(), name: c.item.name }]
        : [],
    )
    .slice(0, 8);
}
