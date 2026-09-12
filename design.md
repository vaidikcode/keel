---
name: slush-design-system
description: >-
  Slush visual design language — inflatable sticker universe on pastel paper.
  Use when building or styling any UI, landing page, component, or marketing
  surface: colors, typography (Lateral display + Aeonik Pro), spacing, radii,
  components, do's/don'ts, and ready-to-paste CSS custom properties / Tailwind
  v4 theme. Invoke whenever asked to design, theme, restyle, or lay out a
  screen in the Slush look.
---

# Slush — Design System Skill

> Inflatable sticker universe on pastel paper. **Theme: light.**

Slush runs on a sticker-book logic: pastel paper canvas, huge inflated 3D ribbons
in electric blue, and a full rainbow of vivid sticker accents scattered like
confetti. Display type is enormous and crushed (Lateral 800 at 200–640px,
line-height 0.75–0.80) so the words become sculptural objects, not sentences. The
six saturated brand colors function as a shared sticker palette — every color
appears as a filled sticker, a card surface, or a decorative wash, never as a
restrained accent. Components are rounded to the point of softness (20–40px on
cards, pill-shaped on nav) and outlined in black for a hand-cut feel. The result
reads less like a fintech landing page and more like a physical collage pinned to
a pale wall.

## How to use this skill

When styling a Slush surface, in order:

1. **Paste the tokens** (see *Quick Start* below) into the project's global CSS
   or Tailwind `@theme` block. Never hardcode hex values in components — always
   reference the token.
2. **Pick a section background** from the surface bands (`#dceeff` → `#ffffff`
   → `#cccccc`) and alternate them down the page for scroll rhythm.
3. **Set display headlines** in Lateral 800 at 200–640px, line-height 0.75–0.80.
   The crushed leading is non-negotiable.
4. **Wrap every headline** with a 3D blue ribbon and/or a sticker cluster — display
   type never sits alone on a flat background.
5. **Outline every interactive element** with a 1px `#000000` border and round it
   (pills to 1600px, cards to 20–40px).
6. **Spread the six-color palette** across the screen as a shared set — never elect
   one as "the" accent.
7. **Check against the Do's & Don'ts** before shipping.

---

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Carbon | `#000000` | `--color-carbon` | Primary text, card borders, filled CTA background, logo mark — creates the hand-cut sticker outline effect against pastel surfaces |
| Paper White | `#ffffff` | `--color-paper-white` | Page canvas, card surfaces, outlined button fills, text on dark fills |
| Sky Wash | `#dceeff` | `--color-sky-wash` | Hero section background, light blue pastel ground |
| Concrete Gray | `#cccccc` | `--color-concrete-gray` | Secondary section background, neutral interlude surface |
| Soft Mist | `#e9e9e9` | `--color-soft-mist` | Subtle button and surface tints, disabled states |
| Electric Blue | `#4da2ff` | `--color-electric-blue` | Dominant brand color — 3D ribbon sculptures, body backgrounds, card washes, the visual signature |
| Mint Pop | `#55db9c` | `--color-mint-pop` | Green wash for highlight backgrounds, decorative bands, checkmark stickers |
| Lavender | `#e9ccff` | `--color-lavender` | Soft accent wash for cards, tags, sticker fills — the gentlest color |
| Ember | `#fb4903` | `--color-ember` | Hot accent for sticker icons, badge fills, rocket body |
| Sunburst | `#ffd731` | `--color-sunburst` | Sticker coin fills, highlight accents, yellow sticker decorations — never a text background |
| Voltage Violet | `#5c4ade` | `--color-voltage-violet` | Deep accent for wallet stickers, QR download cards, secondary CTAs |

**Sticker palette (use as a set):** Electric Blue, Mint Pop, Lavender, Ember, Sunburst, Voltage Violet.

## Tokens — Typography

