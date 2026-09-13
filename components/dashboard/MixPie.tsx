"use client";
import { useState } from "react";
import type { AssetKind } from "@/lib/market/categories";
import type { RankedAsset } from "@/lib/market/snapshotModel";

/**
 * What the saved list is made of, by asset class.
 *
 * Hand-rolled SVG, because there is no charting library here and CI installs
 * with a frozen lockfile. The lift on hover is the same physical idea as the
 * cards and buttons elsewhere: the slice rises off its own shadow rather than
 * changing colour, so depth carries the interaction and the palette stays calm.
 */

export type MixSlice = {
  kind: AssetKind;
  label: string;
  count: number;
  /** Mean Keel risk score across the slice, or null when none was measured. */
  risk: number | null;
  /** Mean annualised movement, the same figure the cards call Steadiness. */
  stability: number | null;
};

const COLOR: Record<AssetKind, string> = {
  funds: "var(--harbor)",
  stocks: "var(--sea-glass)",
  crypto: "var(--amber)",
};
const LABEL: Record<AssetKind, string> = { funds: "Funds", stocks: "Stocks", crypto: "Crypto" };

export function buildMix(assets: RankedAsset[]): MixSlice[] {
  const kinds: AssetKind[] = ["funds", "stocks", "crypto"];
  return kinds
    .map((kind) => {
      const group = assets.filter((a) => a.kind === kind);
      const risks = group.map((a) => a.risk?.score).filter((v): v is number => typeof v === "number");
      const vols = group
        .map((a) => a.risk?.raw.annualVol)
        .filter((v): v is number => typeof v === "number");
      return {
        kind,
        label: LABEL[kind],
        count: group.length,
        risk: risks.length ? Math.round(risks.reduce((s, v) => s + v, 0) / risks.length) : null,
        stability: vols.length
          ? Math.round((vols.reduce((s, v) => s + v, 0) / vols.length) * 100)
          : null,
      };
    })
    .filter((slice) => slice.count > 0);
}

/** A wedge path, pushed out along its own middle angle when lifted. */
function wedge(from: number, to: number, lift: number): string {
  const r = 62;
  const mid = ((from + to) / 2) * (Math.PI / 180) - Math.PI / 2;
  const cx = 80 + Math.cos(mid) * lift;
  const cy = 80 + Math.sin(mid) * lift;
  const a = (from * Math.PI) / 180 - Math.PI / 2;
  const b = (to * Math.PI) / 180 - Math.PI / 2;
  const large = to - from > 180 ? 1 : 0;
  // A full circle cannot be drawn as one arc — its start and end coincide.
  if (to - from >= 359.9)
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  return `M ${cx} ${cy} L ${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r} A ${r} ${r} 0 ${large} 1 ${
    cx + Math.cos(b) * r
  } ${cy + Math.sin(b) * r} Z`;
}

export function MixPie({ slices }: { slices: MixSlice[] }) {
  const [active, setActive] = useState<AssetKind | null>(null);
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  if (!total) return null;

  const laid = slices.map((slice, i) => {
    const before = slices.slice(0, i).reduce((sum, s) => sum + s.count, 0);
    return {
      slice,
      from: (before / total) * 360,
      to: ((before + slice.count) / total) * 360,
    };
  });
  const shown = laid.find((l) => l.slice.kind === active) ?? null;

  return (
    <div className="mix-pie" onMouseLeave={() => setActive(null)}>
      <div className="mix-pie-stage">
        <svg viewBox="0 0 160 168" role="img" aria-label="What your saved list is made of">
          {/* The shadow the slices sit on, so lifting one reads as depth. */}
          {laid.map(({ slice, from, to }) => (
            <path key={`base-${slice.kind}`} className="mix-shadow" d={wedge(from, to, 0)} transform="translate(0 7)" />
          ))}
          {laid.map(({ slice, from, to }) => (
            <path
              key={slice.kind}
              className={`mix-slice ${active === slice.kind ? "is-lifted" : ""}`}
              d={wedge(from, to, active === slice.kind ? 7 : 0)}
              fill={COLOR[slice.kind]}
              tabIndex={0}
              role="button"
              aria-label={`${slice.label}: ${slice.count} of ${total}`}
              onMouseEnter={() => setActive(slice.kind)}
              onFocus={() => setActive(slice.kind)}
              onBlur={() => setActive(null)}
            />
          ))}
        </svg>

        {shown && (
          <div className="mix-tip" role="status">
            <strong>{shown.slice.label}</strong>
            <dl>
              <div>
                <dt>Risk</dt>
                <dd>{shown.slice.risk === null ? "—" : `${shown.slice.risk} / 100`}</dd>
              </div>
              <div>
                <dt>Number of assets</dt>
                <dd>{shown.slice.count}</dd>
              </div>
              <div>
                <dt>Stability</dt>
                <dd>{shown.slice.stability === null ? "—" : `${shown.slice.stability}% a year`}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <ul className="mix-key">
        {slices.map((slice) => (
          <li key={slice.kind} className={active === slice.kind ? "is-active" : ""}>
            <i style={{ background: COLOR[slice.kind] }} aria-hidden="true" />
            <span>{slice.label}</span>
            <b>{slice.count}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
