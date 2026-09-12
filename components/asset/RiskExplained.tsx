"use client";
import type { AssetResponse } from "@/lib/dashboard/api";
import { riskLabelText } from "@/lib/market/risk";
import { RiskPill } from "@/components/dashboard/RiskPill";

const ORDER: Array<[string, string]> = [
  ["volatility", "How much the price jumps around"],
  ["maxDrawdown", "Biggest fall from a high"],
  ["downside", "How hard the bad days hit"],
  ["worst30", "Worst 30 days"],
  ["beta", "Moves with the market"],
  ["size", "Size and stability"],
  ["concentration", "One thing or many"],
];

export function RiskExplained({ risk, beginner }: { risk: AssetResponse["risk"]; beginner: boolean }) {
  if (!risk)
    return (
      <section className="asset-card" id="risk" aria-labelledby="risk-heading">
        <h2 id="risk-heading">Risk, explained</h2>
        <p>There isn’t enough price history yet to measure this one. Keel never guesses a risk score.</p>
      </section>
    );
  const rows = ORDER.map(([key, label]) => ({
    id: key,
    label,
    value: Math.round(risk.components[key] ?? 0),
    explanation: risk.explanations[key] ?? "",
  }));
  const first = rows.slice(0, 3),
    rest = rows.slice(3);
  const raw = risk.raw;
  return (
    <section className="asset-card" id="risk" aria-labelledby="risk-heading">
      <div className="section-head">
        <div>
          <h2 id="risk-heading">Risk, explained</h2>
          <p className="fine-print">Keel’s own estimate from the last year of prices. Higher means bigger surprises, not worse.</p>
        </div>
        <div className="risk-summary">
          <strong>{risk.score}</strong>
          <span>of 100</span>
          <RiskPill label={risk.label} score={risk.score} size="md" />
        </div>
      </div>
      <p className="risk-plain">
        In the last year the price swung about <strong>{Math.round(raw.annualVol * 100)}%</strong> a year, its biggest fall from a
        high was <strong>{Math.round(raw.maxDrawdownPct)}%</strong>, and its worst 30 days lost{" "}
        <strong>{Math.round(Math.abs(raw.worst30Pct))}%</strong>. That adds up to {riskLabelText[risk.label].toLowerCase()} risk.
      </p>
      <ul className="risk-rows">
        {first.map((r) => (
          <RiskRow key={r.id} label={r.label} value={r.value} explanation={r.explanation} />
        ))}
      </ul>
      <details className="asset-details" open={!beginner}>
        <summary>See all seven measures</summary>
        <ul className="risk-rows">
          {rest.map((r) => (
            <RiskRow key={r.id} label={r.label} value={r.value} explanation={r.explanation} />
          ))}
        </ul>
      </details>
    </section>
  );
}

function RiskRow({ label, value, explanation }: { label: string; value: number; explanation: string }) {
  return (
    <li className="risk-row">
      <div>
        <strong>{label}</strong>
        <span>{explanation}</span>
      </div>
      <div className="risk-meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-valuetext={`${value} of 100`} aria-label={label}>
        <span style={{ width: `${value}%` }} />
      </div>
      <b>{value}</b>
    </li>
  );
}
