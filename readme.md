# Keel

An investing companion for beginners. Keel helps users set a goal, explore dated market history, compare options, and understand hypothetical price drops with an animated guide.

## Run locally

Use the existing **keel** project on team **vaidik-bhardwaj-f936a**. Follow [.agents/skills/convex-prod-on-push/SKILL.md](.agents/skills/convex-prod-on-push/SKILL.md) for the complete setup.

```bash
bun install
bunx convex login
bunx convex deployment select local
bun run dev:backend
```

Keep the backend running. In a second terminal:

```bash
bun run dev
```

Open the URL printed by Next.js. `/` contains onboarding; `/dashboard` is the saved user's workspace; `/dashboard?demo=1` is an explicitly illustrative example with no paid generation calls.

Never copy another developer's `.env.local`, commit `.convex/`, or put a production deploy key on a laptop. Each local deployment has its own data.

## Configuration

See [.env.example](.env.example). All provider credentials stay server-side.

- `NEXT_PUBLIC_CONVEX_URL`: local Convex URL created during setup.
- `AI_GATEWAY_API_KEY`: enables new Keel explanations and questions. Without it, charts, scenarios and prepared local explanations remain usable.
- `FINNHUB_API_KEY`: optional dated company news.
- `SEC_USER_AGENT`: your valid contact string for optional SEC company facts.
- `COINGECKO_API_KEY`: optional key for Bitcoin history.

US security history comes from Yahoo Finance and selected crypto assets history from CoinGecko. Unavailable providers produce missing-data states, never fabricated history. The collection is intentionally limited to selected US securities and selected crypto assets. Scenario currency does not convert market data from USD.

## Experience and implementation

- Adaptive onboarding: five core steps; three additional readiness questions when exploring investments for the user. Draft progress stays in this browser until saved to Convex.
- Explorer: selectable date ranges, keyboard/touch scrubbing, comparisons over shared dates, and a text table alternative.
- Scenarios: amount and percentage controls calculated in code, labeled hypothetical.
- Keel: animated character states, chart pointing, contextual guidance, pause/minimize and reduced-motion support.
- Saved options and conversation are stored in Convex. Existing profiles remain readable; newly needed fields are unknown until supplied.
- Generation budget: at most five attempts per conversation, including up to two initial explanations. Atomic reservation prevents concurrent overspend; request IDs deduplicate transport retries. New conversations have a 15-minute cooldown. Failed attempts consume budget but never become successful answers.
- Model output is validated text plus an allowlisted interface action and source URLs. Models do not calculate portfolio values or execute code. Guidance focuses on grounded comparisons and asks for missing context before suggesting a personalized direction.

See [design.md](design.md) and [docs/experience-revamp-plan.md](docs/experience-revamp-plan.md) for the design rules and original plan.

## Checks

```bash
bun test
bun run lint
bun run typecheck
bun run build
```

With local Convex running, `bun scripts/verify-local.ts` verifies profile/cache persistence, concurrent budgeting, duplicate requests, cooldown, saved options and stale-revision protection. It refuses non-local URLs and creates a disposable verification profile.

Key files:

- `components/onboarding/Onboarding.tsx`: guided questions and editable summary.
- `components/dashboard/Spread.tsx`: dashboard workspace and companion conversation.
- `components/dashboard/PriceChart.tsx`: date-aligned interactive charts.
- `lib/dashboard/model.ts`: schemas and deterministic calculations.
- `lib/dashboard/sources/`: dated observations and source evidence.
- `app/api/spread/route.ts`: facts-only dashboard assembly and cache refresh.
- `app/api/keel-ask/route.ts`: grounded explanations with structured actions.
- `convex/profiles.ts`: backward-compatible profiles, bookmarks and atomic generation state.

## Production

A push to `main` deploys Convex production through the existing GitHub Action using the configured repository secret. A commit alone does not deploy. Never run `convex deploy` unless explicitly asked to push production from this machine.

Vercel hosts the frontend. Production needs `NEXT_PUBLIC_CONVEX_URL=https://youthful-manatee-537.convex.cloud` on one line, followed by a redeploy. Never put the production deploy key in Preview environments. Local verification does not deploy either service.
