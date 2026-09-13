/**
 * Price-only indicators, computed from a plain array of closes.
 *
 * These run server-side in `rankSnapshot`, against the full stored history
 * (~370 points) rather than the 60-point `spark` the client receives — a
 * 200-day average cannot be recovered from a downsampled series.
 *
 * Every function returns `null` rather than a guess when the history is too
 * short. design.md: live data never falls back to seeded figures.
 */

/** Simple mean of the last `period` closes. */
export function sma(closes: number[], period: number): number | null {
  if (period <= 0 || closes.length < period) return null;
  let total = 0;
  for (let i = closes.length - period; i < closes.length; i += 1) total += closes[i];
  return total / period;
}

/**
 * Exponential moving average over the whole series, seeded with the simple
 * mean of the first `period` points — the conventional seed, and the one that
 * makes short series behave predictably.
 */
function emaSeries(closes: number[], period: number): number[] | null {
  if (period <= 0 || closes.length < period) return null;
  const k = 2 / (period + 1);
  let seed = 0;
  for (let i = 0; i < period; i += 1) seed += closes[i];
  const out = [seed / period];
  for (let i = period; i < closes.length; i += 1) {
    out.push(closes[i] * k + out[out.length - 1] * (1 - k));
  }
  return out;
}

/**
 * Relative strength index with Wilder's smoothing, the standard 14-period
 * form. 0-100: above 70 is conventionally called overbought, below 30
 * oversold. Keel reports the number and what it is called, never an action.
 */
export function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gain += change;
    else loss -= change;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  for (let i = period + 1; i < closes.length; i += 1) {
    const change = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(0, change)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -change)) / period;
  }
  // A run with no down days has no ratio to take; it is pinned to 100.
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * MACD histogram: the gap between the MACD line (fast EMA minus slow EMA) and
 * its own signal EMA. Positive means the shorter average is pulling away
 * upward, negative the reverse.
 */
export function macdHistogram(
  closes: number[],
  fast = 12,
  slow = 26,
  signal = 9,
): number | null {
  const fastLine = emaSeries(closes, fast);
  const slowLine = emaSeries(closes, slow);
  if (!fastLine || !slowLine) return null;
  // The two EMAs start at different offsets; align them on their tails.
  const span = Math.min(fastLine.length, slowLine.length);
  const macdLine: number[] = [];
  for (let i = 0; i < span; i += 1) {
    macdLine.push(fastLine[fastLine.length - span + i] - slowLine[slowLine.length - span + i]);
  }
  const signalLine = emaSeries(macdLine, signal);
  if (!signalLine) return null;
  return macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1];
}

/** Population standard deviation of the last `period` closes. */
function stdevTail(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const tail = closes.slice(-period);
  const mean = tail.reduce((sum, v) => sum + v, 0) / period;
  const variance = tail.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
  return Math.sqrt(variance);
}

/**
 * Where the latest price sits inside its Bollinger band, 0 at the lower edge
 * and 1 at the upper. Values outside 0-1 mean the price has left the band.
 * A flat series has no band to sit in, so it returns null.
 */
export function bollingerPercentB(
  closes: number[],
  period = 20,
  deviations = 2,
): number | null {
  const middle = sma(closes, period);
  const sd = stdevTail(closes, period);
  if (middle === null || sd === null || sd === 0) return null;
  const upper = middle + deviations * sd;
  const lower = middle - deviations * sd;
  return (closes[closes.length - 1] - lower) / (upper - lower);
}

export type PriceIndicators = {
  rsi: number | null;
  macdHist: number | null;
  /**
   * The histogram as a share of the price. The raw figure is in price units,
   * so a $600 share and a $0.30 coin are not comparable — only this normalised
   * form may be ranked against peers.
   */
  macdHistNorm: number | null;
  sma50: number | null;
  sma200: number | null;
  percentB: number | null;
  /** Latest close, so the client can say "above its 200-day average". */
  last: number | null;
};

export function priceIndicators(closes: number[]): PriceIndicators {
  const hist = macdHistogram(closes);
  const last = closes.length ? closes[closes.length - 1] : null;
  return {
    rsi: rsi(closes),
    macdHist: hist,
    macdHistNorm: hist !== null && last !== null && last > 0 ? (hist / last) * 100 : null,
    sma50: sma(closes, 50),
    sma200: sma(closes, 200),
    percentB: bollingerPercentB(closes),
    last,
  };
}
