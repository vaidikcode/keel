"use client";
import { useEffect, useRef, useState } from "react";
import { currencyFormat } from "@/lib/onboarding/questions";

const TIP_SEEN = "keel-budget-tip";

/**
 * Money spans orders of magnitude, so the track is logarithmic: the first third
 * covers small amounts in useful detail instead of crowding everything left.
 */
const MAX = 1_000_000;
const toSlider = (value: number) =>
  Math.round((Math.log10(Math.max(1, value)) / Math.log10(MAX)) * 1000);
const fromSlider = (pos: number) => {
  const raw = Math.pow(10, (pos / 1000) * Math.log10(MAX));
  const step = raw < 100 ? 1 : raw < 1000 ? 10 : raw < 100000 ? 100 : 1000;
  return Math.max(0, Math.round(raw / step) * step);
};

function Handle({
  side,
  value,
  currency,
  onChange,
  onFirstHover,
  showTip,
  min,
  max,
}: {
  side: "low" | "high";
  value: number;
  currency: string;
  onChange: (n: number) => void;
  onFirstHover: () => void;
  showTip: boolean;
  min: number;
  max: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) input.current?.focus();
  }, [editing]);

  function commit() {
    const n = Number(draft.replace(/[^0-9.]/g, ""));
    if (!Number.isNaN(n) && draft.trim() !== "") {
      onChange(Math.min(max, Math.max(min, Math.round(n))));
    }
    setEditing(false);
  }

  return (
    <div
      className={`budget-handle budget-${side}`}
      style={{ "--pos": `${(toSlider(value) / 1000) * 100}%` } as React.CSSProperties}
      onMouseEnter={onFirstHover}
    >
      <div className="budget-bubble">
        {editing ? (
          <input
            ref={input}
            className="budget-input"
            inputMode="numeric"
            value={draft}
            aria-label={`Exact ${side} amount`}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
          />
        ) : (
          <button
            type="button"
            className="budget-value"
            onClick={() => {
              setDraft(String(value));
              setEditing(true);
            }}
          >
            {currencyFormat(value, currency)}
          </button>
        )}
        {showTip && !editing && <span className="budget-tip">try typing</span>}
      </div>
      <input
        type="range"
        className="budget-slider"
        min={0}
        max={1000}
        value={toSlider(value)}
        aria-label={`${side === "low" ? "Lowest" : "Highest"} amount`}
        aria-valuetext={currencyFormat(value, currency)}
        onChange={(e) =>
          onChange(Math.min(max, Math.max(min, fromSlider(Number(e.target.value)))))
        }
      />
    </div>
  );
}

/**
 * A low/high pair rather than a single figure: a beginner is far more likely to
 * know the band they can invest in than an exact number.
 */
export function BudgetRange({
  low,
  high,
  currency,
  onChange,
}: {
  low: number | null;
  high: number | null;
  currency: string;
  onChange: (low: number, high: number) => void;
}) {
  const [tip, setTip] = useState(false);
  const seen = useRef(false);
  const lo = low ?? 100;
  const hi = high ?? 1000;

  useEffect(() => {
    try {
      seen.current = localStorage.getItem(TIP_SEEN) === "1";
    } catch {
      seen.current = true;
    }
  }, []);

  function firstHover() {
    if (seen.current || tip) return;
    setTip(true);
    seen.current = true;
    try {
      localStorage.setItem(TIP_SEEN, "1");
    } catch {
      /* ignore */
    }
    window.setTimeout(() => setTip(false), 3200);
  }

  return (
    <div className="budget-range">
      <div className="budget-track" aria-hidden="true">
        <span
          className="budget-fill"
          style={{
            left: `${(toSlider(lo) / 1000) * 100}%`,
            right: `${100 - (toSlider(hi) / 1000) * 100}%`,
          }}
        />
      </div>
      {/* A bound that crosses the other one pushes it along rather than being
          clamped away — otherwise a typed amount is silently discarded. */}
      <Handle
        side="low"
        value={lo}
        currency={currency}
        min={0}
        max={MAX}
        showTip={tip}
        onFirstHover={firstHover}
        onChange={(n) => onChange(n, Math.max(n, hi))}
      />
      <Handle
        side="high"
        value={hi}
        currency={currency}
        min={0}
        max={MAX}
        showTip={tip}
        onFirstHover={firstHover}
        onChange={(n) => onChange(Math.min(lo, n), n)}
      />
      <p className="budget-readout">
        {currencyFormat(lo, currency)} – {currencyFormat(hi, currency)}
      </p>
    </div>
  );
}
