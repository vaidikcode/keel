---
name: slush-design-system
description: >-
  Slush visual design language — inflatable sticker universe on pastel paper.
  Use when building or styling any UI, landing page, component, or marketing
  surface: colors, typography (Lateral display + Aeonik Pro), spacing, radii,
  components, do's/don'ts, and ready-to-paste CSS custom properties / Tailwind
  v4 theme. Invoke whenever asked to design, theme, restyle, or lay out a
  screen in the Slush look. Keel onboarding is the product surface — one
  question at a time, ~900ms text reveal, sticker chips, no form wiring.
---

# Slush — Style Reference
> inflatable sticker universe on pastel paper

**Theme:** light

Slush runs on a sticker-book logic: pastel paper canvas, huge inflated 3D ribbons in electric blue, and a full rainbow of vivid sticker accents scattered like confetti. Display type is enormous and crushed (Lateral 800 at 200–640px, line-height 0.75–0.80) so the words become sculptural objects, not sentences. The six saturated brand colors function as a shared sticker palette — every color appears as a filled sticker, a card surface, or a decorative wash, never as a restrained accent. Components are rounded to the point of softness (20–40px on cards, pill-shaped on nav) and outlined in black for a hand-cut feel. The result reads less like a fintech landing page and more like a physical collage pinned to a pale wall.

## How to use this skill

When styling a Keel / Slush surface, in order:

1. **Paste the tokens** (see *Quick Start*) into global CSS / Tailwind `@theme`. Never hardcode hex in components — always reference the token.
2. **Pick a section background** from the surface bands (`#dceeff` → `#ffffff` → `#cccccc`) and alternate them for rhythm.
3. **Set display headlines** in Lateral 800 (Antonio / Bowlby One / Druk substitute) at 200–640px, line-height 0.75–0.80. Crushed leading is non-negotiable on display.
4. **Wrap every display headline** with a 3D blue ribbon and/or a sticker cluster — display type never sits alone on a flat background.
5. **Outline every interactive element** with a 1px `#000000` border and round it (pills to 1600px, cards to 20–40px).
6. **Spread the six-color palette** as a shared set — never elect one as "the" accent.
7. **Check against the Do's & Don'ts** before shipping.

### Keel product exception — onboarding

Keel is **Mind Over Money**: a first-time investor app. Onboarding is **minimal product UX on a Slush canvas**, not a busy marketing collage.

- One question on screen at a time. Selection chips over text fields. Collect experience, goal, assets, risk, jargon fog, impulse source, horizon.
- Question copy enters with a ~900ms blur/rise. Options stagger in after. Respect `prefers-reduced-motion`.
- Welcome can use sculptural display type + ribbon + stickers. Question steps stay quiet: paper, one prompt, chips, one CTA.
- Motion is for *arrival of text*, not decoration. No marquee on question steps. No looping sticker bounce.
- CTAs stay carbon fill / outlined ghost. Sticker colors are surfaces and chips, never the Start button.
- One LLM call starts on Start and builds a catalog (simplified assets, glossary, risk bands, anti-hype flows). Never block the next question on the model. Never promise returns.

---

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Carbon | `#000000` | `--color-carbon` | Primary text, card borders, filled CTA background, logo mark — creates the hand-cut sticker outline effect against pastel surfaces |
| Paper White | `#ffffff` | `--color-paper-white` | Page canvas, card surfaces, outlined button fills, text on dark fills |
| Sky Wash | `#dceeff` | `--color-sky-wash` | Hero section background, light blue pastel ground |
| Concrete Gray | `#cccccc` | `--color-concrete-gray` | Secondary section background, neutral interlude surface |
| Soft Mist | `#e9e9e9` | `--color-soft-mist` | Subtle button and surface tints, disabled states |
| Electric Blue | `#4da2ff` | `--color-electric-blue` | Dominant brand color — 3D ribbon sculptures, body backgrounds, card washes, the visual signature that anchors every screen |
| Mint Pop | `#55db9c` | `--color-mint-pop` | Green wash for highlight backgrounds, decorative bands, and soft emphasis behind content |
| Lavender | `#e9ccff` | `--color-lavender` | Soft accent wash for cards, tags, sticker fills — the gentlest color in the palette |
| Ember | `#fb4903` | `--color-ember` | Hot accent for sticker icons, badge fills, rocket body — warmest hit in the rainbow |
| Sunburst | `#ffd731` | `--color-sunburst` | Sticker coin fills, highlight accents, yellow sticker decorations — never used for text backgrounds |
| Voltage Violet | `#5c4ade` | `--color-voltage-violet` | Deep accent for wallet stickers, QR download cards, secondary CTAs — the anchor purple in the sticker set |

