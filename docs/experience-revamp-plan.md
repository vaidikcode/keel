# Keel onboarding and dashboard revamp

Status: proposed plan, 12 September 2026. No application changes made.

## Product outcome

A first-time investor should understand what Keel does, answer questions without knowing finance terminology, and arrive at a dashboard that makes one useful next step obvious. Keel should feel like a patient, curious companion helping someone explore their options. The main experience is a chart and guided interaction, with details available on demand.

Scope: welcome, onboarding, dashboard, asset comparison, mascot, conversation, source handling, profile persistence and all associated loading/error/empty states. Account linking, brokerage execution and a full portfolio tracker are separate projects. Never imply we know a user's holdings or income unless they have supplied them.

## Findings from the existing code

- `lib/onboarding/questions.ts` asks “Where does the noise hit you?”, “How jumpy can you sleep?” and “What turns into soup?”. These metaphors require users to learn the product's vocabulary before using it.
- The five saved answers cover asset preference, information source, risk preference, confusing topics and intent. There is no goal, time horizon, country, currency, contribution amount or financial readiness information.
- `components/dashboard/Spread.tsx` presents Feed/Filing/Sleep/Twin panes. The chart is a small, unlabelled normalized pulse. The UI exposes implementation language such as “Canned pack” and “No extra model calls”.
- `KeelMascot.tsx` is a circular K with a small positional shift and a status message. There is no character animation, contextual anchoring or conversational memory.
- `universe.ts` selects three assets from a fixed US stock/fund and crypto collection; selection is mostly category and information-source driven. This is not a personalized investment search.
- `gather.ts` can mix fetched facts with seeded risk numbers and synthetic chart values without field-level provenance. A dollar sign is used by the UI as a proxy for a live quote.
- `/api/keel-ask` provides one saved answer per asset and can return that old answer for a different question. Its prompt lacks the complete user profile and historical conversation. Client and API both attempt to save the reply.
- `/api/spread` has a 15-minute cache, but the dashboard skips requesting a refresh whenever any saved spread exists.
- `design.md` encourages oversized display type, six strong surface colors and decorative outlines. Rewrite its product guidance as part of this revamp so it does not recreate the current problems.

## Design direction

Domain: goals, contributions, time, price changes, diversification, evidence and a steady course. The Keel name suggests a small companion that helps someone stay oriented.

Color world: sailcloth ivory, deep ocean ink, harbor blue, sea-glass green, buoy amber and muted coral. Use ivory and ink for reading, blue for selections, green/amber/coral only when their meaning is explicit. Use quiet surface changes and a consistent four-pixel spacing scale. Preserve readable body typography; large numbers belong to the selected chart, not decorative slogans.

Signature: **Keel follows the question.** A small animated blue creature shaped like a rounded boat hull, with expressive eyes and tiny fins, docks beside the relevant chart or control. A short speech bubble and a highlighted data point connect its words to evidence.

Replace the obvious defaults:

1. Equal-sized metric-card grid → one large interactive comparison canvas and a compact next-step area.
2. Floating chatbot detached from the page → a companion anchored to the selected question, with persistent conversation available from its dock.
3. Colorful finance jargon and decoration → plain labels, quiet surfaces, explicit chart annotations and selective character motion.

The signature appears in welcome, onboarding help, chart annotations, comparison and recovery from missing data. Desktop uses an open canvas; mobile stacks the same tasks and keeps Keel in a bottom dock that does not cover controls.

## Onboarding

Welcome: “Understand your options. Take your next step.” Keel says: “I'll ask a few questions so I can explain what matters to you.” CTA: “Let's start”. Secondary: “Explore an example”, clearly marked as sample data throughout.

One question per screen, a visible step count, Back and Continue. No automatic advance. Save progress and let users edit answers later. “I'm not sure” is a valid answer, not silently converted to a risk profile. Use currency-aware examples and short optional “Why we ask” explanations.

Five core screens:

1. **“What would you like help with?”** Learn the basics / Choose investments / Understand something I already own. Help: “You can change this later.”
2. **“What are you saving or investing for?”** A future purchase / Long-term savings / Retirement / Just exploring. Selection opens a simple time control: “When might you need this money?” Within a year / 1–3 years / 3–5 years / More than 5 years / Not sure.
3. **“Where do you live?”** Country and preferred display currency. Explain available market coverage. The current data covers selected US securities and crypto; choosing another currency must not imply local investment availability or silently convert USD prices without exchange-rate data.
4. **“Have you invested before?”** Never / A little / Regularly. Optional interest choices have definitions: “Stocks — part of one company”; “Funds — a collection of investments”; “Crypto — digital assets”; “Help me explore”.
5. **“How would you feel if your investment fell 20%?”** Show an amount decreasing visually. Very uncomfortable / Concerned, but able to wait / Comfortable with large changes / Not sure. Explain that this helps tailor comparisons; it is not a complete suitability assessment.

