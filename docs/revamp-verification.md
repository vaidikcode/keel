# Keel revamp verification

Verified locally on 12 September 2026. No production push or deployment was performed.

## Automated checks

- Production build: passes.
- ESLint and TypeScript: pass.
- Six focused unit tests: pass (historical drawdown, date alignment, scenario arithmetic, legacy migration, missing-context guidance, isolated sample data).
- Local Convex integration: passes (profile persistence, dashboard cache, atomic five-attempt limit under eight concurrent requests, request deduplication, single completion, conversation persistence, cooldown, saved options and stale-revision rejection).

## Browser checks

The existing local Keel server was running at localhost:3002 with Convex on localhost:3210.

- Welcome and example dashboard render without a framework error.
- Completed the eight-step personalized path using synthetic test answers.
- Country selection changes scenario currency; market prices remain explicitly USD.
- Reloading the amount step restores both progress and entered values.
- Saved summary leads to the live dashboard without repeating onboarding.
- Real dated market history and news load. Initial AI guidance was observed successfully.
- Comparison controls and date-range controls render and respond.
- Scenario: a 25% drop from 2,000 produces a 500 decrease and 1,500 remainder.
- Saved investment appears in the Saved view.
- Source panel shows official links and observation dates.
- Pause control updates the motion state.
- At 390px, the page has no horizontal overflow.
- Stubbed follow-up: response appears in conversation and its validated compare action opens comparison controls.
- Browser-aborted follow-up: the error is shown and the user's typed question remains available.

## Verification boundaries

Automatic approval review rejected an additional live follow-up test because it treated the synthetic onboarding fields as sensitive data going to the configured AI Gateway. That rejected request did not run. Follow-up UI success and transport-failure behavior were instead verified using a browser-local response stub and a browser-level request abort; those tests sent nothing to the model.

This is engineering and browser verification, not the five-person novice usability study proposed in the plan. External provider coverage and availability can vary; unavailable data remains visibly missing rather than being filled with illustrative prices.
