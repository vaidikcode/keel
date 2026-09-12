export type QuoteResult = {
  price: number | null;
  changePct: number | null;
  label: string;
};

export type NewsItem = {
  headline: string;
  datetime: number;
  url: string | null;
};

export type SymbolMatch = {
  symbol: string;
  name: string;
  type: string;
};

export type CompanyProfile = {
  name: string;
  ticker: string;
  industry: string | null;
  website: string | null;
  marketCapMillions: number | null;
  country: string | null;
};

function httpsUrl(value: unknown): string | null {
  return typeof value === "string" && /^https:\/\//.test(value) ? value : null;
}

function mapNews(
  data: Array<{ headline?: string; datetime?: number; url?: string }>,
): NewsItem[] {
  return data
    .filter(
      (item) =>
        typeof item.headline === "string" && item.headline.length > 0,
    )
    .slice(0, 5)
    .map((item) => ({
      headline: item.headline as string,
      datetime: typeof item.datetime === "number" ? item.datetime : 0,
      url: httpsUrl(item.url),
    }));
}

function finnhubKey(): string | null {
  const key = process.env.FINNHUB_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

async function finnhubGet<T>(
  path: string,
  params: Record<string, string>,
): Promise<T | null> {
  const key = finnhubKey();
  if (!key) {
    return null;
  }
  const url = new URL(`https://finnhub.io/api/v1${path}`);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  url.searchParams.set("token", key);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal });
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

export async function fetchQuote(symbol: string): Promise<QuoteResult> {
  const data = await finnhubGet<{
    c?: number;
    dp?: number;
  }>("/quote", { symbol });

  if (!data || typeof data.c !== "number" || data.c === 0) {
    return { price: null, changePct: null, label: "—" };
  }

  const changePct = typeof data.dp === "number" ? data.dp : null;
  const price = data.c;
  const change =
    changePct === null
      ? ""
      : ` · ${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%`;
  return {
    price,
    changePct,
    label: `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}${change}`,
  };
}

export async function fetchCompanyNews(
  symbol: string,
): Promise<NewsItem[]> {
  const to = new Date();
  const from = new Date(to.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const data = await finnhubGet<
    Array<{ headline?: string; datetime?: number; url?: string }>
  >("/company-news", {
    symbol,
    from: fmt(from),
    to: fmt(to),
  });

  if (!Array.isArray(data)) {
    return [];
  }

  return mapNews(data);
}

export async function fetchMarketNews(
  category: "general" | "crypto",
): Promise<NewsItem[]> {
  const data = await finnhubGet<
    Array<{ headline?: string; datetime?: number; url?: string }>
  >("/news", { category });

  if (!Array.isArray(data)) {
    return [];
  }

  return mapNews(data);
}

export async function searchSymbols(query: string): Promise<SymbolMatch[]> {
  const data = await finnhubGet<{
    result?: Array<{
      description?: string;
      displaySymbol?: string;
      symbol?: string;
      type?: string;
    }>;
  }>("/search", { q: query.slice(0, 40) });

  if (!Array.isArray(data?.result)) {
    return [];
  }

  return data.result
    .flatMap((row) => {
      const symbol = (row.displaySymbol ?? row.symbol ?? "").trim();
      if (!symbol) return [];
      return [
        {
          symbol,
          name: (row.description ?? symbol).slice(0, 80),
          type: row.type ?? "unknown",
        },
      ];
    })
    .slice(0, 6);
}

export async function fetchCompanyProfile(
  symbol: string,
): Promise<CompanyProfile | null> {
  const data = await finnhubGet<{
    name?: string;
    ticker?: string;
    finnhubIndustry?: string;
    weburl?: string;
    marketCapitalization?: number;
    country?: string;
  }>("/stock/profile2", { symbol });

  if (!data || typeof data.name !== "string" || !data.name) {
    return null;
  }

  return {
    name: data.name,
    ticker: typeof data.ticker === "string" ? data.ticker : symbol,
    industry:
      typeof data.finnhubIndustry === "string" ? data.finnhubIndustry : null,
    website: httpsUrl(data.weburl),
    marketCapMillions:
      typeof data.marketCapitalization === "number"
        ? data.marketCapitalization
        : null,
    country: typeof data.country === "string" ? data.country : null,
  };
}