For “Choose investments”, ask a short additional readiness sequence before personalized suggestions: amount available, recurring contribution if any, money reserved for unexpected costs, expensive debt and near-term cash needs. Allow private/unknown answers; explain exactly which missing answer prevents a useful recommendation. Other users reach the dashboard directly and can answer later when relevant.

End with an editable summary: “You're exploring [goal] over [time]. You prefer [risk preference].” CTA: “See my options”. Avoid fake progress promises or forcing novices to pick an investment category before learning what it means.

## Dashboard and interactions

Navigation: Overview / Explore / Saved, with preferences available from the profile control. No invented portfolio value or performance for users who have not entered holdings.

First screen hierarchy:

1. A concise goal heading and one next step, such as “Compare options for your goal” or “Set a time frame to get more useful suggestions”. Keel offers two or three relevant actions.
2. A large chart with a selected investment and an optional comparator. Names are actual security names plus tickers, not “A story stock”.
3. A compact explanation: why this option is being shown, its main tradeoff and the evidence timestamp.
4. Secondary sections for saved comparisons and current news, revealed below or on demand.

Primary chart modes:

- **Price history:** dated source-backed series, visible units, supported date ranges and pointer/touch/keyboard scrubbing. Keel explains selected points only when the available evidence supports the explanation; temporal coincidence must not become an invented causal claim.
- **Compare:** up to three options on a common date window and normalized starting amount. Identify price-only versus total-return data, currency and whether dividends/fees are included. Missing comparison history means an unavailable state, not a synthetic line.
- **What if prices fell?:** a user-controlled hypothetical drop and amount. The result changes instantly. Label it as a scenario, not a forecast or likelihood estimate. If contributions or long-term growth are added, expose the assumptions and calculate them in code.

“Why this option?” expands into goal fit, time horizon, risks, costs when available and dated source links. Avoid invented match percentages. “Compare another option” searches only the supported universe and names the coverage limit.

Aim for 60–70% of the primary desktop workspace to be visual. Keep main explanations to a sentence and action labels to a few words. Charts retain axes, units and essential qualifications; reducing words must not remove meaning.

## Copy replacements

| Current | Proposed |
| --- | --- |
| Feed vs filing | News and facts |
| Sleep / sleep chip | Price changes / your comfort with risk |
| Boring twin | Compare another option |
| What turns into soup? | What would you like explained? |
| Park it | Explore options for money you may need soon |
| Keel packed / Canned pack | Remove from primary UI; show actual data status |
| Opening the spread | Opening your dashboard |
| Could not pack the board | We couldn't load your dashboard |
| Restart | Edit your answers |
| No extra model calls | Remove |

Apply this language to prompts, fallback text, validation, errors, empty states and existing saved-content rendering as well as visible headings.

## Mascot behavior

Create a lightweight SVG character with idle, greeting, thinking, explaining, pointing, questioning and unavailable states. Animate eye direction, fins and position with short purposeful movements. No audio by default, no endless bouncing, no celebrations of speculative gains.

- During onboarding: reacts to selection; answers “What does this mean?” without advancing the step.
- On arrival: points to one suggested next step.
- On chart interaction: docks next to the relevant panel and highlights the selected point; keeps chat out of the plotting area.
- On comparison: draws attention to a documented difference and asks whether the user wants more detail.
- On missing context: asks one useful question and offers buttons to answer it.
- On unavailable data: states what is missing and offers Retry or another supported option.

Users can minimize the mascot and pause movement. Reduced-motion mode uses a fixed dock and static highlights. Preserve keyboard focus, accessible chat history, touch targets and readable chart alternatives. Do not announce every scrubbing event through a live region.

The assistant returns structured text, source IDs and allowlisted UI actions such as highlightSeries, openComparison, focusQuestion and showScenario. Validate actions and asset IDs before applying them. The model never emits executable code or directly manipulates arbitrary UI state.

## AI and data architecture

Interpret the requested allowance as **up to five generation calls per dashboard session**, with the exact session boundary explicit in backend state:

1. Initial explanation of the verified facts and supported options.
2. Personalized next-step synthesis using that explanation, the profile and deterministic constraints.
3–5. User-requested follow-ups carrying recent conversation and the current chart/comparison selection.

