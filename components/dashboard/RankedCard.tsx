"use client";
import Link from "next/link";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { useKeel } from "@/components/keel/KeelContext";
import { startAssetDrag } from "@/components/keel/keelDnd";
import type { RankedAsset } from "@/lib/dashboard/api";

import { riskLabelText } from "@/lib/market/risk";
import { cardMetrics, type CardMetric } from "@/lib/market/metrics";
import { CardMetrics } from "./CardMetrics";
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
  const summaryId = useId();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const metrics = useMemo(() => cardMetrics(asset), [asset]);
  const saved = keel.savedAssets.includes(asset.id);
  const href = keel.withDemo(`/asset/${asset.id}?from=${categoryId}`);
  const riskText = asset.risk ? `${riskLabelText[asset.risk.label]} risk` : "no history yet";
  const positive = (asset.change30dPct ?? asset.change1yPct ?? 0) >= 0;

  /**
   * Brings the buddy to the row that was pressed and has it explain the figure.
   *
   * `pos` is an offset from where the buddy rests, bottom-right of the window,
   * so the target has to be expressed the same way — and the clamp has to
   * account for the speech bubble, not just the mascot. The bubble is
   * positioned `right: 150px; bottom: 40px` from the overlay and grows leftward
   * up to 300px, so the buddy's real footprint reaches about 450px further left
   * than its own box. Clamping against the mascot alone pushed the bubble off
   * the left edge.
   */
  function explain(metric: CardMetric, row: HTMLElement) {
    keel.say(`${metric.definition}\n\nWhere this comes from: ${metric.source}`, false);
    const overlay = document.querySelector<HTMLElement>(".keel-overlay");
    if (!overlay) return;

    const w = overlay.offsetWidth || 96;
    const h = overlay.offsetHeight || 96;
    const originX = window.innerWidth - w - 20;
    const originY = window.innerHeight - h - 20;
    const rect = row.getBoundingClientRect();

    // The widest the bubble can ever be, from its own CSS — not its current
    // width, which is still showing the previous, possibly shorter, message.
    const reachLeft = 150 + Math.min(300, window.innerWidth - 160);
    const reachUp = 40 + 220;
    const clamp = (x: number, y: number) => ({
      x: Math.round(Math.min(-12, Math.max(12 + reachLeft - (window.innerWidth - 20), x))),
      y: Math.round(Math.min(-12, Math.max(12 + reachUp - (window.innerHeight - 20), y))),
    });

    // Sit to the left of the row, so the bubble opens over open page rather
    // than over the card that was just pressed.
    const target = clamp(rect.left - w - 18 - originX, rect.top - h / 2 - originY);
    keel.setPos(target);

    // The bubble resizes to whatever was just said, so take one more look once
    // it has and nudge it back inside if the new text made it taller or wider.
    window.setTimeout(() => {
      const bubble = document.querySelector<HTMLElement>(".keel-bubble");
      if (!bubble) return;
      const box = bubble.getBoundingClientRect();
      let dx = 0;
      let dy = 0;
      if (box.left < 12) dx = 12 - box.left;
      else if (box.right > window.innerWidth - 12) dx = window.innerWidth - 12 - box.right;
      if (box.top < 12) dy = 12 - box.top;
      else if (box.bottom > window.innerHeight - 12) dy = window.innerHeight - 12 - box.bottom;
      if (dx !== 0 || dy !== 0) keel.setPos({ x: target.x + dx, y: target.y + dy });
    }, 90);
  }

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
        aria-describedby={`${detailsId} ${summaryId}`}
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
        <CardMetrics metrics={metrics} onExplain={explain} />
        <p className="one-liner">{asset.oneLiner}</p>
        <span id={summaryId} className="sr-only">
          {`Rank ${asset.rank} of ${total}. ${metrics.map((m) => `${m.label} ${m.value}`).join(". ")}.`}
        </span>
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
