function demoKey(): string | null {
  const key = process.env.COINGECKO_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

async function geckoGet<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const url = new URL(`https://api.coingecko.com/api/v3${path}`);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  const headers: Record<string, string> = { Accept: "application/json" };
  const key = demoKey();
  if (key) {
    headers["x-cg-demo-api-key"] = key;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCoinPrice(id: string): Promise<{
  price: number | null;
  changePct: number | null;
  label: string;
}> {
  const data = await geckoGet<Record<string, { usd?: number; usd_24h_change?: number }>>(
    "/simple/price",
    {
      ids: id,
      vs_currencies: "usd",
      include_24hr_change: "true",
    },
  );
  const row = data?.[id];
  if (!row || typeof row.usd !== "number") {
    return { price: null, changePct: null, label: "—" };
  }
  const changePct =
    typeof row.usd_24h_change === "number" ? row.usd_24h_change : null;
  const change =
    changePct === null
      ? ""
      : ` · ${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%`;
  return {
    price: row.usd,
    changePct,
    label: `$${row.usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}${change}`,
  };
}

export async function fetchCoinFiling(id: string): Promise<string[]> {
  const data = await geckoGet<{
    description?: { en?: string };
    market_data?: {
      circulating_supply?: number;
      total_supply?: number | null;
      market_cap?: { usd?: number };
    };
  }>(`/coins/${id}`, {
    localization: "false",
    tickers: "false",
    market_data: "true",
    community_data: "false",
    developer_data: "false",
    sparkline: "false",
  });

  if (!data) {
    return [];
  }

  const lines: string[] = [];
  const desc = data.description?.en?.replace(/<[^>]+>/g, " ").trim();
  if (desc) {
    const short = desc.slice(0, 160).replace(/\s+/g, " ");
    lines.push(short.endsWith(".") ? short : `${short}…`);
  }
  const supply = data.market_data?.circulating_supply;
  if (typeof supply === "number") {
    lines.push(
      `Circulating supply about ${supply.toLocaleString("en-US", { maximumFractionDigits: 0 })}.`,
    );
  }
  const cap = data.market_data?.market_cap?.usd;
  if (typeof cap === "number") {
    lines.push(
      `Market cap about $${(cap / 1_000_000_000).toFixed(1)}B.`,
    );
  }
  return lines.slice(0, 3);
}

export async function fetchTrendingNote(): Promise<string | null> {
  const data = await geckoGet<{
    coins?: Array<{ item?: { name?: string; symbol?: string } }>;
  }>("/search/trending");
  const top = data?.coins?.[0]?.item;
  if (!top?.name || !top.symbol) {
    return null;
  }
  return `${top.name} (${top.symbol.toUpperCase()}) is trending on searches.`;
}

export async function fetchCoinSleep(id: string): Promise<{
  nights: number;
  maxDrawdownPct: number;
  pulse: number[];
} | null> {
  const data = await geckoGet<{ prices?: Array<[number, number]> }>(
    `/coins/${id}/market_chart`,
    { vs_currency: "usd", days: "365" },
  );
  const prices = data?.prices;
  if (!Array.isArray(prices) || prices.length < 10) {
    return null;
  }
  return sleepFromCloses(prices.map((row) => row[1] ?? 0).filter((n) => n > 0));
}

export function sleepFromCloses(closes: number[]): {
  nights: number;
  maxDrawdownPct: number;
  pulse: number[];
} {
  let peak = closes[0] ?? 0;
  let maxDrawdown = 0;
  let nights = 0;
  for (let i = 1; i < closes.length; i += 1) {
    const price = closes[i] ?? 0;
    const prev = closes[i - 1] ?? price;
    if (price > peak) {
      peak = price;
    }
    if (peak > 0) {
      const dd = ((peak - price) / peak) * 100;
      if (dd > maxDrawdown) {
        maxDrawdown = dd;
      }
    }
    if (prev > 0 && (price - prev) / prev <= -0.05) {
      nights += 1;
    }
  }
  const step = Math.max(1, Math.floor(closes.length / 12));
  const sample: number[] = [];
  for (let i = 0; i < closes.length; i += step) {
    sample.push(closes[i] ?? 0);
  }
  const max = Math.max(...sample, 1);
  const pulse = sample.slice(0, 12).map((value) => value / max);
  return {
    nights,
    maxDrawdownPct: Math.round(maxDrawdown),
    pulse,
  };
}
