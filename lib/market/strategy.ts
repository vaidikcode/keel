import type { Capacity } from "./fit";
import {
  goalLabels,
  horizonLabels,
  lossToleranceLabel,
  riskLabels,
  type Profile,
} from "../onboarding/questions";

/**
 * Reads someone's base answers into a plain-English strategy, and into what
 * each card metric should look like for them.
 *
 * The *definitions* of the metrics are fixed and live in metrics.ts. What moves
 * here is only what a given person should be looking for — whether a high or a
 * low number suits them — because that genuinely depends on their answers.
 *
 * None of this is advice. It restates what the reader already told Keel and
 * points at which column to read; it never says what to buy.
 */

export type Aim = "low" | "high" | "middle" | "either";

export type MetricTarget = {
  /** Matches CardMetric.key so the two line up on screen. */
  key: string;
  label: string;
  aim: Aim;
  /** What a good number looks like for this person. */
  look: string;
  /** The answer of theirs this was read from. */
  because: string;
};

export type Strategy = {
  headline: string;
  summary: string;
  /** The answers the reading was built from, for showing your working. */
  from: string[];
  targets: MetricTarget[];
};

const AIM_WORD: Record<Aim, string> = {
  low: "Lower is what suits you",
  high: "Higher is what suits you",
  middle: "Somewhere in the middle suits you",
  either: "Either way can work for you",
};

export function aimWord(aim: Aim): string {
  return AIM_WORD[aim];
}

/** Short, medium or long, folded from the horizon answer. */
function span(profile: Profile): "short" | "medium" | "long" {
  if (profile.horizon === "soon") return "short";
  if (profile.horizon === "medium") return "medium";
  if (profile.horizon === "long" || profile.horizon === "future") return "long";
  return "medium";
}

export function strategyFor(profile: Profile, capacity: Capacity): Strategy {
  const reach = span(profile);
  const room = capacity.score;
  // Three bands, matching how `fitScore` already treats capacity.
  const appetite = room < 40 ? "careful" : room < 65 ? "middling" : "roomy";

  const headline =
    appetite === "careful"
      ? reach === "short"
        ? "Keep it steady, and keep it reachable"
        : "Grow it slowly, without big drops"
      : appetite === "roomy"
        ? reach === "long"
          ? "Growth first, with time to ride out the falls"
          : "Growth, but the clock is the constraint"
        : reach === "short"
          ? "A middle course, on a short clock"
          : "A middle course, with room to grow";

  const summary =
    `Your answers point to ${
      appetite === "careful"
        ? "keeping price movement small"
        : appetite === "roomy"
          ? "accepting real price movement in exchange for growth"
          : "a balance between growth and calm"
    }, over ${
      reach === "short"
        ? "a short stretch — under a year or so"
        : reach === "long"
          ? "many years"
          : "a few years"
    }. ` +
    (reach === "short"
      ? "On a short clock a fall matters more, because there is less time for a price to come back."
      : "Over a long stretch the size of any single fall matters less than whether you can sit through it.");

  const from = [
    `Time frame: ${horizonLabels[profile.horizon]}`,
    `Price movement: ${riskLabels[profile.risk]}`,
    `Drop you could sit through: ${lossToleranceLabel(profile.lossTolerance)}`,
    `What the money is for: ${goalLabels[profile.goal]}`,
  ];

  const steadinessAim: Aim = appetite === "careful" ? "low" : appetite === "roomy" ? "either" : "middle";
  const riskAim: Aim = appetite === "careful" ? "low" : appetite === "roomy" ? "either" : "middle";
  const growthAim: Aim = reach === "short" ? "middle" : "high";
  const directionAim: Aim = reach === "short" ? "high" : "either";

  const targets: MetricTarget[] = [
    {
      key: "steadiness",
      label: "Steadiness",
      aim: steadinessAim,
      look:
        steadinessAim === "low"
          ? "A small percentage. That means the price stays close to its own average instead of swinging."
          : steadinessAim === "middle"
            ? "A middling percentage. Some movement is the price of growth; a very large number is more than your answers call for."
            : "A larger percentage is workable for you, as long as you actually sit through the falls rather than selling into them.",
      because: `You said ${riskLabels[profile.risk].toLowerCase()} and that you could sit through ${lossToleranceLabel(profile.lossTolerance).toLowerCase()}.`,
    },
    {
      key: "direction",
      label: "Recent direction",
      aim: directionAim,
      look:
        directionAim === "high"
          ? "Positive helps on a short clock, but one month is a very short look. Do not read a trend into it."
          : "Barely matters for you. Over many years a single month tells you almost nothing.",
      because: `You said your time frame is ${horizonLabels[profile.horizon].toLowerCase()}.`,
    },
    {
      key: "year",
      label: "One year growth",
      aim: growthAim,
      look:
        growthAim === "high"
          ? "A solid positive year is what you are after — but check it against Steadiness, because a huge number usually came with huge swings."
          : "Positive and unremarkable beats spectacular. A spike is a warning about how far it can fall too.",
      because: `You said the money is for ${goalLabels[profile.goal].toLowerCase()}.`,
    },
    {
      key: "risk",
      label: "Risk",
      aim: riskAim,
      look:
        riskAim === "low"
          ? "Under about 25, which Keel calls low."
          : riskAim === "middle"
            ? "Roughly 25 to 50, which Keel calls moderate."
            : "You have room for the higher end, though above 75 is very high by Keel's own scale.",
      because: `Your answers give you a capacity of ${capacity.score} out of 100.`,
    },
    {
      key: "fit",
      label: "Fit for you",
      aim: "high",
      look: "Higher is simply closer to what you said. It is the one number here that is already about you.",
      because: "Fit is built from your answers, so a high score means the risk matches what you told Keel.",
    },
  ];

  return { headline, summary, from, targets };
}
