"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { InterestChips } from "@/components/onboarding/InterestChips";
import { useKeel } from "@/components/keel/KeelContext";
import {
  debtLabels,
  emergencyLabels,
  experienceLabels,
  goalLabels,
  incomeLabels,
  intentLabels,
  type Profile,
} from "@/lib/onboarding/questions";

/** The seven v3 fields onboarding never asks, plus where this person reads. */
const CHOICES = [
  { key: "intent", legend: "What are you here to do?", labels: intentLabels },
  { key: "goal", legend: "What is the money for?", labels: goalLabels },
  { key: "experience", legend: "How much have you invested before?", labels: experienceLabels },
  { key: "income", legend: "How steady is your income?", labels: incomeLabels },
  { key: "emergency", legend: "Do you have money set aside for surprises?", labels: emergencyLabels },
  { key: "debt", legend: "Any high-interest borrowing?", labels: debtLabels },
] as const;

export function QuestionsForm({ profile }: { profile: Profile }) {
  const keel = useKeel();
  const [draft, setDraft] = useState<Profile>(profile);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setState("idle");
  };
  async function save() {
    setState("saving");
    setState((await keel.saveProfile(draft)) ? "saved" : "error");
  }

  return (
    <section className="account-questions" aria-labelledby="questions-heading">
      <div className="section-head">
        <div>
          <h2 id="questions-heading">Your answers</h2>
          <p className="fine-print">
            These order what Keel shows you. Change any of them and the ranking follows.
            Your conversation with Keel is kept.
          </p>
        </div>
      </div>

      <fieldset className="account-field">
        <legend>Which of these do you want to look at?</legend>
        <InterestChips value={draft.interests} onChange={(next) => set("interests", next)} />
      </fieldset>

      {CHOICES.map(({ key, legend, labels }) => (
        <fieldset className="account-field" key={key}>
          <legend>{legend}</legend>
          <div className="account-options">
            {Object.entries(labels).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`account-option ${draft[key] === value ? "selected" : ""}`}
                aria-pressed={draft[key] === value}
                onClick={() => set(key, value as never)}
              >
                {label}
                {draft[key] === value && <Icon name="check" size={15} />}
              </button>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="account-save">
        <button
          type="button"
          className="button primary"
          onClick={() => void save()}
          disabled={!dirty || state === "saving" || keel.demo}
        >
          {state === "saving" ? "Saving…" : "Save answers"}
        </button>
        {state === "saved" && !dirty && (
          <span className="account-save-note">
            <Icon name="check" size={14} /> Saved. Your rankings have been rebuilt.
          </span>
        )}
        {state === "error" && (
          <span className="account-save-note is-error" role="alert">
            That didn’t save. Try again in a moment.
          </span>
        )}
        {keel.demo && <span className="account-save-note">Example mode — answers aren’t saved.</span>}
      </div>
    </section>
  );
}
