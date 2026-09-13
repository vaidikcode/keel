"use client";
import { RankedCard } from "./RankedCard";
import { Carousel } from "./Carousel";
import { useCategoryData } from "./useCategoryData";
import { rankObjectively } from "@/lib/market/objective";
import { CATEGORY_BY_ID, type CategoryId } from "@/lib/market/categories";
import { useKeel } from "@/components/keel/KeelContext";

export type SectionMode = "top" | "fit";

/**
 * One carousel of one category. Each section owns its own fetch so the page
 * can stack several without a bespoke batched route — `useCategoryData` keeps
 * a module-level cache keyed by session, revision and category, so revisiting
 * a section is free.
 */
export function CategorySection({
  categoryId,
  mode = "fit",
  title,
  note,
  limit,
}: {
  categoryId: CategoryId;
  mode?: SectionMode;
  title?: string;
  note?: string;
  limit?: number;
}) {
  const keel = useKeel();
  const { status, data } = useCategoryData(categoryId, keel.sessionId, keel.revision);
  const category = CATEGORY_BY_ID[categoryId];
  const all = data?.assets ?? [];
  const assets = mode === "top" ? rankObjectively(all, limit ?? 10) : all.slice(0, limit ?? all.length);
  const loading = status !== "ready" && !data;

  return (
    <Carousel
      title={title ?? category.label}
      note={note ?? category.blurb}
      resetKey={assets.map((a) => a.id).join()}
    >
      {loading
        ? Array.from({ length: 5 }).map((_, i) => (
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
