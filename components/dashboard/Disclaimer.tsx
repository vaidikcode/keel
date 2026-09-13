/**
 * Stated once at the top of every dashboard page. design.md's rule is that a
 * missing-context answer never becomes a fabricated suitability score — this
 * is the standing version of the same promise.
 */
export function Disclaimer() {
  return (
    <p className="disclaimer-banner" role="note">
      <strong>Not financial advice.</strong> Keel explains options and shows how
      their prices have moved. Rankings are its own estimates from your answers,
      not recommendations, and nothing here predicts what a price will do next.
    </p>
  );
}
