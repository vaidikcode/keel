"use client";
import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { useKeel } from "@/components/keel/KeelContext";
import { startAssetDrag } from "@/components/keel/keelDnd";
import type { RankedAsset } from "@/lib/dashboard/api";
import { formatPct } from "@/lib/dashboard/api";
import { riskLabelText } from "@/lib/market/risk";
import { RiskPill } from "./RiskPill";
import { Sparkline } from "./Sparkline";

export function RankedCard({
  asset,
  categoryId,
  total,
}: {
  asset: RankedAsset;
  categoryId: string;
  total: number;
}) {
  const keel = useKeel();
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const detailsId = useId();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const saved = keel.savedAssets.includes(asset.id);
  const href = keel.withDemo(`/asset/${asset.id}?from=${categoryId}`);
  const riskText = asset.risk ? `${riskLabelText[asset.risk.label]} risk` : "no history yet";
  const positive = (asset.change30dPct ?? asset.change1yPct ?? 0) >= 0;

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && expanded) {
      e.stopPropagation();
      setExpanded(false);
      linkRef.current?.focus();
    }
  }
  const attach = () => {
    keel.attach({ id: asset.id, ticker: asset.ticker, name: asset.name });
    keel.setOpen(true);
  };

  return (
    <li
      className={`ranked-card ${expanded ? "is-expanded" : ""} ${dragging ? "is-dragging" : ""}`}
      draggable
      onDragStart={(e) => {
        startAssetDrag(e, { id: asset.id, ticker: asset.ticker, name: asset.name });
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      onKeyDown={onKeyDown}
      aria-posinset={asset.rank}
      aria-setsize={total}
      aria-roledescription="draggable option"
    >
      <Link
        ref={linkRef}
        href={href}
        className="ranked-card-main"
        draggable={false}
        aria-label={`${asset.name}, ${asset.ticker}, ${riskText}, rank ${asset.rank} of ${total}`}
        aria-describedby={detailsId}
      >
        <span className="ticker">{asset.ticker}</span>
        <span className="name">{asset.name}</span>
        <Sparkline values={asset.spark} positive={positive} />
        <RiskPill label={asset.risk?.label ?? null} score={asset.risk?.score} />
      </Link>
      <button
        type="button"
        className="ranked-expand icon-button"
        aria-expanded={expanded}
        aria-controls={detailsId}
        aria-label={`${expanded ? "Hide" : "Show"} details for ${asset.ticker}`}
        onClick={() => setExpanded((v) => !v)}
      >
        <Icon name="chevron" size={14} />
      </button>
      <div id={detailsId} className="ranked-details" role="group" aria-label={`${asset.ticker} at a glance`}>
        <dl>
          <div>
            <dt>Risk</dt>
            <dd>{asset.risk ? `${asset.risk.score} · ${riskLabelText[asset.risk.label]}` : "—"}</dd>
          </div>
          <div>
            <dt>Fit for you</dt>
            <dd>{asset.fit ? `${asset.fit.score} / 100` : "—"}</dd>
          </div>
          <div>
            <dt>1 year</dt>
            <dd className={(asset.change1yPct ?? 0) >= 0 ? "positive" : "negative"}>{formatPct(asset.change1yPct)}</dd>
          </div>
        </dl>
        <p className="one-liner">{asset.oneLiner}</p>
        <div className="ranked-actions">
          <Link href={href} draggable={false} className="button primary small">
            See details <Icon name="arrow" size={14} />
          </Link>
          <button type="button" className="button secondary small" onClick={attach}>
            <Icon name="chat" size={14} /> Ask Keel
          </button>
          <button
            type="button"
            className={`icon-button ${saved ? "is-saved" : ""}`}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${asset.ticker} from saved` : `Save ${asset.ticker}`}
            onClick={() => void keel.toggleSaved(asset.id)}
          >
            <Icon name="bookmark" size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}
