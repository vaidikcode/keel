import { test } from "node:test";
import assert from "node:assert/strict";
import { cardMetrics } from "../lib/market/metrics";
import type { RankedAsset } from "../lib/market/snapshotModel";

function asset(over: Partial<RankedAsset> = {}): RankedAsset {
  return {
    id: "a",
    ticker: "AAA",
    name: "Alpha",
    kind: "stocks",
    price: 100,
    change1dPct: 1,
    change30dPct: 5,
    change1yPct: 12,
    spark: [1, 2, 3],
    risk: {
      score: 40,
      label: "moderate",
      components: {},
      raw: {
        annualVol: 0.22,
        maxDrawdownPct: 18,
        downsideDev: 0.14,
        worst30Pct: -9,
        beta: 1.1,
        marketCapUsd: 5e11,
        observations: 250,
      },
    },
    fit: { score: 70, reasons: [] },
    rank: 1,
    oneLiner: "A company.",
    metrics: {
      rsi: 58,
      macdHistNorm: 0.4,
      sma50: 95,
      sma200: 90,
      percentB: 0.7,
      last: 100,
      marketCapUsd: 5e11,
      industry: "Technology",
      coinRank: null,
      financials: null,
      coinStats: null,
    },
    ...over,
  } as RankedAsset;
}

test("a card shows the same five figures, in the same order, for every kind", () => {
  for (const kind of ["stocks", "funds", "crypto"] as const) {
    const keys = cardMetrics(asset({ kind })).map((m) => m.key);
    assert.deepEqual(keys, ["steadiness", "direction", "year", "risk", "fit"], kind);
  }
});

test("the figures are the asset's own, not rounded away or invented", () => {
  const m = Object.fromEntries(cardMetrics(asset()).map((x) => [x.key, x]));
  assert.equal(m.steadiness.value, "22% a year", "22% annual volatility");
  assert.equal(m.direction.value, "+5.0%");
  assert.equal(m.year.value, "+12.0%");
  assert.equal(m.risk.value, "40 · Moderate");
  assert.equal(m.fit.value, "70 / 100");
  assert.equal(m.direction.tone, "positive");
});

test("a missing figure is a dash and an explanation, never a zero", () => {
  const bare = asset({ risk: null, fit: null, change30dPct: null, change1yPct: null, metrics: null });
  const m = Object.fromEntries(cardMetrics(bare).map((x) => [x.key, x]));
  for (const key of ["steadiness", "direction", "year", "risk", "fit"]) {
    assert.equal(m[key].value, "—", `${key} should read as missing`);
    assert.ok(m[key].definition.length > 20, `${key} should still explain itself`);
  }
  assert.match(m.risk.definition, /will not guess/, "risk must say it refuses to guess");
});

test("every row explains the measure and says where the number came from", () => {
  const banned = /\b(buy|sell|should|recommend|undervalued|overvalued|bargain|worth buying)\b/i;
  for (const m of cardMetrics(asset())) {
    assert.ok(m.definition.length > 60, `${m.key} needs a real definition`);
    assert.ok(m.source.length > 20, `${m.key} must say where the figure came from`);
    assert.ok(!banned.test(m.definition), `advice-like wording in ${m.key}`);
    // A definition describes the measure, not this particular company.
    assert.ok(!m.definition.includes("Alpha"), `${m.key} should define, not report`);
  }
});

test("the named source matches the provider the prices actually came from", () => {
  const stock = cardMetrics(asset({ kind: "stocks" })).find((m) => m.key === "year")!;
  assert.match(stock.source, /Yahoo Finance/);
  const coin = cardMetrics(asset({ kind: "crypto" })).find((m) => m.key === "year")!;
  assert.match(coin.source, /CoinGecko/);
  // Fit is Keel's own working, and says so rather than borrowing a provider.
  const fit = cardMetrics(asset()).find((m) => m.key === "fit")!;
  assert.match(fit.source, /answers you gave/);
  assert.equal(fit.sourceUrl, null);
});



test("basic financials tolerate the provider's renames, gaps and loss-makers", async () => {
  const { parseBasicFinancials } = await import("../lib/dashboard/sources/finnhub");

  assert.equal(parseBasicFinancials(null), null);
  assert.equal(parseBasicFinancials({}), null);
  assert.equal(parseBasicFinancials({ metric: {} }), null, "no coverage is not an empty reading");

  const full = parseBasicFinancials({
    metric: {
      peTTM: 28.4,
      pbQuarterly: 12.1,
      // The debt key really does contain a slash.
      "totalDebt/totalEquityQuarterly": 1.42,
      netProfitMarginTTM: 24.3,
      currentRatioQuarterly: 0.95,
      roeTTM: "not a number",
    },
  })!;
  assert.equal(full.peTtm, 28.4);
  assert.equal(full.debtToEquity, 1.42);
  assert.equal(full.netMarginTtmPct, 24.3, "margins arrive as percentages already");
  assert.equal(full.roeTtmPct, null, "a non-numeric reading is not a number");
  assert.equal(full.psTtm, null, "an absent field is null, not missing");

  // A negative P/E is not a cheap share, it means the company lost money.
  const loss = parseBasicFinancials({ metric: { peTTM: -14.2, pbQuarterly: 3 } })!;
  assert.equal(loss.peTtm, null);
  assert.equal(loss.pbQuarterly, 3);

  // Falls back to the annual key when the trailing one is absent.
  const annual = parseBasicFinancials({ metric: { peNormalizedAnnual: 19.5 } })!;
  assert.equal(annual.peTtm, 19.5);
});