### Lateral — display headlines only
Weight 800. Sizes: 70 / 110 / 160 / 200 / 281 / 640px. Line-height **0.75–0.80**.
Letter-spacing normal. The wordmark and section banners stack into sculptural
blocks that wrap behind 3D ribbons. Substitutes: Druk, Bowlby One, Antonio.

### Aeonik Pro — all UI, body, nav, buttons, subheads
Weights 500 (body/metadata 12–16px) and 700 (subheads/nav 24–30px, plus a 64px
supporting headline step). Line-height 1.00–1.56. Letter-spacing: `-0.010em`
body, `0.030em` nav/buttons, `0.032em` uppercase labels. OpenType: `"ss01" on,
"tnum"`. Substitutes: Inter, Satoshi, General Sans.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| caption | 12px | 1.56 | -0.01px | `--text-caption` |
| body-lg | 15px | 1.39 | -0.01px | `--text-body-lg` |
| subheading | 24px | 1.2 | -0.01px | `--text-subheading` |
| heading-sm | 30px | 1.1 | -0.01px | `--text-heading-sm` |
| heading | 64px | 1 | -0.01px | `--text-heading` |
| display | 200px | 0.8 | — | `--text-display` |
| display-lg | 640px | 0.75 | — | `--text-display-lg` |

## Tokens — Spacing & Shapes

**Base unit:** 4px · **Density:** comfortable

Spacing scale (px): 4, 8, 12, 16, 20, 24, 28, 32, 40, 44, 48, 60, 80, 128, 180, 224
(tokens `--spacing-4` … `--spacing-224`).

### Border Radius

| Element | Value |
|---------|-------|
| nav | 1600px |
| body | 30px |
| cards | 20px |
| pills | 1600px |
| buttons | 1600px |
| wallet-icon | 16px |
| cards-elevated | 40px |

### Layout
- Page max-width: **1440px** (never below 1280px)
- Section gap: **48px**
- Card padding: **24px**
- Element gap: **4–12px**
- Full-bleed scroll layout, no sidebar. Persistent marquee + minimal top nav
  (logo left, pill nav center, filled CTA right). Each section is a full-viewport
  color band; composition is asymmetric/collage, not grid-locked.

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 1 | Sky Wash | `#dceeff` | Hero / primary section background |
| 2 | Paper White | `#ffffff` | Card surfaces, nav, outlined button fills |
| 3 | Concrete Gray | `#cccccc` | Secondary interlude, neutral breathing band |
| 4 | Sticker Surfaces | `#e9ccff` | Accent card fills — lavender pastel |

---

## Components

- **Pill Nav Button** — 1600px radius, 1px `#000` border, `#fff` fill, Aeonik Pro
  700 at 12–14px / 0.032em, 15px vertical / 12px horizontal padding, 4px gaps.
- **Filled CTA Button** (primary, e.g. "Launch App") — 40px radius, `#000` bg,
  `#fff` text, Aeonik Pro 700 13–14px, 10/12px padding, 1px `#000` border. One per screen.
- **Outlined Ghost Button** (secondary) — 1600px radius, 1px `#000` border, `#fff`
  bg, `#000` text, Aeonik Pro 700 13–14px / 0.032em, 10/12px padding.
- **Logo Mark** — circular black-outlined "S" badge, 1600px radius, 1px `#000` on `#fff`.
- **Plus Menu Button** — circular icon button, 1600px radius, 1px `#000`, `#fff`, `+` glyph.
- **QR Download Card** — 20px radius, `#5c4ade` bg, split QR (white) + label
  ("DOWNLOAD", Aeonik Pro 700 14px / 0.032em white). Black hairline on QR panel.
- **Sticker Decoration** — flat rocket/coin/wallet/checkmark, 1px `#000` outline,
  16–20px radius, filled with one brand color, rotated & overlapping, never grid-aligned.
- **Marquee Banner** — full-bleed `#000` band, `#fff` Aeonik Pro 700 uppercase
  12–13px / 0.032em, repeating, no padding, flush to edges.
