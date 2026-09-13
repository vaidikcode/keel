"use client";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useConvex } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import {
  defaultProfile,
  migrateProfile,
  riskLabels,
  currencyFormat,
  type Profile,
} from "@/lib/onboarding/questions";
import {
  applyIntakeToProfile,
  assetLabel,
  cadenceLabel,
  defaultIntake,
  intakeSchema,
  type Intake,
} from "@/lib/onboarding/signals";
import {
  countryOptions,
  currencyFor,
  guessCountryFromTimeZone,
} from "@/lib/onboarding/regions";
import { readSessionId } from "@/lib/session";
import { KeelMascot } from "@/components/dashboard/KeelMascot";
import { Icon } from "@/components/ui/Icon";
import { StickerNote } from "./StickerNote";
import { BudgetRange } from "./BudgetRange";
import { RocketButton } from "./RocketButton";
export { SESSION_KEY, readSessionId } from "@/lib/session";
const DRAFT = "keel-onboarding-v3";
type Choice = { value: string; title: string; description?: string };

/**
 * Every user answers the same five questions. Nothing branches, so two people's
 * answers are directly comparable — which is what makes them usable as a basis
 * for personalisation later.
 *
 * Option `description` is the intuition shown on the underside of each card.
 * It is written for someone who has never invested; the internal inference each
 * answer implies lives in lib/onboarding/signals.ts, never on screen.
 */
const VEHICLES: Choice[] = [
  {
    value: "trading",
    title: "Trading",
    description:
      "Buying and selling often, aiming to profit from short price moves. It asks for the most attention and carries the most risk.",
  },
  {
    value: "stocks",
    title: "Stocks",
    description:
      "Owning a small part of a company. Its value rises and falls with how that business is doing.",
  },
  {
    value: "crypto",
    title: "Crypto",
    description:
      "Digital assets like Bitcoin. Prices can move very sharply in both directions, including overnight.",
  },
  {
    value: "unsure",
    title: "Not sure",
    description:
      "A good place to start. Keel will show you a mix and explain each one before you decide.",
  },
];

const TIMESCALES: Choice[] = [
  {
    value: "days",
    title: "Days",
    description:
      "Positions opened and closed within a day or two. The fastest and most demanding way to invest.",
  },
  {
    value: "months",
    title: "Months",
    description:
      "Holding for a few months at a time. Short enough that a bad patch may not have time to recover.",
  },
  {
    value: "years",
    title: "Years",
    description:
      "Holding for several years. Time to ride out falls in value, which is what most first-time investors want.",
  },
  {
    value: "decade",
    title: "Decade",
    description:
      "Holding for ten years or more. The longest view, and the one that cares least about day-to-day noise.",
  },
];

const RISK_BANDS: Choice[] = [
  {
    value: "high",
    title: "High",
    description: "I could stay invested through a temporary drop of about 40% or more.",
  },
  {
    value: "balanced",
    title: "Balanced",
    description: "I could stay invested through a temporary drop of about 20%.",
  },
  {
    value: "low",
    title: "Low",
    description: "I would be uncomfortable after a temporary drop of about 10%.",
  },
  {
    value: "veryLow",
    title: "Very low",
    description: "A temporary drop of about 5% would already feel difficult.",
  },
];

const TITLES = [
  "What are you investing in?",
  "What is your time scale?",
  "Where are you?",
  "", // built from the first two answers
  "Risk tolerance",
];

const CAPTIONS = [
  "There's no wrong answer. Hover any option to see what it means.",
  "How long you plan to stay invested changes what suits you.",
  "This sets the currency used for amounts. Market prices stay in US dollars.",
  "An approximate range is plenty. You can change it whenever you like.",
  "How large a temporary fall could you sit through without selling?",
];

const HELPS = [
  "Different things behave differently. Knowing which one you have in mind lets Keel explain the right ideas instead of all of them at once.",
  "Money you need soon has less time to recover from a fall in value. Your time frame matters as much as what you invest in.",
  "Keel explores selected US stocks, US funds and selected crypto. Your country sets the currency shown for amounts; it does not imply these investments are available or suitable where you live.",
  "This is used for hypothetical examples only. Keel never assumes you have already invested it, and never promises a return.",
  "This isn't a test or a complete risk assessment. It's a starting point for understanding how much uncertainty feels comfortable.",
];

/**
 * Choices are cards that rotate on hover to show their underside. The title
 * sits on the face and the explanation waits underneath, so the question stays
 * scannable while the intuition is one hover away — before the click, not after.
 */
