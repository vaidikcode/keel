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

The blue rounded character has expressive eyes and fins. Keel greets, points, thinks and asks questions. Motion is purposeful and triggered by interactions. Pause controls and reduced-motion preferences disable motion. Never cover chart controls or require motion to understand a message.

On desktop Keel occupies a contextual side dock; at narrow widths the companion follows the chart in the document flow. A small companion can point to the chart selection. The full conversation remains available and can be minimized.

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
