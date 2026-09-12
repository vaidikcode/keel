import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_ASSET_IDS, CATEGORIES, categoryOf, isCategoryId } from "../lib/market/categories";
import { selectCategories } from "../lib/market/select";
import { capacityFor } from "../lib/market/fit";
import { defaultProfile } from "../lib/onboarding/questions";
import { actionItems } from "../lib/market/actionItems";

test("seven categories, 8-12 assets each, ids unique", () => {
  assert.equal(CATEGORIES.length, 7);
  for (const c of CATEGORIES) assert.ok(c.assets.length >= 8 && c.assets.length <= 12, c.id);
  assert.equal(new Set(ALL_ASSET_IDS).size, ALL_ASSET_IDS.length);
  for (const id of ["vti", "voo", "bnd", "aapl", "nvda", "btc", "jnj", "tsla", "sgov", "eth", "doge", "sol"])
    assert.ok(ALL_ASSET_IDS.includes(id), id);
});
test("crypto assets carry coin ids and USD pairs; every url is https", () => {
  for (const c of CATEGORIES)
    for (const a of c.assets) {
      assert.match(a.url, /^https:\/\//, a.id);
      if (a.kind === "crypto") {
        assert.ok(a.coinId, a.id);
        assert.match(a.yahooSymbol, /-USD$/);
      }
    }
  assert.equal(categoryOf("btc")?.id, "crypto");
  assert.ok(isCategoryId("growth-tech"));
  assert.ok(!isCategoryId("nope"));
});
test("category selection follows interests and never auto-adds crypto", () => {
  const cap = capacityFor(defaultProfile);
  const none = selectCategories(defaultProfile, cap);
  assert.deepEqual(none.slice(0, 3), ["broad-funds", "bond-cash", "large-stable"]);
  const cryptoFirst = selectCategories({ ...defaultProfile, interests: ["crypto"], risk: "comfortable", lossTolerance: 40, horizon: "future", emergency: "yes", debt: "no", income: "stable", experience: "experienced" }, capacityFor({ ...defaultProfile, risk: "comfortable", lossTolerance: 40, horizon: "future", emergency: "yes", debt: "no", income: "stable", experience: "experienced" }));
  assert.equal(cryptoFirst[0], "crypto");
  assert.ok(cryptoFirst.includes("broad-funds"));
  assert.ok(!cryptoFirst.includes("bond-cash"));
  const uk = selectCategories({ ...defaultProfile, interests: ["dividend"], country: "GB" }, cap);
  assert.ok(uk.includes("international"));
  assert.ok(!uk.includes("crypto"));
  assert.ok(uk.length <= 5);
});
test("action items are 3-5 rule-driven, non-advice items", () => {
  const crypto = CATEGORIES.find((c) => c.id === "crypto")!;
  const items = actionItems({ asset: crypto.assets[0], category: crypto, profile: { ...defaultProfile, emergency: "no" }, risk: null });
  assert.ok(items.length >= 3 && items.length <= 5);
  assert.ok(items.some((i) => i.id === "custody"));
  assert.equal(items[0].id, "cash-first");
  for (const i of items) assert.doesNotMatch(i.detail, /\bbuy now\b|\bsell now\b/i);
});