function Choices({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: string;
  choices: Choice[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="choices" role="group" aria-label={label}>
      {choices.map((c, i) => (
        <button
          type="button"
          key={c.value}
          className={`choice ${value === c.value ? "selected" : ""}`}
          aria-pressed={value === c.value}
          onClick={() => onChange(c.value)}
        >
          <span className="choice-flip">
            <span className="choice-face choice-front">
              <span className="choice-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <strong>{c.title}</strong>
              <span className="choice-check">
                {value === c.value ? <Icon name="check" size={16} /> : null}
              </span>
            </span>
            <span className="choice-face choice-back">
              <small>{c.description}</small>
            </span>
          </span>
          {/* Touch devices never hover, so the same copy stays readable inline. */}
          <small className="choice-inline">{c.description}</small>
        </button>
      ))}
    </div>
  );
}

export function Onboarding() {
  const router = useRouter(),
    { isLoaded, userId } = useAuth(),
    client = useConvex(),
    save = useMutation(api.profiles.saveExperience);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [intake, setIntake] = useState<Intake>(defaultIntake);
  const [step, setStep] = useState(-1),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [help, setHelp] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const interacted = useRef(false);
  const total = 5;

  useEffect(() => {
    if (!isLoaded) return;
    let active = true;
    async function restore() {
      try {
        const draftRaw = localStorage.getItem(DRAFT);
        const draft = draftRaw ? JSON.parse(draftRaw) : null;
        const restored = draft ? migrateProfile(draft.profile) : null;
        if (draft) {
          if (restored) setProfile(restored);
          const parsed = intakeSchema.safeParse(draft.intake);
          if (parsed.success) setIntake(parsed.data);
          // Answers come back, but the step does not: arriving at the site
          // should always show the landing page rather than dropping someone
          // back into the middle of a form they half remember.
        }
        setReady(true);
        const params = new URLSearchParams(location.search);
        if (userId && restored && params.has("continue")) {
          const savedIntake = intakeSchema.safeParse(draft?.intake);
          await save({
            sessionId: userId,
            profile: savedIntake.success
              ? applyIntakeToProfile(restored, savedIntake.data)
              : restored,
            intake: savedIntake.success ? savedIntake.data : undefined,
          });
          localStorage.removeItem(DRAFT);
          if (active)
            router.replace(
              `/dashboard/${(savedIntake.success ? applyIntakeToProfile(restored, savedIntake.data) : restored).interests[0] ?? "broad-funds"}`,
            );
          return;
        }
        // Coming back from sign-up: go straight into the questions rather than
        // making someone press Get started a second time.
        if (userId && params.has("start")) {
          interacted.current = true;
          setStep(0);
          router.replace("/");
        }
        const existing = await client.query(api.profiles.getBySession, {
          sessionId: userId ?? readSessionId(),
        });
        if (!active) return;
        if (!draft && existing && !interacted.current) {
          setProfile(migrateProfile(existing.profileV2 ?? existing.answers));
          const parsed = intakeSchema.safeParse(existing.intake);
          if (parsed.success) setIntake(parsed.data);
          if (params.has("edit")) setStep(0);
        }
      } catch {
        /* A local draft can still be edited while the backend reconnects. */
      }
      if (active) setReady(true);
    }
    void restore();
    return () => {
      active = false;
    };
  }, [client, isLoaded, router, save, userId]);

  // Country is only a default. It is guessed without a permission prompt and
  // without sending the visitor's IP to a third party, and stays editable.
  useEffect(() => {
    let active = true;
    async function detect() {
      let country: string | null = null;
      try {
        const res = await fetch("/api/region");
        if (res.ok) {
          const body = (await res.json()) as {
            country?: string;
            detected?: boolean;
          };
          if (body.detected && body.country) country = body.country;
        }
      } catch {
        /* Falls through to the timezone guess. */
      }
      if (!country) country = guessCountryFromTimeZone();
      if (!active || !country || interacted.current) return;
      const resolved = country;
      setIntake((p) => ({
        ...p,
        country: resolved,
        currency: currencyFor(resolved),
      }));
    }
    void detect();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (ready && step >= 0) {
      try {
        localStorage.setItem(DRAFT, JSON.stringify({ profile, intake, step }));
      } catch {
        /* Storage may be unavailable. */
      }
    }
  }, [profile, intake, step, ready]);

  useEffect(() => {
    if (step >= 0) heading.current?.focus();
  }, [step]);

  const set = <K extends keyof Intake>(key: K, value: Intake[K]) => {
    interacted.current = true;
    setIntake((p) => ({ ...p, [key]: value }));
    setHelp(false);
  };

  async function finish() {
    setBusy(true);
    setError("");
    try {
      // The v2 profile is derived so every existing consumer — the dashboard,
      // catalogFor, nextStep — keeps working without knowing intake exists.
      const merged = applyIntakeToProfile(profile, intake);
      // Answers are keyed to the account once there is one, so they follow the
      // person rather than the browser.
      await save({
        sessionId: userId ?? readSessionId(),
        profile: merged,
        intake,
      });
      localStorage.removeItem(DRAFT);
      router.push(`/dashboard/${merged.interests[0] ?? "broad-funds"}`);
    } catch (err) {
      console.error("Could not save onboarding answers", err);
      setError(
        "We couldn't save your answers. They are still here—please try again.",
      );
      setBusy(false);
    }
  }

  const pct = Math.min(100, ((step + 1) / total) * 100);
  const titles = [...TITLES];
  titles[3] =
    "How much do you have " +
    cadenceLabel[intake.timescale] +
    " to invest in " +
    assetLabel[intake.vehicle] +
    "?";

  return (
    <div className="onboarding">
      {/* No header bar: it was a thin strip of chrome above the content. The
          mark and the one link float over the page so the design owns the
          whole screen. */}
      <div className="floating-mark">
        {step < 0 ? (
          <Link href="/" className="wordmark" aria-label="Keel home">
            <span className="brand-mark">k.</span>
          </Link>
        ) : (
          /* Once the questions are open the mark is decoration only. There is
             nothing useful behind it here, and leaving it clickable dropped
             people back onto the landing page mid-flow. */
          <span className="wordmark mark-idle" aria-hidden="true">
            <span className="brand-mark">k.</span>
          </span>
        )}
        {step < 0 ? (
          <div className="floating-mark-end">
            <Link
              className="button secondary demo-button"
              href={userId ? "/dashboard" : "/dashboard?demo=1"}
            >
              {userId ? "DASHBOARD" : "DEMO"}
            </Link>
          </div>
        ) : null}
      </div>
      {step < 0 ? (
        <>
          <main className="welcome">
          <section className="welcome-copy">
            <span className="eyebrow">Your finances are your friend</span>
            <h1>
              Your money.
              <br />A little more
              <br />
              <em>understood.</em>
            </h1>
            <p>
              Meet Keel. Your curious companion for making sense of investing,
              one small step at a time.
            </p>
            <div className="welcome-actions">
              <RocketButton
                disabled={!ready || !isLoaded}
                onLaunch={() => {
                  interacted.current = true;
                  // Frictionless: an account is created first so answers
                  // belong to a person, then the questions open immediately.
                  if (!userId) {
                    router.push(
                      "/sign-up?redirect_url=" +
                        encodeURIComponent("/?start=1"),
                    );
                    return;
                  }
                  setStep(0);
                }}
              >
                GET STARTED
              </RocketButton>
            </div>
            <div className="welcome-foot">
              <span>
                <Icon name="check" size={15} /> No finance knowledge needed
              </span>
              <span>
                <Icon name="check" size={15} /> Go at your own pace
              </span>
            </div>
          </section>
          <section className="welcome-world" aria-label="Meet Keel">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <StickerNote id="note-top" className="world-note note-top" delay={0}>
              <Icon name="spark" />
              <span>
                Big questions.
                <br />
                <strong>Small, clear steps.</strong>
              </span>
            </StickerNote>
            <div className="world-mascot">
              <KeelMascot size={290} mood="wave" />
            </div>
            <div className="world-bubble">
              “Hi, I’m Keel.
              <br />
              Let’s figure this out together.”
            </div>
            <StickerNote
              id="note-bottom"
              className="world-note note-bottom"
              delay={90}
            >
              <span className="mini-bars">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              <span>
                Less guessing.
                <br />
                <strong>More understanding.</strong>
              </span>
            </StickerNote>
            <StickerNote
              id="note-coin"
              className="world-note note-coin"
              delay={180}
            >
              <span className="sticker-chip chip-amber">%</span>
              <span>
                Plain english.
                <br />
                <strong>Always.</strong>
              </span>
            </StickerNote>
            <StickerNote
              id="note-pace"
              className="world-note note-pace"
              delay={270}
            >
              <span className="sticker-chip chip-sea">✓</span>
              <span>
                <strong>Never a forecast.</strong>
              </span>
            </StickerNote>
            <span className="world-star star-one">✳</span>
            <span className="world-star star-two">✳</span>
          </section>
          </main>
        </>
      ) : (
        <main className="question-layout">
          <section className="question-panel">
            <div className="question-top">
              <span className="label">
                {step >= total
                  ? "YOUR STARTING POINT"
                  : "STEP " + (step + 1) + " OF " + total}
              </span>
            </div>
            <div key={step} className="question-content enter">
              <h1 ref={heading} tabIndex={-1} className="question-title">
                {step >= total ? "Here's where we'll start." : titles[step]}
              </h1>
              <p className="question-caption">
                {step >= total
                  ? "A starting point, not a permanent decision. You can edit any answer."
                  : CAPTIONS[step]}
              </p>
              {step === 0 && (
                <Choices
                  label={titles[0]}
                  value={intake.vehicle}
                  onChange={(v) => set("vehicle", v as Intake["vehicle"])}
                  choices={VEHICLES}
                />
              )}
              {step === 1 && (
                <Choices
                  label={titles[1]}
                  value={intake.timescale}
                  onChange={(v) => set("timescale", v as Intake["timescale"])}
                  choices={TIMESCALES}
                />
              )}
              {step === 2 && (
                <>
                  <label className="field-label" htmlFor="country">
                    Country
                  </label>
                  <select
                    id="country"
                    value={intake.country}
                    onChange={(e) => {
                      interacted.current = true;
                      const country = e.target.value;
                      setIntake((p) => ({
                        ...p,
                        country,
                        currency: currencyFor(country),
                      }));
                    }}
                  >
                    {countryOptions().map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="fine-print">
                    Amounts are shown in {intake.currency}. Market prices remain
                    in USD without currency conversion.
                  </p>
                </>
              )}
              {step === 3 && (
                <BudgetRange
                  low={intake.budgetLow}
                  high={intake.budgetHigh}
                  currency={intake.currency}
                  onChange={(low, high) => {
                    interacted.current = true;
                    setIntake((p) => ({
                      ...p,
                      budgetLow: low,
                      budgetHigh: high,
                    }));
                  }}
                />
              )}
              {step === 4 && (
                <Choices
                  label={titles[4]}
                  value={intake.riskBand}
                  onChange={(v) => set("riskBand", v as Intake["riskBand"])}
                  choices={RISK_BANDS}
                />
              )}
              {step >= total && (
                <div className="summary-list">
                  {[
                    ["What you invest in", assetLabel[intake.vehicle], 0],
                    ["Time scale", cadenceLabel[intake.timescale], 1],
                    ["Currency", intake.currency, 2],
                    [
                      "Amount",
                      intake.budgetLow === null
                        ? "Not set"
                        : currencyFormat(intake.budgetLow, intake.currency) +
                          " – " +
                          currencyFormat(
                            intake.budgetHigh ?? intake.budgetLow,
                            intake.currency,
                          ),
                      3,
                    ],
                    [
                      "Comfort with risk",
                      riskLabels[applyIntakeToProfile(profile, intake).risk],
                      4,
                    ],
                  ].map(([label, value, index]) => (
                    <button key={label} onClick={() => setStep(Number(index))}>
                      <span>
                        <small>{label}</small>
                        <strong>{value}</strong>
                      </span>
                      <Icon name="settings" size={18} />
                    </button>
                  ))}
                </div>
              )}
              {step < total && (
                <div className="onboard-help">
                  <button
                    className="text-button"
                    aria-expanded={help}
                    onClick={() => setHelp(!help)}
                  >
                    <Icon name="help" size={17} /> Why does Keel ask?
                  </button>
                  {help && <p>{HELPS[step]}</p>}
                </div>
              )}
              {error && (
                <p role="alert" className="error-message">
                  {error}
                </p>
              )}
              <div className="question-bottom">
                <span className="fine-print">
                  {busy
                    ? "Saving your answers…"
                    : "You can change this anytime."}
                </span>
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() => {
                    if (step >= total) void finish();
                    else {
                      setStep((s) => s + 1);
                      setHelp(false);
                    }
                  }}
                >
                  {busy
                    ? "Saving…"
                    : step >= total
                      ? "See my options"
                      : "Continue"}
                  <Icon name="arrow" size={18} />
                </button>
              </div>
            </div>
          </section>
          {/* The progress bar lives at the foot of the screen and Keel rides
              it, so the only thing competing with the question is the question. */}
          <div
            className="progress-rail"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={Math.min(step + 1, total)}
            aria-label="Onboarding progress"
          >
            <div className="progress-rail-track">
              <span
                className="progress-rail-fill"
                style={{ width: `${pct}%` }}
              />
              <span className="progress-rail-keel" style={{ left: `${pct}%` }}>
                <KeelMascot size={70} mood={help ? "question" : "idle"} />
              </span>
            </div>
            <span className="progress-rail-label">
              {step >= total ? "All done" : `${step + 1} / ${total}`}
            </span>
          </div>
        </main>
      )}
      <footer className="onboard-footer">
        <span>Made for your first step. And the one after that.</span>
        <span>KEEL / FIND YOUR BEARINGS</span>
      </footer>
    </div>
  );
}
