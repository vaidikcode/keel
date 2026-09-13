"use client";
import { useState } from "react";
import { PriceChart } from "./PriceChart";
import { formatPct } from "@/lib/dashboard/api";
import { countryLabel } from "@/lib/onboarding/questions";
import { useKeel } from "@/components/keel/KeelContext";
import type { Investment } from "@/lib/dashboard/model";
import type { MarketIndexData } from "./useMarketExtras";

/**
 * The reader's own home market, rather than a US index by default.
 *
 * Drawn with the same chart an asset page uses, so scrubbing a market index
 * behaves exactly like scrubbing a single holding — one chart to learn, not
 * two. When Keel has no index for their country it says so and names what it
 * is showing instead, so the number is never mistaken for local.
 */
export function MarketTrends({ index, country }: { index: MarketIndexData | null; country: string }) {
  const keel = useKeel();
  const [days, setDays] = useState(365);
  if (!index?.history || index.history.length < 2) return null;

  // The chart speaks Investment; an index has no ticker page to link to, so the
  // fields it does not have are left empty rather than invented.
  const asInvestment: Investment = {
    id: index.symbol,
    name: index.name,
    ticker: index.symbol,
    kind: "funds",
    description: index.name,
    tradeoff: "",
    url: `https://finance.yahoo.com/quote/${encodeURIComponent(index.symbol)}/`,
    history: index.history,
    historySource: `https://finance.yahoo.com/quote/${encodeURIComponent(index.symbol)}/history/`,
    retrievedAt: 0,
    evidence: [],
  };

  const rows: Array<[string, number | null]> = [
    ["Today", index.change1dPct],
    ["30 days", index.change30dPct],
    ["One year", index.change1yPct],
  ];

  return (
    <section className="market-trends chart-section" aria-labelledby="market-trends-heading">
      <div className="section-head">
        <div>
          <h2 id="market-trends-heading">{index.name}</h2>
          <p className="fine-print">
            {index.isLocal
              ? `The headline stock index in ${countryLabel(country)}. It tracks that market as a whole, not anything you hold.`
              : `Keel doesn’t have an index for ${countryLabel(country)} yet, so this is the S&P 500 — a United States index, shown for reference only.`}
          </p>
        </div>
        <div className="periods" role="group" aria-label="Time period">
          {([
            [30, "1M"],
            [90, "3M"],
            [180, "6M"],
            [365, "1Y"],
          ] as const).map(([d, label]) => (
            <button
              key={d}
              type="button"
              className={days === d ? "active" : ""}
              aria-pressed={days === d}
              onClick={() => setDays(d)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="trend-figures">
        {rows.map(([label, value]) => (
          <div key={label}>
            <span className="gauge-label">{label}</span>
            <b className={value === null ? undefined : value >= 0 ? "positive" : "negative"}>
              {formatPct(value)}
            </b>
          </div>
        ))}
      </div>

      <PriceChart
        key={days}
        assets={[asInvestment]}
        days={days}
        sample={false}
        paused={keel.paused}
        onExplain={(text) => keel.say(text)}
        unit="points"
      />
    </section>
  );
}
