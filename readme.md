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

Open the URL printed by Next.js. `/` contains onboarding; `/dashboard` is the saved user's workspace; `/dashboard?demo=1` is an explicitly illustrative example with made-up prices.

Keel was a hackathon project. Live LLM calls were removed to reduce cost, so questions, thoughts, and tab analysis now return canned demo replies. There is no sign-in.

Never copy another developer's `.env.local`, commit `.convex/`, or put a production deploy key on a laptop. Each local deployment has its own data.

## Configuration

See [.env.example](.env.example). All provider credentials stay server-side.

- `NEXT_PUBLIC_CONVEX_URL`: local Convex URL created during setup.
- `TAVILY_API_KEY`: optional web search for recent facts per category and asset. Without it, fact sections are empty and responses carry a `tavily:off` warning.
- `FINNHUB_API_KEY`: optional company profiles (market value) and dated company news.
- `SEC_USER_AGENT`: your valid contact string for SEC company facts. Ticker to CIK mapping is looked up from SEC's public list and cached for a week.
- `COINGECKO_API_KEY`: optional demo key for crypto market data.

Daily price history for every asset in a category comes from one batched Yahoo Finance call (with a per-symbol fallback), crypto market data from one CoinGecko call, and company size from Finnhub. Snapshots are cached in Convex and shared by every user for 45 minutes (3 hours outside US market hours). Unavailable providers produce missing-data states, never fabricated history.

## Experience and implementation

- Onboarding: eleven short steps. Every answer feeds either category selection (`lib/market/select.ts`) or the capacity score (`lib/market/fit.ts`). Finishing opens the dashboard on the first chosen category.
- Categories: seven curated universes of 10–12 assets each in `lib/market/categories.ts`.
- Risk score (0–100, `lib/market/risk.ts`): volatility, largest drawdown, downside deviation, worst 30 days, beta to VOO, size and concentration, with documented weights. Fit compares an asset's risk with the person's capacity and penalises too-risky harder than too-calm. Ranking is by fit.
- Dashboard (`/dashboard/[categoryId]`): category sidebar, "Keel's thoughts" hero with because-you-said chips and cited sources, Netflix-style ranked cards with a minimal hover/focus overlay, recent facts, and a trending strip.
- Asset page (`/asset/[id]`): price chart, risk explained with meters, a loss scenario seeded from the person's answers, filings and news with links, and rule-based next steps.
- Keel overlay: a floating companion on every post-onboarding page. Drag any card onto it (or use "Ask Keel" on the card) to attach that asset as context; asset pages attach themselves automatically.
- Saved options and conversation are stored in Convex. Request IDs deduplicate transport retries; concurrent category refreshes are serialised with a lock.
