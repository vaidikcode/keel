import { z } from "zod";
import {
  pickAssets,
  twinFor,
  type AssetKind,
  type UniverseAsset,
} from "./universe";

export const jargonSchema = z.object({
  term: z.string(),
  plain: z.string(),
});

export const beatsSchema = z.object({
  feed: z.string(),
  filing: z.string(),
  sleep: z.string(),
  twin: z.string(),
  jargon: z.string(),
  mismatch: z.string(),
});

export const assetPackSchema = z.object({
  id: z.string(),
  title: z.string(),
  ticker: z.string(),
  kind: z.string(),
  feedLine: z.string(),
  filingLine: z.string(),
  sleepLine: z.string(),
  twinLine: z.string(),
  twinId: z.string(),
  twinTitle: z.string(),
  priceLabel: z.string(),
  nights: z.number(),
  maxDrawdownPct: z.number(),
  pulse: z.array(z.number()),
  jargon: z.array(jargonSchema).max(3),
  beats: beatsSchema,
  assetGreeting: z.string(),
});

export const spreadPackSchema = z.object({
  greeting: z.string(),
  prompt: z.string(),
  promptOptions: z.array(
    z.object({
      id: z.union([z.literal("feed"), z.literal("filing")]),
      label: z.string(),
    }),
  ),
  asks: z.array(z.string()).max(3),
  assets: z.array(assetPackSchema).min(1).max(3),
  source: z.union([z.literal("gateway"), z.literal("fallback")]),
});

export type SpreadPack = z.infer<typeof spreadPackSchema>;
export type AssetPack = z.infer<typeof assetPackSchema>;
export type Beats = z.infer<typeof beatsSchema>;

export type SourceAnswers = {
  watch: AssetKind;
  noise: string;
  sleep: string;
  fog: string[];
  intent: string;
};

export type AssetFacts = {
  asset: UniverseAsset;
  priceLabel: string;
  headlines: string[];
  filingFacts: string[];
  nights: number;
  maxDrawdownPct: number;
  pulse: number[];
  trendingNote: string | null;
};

const FOG_JARGON: Record<string, Array<{ term: string; plain: string }>> = {
  jargon: [
    {
      term: "P/E",
      plain: "How many years of current profit you are paying for. High is not automatically good.",
    },
    {
      term: "Market cap",
      plain: "Price times all shares. The sticker on the whole company.",
    },
  ],
  charts: [
    {
      term: "Volatility",
      plain: "How wildly the price jumps. A bumpy ride is not the same as a bad company.",
    },
    {
      term: "Drawdown",
      plain: "How far it has fallen from a recent high. This is the number that tests sleep.",
    },
  ],
  filings: [
    {
      term: "Revenue",
      plain: "Money customers paid. Not profit. Not the stock price.",
    },
    {
      term: "Balance sheet",
      plain: "What it owns minus what it owes. A snapshot, not a vibe.",
    },
  ],
  social: [
    {
      term: "FOMO",
      plain: "Buying because the feed is loud. Keel will make you name a reason that is not everyone.",
    },
  ],
};

function jargonForFog(fog: string[]): Array<{ term: string; plain: string }> {
  const out: Array<{ term: string; plain: string }> = [];
  for (const key of fog) {
    const entries = FOG_JARGON[key] ?? [];
    for (const entry of entries) {
      if (!out.some((item) => item.term === entry.term)) {
        out.push(entry);
      }
      if (out.length >= 3) {
        return out;
      }
    }
  }
  if (out.length === 0) {
    return FOG_JARGON.jargon ?? [];
  }
  return out.slice(0, 3);
}

function intentGreeting(intent: string, watch: AssetKind): string {
  if (intent === "learn") {
    return `I am Keel. We will peel ${watch} into plain words — tap a pane when you are ready.`;
  }
  if (intent === "unhype") {
    return "I am Keel. Feed on the left, filing on the right. The gap is the point.";
  }
  return "I am Keel. We park the drama. Sleep first, tips later.";
}

function intentPrompt(intent: string): {
  prompt: string;
  promptOptions: Array<{ id: "feed" | "filing"; label: string }>;
} {
  if (intent === "learn") {
    return {
      prompt: "Start with a word or the document?",
      promptOptions: [
        { id: "filing", label: "The document" },
        { id: "feed", label: "A loud word" },
      ],
    };
  }
  if (intent === "park") {
    return {
      prompt: "Check sleep or the dull twin first?",
      promptOptions: [
        { id: "filing", label: "The calm side" },
        { id: "feed", label: "What the feed says" },
      ],
    };
  }
  return {
    prompt: "Headline or the filing?",
    promptOptions: [
      { id: "feed", label: "The headline" },
      { id: "filing", label: "The filing" },
    ],
  };
}

