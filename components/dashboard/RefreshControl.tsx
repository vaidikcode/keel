"use client";
import { Icon } from "@/components/ui/Icon";
import { refreshAllCategories, useFreshness } from "./useCategoryData";

function clockTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/**
 * One icon on every dashboard page. The timestamp it used to print alongside
 * itself is only wanted when someone asks for it, so it lives in the tooltip
 * the button shows on hover and on keyboard focus.
 */
export function RefreshControl() {
  // Staleness is decided by the API when it builds the snapshot, so it arrives
  // with the data rather than being re-derived from the clock during render.
  const { fetchedAt, inFlight, stale, sample } = useFreshness();
  const busy = inFlight > 0;

  const tip = busy
    ? "Refreshing prices…"
    : sample
      ? "Showing example prices"
      : fetchedAt === 0
        ? "Refresh prices"
        : stale
          ? `Last refreshed at ${clockTime(fetchedAt)} — may be a little old`
          : `Last refreshed at ${clockTime(fetchedAt)}`;

  return (
    <span className={`refresh-control ${busy ? "is-busy" : ""} ${stale ? "is-stale" : ""}`}>
      <button
        type="button"
        className="refresh-button"
        onClick={refreshAllCategories}
        disabled={busy}
        aria-label={tip}
      >
        <Icon name="refresh" size={17} />
      </button>
      <span className="refresh-tip" role="tooltip" aria-hidden="true">
        {tip}
      </span>
    </span>
  );
}