Render facts and charts before generation completes; calls 1 and 2 are dependent but neither blocks navigation. Only run the second call when enough profile data exists. Reuse cached preparation so unused capacity remains available to follow-ups. Chart gestures, arithmetic, animations and already-prepared explanations use no calls. Do not automatically launch five calls just because the dashboard opened.

Store session budget, attempts and request IDs server-side; reserve atomically to prevent concurrent overspend and deduplicate retries. Remounting, switching assets or opening another tab must not reset the allowance. After the budget is used, keep charts and prepared guidance working and offer “Start a new conversation”; avoid an unexplained disabled input. This interaction starts a new explicit budget window subject to server rate limits. Failed responses must not be stored as successful answers; transport retries must not accidentally duplicate a generation.

Keep arithmetic, historical metrics, eligibility filters and source timestamps outside the model. Recommendations use the complete available context, including uncertainty, not only the last asset summary. Return reasons, tradeoffs, missing context and source references. Do not call an asset suitable from a single comfort-with-risk answer. Establish the supported countries and investment-recommendation product boundary before enabling country-specific recommendations; the first version can provide grounded comparisons with clear next steps.

Preserve dated market observations, prices, source URLs, retrieval times, freshness and availability at field level. Attach facts by stable asset ID rather than array order. Remove fabricated series and seeded numbers from live views. Sample data is a separate mode; unavailable live data is honestly unavailable. Verify asset metadata and descriptions against primary sources before release.

Replace the one-answer-per-asset structure with a conversation record containing turns, context, cited facts and optional UI actions. Write a reply once on the server. Persist a versioned profile, onboarding progress and selected goal; migrate old answers conservatively and ask for newly required information without erasing previous choices.

Cache by profile version, evidence version and relevant dashboard context. Implement actual stale refresh on entry and retry in place. Add bounded source timeouts and per-panel recovery so one provider cannot blank the entire dashboard.

## Implementation sequence

1. **Experience prototype:** rewrite the welcome and question script, create the mascot model sheet, and build a clickable onboarding → dashboard → compare → ask journey with explicit sample data. Check comprehension before polishing animation.
2. **Profile and source foundation:** version the profile, add missing inputs and migration, preserve timestamps/provenance and real historical series, define coverage and replace fake fallback values.
3. **Onboarding:** ship the adaptive questions, resumable progress, examples and editable summary.
4. **Dashboard:** replace Spread with focused components for the overview, chart explorer, comparison, evidence and scenario controls; add mobile layouts and data states.
5. **Companion and AI:** implement the animation states, validated UI actions, two preparation stages, three follow-ups, conversation persistence and atomic budget handling.
6. **Verification and polish:** test complete journeys and failure cases; update design.md and document the new component/copy rules.

Main existing touchpoints: `lib/onboarding/questions.ts`, `components/onboarding/Onboarding.tsx`, `app/dashboard/page.tsx`, `components/dashboard/Spread.tsx`, `components/dashboard/KeelMascot.tsx`, `app/globals.css`, `lib/dashboard/pack.ts`, `lib/dashboard/universe.ts`, `lib/dashboard/sources/*`, `app/api/spread/route.ts`, `app/api/keel-ask/route.ts`, `convex/schema.ts`, `convex/profiles.ts` and `design.md`.

Before implementation, read the installed Next.js guides and applicable Convex rules. Develop against the authorized local backend. This plan does not authorize a production push or deploy.

## Acceptance criteria

- In a small test with five first-time investors, at least four can explain Keel's purpose, answer the core questions and identify a next step without coaching. Treat this as an initial usability check, not statistical proof.
- Each participant can find a source, distinguish historical data from a hypothetical scenario, and explain the main comparison in their own words.
- No primary label depends on “sleep”, “twin”, “spread”, “pack”, “noise” or “fog”.
- Every visible chart point and financial figure has a known source or an explicit scenario/sample status. No synthetic price history in live mode.
- No personalized suggestion when required financial context is missing; Keel asks the next relevant question instead.
- Chart interaction remains responsive while the model or a provider is slow. A failed answer does not erase the conversation or disable chart use.
- Five-call budgeting holds under duplicate submissions, concurrent requests and tab reloads. A new question never receives an unrelated cached answer.
- Existing profiles load through migration; changing answers invalidates affected guidance; stale data refreshes without onboarding restart.
- Keyboard-only use, touch at narrow widths, reduced motion, chart text alternatives and minimized-mascot behavior work through the entire journey.
- Run lint/type/build checks plus focused tests for calculations, provenance, migrations, budget concurrency and conversation behavior. Verify the full first-visit and returning-user flows in a browser against local Convex.
