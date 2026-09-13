import { CATEGORIES, type AssetKind, type Category, type CategoryId } from "./categories";

/**
 * The sidebar shows five destinations; the seven categories live on as the
 * *sections* inside them. Keeping the category ids alive is deliberate — they
 * key the Convex snapshot and thoughts documents and the profile's `interests`,
 * so collapsing the nav costs no migration.
 */
export const NAV_VIEWS = ["overview", "stocks", "funds", "crypto", "portfolio"] as const;
export type NavView = (typeof NAV_VIEWS)[number];

const KINDS = ["stocks", "funds", "crypto"] as const;

export const NAV_LABEL: Record<NavView, string> = {
  overview: "Overview",
  stocks: "Stocks",
  funds: "Funds",
  crypto: "Crypto",
  portfolio: "Portfolio",
};

export const NAV_ICON: Record<NavView, "home" | "building" | "layers" | "drop" | "bookmark"> = {
  overview: "home",
  stocks: "building",
  funds: "layers",
  crypto: "drop",
  portfolio: "bookmark",
};

export function isNavView(value: string): value is NavView {
  return (NAV_VIEWS as readonly string[]).includes(value);
}

/** "crypto" is both a kind and a category id; as a route it means the kind. */
export function isKindView(value: string): value is AssetKind {
  return (KINDS as readonly string[]).includes(value);
}

/** Sections for a kind page, in the order the categories are declared. */
export function categoriesForKind(kind: AssetKind): Category[] {
  return CATEGORIES.filter((c) => c.kind === kind);
}

export function categoryIdsForKind(kind: AssetKind): CategoryId[] {
  return categoriesForKind(kind).map((c) => c.id);
}

/** Which nav destination a category id belongs to. */
export function viewForCategory(id: CategoryId): AssetKind {
  return CATEGORIES.find((c) => c.id === id)?.kind ?? "funds";
}

export const KIND_LABEL: Record<AssetKind, string> = {
  stocks: "stocks",
  funds: "funds",
  crypto: "crypto",
};
