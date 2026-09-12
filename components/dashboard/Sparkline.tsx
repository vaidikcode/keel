"use client";
import { useMemo } from "react";

export function Sparkline({
  values,
  positive,
  width = 96,
  height = 28,
}: {
  values: number[];
  positive: boolean;
  width?: number;
  height?: number;
}) {
  const points = useMemo(() => {
    if (values.length < 2) return "";
    const min = Math.min(...values),
      max = Math.max(...values);
    const span = max - min || 1;
    return values
      .map((v, i) => `${((i / (values.length - 1)) * (width - 2) + 1).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`)
      .join(" ");
  }, [values, width, height]);
  if (!points) return <span className="sparkline sparkline-empty" aria-hidden="true" />;
  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      <polyline points={points} fill="none" stroke={positive ? "var(--sea-glass)" : "var(--coral)"} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
