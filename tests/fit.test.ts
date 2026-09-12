import { test } from "node:test";
import assert from "node:assert/strict";
import { CAPACITY_TABLE, capacityFor, fitFor, fitScore, rankByFit } from "../lib/market/fit";
import { defaultProfile, type Profile } from "../lib/onboarding/questions";

// Mid-range base so no single change hits the 0/100 clamp.
const base: Profile = {
  ...defaultProfile,
  interests: ["broad-funds"],
  risk: "balanced",
  lossTolerance: 20,
  horizon: "long",
  emergency: "yes",
  debt: "no",
  income: "stable",
  experience: "some",
  goal: "explore",
  intent: "choose",
};
function delta(patch: Partial<Profile>): number {
  return capacityFor({ ...base, ...patch }).score - capacityFor(base).score;
}

test("every enum value moves capacity by its documented delta", () => {
  const T = CAPACITY_TABLE;
  for (const [k, v] of Object.entries(T.RISK)) assert.equal(delta({ risk: k as Profile["risk"] }), v - T.RISK.balanced, `risk ${k}`);
  for (const [k, v] of Object.entries(T.HORIZON)) assert.equal(delta({ horizon: k as Profile["horizon"] }), v - T.HORIZON.long, `horizon ${k}`);
  for (const [k, v] of Object.entries(T.EMERGENCY)) assert.equal(delta({ emergency: k as Profile["emergency"] }), v - T.EMERGENCY.yes);
  for (const [k, v] of Object.entries(T.DEBT)) assert.equal(delta({ debt: k as Profile["debt"] }), v - T.DEBT.no);
  for (const [k, v] of Object.entries(T.INCOME)) assert.equal(delta({ income: k as Profile["income"] }), v - T.INCOME.stable);
  for (const [k, v] of Object.entries(T.EXPERIENCE)) assert.equal(delta({ experience: k as Profile["experience"] }), v - T.EXPERIENCE.some);
  for (const [k, v] of Object.entries(T.GOAL)) assert.equal(delta({ goal: k as Profile["goal"] }), v - T.GOAL.explore);
  for (const [k, v] of Object.entries(T.INTENT)) assert.equal(delta({ intent: k as Profile["intent"] }), v - T.INTENT.choose);
  assert.equal(delta({ lossTolerance: 40 }), T.LOSS["40"] - T.LOSS["20"]);
  assert.equal(delta({ lossTolerance: 5 }), T.LOSS["5"] - T.LOSS["20"]);
});
test("amount to monthly ratio nudges capacity", () => {
  assert.equal(delta({ amount: 500, monthly: 100 }), 4);
  assert.equal(delta({ amount: 1200, monthly: 100 }), 0);
  assert.equal(delta({ amount: 5000, monthly: 100 }), -6);
  assert.equal(delta({ amount: 20000, monthly: null }), -3);
});
test("capacity is clamped and default profile sits below the midpoint", () => {
  const cautious = capacityFor({ ...base, risk: "careful", lossTolerance: 5, horizon: "soon", emergency: "no", debt: "yes", income: "none", experience: "new", goal: "purchase" });
  assert.equal(cautious.score, 0);
  const bold = capacityFor({ ...base, risk: "comfortable", lossTolerance: 40, horizon: "future", emergency: "yes", debt: "no", income: "stable", experience: "experienced", goal: "retirement", intent: "choose", amount: 500, monthly: 100 });
  assert.equal(bold.score, 100);
  assert.ok(capacityFor(defaultProfile).score < 50);
  assert.equal(capacityFor(base).score, 73);
});
test("fit penalises too-risky harder than too-calm", () => {
  assert.equal(fitScore(50, 50), 100);
  assert.ok(fitScore(70, 50) < fitScore(30, 50));
  assert.equal(fitScore(70, 50), 68);
  assert.equal(fitScore(30, 50), 88);
  assert.equal(fitScore(100, 0), 0);
});
test("reasons quote the three biggest answers and ranking is deterministic", () => {
  const fit = fitFor(40, capacityFor({ ...base, risk: "careful", horizon: "soon" }));
  assert.equal(fit.reasons.length, 3);
  assert.match(fit.reasons[0], /^Because you said: /);
  const ranked = rankByFit([
    { id: "b", riskScore: 30, fitScore: 80 },
    { id: "a", riskScore: 20, fitScore: 80 },
    { id: "c", riskScore: 10, fitScore: 90 },
    { id: "d", riskScore: null, fitScore: null },
  ]);
  assert.deepEqual(ranked.map((r) => r.id), ["c", "a", "b", "d"]);
});
