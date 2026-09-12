import type { Profile } from "../onboarding/questions";
import type { CategoryId } from "./categories";
import type { Capacity } from "./fit";

const DEFAULT: CategoryId[] = ["broad-funds", "bond-cash", "large-stable"];
export const MAX_SELECTED = 5;

/** Categories Keel opens for this person, interests first, never auto-adds crypto. */
export function selectCategories(profile: Profile, capacity: Capacity): CategoryId[] {
  const out: CategoryId[] = [];
  const add = (id: CategoryId) => {
    if (!out.includes(id) && out.length < MAX_SELECTED) out.push(id);
  };
  const base = profile.interests.length ? profile.interests : DEFAULT;
  for (const id of base) add(id);
  add("broad-funds");
  if (
    capacity.score < 45 ||
    profile.horizon === "soon" ||
    profile.horizon === "medium" ||
    profile.emergency === "no"
  )
    add("bond-cash");
  if (profile.country !== "US") add("international");
  return out;
}
export function landingCategory(profile: Profile, capacity: Capacity): CategoryId {
  return selectCategories(profile, capacity)[0];
}
