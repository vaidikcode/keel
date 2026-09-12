"use client";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useKeel } from "@/components/keel/KeelContext";
import { startAssetDrag } from "@/components/keel/keelDnd";
import { formatPct, type TrendingItem } from "@/lib/dashboard/api";
import { CATEGORY_BY_ID, isCategoryId } from "@/lib/market/categories";
import { Sparkline } from "./Sparkline";

export function TrendingStrip({ items }: { items: TrendingItem[] }) {
  const keel = useKeel();
  return (
    <section className="trending-section" aria-labelledby="trending-heading">
      <div className="section-head">
        <div>
          <h2 id="trending-heading">
            <Icon name="trend" size={18} /> Trending now
          </h2>
          <p className="fine-print">Biggest recent moves across categories you’ve opened. Movement is not a signal to act.</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="fine-print trending-empty">Open a few categories and the biggest movers will show up here.</p>
      ) : (
        <ul className="trending-strip">
          {items.map((t) => {
            const category = isCategoryId(t.categoryId) ? CATEGORY_BY_ID[t.categoryId] : null;
            const up = (t.change1dPct ?? 0) >= 0;
            return (
              <li
                key={t.assetId}
                className="trend-card"
                draggable
                onDragStart={(e) => startAssetDrag(e, { id: t.assetId, ticker: t.ticker, name: t.name })}
              >
                <Link href={keel.withDemo(`/asset/${t.assetId}?from=${t.categoryId}`)} draggable={false}>
                  <span className="trend-top">
                    <strong>{t.ticker}</strong>
                    <span className={`trend-change ${up ? "positive" : "negative"}`}>{formatPct(t.change1dPct)}</span>
                  </span>
                  <span className="name">{t.name}</span>
                  <Sparkline values={t.spark} positive={up} width={120} height={26} />
                  {category && <span className="category-chip">{category.short}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
