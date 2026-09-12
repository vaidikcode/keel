export type StepId = "watch" | "noise" | "sleep" | "fog" | "intent";

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
  watch: string | null;
  noise: string | null;
  sleep: string | null;
  fog: string[];
  intent: string | null;
};

export const emptyAnswers: Answers = {
  watch: null,
  noise: null,
  sleep: null,
  fog: [],
  intent: null,
};

export const STEPS: StepDef[] = [
  {
    id: "watch",
    prompt: "What should Keel watch?",
    caption: "Stocks, funds, or crypto — we keep a tiny shelf. Pick the lane.",
    mode: "single",
    min: 1,
    max: 1,
    surface: "sky-wash",
    cards: true,
  },
  {
    id: "noise",
    prompt: "Where does the noise hit you?",
    caption: "This becomes the Feed pane. Headlines, charts, viral, or friends.",
    mode: "single",
    min: 1,
    max: 1,
    surface: "paper-white",
  },
  {
    id: "sleep",
    prompt: "How jumpy can you sleep?",
    caption: "This becomes your sleep meter. Not a dare. A match.",
    mode: "single",
    min: 1,
    max: 1,
    surface: "lavender",
  },
  {
    id: "fog",
    prompt: "What turns into soup?",
    caption: "Keel peels these first when you tap a word on the board.",
    mode: "multi",
    min: 1,
    max: 3,
    surface: "concrete-gray",
  },
  {
    id: "intent",
    prompt: "What should Keel do first?",
    caption: "Learn the words, cut the hype, or park it. This sets Keel's opening move.",
    mode: "single",
    min: 1,
    max: 1,
    surface: "sky-wash",
  },
];

export const WATCH_OPTIONS: Option[] = [
  { id: "stocks", label: "Stocks", fill: "electric-blue" },
  { id: "funds", label: "Index funds", fill: "mint-pop" },
  { id: "crypto", label: "Crypto", fill: "sunburst" },
];

export const NOISE_OPTIONS: Option[] = [
  { id: "headlines", label: "Headlines" },
  { id: "charts", label: "Charts" },
  { id: "viral", label: "Viral tips" },
  { id: "friends", label: "Friends" },
];

export const SLEEP_OPTIONS: Option[] = [
  { id: "steady", label: "Sleep through it" },
  { id: "balanced", label: "Some swings" },
  { id: "spicy", label: "I can watch it drop" },
];

export const FOG_OPTIONS: Option[] = [
  { id: "jargon", label: "Jargon" },
  { id: "charts", label: "Charts" },
  { id: "filings", label: "Balance sheets" },
  { id: "social", label: "Reels & tips" },
];

export const INTENT_OPTIONS: Option[] = [
  { id: "learn", label: "Learn the words" },
  { id: "unhype", label: "Cut the hype" },
  { id: "park", label: "Park it" },
];

const OPTIONS: Record<StepId, Option[]> = {
  watch: WATCH_OPTIONS,
  noise: NOISE_OPTIONS,
  sleep: SLEEP_OPTIONS,
  fog: FOG_OPTIONS,
  intent: INTENT_OPTIONS,
};

export function optionsForStep(id: StepId): Option[] {
  return OPTIONS[id];
}

export function selectedForStep(id: StepId, answers: Answers): string[] {
  switch (id) {
    case "watch":
      return answers.watch ? [answers.watch] : [];
    case "noise":
      return answers.noise ? [answers.noise] : [];
    case "sleep":
      return answers.sleep ? [answers.sleep] : [];
    case "fog":
      return answers.fog;
    case "intent":
      return answers.intent ? [answers.intent] : [];
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
    case "watch":
      return { ...answers, watch: next[0] ?? null };
    case "noise":
      return { ...answers, noise: next[0] ?? null };
    case "sleep":
      return { ...answers, sleep: next[0] ?? null };
    case "fog":
      return { ...answers, fog: next };
    case "intent":
      return { ...answers, intent: next[0] ?? null };
  }
}

export function isComplete(answers: Answers): boolean {
  return (
    answers.watch !== null &&
    answers.noise !== null &&
    answers.sleep !== null &&
    answers.fog.length > 0 &&
    answers.intent !== null
  );
}
