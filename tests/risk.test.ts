import { test } from "node:test";
import assert from "node:assert/strict";
import {
  betaOf,
  changeOver,
  computeRisk,
  RISK_WEIGHTS,
  riskLabel,
  scale,
  worst30,
} from "../lib/market/risk";
import type { Point } from "../lib/dashboard/model";

function series(values: number[], start = Date.UTC(2025, 0, 1)): Point[] {
  return values.map((value, i) => ({
    date: new Date(start + i * 86400000).toISOString().slice(0, 10),
    value,
  }));
}
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
function gaussianWalk(n: number, sigma: number, seed: number): number[] {
  const rnd = seeded(seed);
  const out = [100];
  for (let i = 1; i < n; i += 1) {
    const u = Math.max(rnd(), 1e-9),
      v = rnd();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    out.push(out[i - 1] * Math.exp(z * sigma));
  }
  return out;
}

test("weights sum to one", () => {
  const total = Object.values(RISK_WEIGHTS).reduce((s, w) => s + w, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
});
test("scale clamps to 0-100", () => {
  assert.equal(scale(-1, 0, 10), 0);
  assert.equal(scale(5, 0, 10), 50);
  assert.equal(scale(50, 0, 10), 100);
});
test("constant prices produce no volatility, drawdown or downside", () => {
  const flat = series(Array(200).fill(100));
  const risk = computeRisk({ closes: flat, benchmark: flat, marketCapUsd: null, kind: "funds" });
  assert.ok(risk);
  assert.equal(risk.components.volatility, 0);
  assert.equal(risk.components.maxDrawdown, 0);
  assert.equal(risk.components.downside, 0);
  assert.equal(risk.components.worst30, 0);
  // beta undefined on a flat benchmark -> neutral 40 * 0.05 = 2, size 10 * 0.1 = 1
  assert.equal(risk.score, 3);
  assert.equal(risk.label, "low");
});
test("too little history returns null", () => {
  const short = series(Array(50).fill(100));
  assert.equal(computeRisk({ closes: short, benchmark: short, marketCapUsd: null, kind: "stocks" }), null);
});
test("seeded random walk recovers its daily volatility", () => {
  const closes = series(gaussianWalk(1500, 0.01, 7));
  const risk = computeRisk({ closes, benchmark: closes, marketCapUsd: 5e11, kind: "stocks" })!;
  const expected = 0.01 * Math.sqrt(252);
  assert.ok(Math.abs(risk.raw.annualVol - expected) < 0.03, `${risk.raw.annualVol} vs ${expected}`);
  assert.ok(Math.abs((risk.raw.beta ?? 0) - 1) < 1e-9);
});
test("an asset with doubled log returns has beta about 2", () => {
  const bench = gaussianWalk(400, 0.01, 11);
  const asset: number[] = bench.map((_, i) => (i === 0 ? 100 : 0));
  for (let i = 1; i < bench.length; i += 1)
    asset[i] = asset[i - 1] * Math.exp(2 * Math.log(bench[i] / bench[i - 1]));
  const beta = betaOf(series(asset), series(bench));
  assert.ok(beta !== null && Math.abs(beta - 2) < 1e-6, String(beta));
  assert.equal(betaOf(series(asset.slice(0, 30)), series(bench.slice(0, 30))), null);
});
test("worst 30-day window finds a step drop", () => {
  const values = [...Array(40).fill(100), ...Array(40).fill(80)];
  assert.ok(Math.abs(worst30(series(values)) - -20) < 1e-9);
});
test("labels follow the thresholds", () => {
  assert.equal(riskLabel(0), "low");
  assert.equal(riskLabel(24.9), "low");
  assert.equal(riskLabel(25), "moderate");
  assert.equal(riskLabel(50), "high");
  assert.equal(riskLabel(75), "very-high");
});
test("crypto and small caps score riskier than a broad fund on identical prices", () => {
  const closes = series(gaussianWalk(300, 0.012, 3));
  const fund = computeRisk({ closes, benchmark: closes, marketCapUsd: null, kind: "funds" })!;
  const smallStock = computeRisk({ closes, benchmark: closes, marketCapUsd: 1e9, kind: "stocks" })!;
  const bigStock = computeRisk({ closes, benchmark: closes, marketCapUsd: 3e12, kind: "stocks" })!;
  const crypto = computeRisk({ closes, benchmark: closes, marketCapUsd: 1e9, kind: "crypto" })!;
  assert.ok(fund.score < bigStock.score);
  assert.ok(bigStock.score < smallStock.score);
  assert.ok(smallStock.score < crypto.score);
});
test("changeOver uses the close at or before the target date", () => {
  const closes = series([100, 101, 102, 103, 104, 110]);
  assert.ok(Math.abs(changeOver(closes, 5)! - 10) < 1e-9);
  assert.equal(changeOver(closes, 30), null);
});
