"use client";
import { Icon } from "@/components/ui/Icon";
import { capacityFor } from "@/lib/market/fit";
import { aimWord, strategyFor } from "@/lib/market/strategy";
import { cardMetrics } from "@/lib/market/metrics";
import type { Profile } from "@/lib/onboarding/questions";
import type { RankedAsset } from "@/lib/market/snapshotModel";

const AIM_ICON = { low: "shield", high: "rocket", middle: "layers", either: "compass" } as const;

/**
 * What this person's answers add up to, and which way to read each card metric
 * because of them.
 *
 * The definition of each measure is fixed — it is the same for everyone and
 * comes from `cardMetrics` — while what to aim for is read from their answers.
 * Keeping those two apart is the point: the meaning of volatility does not
 * change per reader, but whether they should want more or less of it does.
 *
 * Nothing here is a recommendation. It restates their own answers and points at
 * which column to read.
 */
export function StrategyBrief({ profile, sample }: { profile: Profile; sample: RankedAsset | null }) {
  const capacity = capacityFor(profile);
  const strategy = strategyFor(profile, capacity);
  // Definitions come from the same source the cards use, so the two can never
  // drift apart.
  const definitions = new Map(
    (sample ? cardMetrics(sample) : []).map((m) => [m.key, m]),
  );

  return (
    <section className="strategy-brief" aria-labelledby="strategy-heading">
      <div className="section-head">
        <div>
          <h2 id="strategy-heading">What your answers add up to</h2>
          <p className="fine-print">
            Read back from the questions you answered. It describes what you told Keel and how to
            read the numbers on each card — it is not advice, and it does not pick anything for you.
          </p>
        </div>
      </div>

      <div className="strategy-headline">
        <strong>{strategy.headline}</strong>
        <p>{strategy.summary}</p>
        <ul className="strategy-from">
          {strategy.from.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <ul className="strategy-targets">
        {strategy.targets.map((target) => {
          const definition = definitions.get(target.key);
          return (
            <li key={target.key}>
              <div className="target-head">
                <Icon name={AIM_ICON[target.aim]} size={15} />
                <strong>{target.label}</strong>
                <span className={`target-aim is-${target.aim}`}>{aimWord(target.aim)}</span>
              </div>
              <p className="target-look">{target.look}</p>
              <p className="target-because">{target.because}</p>
              {definition && (
                <details className="target-jargon">
                  <summary>What this measure is</summary>
                  <p>{definition.definition}</p>
                  <p className="target-alias">{definition.alsoCalled}</p>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
