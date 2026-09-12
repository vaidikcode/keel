"use client";

import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import {
  FALLBACK_CATALOG,
  catalogSchema,
  matchKeel,
  type Catalog,
  type KeelProfile,
} from "@/lib/onboarding/catalog";
import {
  STEPS,
  applySelection,
  emptyAnswers,
  isComplete,
  optionsForStep,
  selectedForStep,
  type Answers,
  type StickerFill,
} from "@/lib/onboarding/questions";
import { LogoMark, Marquee, Ribbon, Stickers } from "./graphics";

type Phase = "welcome" | "step" | "assembling" | "keel";
type CatalogSource = "gateway" | "fallback";

type CatalogPayload = {
  catalog: Catalog;
  source: CatalogSource;
};

const SURFACE: Record<string, string> = {
  "sky-wash": "bg-sky-wash",
  "paper-white": "bg-paper-white",
  "concrete-gray": "bg-concrete-gray",
  lavender: "bg-lavender",
};

const FILL: Record<StickerFill, string> = {
  "electric-blue": "bg-electric-blue",
  "mint-pop": "bg-mint-pop",
  lavender: "bg-lavender",
  ember: "bg-ember",
  sunburst: "bg-sunburst",
  "voltage-violet": "bg-voltage-violet",
};

const SESSION_KEY = "keel-session";

function readSessionId(): string {
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }
  const next = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, next);
  return next;
}

async function requestCatalog(): Promise<CatalogPayload> {
  try {
    const response = await fetch("/api/onboard", { method: "POST" });
    if (!response.ok) {
      return { catalog: FALLBACK_CATALOG, source: "fallback" };
    }
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "catalog" in body &&
      "source" in body
    ) {
      const parsed = catalogSchema.safeParse(body.catalog);
      if (!parsed.success) {
        return { catalog: FALLBACK_CATALOG, source: "fallback" };
      }
      const source = body.source === "gateway" ? "gateway" : "fallback";
      return { catalog: parsed.data, source };
    }
    return { catalog: FALLBACK_CATALOG, source: "fallback" };
  } catch {
    return { catalog: FALLBACK_CATALOG, source: "fallback" };
  }
}

