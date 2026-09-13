import { riskLabelText } from "./risk";
import type { RankedAsset } from "./snapshotModel";

/**
 * The five figures a card shows, and what each one means in plain words.
 *
 * Every value is measured from this asset's own price history or from the
 * reader's answers — nothing here is estimated to fill a gap. A figure Keel
 * does not have reads as a dash and says why when asked, per design.md's rule
 * that live data never falls back to invented numbers.
 *
 * The explanations are written to describe, never to advise: they say what a
 * number is and what it was measured from, and stop there.
 */

export type CardMetric = {
  key: string;
  label: string;
  /** The real finance term, for the row's tooltip. */
  term: string | null;
  value: string;
  tone: "positive" | "negative" | null;
  /** What the figure means. The definition only — no reading of this company. */
  definition: string;
  /** Where the number came from, named plainly. */
  source: string;
  /** The provider's own page, when there is one to link to. */
  sourceUrl: string | null;
};

const pctText = (v: number | null, digits = 1) => {
  if (v === null || !Number.isFinite(v)) return "—";
  const body = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(v));
  return `${v >= 0 ? "+" : "−"}${body}%`;
};

const plainPct = (v: number | null, digits = 0) =>
  v === null || !Number.isFinite(v)
    ? "—"
    : `${new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(Math.abs(v))}%`;

const toneOf = (v: number | null): "positive" | "negative" | null =>
  v === null || !Number.isFinite(v) ? null : v >= 0 ? "positive" : "negative";

export function cardMetrics(asset: RankedAsset): CardMetric[] {
  const risk = asset.risk;
  const vol = risk ? risk.raw.annualVol * 100 : null;
  const priceProvider = asset.kind === "crypto" ? "CoinGecko" : "Yahoo Finance";
  const priceSource = `Daily closing prices from ${priceProvider}, over the last year.`;
  const url = asset.historySource || null;

  return [
    {
      key: "steadiness",
      label: "Steadiness",
      term: "Annualised volatility",
      value: vol === null ? "—" : `${plainPct(vol)} a year`,
      tone: null,
      definition:
        "Steadiness is how far a price typically travels away from its own average over a year. A bigger number means bigger moves in both directions — up as well as down — not that something is going the wrong way.",
      source: `${priceSource} Keel works the figure out from those prices.`,
      sourceUrl: url,
    },
    {
      key: "direction",
      label: "Recent direction",
      term: "30-day price change",
      value: pctText(asset.change30dPct),
      tone: toneOf(asset.change30dPct),
      definition:
        "Recent direction is how much the price has changed over the last 30 days. It describes what has already happened. It is not a forecast, and a run in either direction can stop or turn around at any time.",
      source: priceSource,
      sourceUrl: url,
    },
    {
      key: "year",
      label: "One year growth",
      term: "12-month price change",
      value: pctText(asset.change1yPct),
      tone: toneOf(asset.change1yPct),
      definition:
        "One year growth compares today's price with the price twelve months ago. It is the price on its own — it leaves out dividends, fees and taxes, so it is not the same as what someone would actually have earned.",
      source: priceSource,
      sourceUrl: url,
    },
    {
      key: "risk",
      label: "Risk",
      term: "Keel risk score",
      value: risk ? `${risk.score} · ${riskLabelText[risk.label]}` : "—",
      tone: null,
      definition:
        "Risk is a score from 0 to 100 built from how much the price swings, how far it has fallen from a high, how closely it follows the wider market, and how big the company is. It is Keel's own estimate, not an official rating, and Keel will not guess one without enough price history.",
      source: `Calculated by Keel. ${priceSource}`,
      sourceUrl: url,
    },
    {
      key: "fit",
      label: "Fit for you",
      term: "Fit score",
      value: asset.fit ? `${asset.fit.score} / 100` : "—",
      tone: null,
      definition:
        "Fit compares this one's risk score against how much movement your own answers suggest you can sit through. It decides the order Keel shows things in. It is not advice — a low number is not a warning, and a high one is not a recommendation.",
      source: "Calculated by Keel from the answers you gave, and from the risk score above.",
      sourceUrl: null,
    },
  ];
}
