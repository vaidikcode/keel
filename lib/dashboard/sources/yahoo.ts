export type YahooQuoteMatch = {
  symbol: string;
  name: string;
  type: string;
  exchange: string | null;
};

export type YahooNewsItem = {
  title: string;
  url: string;
  publisher: string | null;
  asOf: string | null;
};

export type YahooSearchResult = {
  quotes: YahooQuoteMatch[];
  news: YahooNewsItem[];
};

export type YahooQuote = {
  symbol: string;
  price: number;
  changePct: number | null;
  asOf: string | null;
  source: string;
};

function httpsUrl(value: unknown): string | null {
  return typeof value === "string" && /^https:\/\//.test(value) ? value : null;
}

function yahooHeaders(): Record<string, string> {
  return {
    Accept: "application/json",
    "User-Agent": "Keel/2.0",
  };
}

export function sanitizeSymbol(raw: string): string | null {
  const symbol = raw.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9.^:-]{0,19}$/.test(symbol)) return null;
  return symbol;
}

export function yahooSymbol(ticker: string): string {
  const raw = ticker.trim().toUpperCase();
  const symbol = raw.includes(":") ? raw.slice(raw.lastIndexOf(":") + 1) : raw;
  const crypto = symbol.replace(/USDT$/, "").replace(/-USD$/, "");
  if (["BTC", "ETH", "DOGE", "SOL"].includes(crypto)) return `${crypto}-USD`;
  return symbol.replace(/USDT$/, "");
}

export function quotePage(symbol: string): string {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol(symbol))}/`;
}

export function parseYahooSearch(body: unknown): YahooSearchResult {
  if (!body || typeof body !== "object") {
    return { quotes: [], news: [] };
  }
  const row = body as {
    quotes?: Array<{
      symbol?: string;
      shortname?: string;
      longname?: string;
      quoteType?: string;
      typeDisp?: string;
      exchDisp?: string;
      exchange?: string;
    }>;
    news?: Array<{
      title?: string;
      link?: string;
      publisher?: string;
      providerPublishTime?: number;
    }>;
  };
  const quotes = (row.quotes ?? [])
    .flatMap((item) => {
      const symbol = sanitizeSymbol(item.symbol ?? "");
      if (!symbol) return [];
      return [
        {
          symbol,
          name: (item.longname ?? item.shortname ?? symbol).slice(0, 80),
          type: item.typeDisp ?? item.quoteType ?? "unknown",
          exchange: item.exchDisp ?? item.exchange ?? null,
        },
      ];
    })
    .slice(0, 6);
  const news = (row.news ?? [])
    .flatMap((item) => {
      const url = httpsUrl(item.link);
      if (!url || typeof item.title !== "string" || !item.title) return [];
      return [
        {
          title: item.title.slice(0, 240),
          url,
          publisher: item.publisher ?? null,
          asOf:
            typeof item.providerPublishTime === "number" &&
            item.providerPublishTime > 0
              ? new Date(item.providerPublishTime * 1000)
                  .toISOString()
                  .slice(0, 10)
              : null,
        },
      ];
    })
    .slice(0, 5);
  return { quotes, news };
}

async function yahooGet<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: yahooHeaders(),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function searchYahoo(query: string): Promise<YahooSearchResult> {
  const url = new URL("https://query1.finance.yahoo.com/v1/finance/search");
  url.searchParams.set("q", query.trim().slice(0, 40));
  url.searchParams.set("quotesCount", "6");
  url.searchParams.set("newsCount", "5");
  const data = await yahooGet<unknown>(url.toString());
  return parseYahooSearch(data);
}

export async function fetchYahooQuote(
  ticker: string,
): Promise<YahooQuote | null> {
  const symbol = yahooSymbol(ticker);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
  const data = await yahooGet<{
    chart?: {
      result?: Array<{
        meta?: { regularMarketPrice?: number; chartPreviousClose?: number };
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: Array<number | null> }> };
      }>;
    };
  }>(url);
  const result = data?.chart?.result?.[0];
  const closes =
    result?.indicators?.quote?.[0]?.close?.filter(
      (value): value is number => typeof value === "number" && value > 0,
    ) ?? [];
  const price =
    typeof result?.meta?.regularMarketPrice === "number" &&
    result.meta.regularMarketPrice > 0
      ? result.meta.regularMarketPrice
      : (closes.at(-1) ?? 0);
  if (!price) return null;
  const previous =
    typeof result?.meta?.chartPreviousClose === "number" &&
    result.meta.chartPreviousClose > 0
      ? result.meta.chartPreviousClose
      : (closes.at(-2) ?? null);
  const stamp = result?.timestamp?.at(-1);
  return {
    symbol,
    price,
    changePct:
      previous && previous > 0 ? ((price - previous) / previous) * 100 : null,
    asOf:
      typeof stamp === "number"
        ? new Date(stamp * 1000).toISOString().slice(0, 10)
        : null,
    source: quotePage(symbol),
  };
}
