export type QuoteResult = {
  price: number | null;
  changePct: number | null;
  label: string;
};

export type NewsItem = {
  headline: string;
  datetime: number;
};

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
    Array<{ headline?: string; datetime?: number }>
  >("/company-news", {
    symbol,
    from: fmt(from),
    to: fmt(to),
  });

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter((item) => typeof item.headline === "string" && item.headline.length > 0)
    .slice(0, 5)
    .map((item) => ({
      headline: item.headline as string,
      datetime: typeof item.datetime === "number" ? item.datetime : 0,
    }));
}

export async function fetchMarketNews(
  category: "general" | "crypto",
): Promise<NewsItem[]> {
  const data = await finnhubGet<
    Array<{ headline?: string; datetime?: number }>
  >("/news", { category });

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter((item) => typeof item.headline === "string" && item.headline.length > 0)
    .slice(0, 5)
    .map((item) => ({
      headline: item.headline as string,
      datetime: typeof item.datetime === "number" ? item.datetime : 0,
    }));
}
