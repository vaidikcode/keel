"use client";
import { Carousel } from "./Carousel";
import { KeelMascot } from "./KeelMascot";
import type { RankedAsset } from "@/lib/dashboard/api";
import { RankedCard } from "./RankedCard";

/**
 * The category page's own ranked rail. It is the same carousel the asset-class
 * pages use — arrows either side, dots underneath, the reference card size.
 */
export function RankedRow({
  assets,
  categoryId,
  loading = false,
}: {
  assets: RankedAsset[];
  categoryId: string;
  loading?: boolean;
}) {
  if (!loading && assets.length === 0)
    return (
      <div className="empty-state">
        <KeelMascot mood="question" size={90} />
        <h3>Nothing ranked here yet</h3>
        <p>Prices for this category didn’t come through. Try again in a moment.</p>
      </div>
    );

  return (
    <Carousel
      title="Ranked for you"
      note="Ordered by fit with your answers. Hover or tap a card for the short version. Not a recommendation."
      resetKey={assets.map((a) => a.id).join()}
    >
      {loading
        ? Array.from({ length: 5 }, (_, i) => (
            <li className="ranked-card is-skeleton" key={i} aria-hidden="true">
              <span className="ranked-card-main" />
            </li>
          ))
        : assets.map((a) => (
            <RankedCard key={a.id} asset={a} categoryId={categoryId} total={assets.length} />
          ))}
    </Carousel>
  );
}
