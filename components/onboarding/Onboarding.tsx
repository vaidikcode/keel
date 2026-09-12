"use client";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useConvex } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthControls } from "@/components/auth/AuthControls";
import { api } from "@/convex/_generated/api";
import {
  defaultProfile,
  migrateProfile,
  horizonLabels,
  currencyFormat,
  profileAnswers,
  type Profile,
} from "@/lib/onboarding/questions";
import { InterestChips } from "./InterestChips";
import { readSessionId } from "@/lib/session";
import { KeelMascot } from "@/components/dashboard/KeelMascot";
import { Icon } from "@/components/ui/Icon";
export { SESSION_KEY, readSessionId } from "@/lib/session";
const DRAFT = "keel-onboarding-v3";
const STEP_IDS = [
  "intent",
  "interests",
  "goal",
  "country",
  "experience",
  "risk",
  "lossTolerance",
  "amount",
  "income",
  "emergency",
  "debt",
] as const;
type StepId = (typeof STEP_IDS)[number];
const stepIndex = (id: StepId) => STEP_IDS.indexOf(id);
type Choice = { value: string; title: string; description?: string };
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
          <span className="choice-number">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>
            <strong>{c.title}</strong>
            {c.description && <small>{c.description}</small>}
          </span>
          <span className="choice-check">
            {value === c.value ? <Icon name="check" size={16} /> : null}
          </span>
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
  const [step, setStep] = useState(-1),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [help, setHelp] = useState(false),
    [hasProfile, setHasProfile] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const interacted = useRef(false);
  const total = STEP_IDS.length;
  const current: StepId | null = step >= 0 && step < total ? STEP_IDS[step] : null;
  useEffect(() => {
    if (!isLoaded) return;
    let active = true;
    async function restore() {
      try {
        const draftRaw = localStorage.getItem(DRAFT);
        const draft = draftRaw ? JSON.parse(draftRaw) : null;
        const restored = draft ? migrateProfile(draft.profile) : null;
        if (restored) {
          setProfile(restored);
          setStep(Math.max(-1, Math.min(draft.step ?? -1, STEP_IDS.length)));
        }
        setReady(true);
        if (
          userId &&
          restored &&
          new URLSearchParams(location.search).has("continue")
        ) {
          await save({ sessionId: userId, profile: restored });
          localStorage.removeItem(DRAFT);
          if (active) router.replace(`/dashboard/${restored.interests[0] ?? "broad-funds"}`);
          return;
        }
        const existing = await client.query(api.profiles.getBySession, {
          sessionId: userId ?? readSessionId(),
        });
        if (!active) return;
        setHasProfile(Boolean(existing));
        if (!draft && existing && !interacted.current) {
          setProfile(migrateProfile(existing.profileV3 ?? existing.profileV2 ?? existing.answers));
          if (new URLSearchParams(location.search).has("edit")) setStep(0);
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
  useEffect(() => {
    if (ready && step >= 0) {
      try {
        localStorage.setItem(DRAFT, JSON.stringify({ profile, step }));
      } catch {
        /* Storage may be unavailable. */
      }
    }
  }, [profile, step, ready]);
  useEffect(() => {
    if (step >= 0) heading.current?.focus();
  }, [step]);
  const update = (key: keyof Profile, value: Profile[keyof Profile]) => {
    interacted.current = true;
    setProfile((p) => ({ ...p, [key]: value }));
    setHelp(false);
  };
  async function finish() {
    setBusy(true);
    setError("");
    try {
      if (!userId) {
        router.push(
          "/sign-in?redirect_url=" + encodeURIComponent("/?continue=1"),
        );
        return;
      }
      await save({ sessionId: userId, profile });
      localStorage.removeItem(DRAFT);
      router.push(`/dashboard/${profile.interests[0] ?? "broad-funds"}`);
    } catch (err) {
      console.error("Could not save onboarding answers", err);
      setError(
        "We couldn't save your answers. They are still here—please try again.",
      );
      setBusy(false);
    }
  }
  const copy: Record<StepId, { title: string; caption: string; help: string; track: string }> = {
    intent: {
      title: "What would you like help with?",
      caption: "We'll start with what matters to you. You can change this later.",
      help: "Learning starts with explanations. Choosing starts with your goal and circumstances. Understanding focuses on comparing an investment you're curious about.",
      track: "Your starting point",
    },
    interests: {
      title: "What would you like to explore?",
      caption: "Pick as many as you like. The first one you pick is where your dashboard opens.",
      help: "Keel groups investments into seven categories so you can compare like with like. Picking one does not mean it suits you; it just tells Keel where to start ranking.",
      track: "Your interests",
    },
    goal: {
      title: "What are you working toward?",
      caption: "Your goal and time frame help put your options in context.",
      help: "Money you need soon has less time to recover from a fall in value. Your time frame matters as much as the investment itself, so it carries real weight in your ranking.",
      track: "Your goal",
    },
    country: {
      title: "Where do you call home?",
      caption: "This helps us explain market coverage and use familiar amounts.",
      help: "For now, Keel explores selected US stocks, US funds and selected crypto assets. Prices stay in US dollars. If you live outside the US, Keel also opens international funds for you.",
      track: "Your home",
    },
    experience: {
      title: "Have you invested before?",
      caption: "No right answer. I'll meet you where you are.",
      help: "Experience changes how much detail Keel shows up front and nudges the ranking a little toward calmer options for newcomers.",
      track: "Your experience",
    },
    risk: {
      title: "How would a price drop feel?",
      caption: "Imagine your investment fell 20%. How would you feel?",
      help: "This isn't a test or a complete risk assessment. It's a starting point for understanding how much uncertainty feels comfortable, and it's one of the biggest inputs to your ranking.",
      track: "Your comfort",
    },
    lossTolerance: {
      title: "How big a drop could you sit through?",
      caption: "Think about one bad year. At what point would you feel you had to act?",
      help: "Every investment Keel ranks has fallen at some point in the last year. Comparing that fall with the size you could sit through is how Keel decides what fits.",
      track: "Your limit",
    },
    amount: {
      title: "What amount are you considering?",
      caption: "An estimate is enough. Leave blank if you'd rather not say.",
      help: "I'll use this amount for hypothetical scenarios, not assume you have already invested it. If you also add a monthly amount, Keel can tell whether a lump sum is large for you.",
      track: "Your amount",
    },
    income: {
      title: "How steady is your income?",
      caption: "Steady income makes it easier to leave money invested through a rough patch.",
      help: "If income varies or has stopped, you may need to reach your money sooner. That lowers how much price movement is comfortable, so Keel leans calmer.",
      track: "Your income",
    },
    emergency: {
      title: "Do you have money for unexpected costs?",
      caption: "Think of money you could use for an urgent bill without selling investments.",
      help: "Cash for unexpected expenses can help you avoid selling investments at a bad time. Without it, Keel opens bond and cash funds alongside your interests.",
      track: "Your cash buffer",
    },
    debt: {
      title: "Do you have expensive debt?",
      caption: "For example, credit card balances or other high-interest borrowing.",
      help: "Borrowing costs are part of the picture when deciding what to do with available money. High-interest debt usually costs more than investments earn.",
      track: "Your borrowing",
    },
  };
  const answers = profileAnswers(profile);
  const summaryRows: Array<[string, string, StepId]> = [
    ["What you want help with", answers.intent, "intent"],
    ["Categories to explore", answers.interests, "interests"],
    ["Your goal", answers.goal, "goal"],
    ["Time frame", answers.horizon, "goal"],
    ["Home and currency", `${answers.country} · ${answers.currency}`, "country"],
    ["Experience", answers.experience, "experience"],
    ["Comfort with price changes", answers.risk, "risk"],
    ["Drop you could sit through", answers.lossTolerance, "lossTolerance"],
    ["Amount", `${answers.amount} · ${answers.monthly}`, "amount"],
    ["Income", answers.income, "income"],
    ["Cash for surprises", answers.emergency, "emergency"],
    ["Expensive debt", answers.debt, "debt"],
  ];
  const canContinue = current !== "interests" || profile.interests.length > 0;
  return (
    <div className="onboarding">
      <header className="onboard-header">
        <Link href="/" className="wordmark">
          <span className="brand-mark">k.</span>keel
          <span className="brand-dot">●</span>
        </Link>
        <span className="header-note">A little clarity goes a long way.</span>
        <div className="onboard-header-end">
          {hasProfile ? (
            <Link className="text-button" href="/dashboard">
              Your dashboard <Icon name="arrow" size={16} />
            </Link>
          ) : (
            <span className="label">YOUR MONEY, UNDERSTOOD</span>
          )}
          <AuthControls />
        </div>
      </header>
      {step < 0 ? (
        <main className="welcome">
          <section className="welcome-copy">
            <span className="eyebrow">
              <span className="status-dot" /> A CALMER WAY TO START
            </span>
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
              <button
                className="button primary"
                disabled={!ready}
                onClick={() => {
                  interacted.current = true;
                  setStep(0);
                }}
              >
                Let’s find your first step <Icon name="arrow" />
              </button>
              <Link className="text-button" href="/dashboard?demo=1">
                Explore an example <Icon name="chevron" size={16} />
              </Link>
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
            <div className="world-note note-top">
              <Icon name="spark" />
              <span>
                Big questions.
                <br />
                <strong>Small, clear steps.</strong>
              </span>
            </div>
            <div className="world-mascot">
              <KeelMascot size={290} mood="wave" />
            </div>
            <div className="world-bubble">
              “Hi, I’m Keel.
              <br />
              Let’s figure this out together.”
            </div>
            <div className="world-note note-bottom">
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
            </div>
            <span className="world-star star-one">✳</span>
            <span className="world-star star-two">✳</span>
          </section>
        </main>
      ) : (
        <main className="question-layout">
          <aside className="onboard-aside">
            <span className="eyebrow">A PLAN THAT STARTS WITH YOU</span>
            <h2>
              Small steps.
              <br />
              Clearer choices.
            </h2>
            <div className="step-track">
              {STEP_IDS.map((id) => copy[id].track).map((label, i) => (
                <div
                  className={
                    step === i ? "current" : step > i ? "complete" : ""
                  }
                  key={label}
                >
                  <span>
                    {step > i ? <Icon name="check" size={13} /> : i + 1}
                  </span>
                  {label}
                </div>
              ))}
            </div>
            <div className="aside-companion">
              <KeelMascot mood={help ? "question" : "idle"} size={95} />
              <p>
                “You don’t need to know all the answers. That’s why I’m here.”
              </p>
            </div>
          </aside>
          <section className="question-panel">
            <div className="question-top">
              <button
                className="text-button"
                onClick={() => {
                  setStep((s) => s - 1);
                  setHelp(false);
                }}
                disabled={busy}
              >
                <Icon name="back" size={16} /> Back
              </button>
              <span className="label">
                {step >= total
                  ? "YOUR STARTING POINT"
                  : `STEP ${step + 1} OF ${total}`}
              </span>
            </div>
            <div className="progress-track">
              <span
                style={{
                  width: `${Math.min(100, ((step + 1) / total) * 100)}%`,
                }}
              />
            </div>
            <div key={step} className="question-content enter">
              <h1 ref={heading} tabIndex={-1}>
                {current ? copy[current].title : "Here's where we'll start."}
              </h1>
              <p className="question-caption">
                {current
                  ? copy[current].caption
                  : "A starting point, not a permanent decision. You can edit any answer."}
              </p>
              {current === "intent" && (
                <Choices
                  label={copy.intent.title}
                  value={profile.intent}
                  onChange={(v) => update("intent", v as Profile["intent"])}
                  choices={[
                    {
                      value: "learn",
                      title: "Learn the basics",
                      description:
                        "Understand investing before making a decision",
                    },
                    {
                      value: "choose",
                      title: "Explore investments for me",
                      description: "Compare options with my goals in mind",
                    },
                    {
                      value: "understand",
                      title: "Understand an investment",
                      description:
                        "Look closer at something I own or am curious about",
                    },
                  ]}
                />
              )}
              {current === "interests" && (
                <InterestChips
                  value={profile.interests}
                  onChange={(next) => update("interests", next)}
                />
              )}
              {current === "goal" && (
                <>
                  <Choices
                    label="Your goal"
                    value={profile.goal}
                    onChange={(v) => update("goal", v as Profile["goal"])}
                    choices={[
                      { value: "explore", title: "I'm just exploring" },
                      {
                        value: "purchase",
                        title: "Save for a future purchase",
                      },
                      { value: "wealth", title: "Build long-term savings" },
                      { value: "retirement", title: "Plan for retirement" },
                    ]}
                  />
                  <label className="field-label" htmlFor="horizon">
                    When might you need this money?
                  </label>
                  <select
                    id="horizon"
                    value={profile.horizon}
                    onChange={(e) =>
                      update("horizon", e.target.value as Profile["horizon"])
                    }
                  >
                    {Object.entries(horizonLabels).map(([v, label]) => (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {current === "country" && (
                <>
                  <Choices
                    label="Country"
                    value={profile.country}
                    onChange={(v) => {
                      update("country", v as Profile["country"]);
                      update(
                        "currency",
                        v === "IN" ? "INR" : v === "GB" ? "GBP" : "USD",
                      );
                    }}
                    choices={[
                      { value: "US", title: "United States" },
                      { value: "IN", title: "India" },
                      { value: "GB", title: "United Kingdom" },
                      { value: "other", title: "Somewhere else" },
                    ]}
                  />
                  <label className="field-label" htmlFor="currency">
                    Currency for your scenarios
                  </label>
                  <select
                    id="currency"
                    value={profile.currency}
                    onChange={(e) =>
                      update("currency", e.target.value as Profile["currency"])
                    }
                  >
                    <option value="USD">US dollar · USD</option>
                    <option value="INR">Indian rupee · INR</option>
                    <option value="GBP">British pound · GBP</option>
                  </select>
                  <p className="fine-print">
                    Currently exploring selected US investments and selected
                    crypto assets. Market prices remain in USD.
                  </p>
                </>
              )}
              {current === "experience" && (
                <>
                  <Choices
                    label="Investing experience"
                    value={profile.experience}
                    onChange={(v) =>
                      update("experience", v as Profile["experience"])
                    }
                    choices={[
                      { value: "new", title: "I'm completely new" },
                      { value: "some", title: "I've tried a little" },
                      { value: "experienced", title: "I invest regularly" },
                    ]}
                  />
                </>
              )}
              {current === "risk" && (
                <>
                  <div className="risk-example">
                    <span>{currencyFormat(1000, profile.currency)}</span>
                    <span className="risk-arrow">
                      ↘ <small>−20%</small>
                    </span>
                    <strong>{currencyFormat(800, profile.currency)}</strong>
                  </div>
                  <Choices
                    label="Comfort with losses"
                    value={profile.risk}
                    onChange={(v) => update("risk", v as Profile["risk"])}
                    choices={[
                      { value: "careful", title: "Very uncomfortable" },
                      {
                        value: "balanced",
                        title: "Concerned, but I could wait",
                      },
                      {
                        value: "comfortable",
                        title: "Comfortable with large changes",
                      },
                      { value: "unknown", title: "I'm not sure yet" },
                    ]}
                  />
                </>
              )}
              {current === "lossTolerance" && (
                <Choices
                  label={copy.lossTolerance.title}
                  value={String(profile.lossTolerance)}
                  onChange={(v) =>
                    update(
                      "lossTolerance",
                      v === "unknown" ? "unknown" : (Number(v) as Profile["lossTolerance"]),
                    )
                  }
                  choices={[
                    {
                      value: "5",
                      title: "About 5%",
                      description: `${currencyFormat(1000, profile.currency)} becoming ${currencyFormat(950, profile.currency)}`,
                    },
                    {
                      value: "10",
                      title: "About 10%",
                      description: `${currencyFormat(1000, profile.currency)} becoming ${currencyFormat(900, profile.currency)}`,
                    },
                    {
                      value: "20",
                      title: "About 20%",
                      description: `${currencyFormat(1000, profile.currency)} becoming ${currencyFormat(800, profile.currency)}`,
                    },
                    {
                      value: "40",
                      title: "40% or more",
                      description: `${currencyFormat(1000, profile.currency)} becoming ${currencyFormat(600, profile.currency)} or less`,
                    },
                    { value: "unknown", title: "I'm not sure yet" },
                  ]}
                />
              )}
              {current === "income" && (
                <Choices
                  label={copy.income.title}
                  value={profile.income}
                  onChange={(v) => update("income", v as Profile["income"])}
                  choices={[
                    { value: "stable", title: "Steady, month to month" },
                    { value: "variable", title: "It varies a lot" },
                    { value: "none", title: "No income right now" },
                    { value: "unknown", title: "Prefer not to say" },
                  ]}
                />
              )}
              {current === "amount" && (
                <div className="amount-fields">
                  <label htmlFor="amount">
                    Amount to start with · {profile.currency}
                  </label>
                  <input
                    id="amount"
                    type="number"
                    min="0"
                    max="1000000000"
                    placeholder="Prefer not to say"
                    value={profile.amount ?? ""}
                    onChange={(e) =>
                      update(
                        "amount",
                        e.target.value === ""
                          ? null
                          : Math.min(1e9, Math.max(0, Number(e.target.value))),
                      )
                    }
                  />
                  <label htmlFor="monthly">
                    Monthly contribution, if any · {profile.currency}
                  </label>
                  <input
                    id="monthly"
                    type="number"
                    min="0"
                    max="10000000"
                    placeholder="Optional"
                    value={profile.monthly ?? ""}
                    onChange={(e) =>
                      update(
                        "monthly",
                        e.target.value === ""
                          ? null
                          : Math.min(1e7, Math.max(0, Number(e.target.value))),
                      )
                    }
                  />
                </div>
              )}
              {(current === "emergency" || current === "debt") && (
                <Choices
                  label={copy[current].title}
                  value={current === "emergency" ? profile.emergency : profile.debt}
                  onChange={(v) =>
                    update(current, v as Profile["debt"])
                  }
                  choices={[
                    {
                      value: "yes",
                      title:
                        current === "emergency"
                          ? "Yes, I have money set aside"
                          : "Yes, I have high-interest borrowing",
                    },
                    { value: "no", title: current === "emergency" ? "Not yet" : "No" },
                    {
                      value: "unknown",
                      title: "I'm not sure / prefer not to say",
                    },
                  ]}
                />
              )}
              {step >= total && (
                <div className="summary-list">
                  {summaryRows.map(([label, value, id]) => (
                    <button key={label} type="button" onClick={() => setStep(stepIndex(id))}>
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
                  {help && current && <p>{copy[current].help}</p>}
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
                    : !canContinue
                      ? "Pick at least one category to continue."
                      : "You can change this anytime."}
                </span>
                <button
                  className="button primary"
                  disabled={busy || !canContinue}
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
                      ? "See my ranked options"
                      : "Continue"}
                  <Icon name="arrow" size={18} />
                </button>
              </div>
            </div>
          </section>
        </main>
      )}
      <footer className="onboard-footer">
        <span>Made for your first step. And the one after that.</span>
        <span>KEEL / FIND YOUR BEARINGS</span>
      </footer>
    </div>
  );
}
