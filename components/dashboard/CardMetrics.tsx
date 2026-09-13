"use client";
import type { CardMetric } from "@/lib/market/metrics";

/**
 * The five figures, all visible at once. Pressing one asks Keel to explain it
 * in plain words rather than making the reader hunt for a glossary.
 */
export function CardMetrics({
  metrics,
  onExplain,
}: {
  metrics: CardMetric[];
  onExplain: (metric: CardMetric, row: HTMLElement) => void;
}) {
  return (
    <dl className="card-metrics">
      {metrics.map((metric) => (
        <div key={metric.key}>
          <button
            type="button"
            className="metric-row"
            aria-label={`What ${metric.label} means, and where the figure comes from`}
            onClick={(event) => onExplain(metric, event.currentTarget)}
          >
            <dt title={metric.term ?? undefined}>{metric.label}</dt>
            <dd className={metric.tone ?? undefined}>{metric.value}</dd>
          </button>
        </div>
      ))}
    </dl>
  );
}
