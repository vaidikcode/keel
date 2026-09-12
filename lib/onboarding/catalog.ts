import { z } from "zod";
import type { Answers } from "./questions";
import { EXPERIENCE_LABEL } from "./questions";

export const catalogSchema = z.object({
  line: z.string(),
  assetProfiles: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      summary: z.string(),
      kind: z.string(),
      assets: z.array(z.string()),
      risk: z.array(z.string()),
      goals: z.array(z.string()),
    }),
  ),
  glossary: z.array(
    z.object({
      id: z.string(),
      term: z.string(),
      plain: z.string(),
      confusions: z.array(z.string()),
    }),
  ),
  riskBands: z.array(
    z.object({
      id: z.string(),
      risk: z.string(),
      title: z.string(),
      level: z.string(),
      how: z.string(),
    }),
  ),
  decisionFlows: z.array(
    z.object({
      id: z.string(),
      impulse: z.string(),
      title: z.string(),
      how: z.string(),
    }),
  ),
});

export type Catalog = z.infer<typeof catalogSchema>;

export type KeelProfile = {
  line: string;
  experience: string;
  assets: string[];
  risk: string;
  dashboard: Array<{
    id: string;
    title: string;
    summary: string;
    kind: string;
  }>;
  glossary: Array<{
    term: string;
    plain: string;
  }>;
  riskIndicator: {
    id: string;
    title: string;
    level: string;
    how: string;
  };
  decisionFlow: {
    id: string;
    title: string;
    how: string;
  };
};

export const FALLBACK_CATALOG: Catalog = {
  line: "Keel turns market noise into plain English, a risk meter, and a pause before you buy.",
  assetProfiles: [
    {
      id: "broad-index",
      title: "A whole-market fund",
      summary: "Owns a slice of many companies. Boring on purpose. The chart is the market, not a story.",
      kind: "funds",
      assets: ["funds", "unsure"],
      risk: ["steady", "balanced"],
      goals: ["learn", "save", "grow"],
    },
    {
      id: "dividend-stock",
      title: "A slow stock",
      summary: "A company that already makes money. Price still moves. We show why, in one line.",
      kind: "stocks",
      assets: ["stocks"],
      risk: ["balanced", "steady"],
      goals: ["learn", "grow"],
    },
    {
      id: "growth-stock",
      title: "A story stock",
      summary: "Price follows a narrative. Keel flags the story vs the numbers before you chase it.",
      kind: "stocks",
      assets: ["stocks"],
      risk: ["spicy", "balanced"],
      goals: ["grow", "unhype"],
    },
    {
      id: "short-bond",
      title: "A parking spot",
      summary: "Less drama than stocks. Not a piggy bank. We show what you give up for calm.",
      kind: "funds",
      assets: ["funds", "unsure"],
      risk: ["steady"],
      goals: ["save", "learn"],
    },
    {
      id: "btc-plain",
      title: "Bitcoin, un-memed",
      summary: "No new money is printed. Price still swings hard. The meter stays honest.",
      kind: "crypto",
      assets: ["crypto"],
      risk: ["spicy", "balanced"],
      goals: ["learn", "unhype"],
    },
    {
      id: "altcoin-warn",
      title: "A smaller coin",
      summary: "Often a slogan with a chart. Keel treats it as high-fog until the filing exists.",
      kind: "crypto",
      assets: ["crypto"],
      risk: ["spicy"],
      goals: ["unhype", "learn"],
    },
    {
      id: "starter-mix",
      title: "A first mix",
      summary: "One fund, one stock, no crypto until the words make sense. Built for 'I don't know yet'.",
      kind: "funds",
      assets: ["unsure", "funds", "stocks"],
      risk: ["steady", "balanced"],
      goals: ["learn", "save"],
    },
    {
      id: "hype-mirror",
      title: "The thing on your feed",
      summary: "We put the viral asset next to a dull one. Same screen. Different pulse.",
      kind: "stocks",
      assets: ["stocks", "crypto", "unsure"],
      risk: ["balanced", "spicy"],
      goals: ["unhype", "learn"],
    },
  ],
  glossary: [
    {
      id: "pe",
      term: "P/E",
      plain: "How many years of current profit you are paying for. High is not automatically good.",
      confusions: ["jargon", "charts"],
    },
    {
      id: "volatility",
      term: "Volatility",
      plain: "How wildly the price jumps. A bumpy ride is not the same as a bad company.",
      confusions: ["jargon", "charts"],
    },
    {
      id: "drawdown",
      term: "Drawdown",
      plain: "How far it has fallen from a recent high. This is the number that tests sleep.",
      confusions: ["charts", "jargon"],
    },
    {
      id: "balance-sheet",
      term: "Balance sheet",
      plain: "What it owns minus what it owes. A snapshot, not a vibe.",
      confusions: ["filings", "jargon"],
    },
    {
      id: "revenue",
      term: "Revenue",
      plain: "Money customers paid. Not profit. Not the stock price.",
      confusions: ["filings", "jargon"],
    },
    {
      id: "market-cap",
      term: "Market cap",
      plain: "Price times all shares. The sticker on the whole company.",
      confusions: ["jargon", "social"],
    },
    {
      id: "fomo",
      term: "FOMO",
      plain: "Buying because the feed is loud. Keel will make you name a reason that is not 'everyone'.",
      confusions: ["social"],
    },
    {
      id: "index",
      term: "Index fund",
      plain: "A basket that copies a market. You are not picking winners. You are paying for average.",
      confusions: ["jargon", "charts"],
    },
  ],
  riskBands: [
    {
      id: "steady",
      risk: "steady",
      title: "Calm meter",
      level: "Low swing",
      how: "We hide assets that historically lurch. Charts get a sleep-score, not a firework.",
    },
    {
      id: "balanced",
      risk: "balanced",
      title: "Some weather",
      level: "Medium swing",
      how: "Drops are labeled in plain words. You see the bump before the buy button.",
    },
    {
      id: "spicy",
      risk: "spicy",
      title: "Hot meter",
      level: "High swing",
      how: "Volatility is not a badge. We still show how far this can fall in a bad month.",
    },
  ],
  decisionFlows: [
    {
      id: "friends",
      impulse: "friends",
      title: "The friend check",
      how: "Name what they bought, then name a number that is not their screenshot. Proceed only if both exist.",
    },
    {
      id: "social",
      impulse: "social",
      title: "The feed pause",
      how: "A 60-second flow: source, claim, boring twin asset. If you still want it, you write why without the ticker.",
    },
    {
      id: "gut",
      impulse: "gut",
      title: "Gut on paper",
      how: "We turn the feeling into three boxes: time, sleep, and a fact from the filing. Empty box = wait.",
    },
    {
      id: "research",
      impulse: "research",
      title: "Research, then still wait",
      how: "You already read. Keel still asks for the risk match and a dull alternative before confirm.",
    },
  ],
};

