import { test } from "node:test";
import assert from "node:assert/strict";
import { strategyFor } from "../lib/market/strategy";
import { capacityFor } from "../lib/market/fit";
import { defaultProfile, type Profile } from "../lib/onboarding/questions";
import { indexFor, COUNTRY_INDEX } from "../lib/market/marketIndex";
import { rankBalanced } from "../lib/market/balanced";
import type { RankedAsset } from "../lib/market/snapshotModel";

const profile = (over: Partial<Profile> = {}): Profile => ({ ...defaultProfile, ...over });
const strategy = (p: Profile) => strategyFor(p, capacityFor(p));

test("a careful, short-horizon answer set asks for low risk and low movement", () => {
  const s = strategy(profile({ risk: "careful", lossTolerance: 5, horizon: "soon", goal: "purchase" }));
  const aim = Object.fromEntries(s.targets.map((t) => [t.key, t.aim]));
  assert.equal(aim.risk, "low");
  assert.equal(aim.steadiness, "low");
  // On a short clock the last month actually matters.
  assert.equal(aim.direction, "high");
  // And a spike is not what they want — steady beats spectacular.
  assert.equal(aim.year, "middle");
});

test("a comfortable, long-horizon answer set stops chasing calm and asks for growth", () => {
  const s = strategy(
    profile({ risk: "comfortable", lossTolerance: 40, horizon: "future", goal: "retirement", emergency: "yes", income: "stable" }),
  );
  const aim = Object.fromEntries(s.targets.map((t) => [t.key, t.aim]));
  assert.equal(aim.year, "high");
  assert.equal(aim.risk, "either");
  // A single month says nothing over decades.
  assert.equal(aim.direction, "either");
});

test("fit is the one measure everybody should want high", () => {
  for (const p of [
    profile({ risk: "careful", horizon: "soon" }),
    profile({ risk: "comfortable", horizon: "future" }),
    defaultProfile,
  ]) {
    const fit = strategy(p).targets.find((t) => t.key === "fit")!;
    assert.equal(fit.aim, "high");
  }
});

test("every target names the answer it was read from, and reads as description not advice", () => {
  const banned = /\b(buy|sell|you should|we recommend|invest in)\b/i;
  const s = strategy(profile({ risk: "balanced", horizon: "long" }));
  assert.equal(s.targets.length, 5);
  for (const t of s.targets) {
    assert.ok(t.because.length > 10, `${t.key} must cite an answer`);
    assert.ok(!banned.test(t.look), `advice-like wording in ${t.key}: ${t.look}`);
    assert.ok(!banned.test(s.summary), "summary must stay descriptive");
  }
  assert.ok(s.from.length >= 3, "should show the answers it was built from");
});

test("a country with no index falls back to the S&P 500 and says it is not local", () => {
  assert.deepEqual(indexFor("IN"), { index: COUNTRY_INDEX.IN, isLocal: true });
  assert.equal(indexFor("IN").index.symbol, "^NSEI");
  assert.equal(indexFor("GB").index.name, "FTSE 100");
  // Poland has no working Yahoo symbol, so it must degrade rather than guess.
  const pl = indexFor("PL");
  assert.equal(pl.isLocal, false);
  assert.equal(pl.index.symbol, "^GSPC");
  assert.equal(indexFor(null).isLocal, false);
  assert.equal(indexFor("in").index.symbol, "^NSEI", "country codes are case-insensitive");
});

function asset(id: string, riskScore: number | null, year: number | null, drawdown = 15): RankedAsset {
  return {
    id, ticker: id.toUpperCase(), name: id, kind: "stocks",
    price: 100, change1dPct: 0, change30dPct: 0, change1yPct: year,
    spark: [1, 2], fit: null, rank: 1, oneLiner: "", historySource: "", metrics: null,
    risk: riskScore === null ? null : {
      score: riskScore, label: "moderate", components: {},
      raw: { annualVol: 0.2, maxDrawdownPct: drawdown, downsideDev: 0.1, worst30Pct: -5, beta: 1, marketCapUsd: 1e11, observations: 250 },
    },
  } as RankedAsset;
}

test("balanced favours the middle over both the calmest and the wildest", () => {
  const pool = [
    asset("calm", 4, 3), asset("wild", 92, 140), asset("middle", 45, 12),
    asset("nearmiddle", 50, 14), asset("spiky", 70, 95),
  ];
  const order = rankBalanced(pool, 5).map((a) => a.id);
  assert.equal(order[0], "middle", "a middling asset should lead");
  assert.ok(order.indexOf("wild") > order.indexOf("middle"), "the wildest should not win");
  assert.ok(order.indexOf("calm") > order.indexOf("middle"), "nor should the calmest");
});

test("an unmeasured asset is never called balanced", () => {
  const pool = [asset("unmeasured", null, 12), asset("measured", 45, 12)];
  const order = rankBalanced(pool, 2).map((a) => a.id);
  assert.equal(order[0], "measured");
  assert.equal(order[1], "unmeasured", "no risk reading means it sorts last, not that it is dropped");
});
