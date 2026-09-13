"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { analyzedAssetSchema, type AnalyzedAsset } from "@/lib/dashboard/analyzedAsset";
import { useKeel } from "@/components/keel/KeelContext";
import { Icon } from "@/components/ui/Icon";

type Phase = "intro" | "sharing" | "analyzing" | "result";

function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}

export function TabAnalyzer() {
  const keel = useKeel();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [question, setQuestion] = useState("What should I know before considering this stock?");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalyzedAsset | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const input = useRef<HTMLInputElement>(null);

  function stopSharing() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  }

  function close() {
    stopSharing();
    setOpen(false);
    setPhase("intro");
    setError("");
    setResult(null);
  }

  useEffect(() => () => stopSharing(), []);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  async function shareTab() {
    setError("");
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError("This browser doesn't support tab sharing. Try the latest Chrome or Edge.");
      return;
    }
    try {
      const next = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      stopSharing();
      stream.current = next;
      next.getVideoTracks()[0]?.addEventListener("ended", () => {
        stream.current = null;
        setPhase("intro");
      });
      setPhase("sharing");
      requestAnimationFrame(() => {
        if (video.current) {
          video.current.srcObject = next;
          void video.current.play();
        }
        input.current?.focus();
      });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "NotAllowedError")
        setError("Tab sharing was cancelled. Choose a stock tab when you're ready.");
      else setError("Keel couldn't start tab sharing. Please try again.");
    }
  }

  function captureFrame(): string {
    const view = video.current;
    if (!view || !view.videoWidth || !view.videoHeight)
      throw new Error("The shared tab isn't visible yet. Wait a moment and try again.");
    const scale = Math.min(1, 1400 / view.videoWidth, 900 / view.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(view.videoWidth * scale);
    canvas.height = Math.round(view.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Keel couldn't capture this view.");
    context.drawImage(view, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78);
  }

  async function analyze(event: FormEvent) {
    event.preventDefault();
    if (!keel.sessionId || phase === "analyzing") return;
    setError("");
    setPhase("analyzing");
    try {
      const image = captureFrame();
      const response = await fetch("/api/analyze-tab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: keel.sessionId, question: question.trim(), image }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Keel couldn't analyze this tab.");
      const asset = analyzedAssetSchema.parse(body.asset);
      setResult(asset);
      setPhase("result");
      stopSharing();
      keel.attach({ id: asset.id, ticker: asset.ticker, name: asset.name });
      keel.say(asset.summary);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Keel couldn't analyze this tab.");
      setPhase(stream.current ? "sharing" : "intro");
    }
  }

  return (
    <>
      <button
        type="button"
        className="button primary small analyze-tab-trigger"
        onClick={() => setOpen(true)}
        disabled={keel.demo || !keel.sessionId}
        title={keel.demo ? "Add your answers to analyze a live tab" : undefined}
      >
        <Icon name="search" size={15} /> Analyze another tab
      </button>

      {open && (
        <div className="tab-analyzer-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}>
          <section className="tab-analyzer" role="dialog" aria-modal="true" aria-labelledby="tab-analyzer-title">
            <button type="button" className="icon-button tab-analyzer-close" aria-label="Close tab analyzer" onClick={close}>
              <Icon name="close" size={18} />
            </button>

            <div className="tab-analyzer-copy">
              <span className="eyebrow">Live browser context</span>
              <h2 id="tab-analyzer-title">Show Keel what you’re looking at.</h2>
              <p>
                Choose the Groww, Zerodha, or other stock tab. Keel reads one captured view, checks market sources, and saves the analysis here.
              </p>
            </div>

            {phase === "intro" && (
              <div className="tab-share-intro">
                <div className="tab-share-illustration" aria-hidden="true">
                  <span className="browser-page"><i /><i /><i /></span>
                  <span className="share-current"><Icon name="arrow" size={24} /></span>
                  <span className="keel-lens">k.</span>
                </div>
                <button type="button" className="button primary" onClick={() => void shareTab()}>
                  Choose a stock tab <Icon name="arrow" size={16} />
                </button>
                <small>In the browser picker, select “Chrome Tab” and choose the stock page—not Keel.</small>
              </div>
            )}

            {(phase === "sharing" || phase === "analyzing") && (
              <form onSubmit={analyze} className="tab-share-workspace">
                <div className="shared-tab-preview">
                  <video ref={video} muted playsInline aria-label="Preview of the shared stock tab" />
                  <span className="sharing-pill"><i /> Sharing one tab</span>
                </div>
                <label htmlFor="tab-question">What do you want to understand?</label>
                <div className="tab-question-row">
                  <input
                    ref={input}
                    id="tab-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    maxLength={500}
                    required
                  />
                  <button type="submit" className="button primary" disabled={phase === "analyzing" || !question.trim()}>
                    {phase === "analyzing" ? "Checking…" : "Analyze this view"}
                  </button>
                </div>
                <button type="button" className="text-button" onClick={() => void shareTab()} disabled={phase === "analyzing"}>
                  Choose a different tab
                </button>
              </form>
            )}

            {phase === "result" && result && (
              <div className="tab-analysis-result">
                <div className="result-identity">
                  <span className="ticker">{result.ticker}</span>
                  <div><strong>{result.name}</strong><small>{[result.exchange, result.platform].filter(Boolean).join(" · ")}</small></div>
                  <Icon name="check" size={20} />
                </div>
                <p>{result.summary}</p>
                {result.sourceIds.length > 0 && (
                  <div className="result-sources">
                    {result.sourceIds.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer">{sourceHost(url)}</a>)}
                  </div>
                )}
                <div className="result-actions">
                  <button type="button" className="button primary" onClick={() => { keel.setOpen(true); close(); }}>
                    Continue with Keel <Icon name="chat" size={16} />
                  </button>
                  <button type="button" className="button secondary" onClick={() => { setResult(null); setPhase("intro"); }}>
                    Analyze another
                  </button>
                </div>
              </div>
            )}

            {error && <p className="tab-analyzer-error" role="alert">{error}</p>}
            <p className="tab-analyzer-privacy"><Icon name="shield" size={13} /> Keel only receives the captured frame when you press Analyze.</p>
          </section>
        </div>
      )}
    </>
  );
}

export function RecentlyAnalyzed() {
  const keel = useKeel();
  if (!keel.analyzedAssets.length) return null;
  return (
    <section className="recent-analysis" aria-labelledby="recent-analysis-title">
      <div className="section-head">
        <div>
          <h2 id="recent-analysis-title">Recently analyzed</h2>
          <p className="fine-print">Stocks brought in from the pages you shared with Keel.</p>
        </div>
      </div>
      <div className="recent-analysis-grid">
        {keel.analyzedAssets.slice(0, 4).map((asset) => (
          <article className="recent-analysis-card" key={asset.id}>
            <div className="recent-analysis-meta">
              <span className="ticker">{asset.ticker}</span>
              <small>{[asset.exchange, asset.platform].filter(Boolean).join(" · ")}</small>
            </div>
            <h3>{asset.name}</h3>
            <p>{asset.summary}</p>
            <button type="button" className="text-button" onClick={() => {
              keel.attach({ id: asset.id, ticker: asset.ticker, name: asset.name });
              keel.setOpen(true);
            }}>
              Continue analysis <Icon name="arrow" size={14} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
