"use client";
import { useCallback, useEffect, useState } from "react";
import { Carousel } from "./Carousel";
import { RankedCard } from "./RankedCard";
import { TrendingSection } from "./TrendingSection";
import { useCategoryData } from "./useCategoryData";
import { useKeel } from "@/components/keel/KeelContext";
import { rankObjectively } from "@/lib/market/objective";
import { NAV_LABEL } from "@/lib/market/navGroups";
import type { AssetKind, CategoryId } from "@/lib/market/categories";
import type { RankedAsset } from "@/lib/market/snapshotModel";

type Loaded = Record<string, { assets: RankedAsset[]; categoryId: CategoryId }>;

/**
 * Reports one category's assets upward. `useCategoryData` is a hook, so it
 * cannot be called in a loop over a list whose length changes between kinds
 * (stocks has three categories, crypto one). A child per category keeps the
 * hook count stable inside each component, and the shared module-level cache
 * means the per-category sections below re-use these same fetches for free.
 */
function AssetProbe({
  categoryId,
  onData,
}: {
  categoryId: CategoryId;
  onData: (id: CategoryId, assets: RankedAsset[]) => void;
}) {
  const keel = useKeel();
  const { data } = useCategoryData(categoryId, keel.sessionId, keel.revision);
  const assets = data?.assets;
  useEffect(() => {
    if (assets) onData(categoryId, assets);
  }, [assets, categoryId, onData]);
  return null;
}

/**
 * The two cross-category rails at the top of an asset class: the same Top 10
 * for everyone, then the fit-ordered list for this person. Both span every
 * category in the class rather than just the first one.
 */
export function KindSections({ kind, categoryIds }: { kind: AssetKind; categoryIds: CategoryId[] }) {
  const [loaded, setLoaded] = useState<Loaded>({});
  const onData = useCallback((id: CategoryId, assets: RankedAsset[]) => {
    setLoaded((prev) =>
      prev[id]?.assets === assets ? prev : { ...prev, [id]: { assets, categoryId: id } },
    );
  }, []);

  const merged = categoryIds.flatMap((id) =>
    (loaded[id]?.assets ?? []).map((a) => ({ asset: a, categoryId: id })),
  );
  const top = rankObjectively(merged.map((m) => m.asset), 10);
  const byFit = [...merged]
    .sort((a, b) => (b.asset.fit?.score ?? -1) - (a.asset.fit?.score ?? -1))
    .slice(0, 12)
    .map((m, i) => ({ ...m, asset: { ...m.asset, rank: i + 1 } }));
  const homeOf = (id: string) =>
    merged.find((m) => m.asset.id === id)?.categoryId ?? categoryIds[0];
  const loading = merged.length === 0;

  const skeletons = Array.from({ length: 5 }).map((_, i) => (
    <li className="ranked-card is-skeleton" key={i} aria-hidden="true">
      <span className="ranked-card-main" />
    </li>
  ));

  return (
    <>
      {categoryIds.map((id) => (
        <AssetProbe key={id} categoryId={id} onData={onData} />
      ))}

      <Carousel
        title={`Top 10 ${NAV_LABEL[kind].toLowerCase()}`}
        note="The largest and steadiest of these, in the same order for everyone. Not ranked against your answers."
        resetKey={top.map((a) => a.id).join()}
      >
        {loading
          ? skeletons
          : top.map((a) => (
              <RankedCard key={a.id} asset={a} categoryId={homeOf(a.id)} total={top.length} />
            ))}
      </Carousel>

      <Carousel
        title="You might be interested"
        note="Ordered by fit with your answers. Hover or tap a card for the short version. Not a recommendation."
        resetKey={byFit.map((m) => m.asset.id).join()}
      >
        {loading
          ? skeletons
          : byFit.map((m) => (
              <RankedCard
                key={m.asset.id}
                asset={m.asset}
                categoryId={m.categoryId}
                total={byFit.length}
              />
            ))}
      </Carousel>

      <TrendingSection kind={kind} assets={merged} />
    </>
  );
}
