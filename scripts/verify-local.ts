import assert from "node:assert/strict";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { defaultProfile } from "../lib/onboarding/questions";
import { dashboardSchema } from "../lib/dashboard/model";
import { sampleDashboard } from "../lib/dashboard/catalog";
const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url || !/^http:\/\/(localhost|127\.0\.0\.1):3210\/?$/.test(url))
  throw new Error("Verification only runs against the local backend on 3210.");
const client = new ConvexHttpClient(url);
const sessionId = `verify-${crypto.randomUUID()}`;
await client.mutation(api.profiles.saveExperience, {
  sessionId,
  profile: defaultProfile,
});
let p = await client.query(api.profiles.getBySession, { sessionId });
assert.equal(p?.profileV2?.version, 2);
const revision = p!.revision!;
assert.equal(
  await client.mutation(api.profiles.saveDashboard, {
    sessionId,
    revision,
    dashboard: dashboardSchema.parse(sampleDashboard()),
  }),
  true,
);
const results = await Promise.all(
  Array.from({ length: 8 }, (_, i) =>
    client.mutation(api.profiles.reserveGeneration, {
      sessionId,
      revision,
      requestId: `q-${i}`,
    }),
  ),
);
assert.equal(
  results.filter((r) => r.status === "reserved").length,
  8,
  "questions are not capped; concurrent reservations must all succeed",
);
const first = results.findIndex((r) => r.status === "reserved");
const duplicate = await client.mutation(api.profiles.reserveGeneration, {
  sessionId,
  revision,
  requestId: `q-${first}`,
});
assert.equal(duplicate.status, "duplicate");
await client.mutation(api.profiles.finishGeneration, {
  sessionId,
  revision,
  requestId: `q-${first}`,
  turn: {
    id: `q-${first}`,
    question: "What is risk?",
    reply: "Price changes can reduce your investment's value.",
    action: "scenario",
    sourceIds: [],
  },
});
assert.equal(
  await client.mutation(api.profiles.finishGeneration, {
    sessionId,
    revision,
    requestId: `q-${first}`,
    turn: null,
  }),
  false,
  "a completed answer cannot be overwritten",
);
p = await client.query(api.profiles.getBySession, { sessionId });
assert.equal(p!.conversation!.length, 1);
assert.equal(
  await client.mutation(api.profiles.newConversation, { sessionId }),
  true,
  "a new conversation can start without a cooldown",
);
p = await client.query(api.profiles.getBySession, { sessionId });
assert.equal(p!.conversation!.length, 0);
assert.deepEqual(
  await client.mutation(api.profiles.toggleSaved, {
    sessionId,
    assetId: "vti",
  }),
  ["vti"],
);
assert.deepEqual(
  await client.mutation(api.profiles.toggleSaved, {
    sessionId,
    assetId: "vti",
  }),
  [],
);
await client.mutation(api.profiles.saveExperience, {
  sessionId,
  profile: { ...defaultProfile, horizon: "future" },
});
p = await client.query(api.profiles.getBySession, { sessionId });
assert.equal(
  p!.dashboard,
  undefined,
  "edited answers invalidate evidence cache",
);
assert.equal(
  p!.generation!.requests.length,
  0,
  "a new conversation clears generation tracking",
);
assert.equal(
  await client.mutation(api.profiles.saveDashboard, {
    sessionId,
    revision,
    dashboard: dashboardSchema.parse(sampleDashboard()),
  }),
  false,
  "stale work must not overwrite a newer profile",
);
console.log(
  "PASS: local schema, profile persistence, unbounded reservations, deduplication, conversation writes, conversation reset, bookmarks and stale-revision protection.",
);