function overlap(a: string[], b: string[]): number {
  const set = new Set(a);
  return b.reduce((sum, item) => sum + (set.has(item) ? 1 : 0), 0);
}

export function matchKeel(answers: Answers, catalog: Catalog): KeelProfile | null {
  if (
    answers.experience === null ||
    answers.goal === null ||
    answers.risk === null ||
    answers.impulse === null ||
    answers.horizon === null ||
    answers.assets.length === 0
  ) {
    return null;
  }

  const risk = answers.risk;
  const goal = answers.goal;
  const impulse = answers.impulse;
  const horizon = answers.horizon;
  const experience = answers.experience;

  const dashboard = [...catalog.assetProfiles]
    .map((profile) => ({
      profile,
      score:
        overlap(profile.assets, answers.assets) * 4 +
        (profile.risk.includes(risk) ? 3 : 0) +
        (profile.goals.includes(goal) ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ profile }) => ({
      id: profile.id,
      title: profile.title,
      summary: profile.summary,
      kind: profile.kind,
    }));

  const glossary = [...catalog.glossary]
    .map((entry) => ({
      entry,
      score: overlap(entry.confusions, answers.confusions),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ entry }) => ({ term: entry.term, plain: entry.plain }));

  const band =
    catalog.riskBands.find((item) => item.risk === risk) ??
    catalog.riskBands[0];

  const flow =
    catalog.decisionFlows.find((item) => item.impulse === impulse) ??
    catalog.decisionFlows[0];

  const exp = EXPERIENCE_LABEL[experience] ?? experience;
  const horizonLabel =
    horizon === "decade"
      ? "decade+"
      : horizon === "years"
        ? "years"
        : "months";

  return {
    line: `${exp} · ${horizonLabel}. ${catalog.line}`,
    experience,
    assets: answers.assets,
    risk,
    dashboard,
    glossary:
      glossary.length > 0
        ? glossary
        : catalog.glossary.slice(0, 3).map((entry) => ({
            term: entry.term,
            plain: entry.plain,
          })),
    riskIndicator: band
      ? {
          id: band.id,
          title: band.title,
          level: band.level,
          how: band.how,
        }
      : {
          id: "steady",
          title: "Calm meter",
          level: "Low swing",
          how: "We hide assets that historically lurch.",
        },
    decisionFlow: flow
      ? { id: flow.id, title: flow.title, how: flow.how }
      : {
          id: "social",
          title: "The feed pause",
          how: "A short flow that names the claim before you buy.",
        },
  };
}

export const CATALOG_PROMPT = `You are Keel, a first-time investor app for the Bit n Build Punjab "Mind Over Money" round.

Generate ONE catalog. Do not personalize to a single user. Cover stocks, funds, and crypto. No hype. No "to the moon". Plain English.

Rules:
- line: one sentence on what Keel does.
- assetProfiles: exactly 8. Beginner-friendly simplified assets. Tag assets with only: stocks, funds, crypto, unsure. Tag risk with only: steady, balanced, spicy. Tag goals with only: learn, save, grow, unhype. kind is stocks, funds, or crypto.
- glossary: exactly 8 financial terms in plain English. Tag confusions with only: jargon, charts, filings, social.
- riskBands: exactly 3, risk exactly: steady, balanced, spicy. level is a short swing label.
- decisionFlows: exactly 4, impulse exactly: friends, social, gut, research. These slow impulsive, trend-based buying.
- Titles stay short. Summaries stay concrete. Never give personalized financial advice. Never promise returns.`;