**Sticker palette (use as a set):** Electric Blue, Mint Pop, Lavender, Ember, Sunburst, Voltage Violet.

## Tokens — Typography

### Lateral — Display headlines only — the wordmark 'SLUSH' / 'KEEL' and section banners sit at 200–640px with crushed 0.75–0.80 line-height so the letters stack into sculptural blocks. This is anti-convention display: no other site pairs an 800-weight display face with line-height under 0.85, and the effect makes text behave like a physical object that wraps behind 3D ribbons. · `--font-lateral`
- **Substitute:** Druk, Bowlby One, Antonio
- **Weights:** 800
- **Sizes:** 70px, 110px, 160px, 200px, 281px, 640px
- **Line height:** 0.75–0.80
- **Letter spacing:** normal
- **Role:** Display headlines only

### Aeonik Pro — All UI, body, nav, buttons, subheads. Weight 500 for body and metadata (12–16px), weight 700 for subheads and nav labels (24–30px), and a 64px 700-weight step for large supporting headlines. Tight letter-spacing (-0.010em) tightens the 14–16px body; slight opening (0.030–0.032em) on nav/button labels gives pill controls breathing room. · `--font-aeonik-pro`
- **Substitute:** Inter, Satoshi, General Sans, Outfit
- **Weights:** 500, 700
- **Sizes:** 12px, 13px, 14px, 15px, 16px, 24px, 30px, 64px
- **Line height:** 1.00–1.56
- **Letter spacing:** -0.010em body, 0.030em nav/buttons, 0.032em uppercase labels
- **OpenType features:** `"ss01" on, "tnum"`
- **Role:** All UI, body, nav, buttons, subheads

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

**Base unit:** 4px

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 20 | 20px | `--spacing-20` |
| 24 | 24px | `--spacing-24` |
| 28 | 28px | `--spacing-28` |
| 32 | 32px | `--spacing-32` |
| 40 | 40px | `--spacing-40` |
| 44 | 44px | `--spacing-44` |
| 48 | 48px | `--spacing-48` |
| 60 | 60px | `--spacing-60` |
| 80 | 80px | `--spacing-80` |
| 128 | 128px | `--spacing-128` |
| 180 | 180px | `--spacing-180` |
| 224 | 224px | `--spacing-224` |

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

- **Page max-width:** 1440px
- **Section gap:** 48px
- **Card padding:** 24px
- **Element gap:** 4-12px

## Components

### Pill Nav Button
**Role:** Top navigation links

1600px border-radius, 1px solid #000000 border, #ffffff fill, Aeonik Pro 700 at 12–14px with 0.032em letter-spacing, 15px vertical padding, 12px horizontal padding. Sits inline in the nav bar with 4px gaps.

### Filled CTA Button
**Role:** Primary action — 'Launch App' / 'Start'

40px border-radius, #000000 background, #ffffff text, Aeonik Pro 700 at 13–14px, 10px vertical and 12px horizontal padding, 1px solid #000000 border (invisible against fill). Used for the single highest-priority action per screen.

### Outlined Ghost Button
**Role:** Secondary action — 'Launch Web App', 'Download for Chrome', 'Back'

1600px border-radius, 1px solid #000000 border, #ffffff background, #000000 text, Aeonik Pro 700 at 13–14px with 0.032em letter-spacing, 10px vertical and 12px horizontal padding. Pairs beside or below the filled CTA.

### Logo Mark
**Role:** Brand identifier in nav

Circular black-outlined 'K' badge, 1600px radius, 1px #000000 border on #ffffff fill. Sits top-left at fixed position across all sections.

