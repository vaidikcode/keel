/**
 * Said once per page, quietly, as part of the lead rather than as a warning
 * box. design.md's rule is that a missing-context answer never becomes a
 * fabricated suitability score — this is the standing version of the same
 * promise, and it reads better as a sentence than as an alarm.
 */
export function Disclaimer() {
  return (
    <span className="lead-note">
      Keel explains options and shows how their prices have moved. Its rankings are
      estimates from your answers, not recommendations or financial advice, and nothing
      here predicts what a price will do next.
    </span>
  );
}
