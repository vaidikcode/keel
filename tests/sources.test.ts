import { test } from "node:test";
import assert from "node:assert/strict";
import { missingSymbols, parseSpark } from "../lib/market/sources/spark";
import { parseTavily, tavilySearch } from "../lib/market/sources/tavily";
import { parseCoinMarkets } from "../lib/market/sources/geckoMarkets";
import { reduceTickers } from "../lib/market/sources/secTickers";
import { sparkline } from "../lib/market/snapshotModel";
import { isUsMarketOpen, ttlFor } from "../lib/market/refresh";

test("spark parsing handles both payload shapes, skips nulls, dedupes dates", () => {
  const t = [1735689600, 1735776000, 1735776000, 1735862400]; // 2025-01-01..03 with a dup
  const flat = parseSpark({ VOO: { timestamp: t, close: [100, null, 101, 102] }, JUNK: {} });
  assert.deepEqual([...flat.keys()], ["VOO"]);
  assert.deepEqual(flat.get("VOO")!.map((p) => p.value), [100, 101, 102]);
  const wrapped = parseSpark({
    spark: { result: [{ symbol: "btc-usd", response: [{ timestamp: t, indicators: { quote: [{ close: [1, 2, 3, 4] }] } }] }] },
  });
  assert.ok(wrapped.has("BTC-USD"));
  assert.deepEqual(missingSymbols(["VOO", "SCHB"], flat), ["SCHB"]);
  assert.equal(parseSpark(null).size, 0);
});
test("tavily parsing keeps https results with trimmed snippets; no key means unavailable", async () => {
  const facts = parseTavily({
    results: [
      { title: "A", url: "https://example.com/a", content: "  lots   of   text ".repeat(40), published_date: "2026-09-01T10:00:00Z" },
      { title: "B", url: "http://example.com/b", content: "x" },
    ],
  });
  assert.equal(facts.length, 1);
  assert.ok(facts[0].snippet.length <= 300);
  assert.equal(facts[0].publishedAt, "2026-09-01");
  const prior = process.env.TAVILY_API_KEY;
  delete process.env.TAVILY_API_KEY;
  let called = false;
  const result = await tavilySearch("anything", {
    fetcher: (async () => {
      called = true;
      return new Response("{}");
    }) as typeof fetch,
  });
  if (prior) process.env.TAVILY_API_KEY = prior;
  assert.deepEqual(result, { facts: [], available: false });
  assert.equal(called, false);
});
test("coingecko markets and SEC tickers reduce to what Keel needs", () => {
  const coins = parseCoinMarkets([
    { id: "bitcoin", market_cap: 1e12, market_cap_rank: 1, current_price: 50000, price_change_percentage_24h: 1.5, price_change_percentage_1y_in_currency: 40 },
    { nope: true },
  ]);
  assert.equal(coins.get("bitcoin")?.rank, 1);
  assert.equal(coins.get("bitcoin")?.change30dPct, null);
  const ciks = reduceTickers(
    { "0": { cik_str: 320193, ticker: "AAPL", title: "Apple" }, "1": { cik_str: 1, ticker: "ZZZZ" } },
    new Set(["AAPL"]),
  );
  assert.deepEqual(ciks, { AAPL: "0000320193" });
});
test("sparkline downsamples evenly and ttl respects market hours", () => {
  const pts = Array.from({ length: 366 }, (_, i) => ({ date: String(i), value: i }));
  const s = sparkline(pts, 60);
  assert.equal(s.length, 60);
  assert.equal(s[0], 0);
  assert.equal(s[59], 365);
  assert.equal(isUsMarketOpen(new Date("2026-09-12T15:00:00Z")), false); // Saturday
  assert.equal(isUsMarketOpen(new Date("2026-09-14T15:00:00Z")), true); // Monday 11:00 ET
  assert.equal(isUsMarketOpen(new Date("2026-09-14T03:00:00Z")), false);
  assert.ok(ttlFor("crypto", new Date("2026-09-14T03:00:00Z")) < ttlFor("broad-funds", new Date("2026-09-14T03:00:00Z")));
});
