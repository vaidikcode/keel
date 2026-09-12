"use client";
import { useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import type { RankedAsset } from "@/lib/dashboard/api";
import { RankedCard } from "./RankedCard";

export function RankedRow({ assets, categoryId, loading = false }: { assets: RankedAsset[]; categoryId: string; loading?: boolean }) {
  const row = useRef<HTMLOListElement>(null);
  const scroll = (dir: -1 | 1) => row.current?.scrollBy({ left: dir * 520, behavior: "smooth" });
  return (
    <section className="ranked-section" aria-labelledby="ranked-heading" aria-busy={loading}>
      <div className="section-head">
        <div>
          <h2 id="ranked-heading">Ranked for you</h2>
          <p className="fine-print">Ordered by fit with your answers. Hover or tap a card for the short version. Not a recommendation.</p>
        </div>
        <div className="row-scroll-buttons">
          <button type="button" className="icon-button" aria-label="Scroll left" onClick={() => scroll(-1)}>
            <Icon name="back" size={16} />
          </button>
          <button type="button" className="icon-button" aria-label="Scroll right" onClick={() => scroll(1)}>
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>
      {loading ? (
        <ol className="ranked-row" aria-label="Loading ranked options">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="ranked-card is-skeleton" aria-hidden="true">
              <span className="rank-number">{i + 1}</span>
              <span className="ranked-card-main" />
            </li>
          ))}
        </ol>
      ) : assets.length === 0 ? (
        <div className="empty-state">
          <h3>Nothing ranked here yet</h3>
          <p>Prices for this category didn’t come through. Try again in a moment.</p>
        </div>
      ) : (
        <ol ref={row} className="ranked-row" aria-label="Ranked options, ordered by fit">
          {assets.map((a) => (
            <RankedCard key={a.id} asset={a} categoryId={categoryId} total={assets.length} />
          ))}
        </ol>
      )}
    </section>
  );
}
