"use client";
import Link from "next/link";
import { Carousel } from "./Carousel";
import { Sparkline } from "./Sparkline";
import { useKeel } from "@/components/keel/KeelContext";
import { startAssetDrag } from "@/components/keel/keelDnd";
import { formatPct } from "@/lib/dashboard/api";
import { CATEGORY_BY_ID, type AssetKind, type CategoryId } from "@/lib/market/categories";
import { NAV_LABEL } from "@/lib/market/navGroups";
import type { RankedAsset } from "@/lib/market/snapshotModel";

/**
 * Biggest one-day moves inside this asset class, computed from the assets the
 * page has already loaded.
 *
 * The snapshot's own `trending` list can't be used: it is capped at six across
 * all seven categories, so narrowing it to one asset class leaves one or two
 * items. Ranking the class's own assets here costs no extra request and gives
 * the rail a full deck.
 */
export function TrendingSection({
  kind,
  assets,
  titleOverride,
}: {
  kind: AssetKind;
  assets: Array<{ asset: RankedAsset; categoryId: CategoryId }>;
  /** Set when the rail spans every asset class rather than one of them. */
  titleOverride?: string;
}) {
  const keel = useKeel();
  const items = assets
    .filter(({ asset }) => asset.change1dPct !== null && asset.spark.length > 5)
    .sort(
      (a, b) => Math.abs(b.asset.change1dPct ?? 0) - Math.abs(a.asset.change1dPct ?? 0),
    )
    .slice(0, 10);

  if (items.length === 0) return null;

  return (
    <Carousel
      title={titleOverride ?? `Trending ${NAV_LABEL[kind].toLowerCase()}`}
      note="Biggest moves today in this group. Movement is not a signal to act."
      resetKey={items.map(({ asset }) => asset.id).join()}
    >
      {items.map(({ asset, categoryId }) => {
        const category = CATEGORY_BY_ID[categoryId];
        const up = (asset.change1dPct ?? 0) >= 0;
        return (
          <li
            key={asset.id}
            className="trend-card"
            draggable
            onDragStart={(e) =>
              startAssetDrag(e, { id: asset.id, ticker: asset.ticker, name: asset.name })
            }
          >
            <Link href={keel.withDemo(`/asset/${asset.id}?from=${categoryId}`)} draggable={false}>
              <span className="trend-top">
                <strong>{asset.ticker}</strong>
                <span className={`trend-change ${up ? "positive" : "negative"}`}>
                  {formatPct(asset.change1dPct)}
                </span>
              </span>
              <span className="name">{asset.name}</span>
              <Sparkline values={asset.spark} positive={up} width={120} height={26} />
              {category && <span className="category-chip">{category.short}</span>}
            </Link>
          </li>
        );
      })}
    </Carousel>
  );
}