### Plus Menu Button
**Role:** Overflow/navigation trigger

Circular icon button, 1600px radius, 1px #000000 border, #ffffff fill, contains a + glyph in Aeonik Pro 700.

### QR Download Card
**Role:** App download prompt

20px border-radius card, #5c4ade background, split into QR code panel (white) and label panel (#5c4ade with white Aeonik Pro 700 'DOWNLOAD' text). Black hairline border on the QR panel.

### Sticker Decoration
**Role:** Playful visual accent floating around display text

Flat illustrated stickers (rocket, coin, wallet, checkmark) with 1px #000000 outline, 16–20px radius, filled with one of the six brand colors. Positioned as overlapping, rotated decorative elements around display type — never grid-aligned.

### Marquee Banner
**Role:** Scrolling announcement strip

Full-bleed horizontal band at page top, #000000 background, #ffffff Aeonik Pro 700 uppercase text at 12–13px with 0.032em letter-spacing, repeating message. Separates from the page edge with no padding.

### Display Headline Block
**Role:** Hero/section sculptural text

Lateral 800 at 200–640px, line-height 0.75–0.80, #000000 fill. Treated as a physical object that the 3D blue ribbon wraps behind. Always paired with a smaller Aeonik Pro tagline below.

### Tagline Subhead
**Role:** Supporting line under display text

Aeonik Pro 500 at 24–64px, #000000, sits centered or left-aligned directly below the Lateral display block. The size step (24–64px) keeps it readable without competing with the display.

### 3D Ribbon Element
**Role:** Signature visual motif — inflatable curved tube

