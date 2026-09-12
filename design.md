# Keel product design

Keel helps first-time investors understand their options and find one useful next step. All product language must work without knowing finance jargon. This replaces the former sticker-collage and Feed/Filing/Sleep/Twin guidance.

## Visual system

- Intent: patient, curious and approachable; a person can explore without feeling rushed to invest.
- Canvas: warm ivory (#f7f8f4). Text: ocean ink (#183446). Selection/action: harbor blue (#3779cf / #205daa). Sea-glass green (#488b73), amber (#b1813b) and coral (#b66050) have explicit semantic roles.
- Surfaces: quiet white panels with subtle separators; do not give every panel a different accent color.
- Typography: Outfit at 400–600 for readable interfaces. Use tabular numbers for financial values. Georgia italic is a restrained accent in the welcome message only.
- Spacing: 4px base, with comfortable primary spacing and a large chart canvas. Border radius: 8–14px on controls and panels.
- Hierarchy: goal → one next step → interactive chart → short explanation → evidence on demand. Avoid equal-sized metric grids.

## Keel

The blue rounded character has expressive eyes and fins. Keel greets, points, thinks and asks questions. Motion is purposeful: mostly triggered by interaction, with the one exception that welcome stickers animate in once after load. Pause controls and reduced-motion preferences disable motion. Never cover chart controls or require motion to understand a message.

On desktop Keel occupies a contextual side dock; at narrow widths the companion follows the chart in the document flow. A small companion can point to the chart selection. The full conversation remains available and can be minimized.

## Play layer

The palette stays calm; the interaction carries the personality. Colour is never the thing that makes a control feel alive — movement and depth are. Nothing here may be the only way to reach information.

- **Choice cards turn like a block, not a page.** A choice is a rounded rectangle (12px), not a pill. It is two faces of a cube **90deg apart**, never the front and back of a flat plane: the label sits on the front face at `translateZ(h/2)`, and the explanation is the cube's *underside* at `rotateX(-90deg) translateZ(h/2)`, edge-on and invisible at rest. Hovering rotates the box `rotateX(90deg)` — the label tips up and away as the underside rises into view. Face is harbor-deep (#205daa) on white text; underside is harbor-wash (#edf4fc) on ink. The faces must share a fixed height or the cube stops being a cube.
- **The extrusion is the socket, not the card.** The hard #183446 block sits on the outer button and never rotates, so the cube turns inside a fixed shell.
- **The underside is never the only copy.** Under `@media (hover: none)` and `prefers-reduced-motion` the same sentence renders inline beneath the card. Hover is an enhancement, not a gate.
- **Selection survives the colour.** Because every face is blue, a chosen card needs its own signal: a filled check plus a 2px ink ring, not a colour change.
- **The mark is a large circle, top left,** with the Demo button beside it. Everything else in that bar sits centred in its own column, so moving the mark never drags the rest along. A stamped badge on its own extrusion, sized to be seen rather than tucked away. It is positioned out of flow so moving it never shifts the content. A stamped badge on its own extrusion, sized to be seen rather than tucked away. It is positioned out of flow so moving it never shifts the content.
- **The mark does not spin.** It presses like every other control here — down onto its extrusion on hover, further on active. One physical vocabulary across the page beats a special case for the logo.
- **Stickers are pasted, not faded in.** A `clip-path` fold sweeps from the top-right to the bottom-left and **stops short at 22%**, leaving that corner permanently lifted — a hard ink fold line with the flap's underside showing. Hovering lifts it further.
- **The flap is the sticker's own back and moves with the fold.** A crease that travels while its folded-back face stays put is the single thing that stops a peel reading as a wipe: the flap is sized in the same percentages as the clip so their diagonals always coincide, and being a child of the clipped card it can only ever show on the stuck side of the crease. It shades bright at the fold and falls away darker, the way paper does when it curls.
- **Peeling is not the paste played backwards.** A click runs the same diagonal the other way to about 60%, then the sticker detaches and re-pastes somewhere else. Rewinding the whole animation reads as scrubbing a video; stopping short and letting it come away reads as handling a sticker.
- **Never in lockstep.** Each sticker gets its own random wait and duration, generated after mount so the timings stay out of the server's markup. Order and pace differ on every load. They can still be dragged anywhere and left there; placement is per-browser and cosmetic, so it belongs in localStorage, never the profile.
- **Display type is brutalist.** Antonio 700, uppercase, tight tracking and sub-1.0 leading for the welcome headline and question titles, against Outfit for everything else. Georgia italic stays the single restrained accent in the welcome message.
- **Primary actions press into the page.** 2px ink border and a 4px extrusion that collapses as the button is pushed down on hover and active.
- **The mark stands alone.** No wordmark text beside it and no marquee strip; the header stays quiet so the page can be loud.
- **The primary CTA carries a rocket.** It sits to the **right of the label**, nose level and pointing right. Hovering swings the nose **left** and tightens the shake, so the press reads as releasing something wound up; clicking recoils it and sends it out through the button's right-hand edge. Write `translate()` before `rotate()` in those keyframes — rotate first and the travel happens in the rotated frame, so the rocket leaves sideways. Navigation waits for the launch so the action reads as its cause. Under reduced motion it simply navigates.
- **Easing is exponential, not linear-ish.** `--ease-expo-out` for anything arriving, `--ease-expo-in` for anything leaving, `--ease-expo-in-out` for anything doing both. Movement should start or stop decisively and settle slowly; the default browser curves make everything feel mechanical.
- **Motion is always optional.** Every effect above no-ops under `prefers-reduced-motion` and `.motion-paused`. Dragging still works without animation.

## Accounts

Signing up happens inside **Get started**, not as a separate invitation: pressing it sends someone without an account to sign-up with a `redirect_url` back to `/?start=1`, and that parameter opens the questions immediately rather than making them press the button a second time. There is no standalone sign-in control competing with it. Answers are keyed to the account once there is one, and fall back to the browser session until then.

Clerk's components are themed through its `appearance` prop, never by styling its `.cl-*` classes from our stylesheet. Those classes track Clerk's internal DOM and break silently when it ships an update — Clerk warns about this at runtime. The element keys are the supported API; the values are our own class names.

## Question view

A question gets the screen to itself. No sidebar, no step list, no companion panel beside it — those competed with the only thing being asked. Progress moves to a fixed rail at the foot of the window, where Keel rides the fill as the indicator and the count sits at the end.

After the last question the answers are shown as a summary, every row a button that jumps back to the step that set it. Nothing is final; editing is the expected path, not a recovery path.

A saved draft restores the **answers but never the step**. Dropping a returning visitor into the middle of a half-remembered form skips the page that explains what they are doing; they land on the welcome screen and their answers are still waiting.

Avoid `filter` on the mascot while it animates — rasterising an SVG of that complexity on every repaint stalls the compositor.

## Onboarding intake

Five fixed questions, identical for every user: what they invest in, their time scale, where they are, how much per period, and risk tolerance. Nothing branches — a comparable answer set is what makes personalisation possible later. The amount question interpolates its wording from the first two answers ("per day ... in crypto").

Answers are stored as `intake` and reduced to a typed `signals` object by `lib/onboarding/signals.ts`. Consumers read `signals`; they never re-derive meaning from question wording. Internal inference — income share caps, volatility tolerance, exposure flags — stays out of the interface.

Risk options are never ranked or discouraged. The highest-exposure option is freely selectable and says plainly on its underside that markets always carry risk and very low is not zero. Keel states consequences; it does not withhold choices or judge them.

## Language

Use “Price history”, “Compare”, “What if?”, “News and facts”, “Edit your answers” and “Check the sources”. Avoid “spread”, “pack”, “sleep chip”, “noise”, “boring twin” and model-call implementation details in active product UI. Explain terms where they are used. Technical failures get an understandable retry path.

## Data and comparisons

- Live data never falls back to made-up history or seeded risk figures.
- Sample mode must be labeled at page and chart level, with no factual performance claims.
- Use common dates for comparisons, explicit units, visible source dates and USD labels. A preferred scenario currency does not convert market prices.
- Historical price comparisons exclude dividends, fees and taxes unless explicitly supported by the provider.
- Scenarios are calculated in code and labeled hypothetical, never presented as forecasts.
- Missing profile context triggers a useful question, never a fabricated suitability score.

## Verification

Check a first-time journey, returning profile, comparison, scenario, saved item, chat error and source panel. Check mobile at 390px, keyboard chart scrubbing, reduced motion and missing providers. Keep budgeting and persistence tests independent of paid model generation.
