import type { AnalyzedAsset } from "@/lib/dashboard/analyzedAsset";
import type { Reply } from "@/lib/dashboard/model";
import { profileAnswers, type Profile } from "@/lib/onboarding/questions";

/** Canned assistant reply. Live model calls were removed to keep costs down. */
export const DEMO_ASK_REPLY: Reply = {
  text: "This is a demo reply. Keel began as a hackathon project; live LLM answers were removed to reduce cost, so every question now returns this canned response.",
  action: "none",
  sourceIds: [],
};

export function demoThoughts(profile: Profile) {
  const answers = profileAnswers(profile);
  return {
    paragraphs: [
      "This ranking is a demo. Keel used to write these thoughts with an LLM; that call was removed to reduce cost.",
      "Risk numbers still come from price history, not a model. Fit is a simple comparison of those numbers with your answers.",
      "Questions in the overlay also return a canned demo reply instead of a live model call.",
    ],
    because: [
      { field: "risk", text: answers.risk },
      { field: "horizon", text: answers.horizon },
      { field: "goal", text: answers.goal },
    ],
    sourceIds: [] as string[],
  };
}

export function demoAnalyzedAsset(question: string): AnalyzedAsset {
  return {
    id: "external:nasdaq:aapl",
    name: "Apple",
    ticker: "AAPL",
    exchange: "NASDAQ",
    platform: "Other",
    question,
    summary:
      "This is a demo analysis. Live tab reading used an LLM and was turned off to reduce cost, so Keel now returns this canned Apple example instead of reading the screenshot.",
    sourceIds: ["https://finance.yahoo.com/quote/AAPL/"],
    analyzedAt: Date.now(),
  };
}
