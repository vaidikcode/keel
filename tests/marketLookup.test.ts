import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isHttpsUrl,
  rememberUrl,
} from "../lib/dashboard/marketLookup";
import {
  parseYahooSearch,
  quotePage,
  sanitizeSymbol,
  yahooSymbol,
} from "../lib/dashboard/sources/yahoo";

test("yahoo tickers map crypto onto USD pairs and reject junk", () => {
  assert.equal(yahooSymbol("btc"), "BTC-USD");
  assert.equal(yahooSymbol("BINANCE:ETHUSDT"), "ETH-USD");
  assert.equal(yahooSymbol("AAPL"), "AAPL");
  assert.equal(sanitizeSymbol("msft"), "MSFT");
  assert.equal(sanitizeSymbol("not a ticker!!"), null);
  assert.equal(
    quotePage("AAPL"),
    "https://finance.yahoo.com/quote/AAPL/",
  );
});

test("yahoo search parsing keeps listed quotes and https news only", () => {
  const parsed = parseYahooSearch({
    quotes: [
      {
        symbol: "MSFT",
        longname: "Microsoft Corporation",
        typeDisp: "Equity",
        exchDisp: "NASDAQ",
      },
      { symbol: "bad ticker" },
    ],
    news: [
      {
        title: "Microsoft reports results",
        link: "https://finance.yahoo.com/news/msft",
        publisher: "Yahoo",
        providerPublishTime: Date.parse("2026-01-15T00:00:00Z") / 1000,
      },
      {
        title: "Skip http",
        link: "http://example.com/insecure",
      },
    ],
  });
  assert.equal(parsed.quotes.length, 1);
  assert.equal(parsed.quotes[0].symbol, "MSFT");
  assert.equal(parsed.news.length, 1);
  assert.equal(parsed.news[0].url, "https://finance.yahoo.com/news/msft");
  assert.equal(parsed.news[0].asOf, "2026-01-15");
  assert.deepEqual(parseYahooSearch(null), { quotes: [], news: [] });
});

test("citation bag only stores unique https URLs", () => {
  const bag: string[] = [];
  rememberUrl(bag, "https://finance.yahoo.com/quote/MSFT/");
  rememberUrl(bag, "https://finance.yahoo.com/quote/MSFT/");
  rememberUrl(bag, "http://example.com");
  rememberUrl(bag, "not-a-url");
  assert.deepEqual(bag, ["https://finance.yahoo.com/quote/MSFT/"]);
  assert.equal(isHttpsUrl("https://sec.gov/"), true);
  assert.equal(isHttpsUrl("javascript:alert(1)"), false);
});