export function Onboarding() {
  const saveProfile = useMutation(api.profiles.save);
  const [phase, setPhase] = useState<Phase>("welcome");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [keel, setKeel] = useState<KeelProfile | null>(null);
  const [catalog, setCatalog] = useState<CatalogPayload | null>(null);
  const catalogPromise = useRef<Promise<CatalogPayload> | null>(null);
  const advanceTimer = useRef<number | null>(null);

  const step = STEPS[stepIndex];

  const clearAdvance = () => {
    if (advanceTimer.current !== null) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  };

  useEffect(() => {
    return () => clearAdvance();
  }, []);

  const finish = useCallback(
    async (finalAnswers: Answers) => {
      let payload = catalog;
      if (!payload) {
        setPhase("assembling");
        payload = await (catalogPromise.current ?? requestCatalog());
        setCatalog(payload);
      }
      const matched = matchKeel(finalAnswers, payload.catalog);
      if (
        !matched ||
        !isComplete(finalAnswers) ||
        !finalAnswers.experience ||
        !finalAnswers.goal ||
        !finalAnswers.risk ||
        !finalAnswers.impulse ||
        !finalAnswers.horizon
      ) {
        setPhase("step");
        return;
      }
      setKeel(matched);
      setPhase("keel");
      try {
        await saveProfile({
          sessionId: readSessionId(),
          answers: {
            experience: finalAnswers.experience,
            goal: finalAnswers.goal,
            assets: finalAnswers.assets,
            risk: finalAnswers.risk,
            confusions: finalAnswers.confusions,
            impulse: finalAnswers.impulse,
            horizon: finalAnswers.horizon,
          },
          keel: matched,
          catalogSource: payload.source,
        });
      } catch (error) {
        console.error("Could not save keel", error);
      }
    },
    [catalog, saveProfile],
  );

  function goNext(nextAnswers: Answers) {
    if (stepIndex >= STEPS.length - 1) {
      void finish(nextAnswers);
      return;
    }
    setStepIndex((index) => index + 1);
  }

  function onStart() {
    readSessionId();
    catalogPromise.current = requestCatalog().then((payload) => {
      setCatalog(payload);
      return payload;
    });
    setPhase("step");
    setStepIndex(0);
  }

  function onPick(optionId: string) {
    if (!step) {
      return;
    }
    clearAdvance();
    const next = applySelection(
      step.id,
      answers,
      optionId,
      step.mode,
      step.max,
    );
    setAnswers(next);
    if (step.mode === "single") {
      advanceTimer.current = window.setTimeout(() => {
        goNext(next);
      }, 420);
    }
  }

  function onContinue() {
    if (!step) {
      return;
    }
    const selected = selectedForStep(step.id, answers);
    if (selected.length < step.min) {
      return;
    }
    goNext(answers);
  }

  function onBack() {
    clearAdvance();
    if (stepIndex === 0) {
      setPhase("welcome");
      return;
    }
    setStepIndex((index) => index - 1);
  }

  const surface =
    phase === "welcome"
      ? "bg-sky-wash"
      : phase === "keel"
        ? "bg-sky-wash"
        : phase === "assembling"
          ? "bg-paper-white"
          : SURFACE[step?.surface ?? "sky-wash"];

  return (
    <div className={`relative flex min-h-full flex-1 flex-col ${surface}`}>
      {phase === "welcome" ? (
        <Marquee text="Mind over money  ·  Cut the hype  ·  Plain English  ·  First-time investors" />
      ) : null}

      <header className="flex items-center justify-between px-5 py-4 md:px-8">
        <LogoMark />
        {phase === "step" && step ? (
          <ol className="flex gap-1" aria-label="Onboarding progress">
            {STEPS.map((item, index) => (
              <li
                key={item.id}
                className={`size-2 rounded-full border border-carbon ${
                  index <= stepIndex ? "bg-carbon" : "bg-paper-white"
                }`}
              />
            ))}
          </ol>
        ) : (
          <span className="font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase">
            Keel
          </span>
        )}
      </header>

      {phase === "welcome" ? <Welcome onStart={onStart} /> : null}
      {phase === "step" && step ? (
        <Question
          key={step.id}
          prompt={step.prompt}
          caption={step.caption}
          mode={step.mode}
          min={step.min}
          max={step.max}
          cards={Boolean(step.cards)}
          options={optionsForStep(step.id)}
          selected={selectedForStep(step.id, answers)}
          onPick={onPick}
          onContinue={onContinue}
          onBack={onBack}
        />
      ) : null}
      {phase === "assembling" ? <Assembling /> : null}
      {phase === "keel" && keel ? (
        <KeelResult
          keel={keel}
          onReset={() => {
            setPhase("welcome");
            setAnswers(emptyAnswers);
            setKeel(null);
            setStepIndex(0);
          }}
        />
      ) : null}
    </div>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-8 text-center">
      <Ribbon className="pointer-events-none absolute left-1/2 top-[18%] w-[140%] max-w-none -translate-x-1/2 md:top-[12%]" />
      <Stickers />
      <p className="keel-in relative font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase">
        Mind over money
      </p>
      <h1 className="keel-display keel-in relative mt-4 text-carbon [animation-delay:80ms]">
        KEEL
      </h1>
      <p className="keel-in relative mt-6 max-w-xl font-aeonik-pro text-[24px] font-medium leading-[1.2] tracking-[-0.01em] text-carbon [animation-delay:180ms]">
        Investing, without the noise.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="keel-in relative mt-10 rounded-[40px] border border-carbon bg-carbon px-5 py-3 font-aeonik-pro text-[14px] font-bold tracking-[0.032em] text-paper-white [animation-delay:280ms]"
      >
        Start
      </button>
    </section>
  );
}

