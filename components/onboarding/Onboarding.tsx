"use client";
import { useMutation, useConvex } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import {
  defaultProfile,
  migrateProfile,
  goalLabels,
  horizonLabels,
  riskLabels,
  currencyFormat,
  type Profile,
} from "@/lib/onboarding/questions";
import { readSessionId } from "@/lib/session";
import { KeelMascot } from "@/components/dashboard/KeelMascot";
import { Icon } from "@/components/ui/Icon";
export { SESSION_KEY, readSessionId } from "@/lib/session";
const DRAFT = "keel-onboarding-v2";
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
  const extra = profile.intent === "choose",
    total = extra ? 8 : 5;
  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const draft = localStorage.getItem(DRAFT);
        if (draft) {
          const d = JSON.parse(draft);
          const restored = migrateProfile(d.profile);
          setProfile(restored);
          setStep(
            Math.max(
              -1,
              Math.min(d.step ?? -1, restored.intent === "choose" ? 8 : 5),
            ),
          );
        }
        setReady(true);
        const existing = await client.query(api.profiles.getBySession, {
          sessionId: readSessionId(),
        });
        if (!active) return;
        setHasProfile(Boolean(existing));
        if (!draft && existing && !interacted.current) {
          setProfile(migrateProfile(existing.profileV2 ?? existing.answers));
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
  }, [client]);
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
      await save({ sessionId: readSessionId(), profile });
      localStorage.removeItem(DRAFT);
      router.push("/dashboard");
    } catch {
      setError(
        "We couldn't save your answers. They are still here—please try again.",
      );
      setBusy(false);
    }
  }
  const titles = [
    "What would you like help with?",
    "What are you working toward?",
    "Where do you call home?",
    "Have you invested before?",
    "How would a price drop feel?",
    "What amount are you considering?",
    "Do you have money for unexpected costs?",
    "Do you have expensive debt?",
  ];
  const captions = [
    "We'll start with what matters to you. You can change this later.",
    "Your goal and time frame help put your options in context.",
    "This helps us explain market coverage and use familiar amounts.",
    "No right answer. I'll meet you where you are.",
    "Imagine your investment fell 20%. How would you feel?",
    "An estimate is enough. Leave blank if you'd rather not say.",
    "Think of money you could use for an urgent bill without selling investments.",
    "For example, credit card balances or other high-interest borrowing.",
  ];
  const helps = [
    "Learning starts with explanations. Choosing starts with your goal and circumstances. Understanding focuses on comparing an investment you're curious about.",
    "Money you need soon has less time to recover from a fall in value. Your time frame matters as much as the investment itself.",
    "For now, Keel explores selected US stocks, US funds and selected crypto assets. Prices stay in US dollars. Your country does not imply these investments are available or suitable locally.",
    "A stock is part of one company. A fund holds a collection of investments. Crypto is a digital asset. You don't need to choose a category yet.",
    "This isn't a test or a complete risk assessment. It's a starting point for understanding how much uncertainty feels comfortable.",
    "I'll use this amount for hypothetical scenarios, not assume you have already invested it.",
    "Cash for unexpected expenses can help you avoid selling investments at a bad time.",
    "Borrowing costs are part of the picture when deciding what to do with available money.",
  ];
  return (
    <div className="onboarding">
      <header className="onboard-header">
        <Link href="/" className="wordmark">
          <span className="brand-mark">k.</span>keel
          <span className="brand-dot">●</span>
        </Link>
        <span className="header-note">A little clarity goes a long way.</span>
        {hasProfile ? (
          <Link className="text-button" href="/dashboard">
            Your dashboard <Icon name="arrow" size={16} />
          </Link>
        ) : (
          <span className="label">YOUR MONEY, UNDERSTOOD</span>
        )}
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
              {[
                "Your starting point",
                "Your goal",
                "Your home",
                "Your experience",
                "Your comfort",
                ...(extra
                  ? ["Your amount", "Your cash buffer", "Your borrowing"]
                  : []),
              ].map((label, i) => (
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
                {step >= total ? "Here's where we'll start." : titles[step]}
              </h1>
              <p className="question-caption">
                {step >= total
                  ? "A starting point, not a permanent decision. You can edit any answer."
                  : captions[step]}
              </p>
              {step === 0 && (
                <Choices
                  label={titles[0]}
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
              {step === 1 && (
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
              {step === 2 && (
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
              {step === 3 && (
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
                  <label className="field-label" htmlFor="interest">
                    Anything you’d like to explore?
                  </label>
                  <select
                    id="interest"
                    value={profile.watch}
                    onChange={(e) =>
                      update("watch", e.target.value as Profile["watch"])
                    }
                  >
                    <option value="all">Help me explore</option>
                    <option value="funds">
                      Funds — a collection of investments
                    </option>
                    <option value="stocks">Stocks — part of one company</option>
                    <option value="crypto">Crypto — digital assets</option>
                  </select>
                </>
              )}
              {step === 4 && (
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
              {extra && step === 5 && (
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
              {(step === 6 || step === 7) && (
                <Choices
                  label={titles[step]}
                  value={step === 6 ? profile.emergency : profile.debt}
                  onChange={(v) =>
                    update(
                      step === 6 ? "emergency" : "debt",
                      v as Profile["debt"],
                    )
                  }
                  choices={[
                    {
                      value: "yes",
                      title:
                        step === 6
                          ? "Yes, I have money set aside"
                          : "Yes, I have high-interest borrowing",
                    },
                    { value: "no", title: step === 6 ? "Not yet" : "No" },
                    {
                      value: "unknown",
                      title: "I'm not sure / prefer not to say",
                    },
                  ]}
                />
              )}
              {step >= total && (
                <div className="summary-list">
                  {[
                    ["Your goal", goalLabels[profile.goal], 1],
                    ["Time frame", horizonLabels[profile.horizon], 1],
                    ["Comfort with risk", riskLabels[profile.risk], 4],
                    ["Currency for scenarios", profile.currency, 2],
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
                  {help && <p>{helps[step]}</p>}
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
        </main>
      )}
      <footer className="onboard-footer">
        <span>Made for your first step. And the one after that.</span>
        <span>KEEL / FIND YOUR BEARINGS</span>
      </footer>
    </div>
  );
}