- **Display Headline Block** — Lateral 800 200–640px, line-height 0.75–0.80, `#000`,
  treated as a physical object the blue ribbon wraps behind; paired with a tagline.
- **Tagline Subhead** — Aeonik Pro 500 24–64px, `#000`, directly below the display block.
- **3D Ribbon Element** — grainy Electric Blue (`#4da2ff`) tubular form, full-bleed,
  wrapping behind display text. The signature motif — appears in every section.
- **Section Background Panel** — full-bleed band alternating `#dceeff` / `#fff` /
  `#cccccc`. No border, no shadow — color bands alone define sections.

## Imagery

3D-rendered blue ribbons dominate — a single grainy, inflatable tubular motif in
`#4da2ff` wrapping behind display text in every section. 2D stickers (rocket,
gold coin, green checkmark, purple wallet) float around headlines like cut-outs,
each with a 1px black outline. No photography. No illustration grids — everything
is collage-like and asymmetric.

## Animation

Marquee scrolls horizontally on a continuous loop. 3D ribbons and stickers are
static. Motion is limited to the marquee and minimal button hover transitions —
the site reads as a printed collage, not a kinetic experience.

---

## Do's

- Use Lateral 800 at 200–640px with line-height 0.75–0.80 for display headlines; crushed leading is mandatory.
- Apply the six-color sticker palette as a shared set — multiple colors per screen.
- Give every interactive element a 1px solid `#000` border — the hand-cut outline is the language, not a fallback.
- Round nav/buttons/tags to 1600px and cards to 20–40px.
- Pair every display headline with a 3D blue ribbon or sticker cluster.
- Use Aeonik Pro 700 with 0.030–0.032em tracking for nav/button/uppercase labels.
- Alternate section backgrounds across `#dceeff`, `#fff`, `#cccccc` for scroll rhythm without dividers.

## Don'ts

- No border-radius under 16px on cards or under 1600px on buttons/tags.
- Never set line-height above 0.85 on Lateral display text.
- Never use blue (`#4da2ff`) as a CTA fill or link color — it's decorative only. CTAs are black-fill or outlined-black.
- No box-shadows anywhere — elevation comes from color bands and black outlines.
- Don't use green (`#55db9c`) as a success state — it's a sticker accent, not a semantic color.
- Don't constrain the page below 1280px max-width.
- No gradients anywhere — flat fills only; the 3D ribbons carry all dimensional weight.