function Question({
  prompt,
  caption,
  mode,
  min,
  max,
  cards,
  options,
  selected,
  onPick,
  onContinue,
  onBack,
}: {
  prompt: string;
  caption: string;
  mode: "single" | "multi";
  min: number;
  max: number;
  cards: boolean;
  options: Array<{ id: string; label: string; fill?: StickerFill }>;
  selected: string[];
  onPick: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const canContinue = selected.length >= min;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-10 pt-6 md:pt-16">
      <button
        type="button"
        onClick={onBack}
        className="keel-in self-start rounded-full border border-carbon bg-paper-white px-3 py-2 font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase"
      >
        Back
      </button>
      <h2 className="keel-in mt-10 font-aeonik-pro text-[30px] font-bold leading-[1.1] tracking-[-0.01em] text-carbon">
        {prompt}
      </h2>
      <p className="keel-in mt-4 max-w-xl font-aeonik-pro text-[15px] font-medium leading-[1.39] tracking-[-0.01em] text-carbon [animation-delay:120ms]">
        {caption}
      </p>
      <div
        className={`mt-10 flex flex-wrap ${cards ? "gap-3" : "gap-2"}`}
        role="group"
        aria-label={prompt}
      >
        {options.map((option, index) => {
          const isOn = selected.includes(option.id);
          const sticker = option.fill ? FILL[option.fill] : "";
          const delay = `${180 + index * 55}ms`;
          if (cards) {
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isOn}
                onClick={() => onPick(option.id)}
                style={{ animationDelay: delay }}
                className={`keel-in min-h-28 min-w-[140px] flex-1 rounded-[20px] border border-carbon px-5 py-6 text-left font-aeonik-pro text-[24px] font-bold leading-[1.2] tracking-[-0.01em] ${
                  isOn ? "bg-carbon text-paper-white" : `${sticker} text-carbon`
                }`}
              >
                {option.label}
              </button>
            );
          }
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isOn}
              onClick={() => onPick(option.id)}
              style={{ animationDelay: delay }}
              className={`keel-in rounded-full border border-carbon px-4 py-2.5 font-aeonik-pro text-[13px] font-bold tracking-[0.032em] ${
                isOn ? "bg-carbon text-paper-white" : "bg-paper-white text-carbon"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {mode === "multi" ? (
        <div className="mt-auto flex items-center justify-between gap-4 pt-12">
          <p className="font-aeonik-pro text-[12px] font-medium tracking-[-0.01em]">
            {selected.length}/{max}
          </p>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="rounded-[40px] border border-carbon bg-carbon px-5 py-3 font-aeonik-pro text-[14px] font-bold tracking-[0.032em] text-paper-white disabled:bg-soft-mist disabled:text-carbon"
          >
            Continue
          </button>
        </div>
      ) : null}
    </section>
  );
}

function Assembling() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <span className="sticker mb-8 rotate-[-8deg] bg-mint-pop">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="#000" strokeWidth="2">
          <path d="m6.5 12.5 3.4 3.4 7.6-7.8" />
        </svg>
      </span>
      <h2 className="keel-in font-aeonik-pro text-[30px] font-bold leading-[1.1] md:text-[64px] md:leading-none">
        Cutting the jargon
      </h2>
      <p className="keel-in mt-4 font-aeonik-pro text-[15px] font-medium [animation-delay:120ms]">
        Matching a dashboard, a risk meter, and a pause before you buy.
      </p>
    </section>
  );
}

function KeelResult({
  keel,
  onReset,
}: {
  keel: KeelProfile;
  onReset: () => void;
}) {
  const cards = [
    {
      fill: "bg-lavender",
      kicker: "Dashboard",
      title: keel.dashboard[0]?.title ?? "Simplified assets",
      body: keel.dashboard.map((item) => item.title).join(" · "),
    },
    {
      fill: "bg-electric-blue",
      kicker: "Plain English",
      title: keel.glossary[0]?.term ?? "Glossary",
      body: keel.glossary[0]?.plain ?? keel.line,
    },
    {
      fill: "bg-sunburst",
      kicker: "Risk meter",
      title: `${keel.riskIndicator.title} · ${keel.riskIndicator.level}`,
      body: keel.riskIndicator.how,
    },
    {
      fill: "bg-voltage-violet",
      kicker: "Before you buy",
      title: keel.decisionFlow.title,
      body: keel.decisionFlow.how,
    },
  ];

  return (
    <section className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-16 pt-4">
      <Ribbon className="pointer-events-none absolute -left-10 top-0 w-[80%] opacity-80" />
      <p className="keel-in relative font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase">
        Your keel
      </p>
      <h2 className="keel-in relative mt-3 max-w-3xl font-aeonik-pro text-[30px] font-bold leading-[1.1] md:text-[64px] md:leading-none">
        Noise is off.
      </h2>
      <p className="keel-in relative mt-4 max-w-2xl font-aeonik-pro text-[15px] font-medium leading-[1.39]">
        {keel.line}
      </p>
      <div className="relative mt-10 grid gap-3 md:grid-cols-2">
        {cards.map((card, index) => (
          <article
            key={card.kicker}
            style={{ animationDelay: `${120 + index * 80}ms` }}
            className={`keel-in rounded-[20px] border border-carbon p-6 ${card.fill} ${
              card.fill === "bg-voltage-violet" ? "text-paper-white" : "text-carbon"
            }`}
          >
            <p className="font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase">
              {card.kicker}
            </p>
            <h3 className="mt-3 font-aeonik-pro text-[24px] font-bold leading-[1.2]">
              {card.title}
            </h3>
            <p className="mt-3 font-aeonik-pro text-[15px] font-medium leading-[1.39] tracking-[-0.01em]">
              {card.body}
            </p>
          </article>
        ))}
      </div>
      {keel.glossary.length > 1 ? (
        <ul className="keel-in relative mt-8 space-y-3 [animation-delay:400ms]">
          {keel.glossary.slice(1).map((item) => (
            <li
              key={item.term}
              className="rounded-[20px] border border-carbon bg-paper-white px-5 py-4 font-aeonik-pro text-[15px] font-medium leading-[1.39]"
            >
              <span className="font-bold tracking-[0.032em] uppercase">
                {item.term}
              </span>
              <span className="mt-1 block">{item.plain}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        onClick={onReset}
        className="relative mt-10 self-start rounded-full border border-carbon bg-paper-white px-4 py-2.5 font-aeonik-pro text-[13px] font-bold tracking-[0.032em]"
      >
        Start over
      </button>
    </section>
  );
}
