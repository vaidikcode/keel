"use client";
import { Carousel } from "./Carousel";
import { RankedCard } from "./RankedCard";
import type { AssetKind, CategoryId } from "@/lib/market/categories";
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
      {items.map(({ asset, categoryId }, i) => (
        <RankedCard
          key={asset.id}
          asset={{ ...asset, rank: i + 1 }}
          categoryId={categoryId}
          total={items.length}
        />
      ))}
    </Carousel>
  );
}
