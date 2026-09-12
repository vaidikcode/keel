"use client";
import { Icon } from "@/components/ui/Icon";
import { KeelMascot } from "@/components/dashboard/KeelMascot";
import { useKeel } from "@/components/keel/KeelContext";
import { sourceHost, type CategoryResponse } from "@/lib/dashboard/api";
import type { Category } from "@/lib/market/categories";
import { interestLabels } from "@/lib/onboarding/questions";

function splitLead(text: string): [string, string] {
  const match = text.match(/^(.+?[.!?])(\s+|$)([\s\S]*)$/);
  if (!match) return [text, ""];
  return [match[1], match[3] ?? ""];
}

export function KeelThoughts({
  category,
  data,
  status,
  fallbackReasons,
}: {
  category: Pick<Category, "id" | "label" | "blurb">;
  data: CategoryResponse["thoughts"];
  status: "idle" | "loading" | "ready" | "error" | "unavailable";
  fallbackReasons: string[];
}) {
  const keel = useKeel();
  const [lead, rest] = data?.paragraphs[0] ? splitLead(data.paragraphs[0]) : ["", ""];
  const updated = data ? new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : null;
  return (
    <section className="thoughts-card" aria-labelledby="thoughts-heading" aria-busy={status === "loading"}>
      <div className="thoughts-stage" aria-hidden="true">
        <span className="thoughts-halo" />
        <KeelMascot mood={status === "loading" ? "thinking" : "point"} size={104} paused={keel.paused} />
      </div>
      <div className="thoughts-body">
        <span className="eyebrow">
          <span className="status-dot" /> KEEL’S THOUGHTS · {category.label.toUpperCase()}
        </span>
        {data ? (
          <>
            <h1 id="thoughts-heading" className="thoughts-quote">
              {lead}
            </h1>
            <div className="thoughts-text">
              {rest && <p>{rest}</p>}
              {data.paragraphs.slice(1).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </>
        ) : status === "loading" ? (
          <>
            <h1 id="thoughts-heading" className="thoughts-quote">
              Keel is forming a view on {category.label.toLowerCase()} for you…
            </h1>
            <div className="thoughts-skeleton" aria-hidden="true">
              <span />
              <span />
              <span style={{ width: "70%" }} />
            </div>
          </>
        ) : (
          <>
            <h1 id="thoughts-heading" className="thoughts-quote">
              {category.blurb}
            </h1>
            <div className="thoughts-text">
              <p>
                Options that fit your answers rank higher. Calmer choices sit near the top for someone who wants smaller
                surprises; livelier ones rise when you said you could sit through bigger drops.
              </p>
              {status === "unavailable" && (
                <p className="fine-print">Keel’s written view isn’t available right now. The ranking still uses your answers.</p>
              )}
              {status === "error" && <p className="fine-print">Keel couldn’t finish writing this time. The ranking still works.</p>}
            </div>
          </>
        )}
        <ul className="because-chips" aria-label="Because you said">
          {(data?.because.length
            ? data.because.map((b) => b.text)
            : fallbackReasons.map((r) => r.replace(/^Because you said: /, ""))
          )
            .slice(0, 5)
            .map((text) => (
              <li key={text}>
                <small>Because you said</small>
                {text}
              </li>
            ))}
          {keel.profile?.interests.includes(category.id) && (
            <li className="is-interest">
              <small>You chose</small>
              {interestLabels[category.id]}
            </li>
          )}
        </ul>
        {data && data.sourceIds.length > 0 && (
          <ul className="source-chips" aria-label="Sources Keel used">
            {data.sourceIds.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  <Icon name="link" size={12} /> {sourceHost(url)}
                </a>
              </li>
            ))}
          </ul>
        )}
        <div className="thoughts-foot">
          <span className="fine-print">Keel’s view, not advice.{updated ? ` Written ${updated}.` : ""}</span>
          <button type="button" className="text-button" onClick={() => void keel.ask(`What does the ${category.label.toLowerCase()} ranking mean for me?`)}>
            Ask Keel a follow-up <Icon name="chevron" size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
