import {
  fetchCoinFiling,
  fetchCoinPrice,
  searchCoins,
} from "./sources/coingecko";
import {
  fetchCompanyNews,
  fetchCompanyProfile,
  fetchQuote,
  searchSymbols,
} from "./sources/finnhub";
import { fetchFinancialEvidence } from "./sources/evidence";
import {
  fetchYahooQuote,
  quotePage,
  sanitizeSymbol,
  searchYahoo,
  yahooSymbol,
} from "./sources/yahoo";
import { CATALOG } from "./catalog";

export function isHttpsUrl(value: string): boolean {
  return /^https:\/\//.test(value);
}

export function rememberUrl(bag: string[], url: string): void {
  if (!isHttpsUrl(url) || bag.includes(url) || bag.length >= 24) return;
  bag.push(url);
}

function formatCap(millions: number): string {
  if (millions >= 1_000_000) return `$${(millions / 1_000_000).toFixed(1)}T`;
  if (millions >= 1_000) return `$${(millions / 1_000).toFixed(1)}B`;
  return `$${millions.toFixed(0)}M`;
}

function knownAsset(symbol: string) {
  return CATALOG.find(
    (asset) => asset.ticker.toUpperCase() === yahooSymbol(symbol).replace(/-USD$/, ""),
  );
}

export async function lookupSecurities(query: string, bag: string[]) {
  const q = query.trim().slice(0, 40);
  if (!q) return { matches: [], note: "Need a name or ticker to search." };
  const [yahoo, finnhub, coins] = await Promise.all([
    searchYahoo(q),
    searchSymbols(q),
    searchCoins(q),
  ]);
  for (const item of yahoo.quotes) rememberUrl(bag, quotePage(item.symbol));
  for (const item of yahoo.news) rememberUrl(bag, item.url);
  const matches = [
    ...yahoo.quotes.map((item) => ({
      symbol: item.symbol,
      name: item.name,
      type: item.type,
      exchange: item.exchange,
      source: quotePage(item.symbol),
    })),
    ...finnhub
      .filter(
        (item) =>
          !yahoo.quotes.some(
            (quote) => quote.symbol === yahooSymbol(item.symbol),
          ),
      )
      .map((item) => ({
        symbol: item.symbol,
        name: item.name,
        type: item.type,
        exchange: null as string | null,
        source: quotePage(item.symbol),
      })),
    ...coins.map((coin) => {
      const source = `https://www.coingecko.com/en/coins/${coin.id}`;
      rememberUrl(bag, source);
      return {
        symbol: coin.symbol,
        name: coin.name,
        type: "crypto",
        exchange: "CoinGecko",
        source,
      };
    }),
  ].slice(0, 8);
  return {
    matches,
    news: yahoo.news,
    note: matches.length
      ? "Use getMarketSnapshot or getRecentNews with a ticker from this list."
      : "No listed matches. Try the exchange ticker (for example MSFT).",
  };
}