function defaultAsks(noise: string): string[] {
  if (noise === "friends") {
    return [
      "What did my friend claim?",
      "Is that in the filing?",
      "Show the boring twin",
    ];
  }
  if (noise === "viral") {
    return [
      "Why is this trending?",
      "What does the document say?",
      "How jumpy is this?",
    ];
  }
  return [
    "What is this, simply?",
    "Should I worry about sleep?",
    "What is the dull twin?",
  ];
}

export function buildFallbackPack(
  answers: SourceAnswers,
  factsList?: AssetFacts[],
): SpreadPack {
  const assets = factsList?.map((facts) => facts.asset) ?? pickAssets(answers.watch, answers.noise);
  const { prompt, promptOptions } = intentPrompt(answers.intent);
  const jargon = jargonForFog(answers.fog);

  return {
    greeting: intentGreeting(answers.intent, answers.watch),
    prompt,
    promptOptions,
    asks: defaultAsks(answers.noise),
    source: "fallback",
    assets: assets.map((asset, index) => {
      const facts = factsList?.[index];
      const twin = twinFor(asset);
      const nights = facts?.nights ?? asset.sleepSeed.nights;
      const maxDrawdownPct =
        facts?.maxDrawdownPct ?? asset.sleepSeed.maxDrawdownPct;
      const sleepMatch =
        (answers.sleep === "steady" && nights <= 3) ||
        (answers.sleep === "balanced" && nights <= 7) ||
        answers.sleep === "spicy";

      return {
        id: asset.id,
        title: asset.title,
        ticker: asset.ticker,
        kind: asset.kind,
        feedLine:
          facts?.headlines[0] ??
          facts?.trendingNote ??
          asset.feedSeed,
        filingLine:
          facts?.filingFacts[0] ?? asset.filingSeed,
        sleepLine: facts
          ? `About ${nights} bad nights. Max drop ~${maxDrawdownPct}%.`
          : asset.sleepSeed.line,
        twinLine: twin
          ? `Boring twin: ${twin.title} (${twin.ticker}). Same imagined dollars, different pulse.`
          : "No twin on file.",
        twinId: asset.twinId,
        twinTitle: twin?.title ?? "Twin",
        priceLabel: facts?.priceLabel ?? "—",
        nights,
        maxDrawdownPct,
        pulse: facts?.pulse ?? [0.4, 0.45, 0.42, 0.5, 0.48, 0.52, 0.5],
        jargon,
        beats: {
          ...asset.cannedBeats,
          mismatch: sleepMatch
            ? asset.cannedBeats.sleep
            : asset.cannedBeats.mismatch,
        },
        assetGreeting: `${asset.title}. Tap left for noise, right for the document.`,
      };
    }),
  };
}

export const PACK_PROMPT = `You are Keel, a sticker mascot for first-time investors (Mind Over Money hackathon).

Given user answers and raw facts for up to 3 assets, produce ONE pack.
Rules:
- Never invent numbers that are not in the facts. You may round and rephrase.
- Titles stay short. Lines stay concrete. No return promises. No "to the moon".
- greeting: one sentence from Keel to this user.
- prompt: one question Keel asks on landing (match intent: learn / unhype / park).
- promptOptions: exactly two, ids only "feed" or "filing".
- asks: exactly 3 short suggestion chips for Ask Keel.
- For each asset: feedLine (8 words-ish from headlines/trending), filingLine (8 words-ish from filing facts or seed), sleepLine (name the nights), twinLine, jargon (exactly 3 term+plain), beats (feed, filing, sleep, twin, jargon, mismatch — 1-2 sentences each as Keel speaking), assetGreeting.
- mismatch beat only if nights clash with sleep chip (steady wants low nights).
- Keep voice calm, sticker-book, anti-hype.`;

export function llmAssetPayload(facts: AssetFacts) {
  const twin = twinFor(facts.asset);
  return {
    id: facts.asset.id,
    title: facts.asset.title,
    ticker: facts.asset.ticker,
    kind: facts.asset.kind,
    twinId: facts.asset.twinId,
    twinTitle: twin?.title ?? "Twin",
    filingSeed: facts.asset.filingSeed,
    priceLabel: facts.priceLabel,
    headlines: facts.headlines.slice(0, 5),
    filingFacts: facts.filingFacts.slice(0, 6),
    nights: facts.nights,
    maxDrawdownPct: facts.maxDrawdownPct,
    trendingNote: facts.trendingNote,
  };
}
