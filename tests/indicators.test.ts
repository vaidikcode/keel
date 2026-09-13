import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bollingerPercentB,
  macdHistogram,
  priceIndicators,
  rsi,
  sma,
} from "../lib/market/indicators";

const rising = Array.from({ length: 60 }, (_, i) => 100 + i);
const falling = Array.from({ length: 60 }, (_, i) => 200 - i);
const flat = Array.from({ length: 60 }, () => 100);

test("a moving average is the mean of its own window, and nothing shorter", () => {
  assert.equal(sma([1, 2, 3, 4], 4), 2.5);
  assert.equal(sma([1, 2, 3, 4], 2), 3.5);
  // Fewer closes than the window has no average to report.
  assert.equal(sma([1, 2, 3], 4), null);
  assert.equal(sma([], 1), null);
  assert.equal(sma([1, 2, 3], 0), null);
});

test("relative strength pins at the extremes and sits at 50 when gains and losses match", () => {
  assert.equal(rsi(rising), 100);
  assert.equal(rsi(falling), 0);
  // No movement at all is neither strength nor weakness.
  assert.equal(rsi(flat), 50);

  // Exactly one period of alternating +1/-1: seven gains and seven losses, so
  // the averages are equal and the index is exactly half. Fifteen closes means
  // the seed is the whole calculation, with no smoothing on top.
  const even = Array.from({ length: 15 }, (_, i) => (i % 2 === 0 ? 100 : 101));
  assert.equal(rsi(even), 50);

  assert.equal(rsi([100, 101]), null);
});

test("the MACD histogram takes the side the shorter average is pulling toward", () => {
  // A straight ramp is the instructive case: both averages lag it by a fixed
  // amount, so the MACD line is a constant and the histogram settles at zero.
  // The histogram measures a change of pace, not a direction of travel.
  const steady = macdHistogram(rising);
  assert.ok(steady !== null && Math.abs(steady) < 0.01, "a constant climb has no acceleration");
  assert.equal(macdHistogram(flat), 0);

  // Accelerating away is what actually moves it.
  const faster = Array.from({ length: 60 }, (_, i) => 100 + i * i * 0.1);
  const slower = Array.from({ length: 60 }, (_, i) => 5000 - i * i * 0.1);
  const up = macdHistogram(faster);
  const down = macdHistogram(slower);
  assert.ok(up !== null && up > 0, "a climb that is speeding up should read positive");
  assert.ok(down !== null && down < 0, "a fall that is speeding up should read negative");

  // 12/26/9 needs 34 closes before a signal line exists.
  assert.equal(macdHistogram(rising.slice(0, 33)), null);
  assert.ok(macdHistogram(rising.slice(0, 34)) !== null);
});

test("percent B places the last close inside its band", () => {
  // Twenty closes alternating 99/101: mean 100, deviation 1, so the band runs
  // 98 to 102 and a last close of 101 sits three quarters of the way up.
  const banded = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 99 : 101));
  assert.equal(bollingerPercentB(banded), 0.75);
  // A flat series has no band to sit in.
  assert.equal(bollingerPercentB(flat), null);
  assert.equal(bollingerPercentB([1, 2, 3]), null);
});

test("a short history reports the averages it cannot reach as missing", () => {
  const short = rising.slice(0, 120);
  const out = priceIndicators(short);
  assert.ok(out.sma50 !== null, "120 closes is enough for a 50-day average");
  assert.equal(out.sma200, null, "but not for a 200-day one");
  assert.equal(out.last, short[short.length - 1]);

  const empty = priceIndicators([]);
  assert.deepEqual(empty, {
    rsi: null,
    macdHist: null,
    macdHistNorm: null,
    sma50: null,
    sma200: null,
    percentB: null,
    last: null,
  });
});

test("only the normalised histogram survives a change of price scale", () => {
  // The same shape at a thousand times the price: the raw histogram scales with
  // it, the normalised one does not. This is what makes the normalised figure
  // the only one that may be compared between a share and a coin.
  const base = Array.from({ length: 60 }, (_, i) => 100 + i * i * 0.1);
  const scaled = base.map((v) => v * 1000);
  const a = priceIndicators(base);
  const b = priceIndicators(scaled);
  assert.ok(a.macdHist !== null && b.macdHist !== null);
  assert.ok(Math.abs(b.macdHist - a.macdHist * 1000) < 1e-6, "raw scales with price");
  assert.ok(a.macdHistNorm !== null && b.macdHistNorm !== null);
  assert.ok(Math.abs(b.macdHistNorm - a.macdHistNorm) < 1e-9, "normalised does not");
});