---

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-carbon: #000000;
  --color-paper-white: #ffffff;
  --color-sky-wash: #dceeff;
  --color-concrete-gray: #cccccc;
  --color-soft-mist: #e9e9e9;
  --color-electric-blue: #4da2ff;
  --color-mint-pop: #55db9c;
  --color-lavender: #e9ccff;
  --color-ember: #fb4903;
  --color-sunburst: #ffd731;
  --color-voltage-violet: #5c4ade;

  /* Typography — Font Families */
  --font-lateral: 'Lateral', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-aeonik-pro: 'Aeonik Pro', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-caption: 12px;      --leading-caption: 1.56;      --tracking-caption: -0.01px;
  --text-body-lg: 15px;      --leading-body-lg: 1.39;      --tracking-body-lg: -0.01px;
  --text-subheading: 24px;   --leading-subheading: 1.2;    --tracking-subheading: -0.01px;
  --text-heading-sm: 30px;   --leading-heading-sm: 1.1;    --tracking-heading-sm: -0.01px;
  --text-heading: 64px;      --leading-heading: 1;         --tracking-heading: -0.01px;
  --text-display: 200px;     --leading-display: 0.8;
  --text-display-lg: 640px;  --leading-display-lg: 0.75;

  /* Typography — Weights */
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* Spacing */
  --spacing-unit: 4px;
  --spacing-4: 4px;    --spacing-8: 8px;     --spacing-12: 12px;  --spacing-16: 16px;
  --spacing-20: 20px;  --spacing-24: 24px;   --spacing-28: 28px;  --spacing-32: 32px;
  --spacing-40: 40px;  --spacing-44: 44px;   --spacing-48: 48px;  --spacing-60: 60px;
  --spacing-80: 80px;  --spacing-128: 128px; --spacing-180: 180px; --spacing-224: 224px;

  /* Layout */
  --page-max-width: 1440px;
  --section-gap: 48px;
  --card-padding: 24px;

  /* Border Radius */
  --radius-nav: 1600px;
  --radius-body: 30px;
  --radius-cards: 20px;
  --radius-pills: 1600px;
  --radius-buttons: 1600px;
  --radius-wallet-icon: 16px;
  --radius-cards-elevated: 40px;

  /* Surfaces */
  --surface-sky-wash: #dceeff;
  --surface-paper-white: #ffffff;
  --surface-concrete-gray: #cccccc;
  --surface-sticker-surfaces: #e9ccff;
}
```

### Tailwind v4

```css
@theme {
  /* Colors */
  --color-carbon: #000000;
  --color-paper-white: #ffffff;
  --color-sky-wash: #dceeff;
  --color-concrete-gray: #cccccc;
  --color-soft-mist: #e9e9e9;
  --color-electric-blue: #4da2ff;
  --color-mint-pop: #55db9c;
  --color-lavender: #e9ccff;
  --color-ember: #fb4903;
  --color-sunburst: #ffd731;
  --color-voltage-violet: #5c4ade;

  /* Typography */
  --font-lateral: 'Lateral', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-aeonik-pro: 'Aeonik Pro', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-caption: 12px;      --text-body-lg: 15px;      --text-subheading: 24px;
  --text-heading-sm: 30px;   --text-heading: 64px;      --text-display: 200px;
  --text-display-lg: 640px;

  /* Spacing */
  --spacing-4: 4px;    --spacing-8: 8px;     --spacing-12: 12px;  --spacing-16: 16px;
  --spacing-20: 20px;  --spacing-24: 24px;   --spacing-28: 28px;  --spacing-32: 32px;
  --spacing-40: 40px;  --spacing-44: 44px;   --spacing-48: 48px;  --spacing-60: 60px;
  --spacing-80: 80px;  --spacing-128: 128px; --spacing-180: 180px; --spacing-224: 224px;

  /* Border Radius */
  --radius-2xl: 16px;  --radius-2xl-2: 20px; --radius-3xl: 30px;  --radius-3xl-2: 40px;
  --radius-full-3: 1600px;
}
```

## Example component prompts

1. **Primary action button** — `#fff` bg, `#000` text, 9999px radius, compact pill padding.
2. **Hero section** — `#dceeff` full-bleed bg; centered Lateral 800 200px `#000`
   headline at line-height 0.80; a 3D Electric Blue (`#4da2ff`) grainy ribbon
   wrapping behind; Aeonik Pro 500 24px `#000` tagline below; two ghost buttons
   ("Launch Web App", "Download for Chrome"); floating stickers — rocket (Ember),
   coin (Sunburst), wallet (Voltage Violet), each 1px `#000` outline, 20px radius, rotated.
3. **QR download card** — 20px radius, `#5c4ade` bg, 1px `#000` border; left half
   `#fff` QR square with 8px padding; right half "DOWNLOAD" Aeonik Pro 700 14px / 0.032em white.
4. **Marquee strip** — `#000` full-bleed, 1px top/bottom `#000` border; scrolling
   Aeonik Pro 700 12px / 0.032em `#fff` uppercase, no inner padding.
5. **Secondary section** — `#cccccc` full-bleed; Lateral 800 281px `#000` at 0.76
   line-height on the left; a `#4da2ff` ribbon arcing across the top; green
   checkmark sticker (`#55db9c`) far left, purple wallet sticker (`#5c4ade`) far right, both overlapping the type.

## Similar brands

Rainbow.me · Phantom Wallet · Backpack Wallet · Magic Eden — sticker-on-pastel
palettes, oversized display type with tight leading, and 3D decorative elements
wrapping behind text.