export async function lookupSnapshot(rawSymbol: string, bag: string[]) {
  const symbol = sanitizeSymbol(rawSymbol);
  if (!symbol)
    return { error: "That ticker looks invalid. Search for the company first." };
  const known = knownAsset(symbol);
  const [finnhubQuote, yahooQuote, profile] = await Promise.all([
    fetchQuote(known?.kind === "crypto" ? symbol : yahooSymbol(symbol).replace(/-USD$/, "")),
    fetchYahooQuote(symbol),
    fetchCompanyProfile(yahooSymbol(symbol).replace(/-USD$/, "")),
  ]);
  const filings =
    known && known.kind !== "crypto"
      ? await fetchFinancialEvidence(known.ticker)
      : [];
  const coin = known?.kind === "crypto" && known.coinId ? known.coinId : null;
  const coinPrice = coin ? await fetchCoinPrice(coin) : null;
  const coinFiling = coin ? await fetchCoinFiling(coin) : [];
  const priceLabel =
    coinPrice && coinPrice.price
      ? coinPrice.label
      : finnhubQuote.price
        ? finnhubQuote.label
        : yahooQuote
          ? `$${yahooQuote.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}${
              yahooQuote.changePct === null
                ? ""
                : ` · ${yahooQuote.changePct >= 0 ? "+" : ""}${yahooQuote.changePct.toFixed(1)}%`
            }`
          : null;
  const source =
    (known?.url && isHttpsUrl(known.url) ? known.url : null) ??
    profile?.website ??
    yahooQuote?.source ??
    quotePage(symbol);
  rememberUrl(bag, source);
  if (profile?.website) rememberUrl(bag, profile.website);
  for (const filing of filings) rememberUrl(bag, filing.url);
  if (coin)
    rememberUrl(bag, `https://www.coingecko.com/en/coins/${coin}`);
  if (!priceLabel && !profile && !filings.length && !coinFiling.length) {
    return {
      symbol,
      error:
        "No live quote or company snapshot came back. Try searchSecurities or searchCurrentFacts.",
      source,
    };
  }
  return {
    symbol: yahooSymbol(symbol),
    name: profile?.name ?? known?.name ?? symbol,
    price: priceLabel,
    industry: profile?.industry ?? known?.kind ?? null,
    country: profile?.country ?? null,
    marketCap: profile?.marketCapMillions
      ? formatCap(profile.marketCapMillions)
      : null,
    filingNotes: filings.map((item) => item.text).concat(coinFiling).slice(0, 4),
    officialPage: known?.url ?? profile?.website ?? source,
    quotePage: quotePage(symbol),
    asOf: yahooQuote?.asOf ?? null,
    note: "Quotes can be delayed. This is not a buy or sell instruction.",
  };
}

export async function lookupNews(rawSymbol: string, bag: string[]) {
  const symbol = sanitizeSymbol(rawSymbol);
  if (!symbol) return { error: "Need a ticker such as AAPL or VOO." };
  const ticker = yahooSymbol(symbol).replace(/-USD$/, "");
  const [company, yahoo] = await Promise.all([
    fetchCompanyNews(ticker),
    searchYahoo(ticker),
  ]);
  const items = [
    ...company.flatMap((item) => {
      if (!item.url) return [];
      rememberUrl(bag, item.url);
      return [
        {
          headline: item.headline,
          url: item.url,
          asOf:
            item.datetime > 0
              ? new Date(item.datetime * 1000).toISOString().slice(0, 10)
              : null,
          source: "Finnhub",
        },
      ];
    }),
    ...yahoo.news.map((item) => {
      rememberUrl(bag, item.url);
      return {
        headline: item.title,
        url: item.url,
        asOf: item.asOf,
        source: item.publisher ?? "Yahoo Finance",
      };
    }),
  ].slice(0, 6);
  rememberUrl(bag, quotePage(symbol));
  return {
    symbol: ticker,
    items,
    note: items.length
      ? "Cite the article URLs. Headlines are claims, not facts in a filing."
      : "No recent articles. Try searchCurrentFacts with a plain-English question.",
  };
}

export async function lookupCurrentFacts(query: string, bag: string[]) {
  const q = query.trim().slice(0, 80);
  if (!q) return { error: "Need a search question." };
  const yahoo = await searchYahoo(q);
  for (const item of yahoo.quotes) rememberUrl(bag, quotePage(item.symbol));
  for (const item of yahoo.news) rememberUrl(bag, item.url);
  if (!yahoo.quotes.length && !yahoo.news.length) {
    return {
      query: q,
      error:
        "Search returned nothing I can cite. Say that the live lookup did not find a source.",
    };
  }
  return {
    query: q,
    matches: yahoo.quotes.map((item) => ({
      symbol: item.symbol,
      name: item.name,
      type: item.type,
      source: quotePage(item.symbol),
    })),
    articles: yahoo.news,
    note: "Only use these headlines with their URLs. Do not invent extra details.",
  };
}