Rendered 3D blue (#4da2ff) tubular form with a rough/grainy surface texture, full-bleed, wrapping behind display text. Functions as a brand symbol more than decoration — appears in every section that uses display type.

### Section Background Panel
**Role:** Full-bleed section ground

Alternates between #dceeff (light blue), #ffffff (white), and #cccccc (gray) across scroll. No border or shadow — sections are defined purely by color bands.

### Selection Chip (Keel)
**Role:** Onboarding answers — the primary input

1600px radius, 1px #000000 border, #ffffff fill, Aeonik Pro 700 13–14px / 0.032em. Selected: #000000 fill, #ffffff text. Multi-select stays chips. Role cards may use sticker-palette fills (lavender / sunburst / electric blue) as surfaces, still with the 1px carbon outline.

## Do's and Don'ts

### Do
- Use Lateral 800 at 200–640px with line-height 0.75–0.80 for any display headline; the crushed leading is non-negotiable for the sculptural text effect.
- Apply the six-color sticker palette (Electric Blue, Mint Pop, Lavender, Ember, Sunburst, Voltage Violet) as a shared set — use multiple colors per screen, never pick one as 'the' accent.
- Set all interactive elements (nav, buttons, cards) to 1px solid #000000 borders; the hand-cut outline is part of the visual language, not a fallback.
- Round nav, buttons, and tags to 1600px (pill shape) and cards to 20–40px; softness is the system default.
- Pair every display headline with a 3D blue ribbon or sticker cluster — display type never appears alone on a flat background.
- Use Aeonik Pro 700 with 0.030–0.032em letter-spacing for all nav, button, and uppercase label text to give pill controls breathing room.
- Alternate section backgrounds across #dceeff, #ffffff, and #cccccc to create visible scroll rhythm without dividers or shadows.
- Onboard with chips and cards. One prompt. ~1s text arrival. LLM starts on Start, never on page load.

### Don't
- Do not use any border-radius under 16px for cards or under 1600px for buttons/tags; sharp corners break the soft sticker-book feel.
- Do not set line-height above 0.85 on Lateral display text — the crushed leading is what makes the type sculptural rather than typographic.
- Do not use blue (#4da2ff) as a CTA fill or link color; it is a decorative/brand surface color, not an action color. CTAs are black-fill or outlined-black only.
- Do not add box-shadows to cards, buttons, or surfaces; elevation is communicated through color bands and black outlines, never shadows.
- Do not use green (#55db9c) as a success state color — it is a sticker accent, not a semantic state. Reserve it for decorative/checkmark stickers.
- Do not constrain the page to a max-width under 1280px; the inflated display type and 3D ribbons need horizontal room to breathe. Onboarding question columns may be narrower; the *page* still goes full-bleed.
- Do not use gradients anywhere; the 3D ribbons carry all dimensional weight, and flat color fills preserve the sticker/paper aesthetic.
- Do not put a long form on one screen. Do not start the LLM until Start. Do not block the next question on the model.

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 1 | Sky Wash | `#dceeff` | Hero and primary section background — pale blue pastel |
| 2 | Paper White | `#ffffff` | Card surfaces, nav, outlined button fills |
| 3 | Concrete Gray | `#cccccc` | Secondary section interlude, neutral breathing band |
| 4 | Sticker Surfaces | `#e9ccff` | Accent card fills — lavender pastel |

## Imagery

The visual language is dominated by 3D-rendered blue ribbons — a single signature motif that appears as a grainy, inflatable tubular form in Electric Blue (#4da2ff), wrapping around or behind display text in every section. Decorative 2D stickers (rocket, gold coin, green checkmark, purple wallet) float around headlines like physical cut-outs pinned to a board, each with a 1px black outline. No photography appears anywhere. No traditional illustration grids — everything is collage-like and asymmetrically placed. The 3D ribbons do the heavy atmospheric lifting; stickers add playfulness; the rest is type and color.

## Layout

Full-bleed scroll-based layout with no sidebar or persistent container. The marquee banner and a minimal top nav (logo left, pill nav center, filled CTA right) persist at the top of marketing screens. Each section is a full-viewport color band (#dceeff → #ffffff → #cccccc) with oversized Lateral display text centered or left-aligned, wrapped by 3D blue ribbons. Content arrangement is deliberately loose and collage-like rather than grid-locked: stickers overlap display type, ribbons cross behind text. Vertical rhythm is generous (48px section gaps) but horizontal composition is intentionally asymmetric.

Keel onboarding: full-viewport color band, prompt centered, chips wrapping underneath. No sidebar. No progress bar — only a row of carbon dots.

## Animation Philosophy

The marquee strip scrolls horizontally on a continuous loop. The 3D ribbons are static 3D renders, not animated. Sticker decorations are static. Marketing surfaces read as a printed collage — motion is restricted to the marquee and minimal hover transitions on buttons.

**Keel onboarding exception:** question and option text arrive once, ~900ms, blur-to-sharp + 16px rise, then sit still. Options stagger ~60ms. Single-select holds ~400ms so the choice is visible before the next prompt. No perpetual motion on question steps.

## Similar Brands

- **Rainbow.me** — Same sticker-on-pastel approach with a multi-color accent palette and rounded pill buttons, though Rainbow leans darker
- **Phantom Wallet** — Similar pastel hero with oversized display type and decorative 3D elements wrapping behind text
- **Backpack Wallet** — Shared vivid multi-color sticker palette, rounded card surfaces, and playful 3D decorative elements on a light canvas
- **Magic Eden** — Same bold display typography with tight leading and full-bleed colored section bands, though Magic Eden uses more photography

## Agent Prompt Guide

Quick Color Reference:
- text: #000000
- background: #ffffff / #dceeff / #cccccc (section-dependent)
- border: #000000 (1px outlines everywhere)
- accent: #4da2ff (3D ribbon blue — decorative only)
- sticker palette: #55db9c, #e9ccff, #fb4903, #ffd731, #5c4ade
- primary action: #000000 fill, #ffffff text (filled CTA)

Example Component Prompts:
1. Create a Primary Action Button: #000000 background, #ffffff text, 40px radius, compact pill padding. Use this filled treatment for the main CTA. (The older "white fill black text" prompt is the ghost/outlined treatment, not Start.)
2. Build a hero section: #dceeff full-bleed background. Centered Lateral 800 200px #000000 display headline with line-height 0.80. A 3D Electric Blue (#4da2ff) grainy tubular ribbon wrapping behind the text. Tagline below: Aeonik Pro 500 24px #000000, letter-spacing -0.01em. Two ghost buttons beneath. Decorative stickers (rocket in Ember #fb4903, coin in Sunburst #ffd731, wallet in Voltage Violet #5c4ade) floating around the headline with 1px #000000 outlines, 20px radius, slight rotation.
3. Build a QR download card: 20px radius, #5c4ade background, 1px #000000 border. Split layout — left half is a #ffffff QR code square with 8px internal padding; right half shows 'DOWNLOAD' in Aeonik Pro 700 14px 0.032em #ffffff text centered vertically.
4. Build a marquee strip: #000000 full-bleed background, 1px top and bottom #000000 border. Scrolling Aeonik Pro 700 12px 0.032em #ffffff uppercase text repeating a promotional message. No padding inside — text sits flush to the band edges.
5. Build a secondary section: #cccccc full-bleed background. Asymmetric placement: Lateral 800 281px #000000 display text at 0.76 line-height on the left, with a 3D #4da2ff ribbon arcing across the top. A green checkmark sticker (#55db9c fill, 1px #000000 border, 20px radius) on the far left, and a purple wallet sticker (#5c4ade fill, 1px #000000 border, 16px radius) on the far right, both overlapping the display type.
6. Build a Keel onboarding step: full-bleed surface band. One Aeonik Pro 700 30–64px question. Chips below. No other copy except a caption. Animate the question in over ~900ms.

## Gradient System

No gradients. The 3D ribbon elements carry all dimensional weight, and all flat surfaces (backgrounds, cards, buttons, stickers) use solid fills. This is a hard rule — gradients would undermine the sticker-on-paper aesthetic. Paper grain via SVG noise is texture, not a gradient.

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
  --font-lateral: 'Lateral', 'Antonio', 'Bowlby One', ui-sans-serif, system-ui, sans-serif;
  --font-aeonik-pro: 'Aeonik Pro', 'Outfit', ui-sans-serif, system-ui, sans-serif;

  /* Typography — Scale */
  --text-caption: 12px;
  --leading-caption: 1.56;
  --tracking-caption: -0.01px;
  --text-body-lg: 15px;
  --leading-body-lg: 1.39;
  --tracking-body-lg: -0.01px;
  --text-subheading: 24px;
  --leading-subheading: 1.2;
  --tracking-subheading: -0.01px;
  --text-heading-sm: 30px;
  --leading-heading-sm: 1.1;
  --tracking-heading-sm: -0.01px;
  --text-heading: 64px;
  --leading-heading: 1;
  --tracking-heading: -0.01px;
  --text-display: 200px;
  --leading-display: 0.8;
  --text-display-lg: 640px;
  --leading-display-lg: 0.75;

  /* Typography — Weights */
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* Spacing */
  --spacing-unit: 4px;
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-28: 28px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-44: 44px;
  --spacing-48: 48px;
  --spacing-60: 60px;
  --spacing-80: 80px;
  --spacing-128: 128px;
  --spacing-180: 180px;
  --spacing-224: 224px;

  /* Layout */
  --page-max-width: 1440px;
  --section-gap: 48px;
  --card-padding: 24px;
  --element-gap: 4-12px;

  /* Border Radius */
  --radius-2xl: 16px;
  --radius-2xl-2: 20px;
  --radius-3xl: 30px;
  --radius-3xl-2: 40px;
  --radius-full: 1440px;
  --radius-full-2: 1500px;
  --radius-full-3: 1600px;

  /* Named Radii */
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

  --font-lateral: var(--font-lateral);
  --font-aeonik-pro: var(--font-aeonik-pro);

  --text-caption: 12px;
  --text-body-lg: 15px;
  --text-subheading: 24px;
  --text-heading-sm: 30px;
  --text-heading: 64px;
  --text-display: 200px;
  --text-display-lg: 640px;

  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-28: 28px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-44: 44px;
  --spacing-48: 48px;
  --spacing-60: 60px;
  --spacing-80: 80px;
  --spacing-128: 128px;
  --spacing-180: 180px;
  --spacing-224: 224px;

  --radius-2xl: 16px;
  --radius-2xl-2: 20px;
  --radius-3xl: 30px;
  --radius-3xl-2: 40px;
  --radius-full: 1440px;
  --radius-full-2: 1500px;
  --radius-full-3: 1600px;
}
```
