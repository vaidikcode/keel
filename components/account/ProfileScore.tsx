"use client";
import { capacityFor } from "@/lib/market/fit";
import type { Profile } from "@/lib/onboarding/questions";

/**
 * The score was already being computed for every ranking — `capacityFor` returns
 * 0–100 with a reason per answer. This just gives it a face, and names the
 * answers that are holding it where it is.
 */
export function ProfileScore({ profile }: { profile: Profile }) {
  const capacity = capacityFor(profile);
  const moved = capacity.contributions
    .filter((c) => c.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4);
  const unanswered = capacity.contributions.filter((c) => c.delta === 0).length;

  return (
    <section className="profile-score" aria-labelledby="score-heading">
      <div className="section-head">
        <div>
          <h2 id="score-heading">Your profile</h2>
          <p className="fine-print">
            How much price movement your answers suggest you can sit through. It orders
            what Keel shows you. It is not a grade, and not advice.
          </p>
        </div>
      </div>

      <div className="score-readout">
        <strong>{capacity.score}</strong>
        <span>out of 100</span>
      </div>
      <div className="risk-meter" role="img" aria-label={`Capacity ${capacity.score} of 100`}>
        <span style={{ width: `${capacity.score}%` }} />
      </div>

      {moved.length > 0 && (
        <ul className="score-reasons">
          {moved.map((c) => (
            <li key={c.field}>
              <span className={c.delta > 0 ? "positive" : "negative"}>
                {c.delta > 0 ? "+" : ""}
                {c.delta}
              </span>
              {c.text}
            </li>
          ))}
        </ul>
      )}
      {unanswered > 0 && (
        <p className="fine-print">
          {unanswered} {unanswered === 1 ? "answer is" : "answers are"} still at their
          default and count for nothing either way. Filling them in sharpens the ranking.
        </p>
      )}
    </section>
  );
}
