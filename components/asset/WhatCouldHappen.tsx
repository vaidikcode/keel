"use client";
import { useState } from "react";
import { lossScenario } from "@/lib/dashboard/model";
import { currencyFormat, type Profile } from "@/lib/onboarding/questions";
import { Icon } from "@/components/ui/Icon";

const LOSS_DEFAULT: Record<string, number> = { "5": 5, "10": 10, "20": 20, "40": 40, unknown: 20 };

export function WhatCouldHappen({ profile, largestDrop, ticker }: { profile: Profile | null; largestDrop: number | null; ticker: string }) {
  const currency = profile?.currency ?? "USD";
  const [amount, setAmount] = useState(profile?.amount ?? 1000);
  const [drop, setDrop] = useState(LOSS_DEFAULT[String(profile?.lossTolerance ?? "unknown")] ?? 20);
  const outcome = lossScenario(amount, drop);
  return (
    <section className="asset-card scenario" id="what-could-happen" aria-labelledby="scenario-heading">
      <span className="eyebrow">WHAT COULD HAPPEN</span>
      <h2 id="scenario-heading">
        If {ticker} fell <em>{drop}%</em>, {currencyFormat(amount, currency)} would become {currencyFormat(outcome.remaining, currency)}.
      </h2>
      <p className="fine-print">A possibility, not a prediction. Prices can also rise. This is your money on paper, not real holdings.</p>
      <div className="scenario-visual" aria-hidden="true">
        <div className="scenario-before">
          <span>Before</span>
          <i className="scenario-bar" style={{ height: 96 }} />
          <strong>{currencyFormat(amount, currency)}</strong>
        </div>
        <Icon name="arrow" size={22} />
        <div className="scenario-after">
          <span>After a {drop}% fall</span>
          <i className="scenario-bar" style={{ height: Math.max(6, 96 * (1 - drop / 100)) }} />
          <strong>{currencyFormat(outcome.remaining, currency)}</strong>
        </div>
      </div>
      <div className="scenario-inputs">
        <label htmlFor="scenario-amount">
          Amount you’re imagining · {currency}
          <input id="scenario-amount" type="number" min={0} max={1e9} value={amount} onChange={(e) => setAmount(Math.max(0, Math.min(1e9, Number(e.target.value) || 0)))} />
        </label>
        <label htmlFor="scenario-drop">
          Size of the fall · {drop}%
          <input id="scenario-drop" type="range" min={0} max={80} step={5} value={drop} onChange={(e) => setDrop(Number(e.target.value))} />
          <span className="range-labels">
            <span>0%</span>
            <span>80%</span>
          </span>
        </label>
      </div>
      <div className="scenario-result">
        <span>
          That’s <strong>{currencyFormat(outcome.loss, currency)}</strong> less, at least for a while.
        </span>
        {largestDrop !== null && largestDrop > 0 && (
          <button type="button" className="text-button" onClick={() => setDrop(Math.min(80, Math.round(largestDrop / 5) * 5))}>
            Its largest past drop was −{Math.round(largestDrop)}%. Use that <Icon name="chevron" size={14} />
          </button>
        )}
      </div>
    </section>
  );
}
