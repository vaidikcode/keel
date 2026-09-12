"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
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

type Phase = "welcome" | "step" | "assembling";

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

export const SESSION_KEY = "keel-session";

export function readSessionId(): string {
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }
  const next = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, next);
  return next;
}

export function Onboarding() {
  const saveProfile = useMutation(api.profiles.save);
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("welcome");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
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
      if (
        !isComplete(finalAnswers) ||
        !finalAnswers.watch ||
        !finalAnswers.noise ||
        !finalAnswers.sleep ||
        !finalAnswers.intent
      ) {
        setPhase("step");
        return;
      }
      setPhase("assembling");
      const sessionId = readSessionId();
      try {
        await saveProfile({
          sessionId,
          answers: {
            watch: finalAnswers.watch,
            noise: finalAnswers.noise,
            sleep: finalAnswers.sleep,
            fog: finalAnswers.fog,
            intent: finalAnswers.intent,
          },
        });
      } catch (error) {
        console.error("Could not save profile", error);
      }

      try {
        const response = await fetch("/api/spread", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            answers: {
              watch: finalAnswers.watch,
              noise: finalAnswers.noise,
              sleep: finalAnswers.sleep,
              fog: finalAnswers.fog,
              intent: finalAnswers.intent,
            },
          }),
        });
        if (!response.ok) {
          console.error("Spread assemble failed", await response.text());
        }
      } catch (error) {
        console.error("Spread assemble error", error);
      }

      router.push("/dashboard");
    },
    [router, saveProfile],
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
      <span className="sticker relative mb-8 rotate-[-8deg] bg-mint-pop">
        <span className="font-aeonik-pro text-[13px] font-bold">K</span>
      </span>
      <h2 className="keel-in font-aeonik-pro text-[30px] font-bold leading-[1.1] md:text-[64px] md:leading-none">
        Keel is reading the filing
      </h2>
      <p className="keel-in mt-4 font-aeonik-pro text-[15px] font-medium [animation-delay:120ms]">
        Packing Feed, Filing, sleep, and a few lines for you to tap.
      </p>
    </section>
  );
}
