"use client";
import { useId, useState } from "react";

/**
 * The risk reading, as a band someone can point at.
 *
 * The four names are Keel's own thresholds from `riskLabel` — under 25 low,
 * under 50 moderate, under 75 high, above that very high — so the bar and the
 * pill on every card can never disagree. Hovering or focusing a band names it;
 * the marker says where this list actually sits.
 */
const BANDS = [
  { key: "very-low", label: "Very low", from: 0, to: 12, note: "Barely moves. Cash-like." },
  { key: "low", label: "Low", from: 12, to: 25, note: "Small movements, rarely sharp." },
  { key: "moderate", label: "Moderate", from: 25, to: 50, note: "Real movement, both ways." },
  { key: "high", label: "High", from: 50, to: 75, note: "Large swings are normal here." },
  { key: "very-high", label: "Very high", from: 75, to: 100, note: "Can halve or double." },
] as const;

export function bandFor(score: number): string {
  return (BANDS.find((b) => score < b.to) ?? BANDS[BANDS.length - 1]).label;
}

export function RiskBar({ score, caption }: { score: number; caption: string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const id = useId();
  const active = BANDS.find((b) => b.key === hovered) ?? null;
  const resting = BANDS.find((b) => score < b.to) ?? BANDS[BANDS.length - 1];
  const shown = active ?? resting;

  return (
    <div className="risk-bar" onMouseLeave={() => setHovered(null)}>
      <p className="risk-bar-readout" aria-hidden="true">
        <strong>{score}</strong>
        <span>out of 100 · {shown.label}</span>
      </p>

      <div
        className="risk-bar-track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-valuetext={`${score} of 100, ${resting.label} risk`}
        aria-describedby={id}
      >
        {BANDS.map((band) => (
          <button
            key={band.key}
            type="button"
            className={`risk-band is-${band.key} ${hovered === band.key ? "is-hovered" : ""} ${
              band.key === resting.key ? "is-current" : ""
            }`}
            style={{ flexGrow: band.to - band.from }}
            aria-label={`${band.label}: ${band.note}`}
            onMouseEnter={() => setHovered(band.key)}
            onFocus={() => setHovered(band.key)}
            onBlur={() => setHovered(null)}
          >
            <span className="risk-band-name">{band.label}</span>
          </button>
        ))}
        <span className="risk-marker" style={{ left: `${Math.min(100, Math.max(0, score))}%` }}>
          <i />
        </span>
      </div>

      <p className="risk-bar-note" id={id}>
        {active ? active.note : caption}
      </p>
    </div>
  );
}
