import { test } from "node:test";
import assert from "node:assert/strict";
import {
  alignedSeries,
  dashboardSchema,
  drawdown,
  lossScenario,
} from "../lib/dashboard/model";
import { sampleDashboard } from "../lib/dashboard/catalog";
import {
  defaultProfile,
  migrateProfile,
  nextStep,
  profileSchema,
} from "../lib/onboarding/questions";

test("drawdown tracks a previous peak, not merely adjacent losses", () => {
  assert.equal(
    drawdown([
      { date: "2026-01-01", value: 100 },
      { date: "2026-01-02", value: 120 },
      { date: "2026-01-03", value: 90 },
      { date: "2026-01-04", value: 100 },
    ]),
    25,
  );
  assert.equal(drawdown([]), null);
  assert.equal(drawdown([{ date: "2026-01-01", value: 100 }]), null);
});
test("comparison intersects dates rather than shifting missing observations", () => {
  const [a, b] = sampleDashboard().assets;
  const result = alignedSeries(
    [
      {
        ...a,
        history: [
          { date: "2026-01-01", value: 100 },
          { date: "2026-01-02", value: 105 },
          { date: "2026-01-03", value: 110 },
        ],
      },
      {
        ...b,
        history: [
          { date: "2026-01-01", value: 200 },
          { date: "2026-01-03", value: 250 },
        ],
      },
    ],
    30,
  );
  assert.deepEqual(
    result[0].points.map((p) => p.date),
    ["2026-01-01", "2026-01-03"],
  );
  assert.deepEqual(
    result[1].points.map((p) => p.value),
    [200, 250],
  );
  assert.deepEqual(alignedSeries([{ ...a, history: [] }, b], 30), []);
});
test("scenarios calculate money independently of the model", () => {
  assert.deepEqual(lossScenario(1000, 20), { remaining: 800, loss: 200 });
  assert.deepEqual(lossScenario(0, 80), { remaining: 0, loss: 0 });
  assert.deepEqual(lossScenario(1000, 0), { remaining: 1000, loss: 0 });
});
test("legacy migration keeps preferences and does not invent financial readiness", () => {
  const migrated = migrateProfile({
    watch: "stocks",
    sleep: "steady",
    intent: "park",
  });
  assert.deepEqual(migrated.interests, ["large-stable", "growth-tech", "dividend"]);
  assert.equal(migrated.lossTolerance, 10);
  assert.equal(migrated.risk, "careful");
  assert.equal(migrated.horizon, "unknown");
  assert.equal(migrated.amount, null);
  assert.equal(migrated.emergency, "unknown");
  assert.deepEqual(migrateProfile(null), defaultProfile);
  const fromV2 = migrateProfile({
    ...defaultProfile,
    version: 2,
    watch: "crypto",
    risk: "comfortable",
    interests: undefined,
    lossTolerance: undefined,
    income: undefined,
  });
  assert.equal(fromV2.version, 3);
  assert.deepEqual(fromV2.interests, ["crypto", "broad-funds"]);
  assert.equal(fromV2.lossTolerance, 40);
  assert.equal(fromV2.income, "unknown");
  assert.equal(
    profileSchema.safeParse({ ...defaultProfile, amount: -10 }).success,
    false,
  );
});
test("unknown circumstances prompt context rather than a suitability claim", () => {
  assert.match(nextStep(defaultProfile), /time frame/);
  assert.match(
    nextStep({
      ...defaultProfile,
      intent: "choose",
      horizon: "future",
      lossTolerance: 20,
    }),
    /finances/,
  );
  assert.match(
    nextStep({
      ...defaultProfile,
      intent: "choose",
      horizon: "future",
      lossTolerance: 20,
      amount: 1000,
      emergency: "no",
      debt: "no",
    }),
    /cash needs/,
  );
});
test("demo history stays explicitly marked and dates are unique", () => {
  const demo = dashboardSchema.parse(sampleDashboard());
  assert.equal(demo.sample, true);
  for (const asset of demo.assets) {
    assert.equal(
      new Set(asset.history.map((p) => p.date)).size,
      asset.history.length,
    );
    assert.equal(asset.evidence.length, 0);
  }
});
