"use client";
import { useCategoryData } from "./useCategoryData";
import { useKeel } from "@/components/keel/KeelContext";
import type { CategoryId } from "@/lib/market/categories";
import type { RankedAsset } from "@/lib/market/snapshotModel";

export type OwnedAsset = { asset: RankedAsset; categoryId: CategoryId };

/**
 * Every asset Keel knows about, across all seven categories.
 *
 * The calls are written out rather than mapped over `CATEGORY_IDS`: the list is
 * a fixed seven so a loop would be safe, but hooks in a loop are exactly what
 * the rules-of-hooks lint forbids, and spelling them out makes the fixed order
 * obvious. The module-level cache in `useCategoryData` means a page that has
 * already loaded a category pays nothing for asking again.
 */
export function useAllAssets(): { items: OwnedAsset[]; loading: boolean } {
  const keel = useKeel();
  const session = keel.sessionId;
  const revision = keel.revision;

  const broad = useCategoryData("broad-funds", session, revision);
  const bond = useCategoryData("bond-cash", session, revision);
  const large = useCategoryData("large-stable", session, revision);
  const growth = useCategoryData("growth-tech", session, revision);
  const dividend = useCategoryData("dividend", session, revision);
  const crypto = useCategoryData("crypto", session, revision);
  const international = useCategoryData("international", session, revision);

  const sources: Array<[CategoryId, typeof broad]> = [
    ["broad-funds", broad],
    ["bond-cash", bond],
    ["large-stable", large],
    ["growth-tech", growth],
    ["dividend", dividend],
    ["crypto", crypto],
    ["international", international],
  ];

  const items = sources.flatMap(([categoryId, result]) =>
    (result.data?.assets ?? []).map((asset) => ({ asset, categoryId })),
  );
  return { items, loading: items.length === 0 };
}
