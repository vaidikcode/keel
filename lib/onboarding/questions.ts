export type StepId =
  | "experience"
  | "goal"
  | "assets"
  | "risk"
  | "confusions"
  | "impulse"
  | "horizon";

export type StickerFill =
  | "electric-blue"
  | "mint-pop"
  | "lavender"
  | "ember"
  | "sunburst"
  | "voltage-violet";

export type Option = {
  id: string;
  label: string;
  fill?: StickerFill;
};

export type StepDef = {
  id: StepId;
  prompt: string;
  caption: string;
  mode: "single" | "multi";
  min: number;
  max: number;
  surface: "sky-wash" | "paper-white" | "concrete-gray" | "lavender";
  cards?: boolean;
};

export type Answers = {
  experience: string | null;
  goal: string | null;
  assets: string[];
  risk: string | null;
  confusions: string[];
  impulse: string | null;
  horizon: string | null;
};

export const emptyAnswers: Answers = {
  experience: null,
  goal: null,
  assets: [],
  risk: null,
  confusions: [],
  impulse: null,
  horizon: null,
};

export const STEPS: StepDef[] = [
  {
    id: "experience",
    prompt: "Have you invested yet?",
    caption: "Keel is built for first-timers. Honesty keeps the advice boring — on purpose.",
    mode: "single",
    min: 1,
    max: 1,
    surface: "sky-wash",
    cards: true,
  },
  {
    id: "goal",
    prompt: "What do you want first?",
    caption: "We will not optimize for a hot tip. We will optimize for this.",
    mode: "single",
    min: 1,
    max: 1,
    surface: "paper-white",
  },
  {
    id: "assets",
    prompt: "What should the dashboard show?",
    caption: "Stocks, funds, or crypto — simplified. Pick what you actually want to understand.",
    mode: "multi",
    min: 1,
    max: 3,
    surface: "concrete-gray",
  },
  {
    id: "risk",
    prompt: "How jumpy is your money?",
    caption: "This becomes your risk meter. Not a dare. A match.",
    mode: "single",
    min: 1,
    max: 1,
    surface: "lavender",
  },
  {
    id: "confusions",
    prompt: "What turns into soup?",
    caption: "Keel translates this into plain English. Pick the fog.",
    mode: "multi",
    min: 1,
    max: 3,
    surface: "sky-wash",
  },
  {
    id: "impulse",
    prompt: "Where do decisions leak from?",
    caption: "The guided flow is built to slow this down — especially social hype.",
    mode: "single",
    min: 1,
    max: 1,
    surface: "paper-white",
  },
  {
    id: "horizon",
    prompt: "How long can this sit?",
    caption: "Time is the quiet half of risk. We use it in the simulation.",
    mode: "single",
    min: 1,
    max: 1,
    surface: "concrete-gray",
  },
];

export const EXPERIENCE_OPTIONS: Option[] = [
  { id: "never", label: "Never invested", fill: "lavender" },
  { id: "paper", label: "Paper only", fill: "sunburst" },
  { id: "once", label: "Bought once", fill: "electric-blue" },
  { id: "follow", label: "I follow markets", fill: "mint-pop" },
];

export const GOAL_OPTIONS: Option[] = [
  { id: "learn", label: "Learn the words" },
  { id: "save", label: "Park savings" },
  { id: "grow", label: "Grow slowly" },
  { id: "unhype", label: "Cut the hype" },
];

export const ASSET_OPTIONS: Option[] = [
  { id: "stocks", label: "Stocks" },
  { id: "funds", label: "Index funds" },
  { id: "crypto", label: "Crypto" },
  { id: "unsure", label: "I don't know yet" },
];

export const RISK_OPTIONS: Option[] = [
  { id: "steady", label: "Sleep through it" },
  { id: "balanced", label: "Some swings" },
  { id: "spicy", label: "I can watch it drop" },
];

export const CONFUSION_OPTIONS: Option[] = [
  { id: "jargon", label: "Jargon" },
  { id: "charts", label: "Charts" },
  { id: "filings", label: "Balance sheets" },
  { id: "social", label: "Reels & tips" },
];

export const IMPULSE_OPTIONS: Option[] = [
  { id: "friends", label: "Friends" },
  { id: "social", label: "Reels & tweets" },
  { id: "gut", label: "Gut" },
  { id: "research", label: "I already research" },
];

export const HORIZON_OPTIONS: Option[] = [
  { id: "months", label: "A few months" },
  { id: "years", label: "A few years" },
  { id: "decade", label: "A decade+" },
];

const OPTIONS: Record<StepId, Option[]> = {
  experience: EXPERIENCE_OPTIONS,
  goal: GOAL_OPTIONS,
  assets: ASSET_OPTIONS,
  risk: RISK_OPTIONS,
  confusions: CONFUSION_OPTIONS,
  impulse: IMPULSE_OPTIONS,
  horizon: HORIZON_OPTIONS,
};

export function optionsForStep(id: StepId): Option[] {
  return OPTIONS[id];
}

export function selectedForStep(id: StepId, answers: Answers): string[] {
  switch (id) {
    case "experience":
      return answers.experience ? [answers.experience] : [];
    case "goal":
      return answers.goal ? [answers.goal] : [];
    case "assets":
      return answers.assets;
    case "risk":
      return answers.risk ? [answers.risk] : [];
    case "confusions":
      return answers.confusions;
    case "impulse":
      return answers.impulse ? [answers.impulse] : [];
    case "horizon":
      return answers.horizon ? [answers.horizon] : [];
  }
}

export function applySelection(
  id: StepId,
  answers: Answers,
  optionId: string,
  mode: "single" | "multi",
  max: number,
): Answers {
  const current = selectedForStep(id, answers);
  let next: string[];
  if (mode === "single") {
    next = [optionId];
  } else if (current.includes(optionId)) {
    next = current.filter((value) => value !== optionId);
  } else if (current.length >= max) {
    next = [...current.slice(1), optionId];
  } else {
    next = [...current, optionId];
  }

  switch (id) {
    case "experience":
      return { ...answers, experience: next[0] ?? null };
    case "goal":
      return { ...answers, goal: next[0] ?? null };
    case "assets":
      return { ...answers, assets: next };
    case "risk":
      return { ...answers, risk: next[0] ?? null };
    case "confusions":
      return { ...answers, confusions: next };
    case "impulse":
      return { ...answers, impulse: next[0] ?? null };
    case "horizon":
      return { ...answers, horizon: next[0] ?? null };
  }
}

export function isComplete(answers: Answers): boolean {
  return (
    answers.experience !== null &&
    answers.goal !== null &&
    answers.assets.length > 0 &&
    answers.risk !== null &&
    answers.confusions.length > 0 &&
    answers.impulse !== null &&
    answers.horizon !== null
  );
}

export const EXPERIENCE_LABEL: Record<string, string> = {
  never: "Never invested",
  paper: "Paper only",
  once: "Bought once",
  follow: "Follows markets",
};
