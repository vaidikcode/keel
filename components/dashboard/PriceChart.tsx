"use client";
import { useId, useMemo, useState } from "react";
import { alignedSeries, type Investment } from "@/lib/dashboard/model";
import { KeelMascot } from "./KeelMascot";
import { Icon } from "@/components/ui/Icon";
const colors = ["var(--harbor)", "var(--sea-glass)", "var(--amber)"];
export function PriceChart({
  assets,
  days,
  sample,
  paused,
  onExplain,
  unit = "usd",
}: {
  assets: Investment[];
  days: number;
  sample: boolean;
  paused: boolean;
  onExplain: (text: string) => void;
  /**
   * A stock has a price in dollars; a market index has a level in points and no
   * currency at all. Labelling NIFTY 50 as "$23,398" would be wrong twice over.
   */
  unit?: "usd" | "points";
}) {
  const id = useId().replaceAll(":", "");
  const series = useMemo(() => alignedSeries(assets, days), [assets, days]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [inspect, setInspect] = useState(false);
  const count = series[0]?.points.length ?? 0;
  const index = Math.min(
    cursor ?? Math.max(0, count - 1),
    Math.max(0, count - 1),
  );
  if (count < 2)
    return (
      <div className="chart-empty">
        <Icon name="chart" size={42} />
        <h3>Price history isn’t available yet.</h3>
        <p>
          {assets.length > 1
            ? "These options don't have enough shared dates. Try a different comparison."
            : "We couldn't retrieve this chart. You can still explore the investment and try a scenario."}
        </p>
        <span className="fine-print">
          Missing data is never replaced with made-up prices.
        </span>
      </div>
    );
  const compare = assets.length > 1;
  const data = series.map((s) => ({
    ...s,
    points: s.points.map((p) => ({
      ...p,
      value: compare ? (p.value / s.points[0].value) * 1000 : p.value,
    })),
  }));
  const values = data.flatMap((s) => s.points.map((p) => p.value));
  const min = Math.min(...values),
    max = Math.max(...values),
    pad = Math.max((max - min) * 0.18, max * 0.008);
  const low = min - pad,
    high = max + pad;
  const x = (i: number) => 20 + (i / (count - 1)) * 790;
  const y = (v: number) => 245 - ((v - low) / (high - low)) * 218;
  const path = (points: (typeof data)[number]["points"]) =>
    points
      .map(
        (p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`,
      )
      .join(" ");
  const date = data[0].points[index].date;
  const dateLabel = (d: string) =>
    new Date(d + "T00:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  const price = (n: number) =>
    new Intl.NumberFormat("en-US", {
      ...(unit === "usd" ? { style: "currency" as const, currency: "USD" } : {}),
      maximumFractionDigits: n > 10000 ? 0 : 2,
    }).format(n);
  const last = data[0].points[index].value;
  const change = (last / data[0].points[0].value - 1) * 100;
  return (
    <div className="price-chart">
      <div className="chart-readout">
        <div>
          <span className="label">
            {sample
              ? "ILLUSTRATIVE VALUE"
              : compare
                ? "VALUE OF A $1,000 START"
                : unit === "points"
                  ? "INDEX LEVEL · POINTS"
                  : "DAILY PRICE · USD"}
          </span>
          <div className="chart-value">
            {price(last)}{" "}
            <span className={change >= 0 ? "positive" : "negative"}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)}% <small>in selected period</small>
            </span>
          </div>
        </div>
        <span className="chart-date">{dateLabel(date)}</span>
      </div>
      <div className="chart-plot">
        <svg
          viewBox="0 0 900 280"
          role="img"
          aria-label={`${sample ? "Illustrative" : "Historical"} ${compare ? "comparison, starting at 1,000 US dollars" : "prices in US dollars"}. ${data.map((s) => `${s.name}: ${price(s.points[index].value)} on ${dateLabel(date)}`).join(". ")}`}
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setCursor(
              Math.max(
                0,
                Math.min(
                  count - 1,
                  Math.round(
                    ((((e.clientX - rect.left) / rect.width) * 900 - 20) /
                      790) *
                      (count - 1),
                  ),
                ),
              ),
            );
            setInspect(true);
          }}
          onPointerLeave={() => setInspect(false)}
        >
          <defs>
            <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="var(--harbor)" stopOpacity=".13" />
              <stop offset="1" stopColor="var(--harbor)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((i) => {
            const value = low + ((high - low) / 3) * i;
            return (
              <g key={i}>
                <line
                  x1="20"
                  y1={y(value)}
                  x2="810"
                  y2={y(value)}
                  stroke="var(--line)"
                  strokeDasharray="3 6"
                />
                <text
                  x="832"
                  y={y(value) + 4}
                  fill="var(--muted)"
                  fontSize="12"
                >
                  ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </text>
              </g>
            );
          })}
          <path
            d={`${path(data[0].points)}L810,250L20,250Z`}
            fill={`url(#area-${id})`}
          />
          {data.map((s, i) => (
            <path
              key={s.id}
              d={path(s.points)}
              fill="none"
              stroke={colors[i]}
              strokeWidth={i === 0 ? 3 : 2.5}
              strokeDasharray={i === 2 ? "7 4" : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          <line
            x1={x(index)}
            y1="16"
            x2={x(index)}
            y2="250"
            stroke="var(--harbor)"
            opacity=".3"
            strokeDasharray="4 4"
          />
          {data.map((s, i) => (
            <circle
              key={s.id}
              cx={x(index)}
              cy={y(s.points[index].value)}
              r="5"
              fill={colors[i]}
              stroke="var(--surface)"
              strokeWidth="3"
            />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const i = Math.round((count - 1) * f);
            return (
              <text
                key={f}
                x={x(i)}
                y="276"
                textAnchor={f === 0 ? "start" : f === 1 ? "end" : "middle"}
                fill="var(--muted)"
                fontSize="12"
              >
                {new Date(
                  data[0].points[i].date + "T00:00:00Z",
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </text>
            );
          })}
        </svg>
        {inspect && (
          <div
            className="chart-friend"
            style={{
              left: `${Math.min(82, Math.max(6, (x(index) / 900) * 100))}%`,
            }}
          >
            <KeelMascot mood="point" size={56} paused={paused} />
          </div>
        )}
      </div>
      <div className="chart-legend">
        {data.map((s, i) => (
          <span key={s.id}>
            <i style={{ background: colors[i] }} />
            {s.ticker}
            <strong>{price(s.points[index].value)}</strong>
          </span>
        ))}
      </div>
      <div className="chart-controls">
        <label htmlFor={`scrub-${id}`} className="sr-only">
          Explore chart date
        </label>
        <input
          id={`scrub-${id}`}
          aria-valuetext={dateLabel(date)}
          type="range"
          min="0"
          max={count - 1}
          value={index}
          onChange={(e) => {
            setCursor(Number(e.target.value));
            setInspect(true);
          }}
        />
        <button
          className="text-button"
          onClick={() =>
            onExplain(
              `${sample ? "In this example" : "On " + dateLabel(date)}, ${data.map((s) => `${s.ticker} ${compare ? "would show" : "was"} ${price(s.points[index].value)}`).join(" and ")}. ${compare ? "Both start with the same amount on the same date. " : ""}This shows price changes, not a forecast.`,
            )
          }
        >
          <Icon name="spark" size={15} /> Explain this point
        </button>
      </div>
      <p className="fine-print">
        {sample
          ? "Sample data · Made-up paths to demonstrate the chart. Not actual returns."
          : unit === "points"
            ? "Daily index level · Points, not a currency · An index tracks a market, and cannot itself be bought. Past performance does not predict future results."
            : "Daily prices · USD · Excludes dividends, fees and taxes. Past performance does not predict future results."}
      </p>
      <details className="chart-table">
        <summary>View chart data as a table</summary>
        <div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                {data.map((s) => (
                  <th key={s.id}>
                    {s.ticker} ({unit === "points" ? "points" : "USD"})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data[0].points.map((p, i) => (
                <tr key={p.date}>
                  <td>{p.date}</td>
                  {data.map((s) => (
                    <td key={s.id}>{price(s.points[i].value)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
