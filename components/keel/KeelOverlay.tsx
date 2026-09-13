"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { KeelMascot } from "@/components/dashboard/KeelMascot";
import { sourceHost } from "@/lib/dashboard/api";
import { decodeAsset, hasKeelPayload } from "./keelDnd";
import { useKeel } from "./KeelContext";

export function KeelOverlay() {
  const keel = useKeel();
  const dockRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [question, setQuestion] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [hintFor, setHintFor] = useState<string | null>(null);
  const [flip, setFlip] = useState(false);
  const drag = useRef({ px: 0, py: 0, ox: 0, oy: 0, moved: false, active: false });
  const pos = dragPos ?? keel.pos;

  // Keep the buddy on screen when the window changes size, or one dragged to
  // an edge becomes unreachable.
  const clamp = useCallback((p: { x: number; y: number }) => {
    const el = rootRef.current;
    if (!el) return p;
    const r = el.getBoundingClientRect();
    const maxX = Math.max(0, window.innerWidth - 28 - (r.right - r.left) - (r.left - p.x));
    return {
      x: Math.min(Math.max(p.x, -(r.left - p.x) + 12), maxX),
      y: Math.min(Math.max(p.y, -(r.top - p.y) + 12), window.innerHeight - 28 - (r.bottom - p.y)),
    };
  }, []);
  useEffect(() => {
    const onResize = () => keel.setPos(clamp(keel.pos));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp, keel]);

  useEffect(() => {
    if (!keel.open) return;
    const check = () => {
      const dock = dockRef.current?.getBoundingClientRect();
      const panel = rootRef.current?.querySelector(".keel-panel")?.getBoundingClientRect();
      if (!dock || !panel) return;
      setFlip(dock.bottom + panel.height + 24 > window.innerHeight);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [keel.open, pos.y]);

  // A press that never moves is a click; 3px of travel makes it a drag.
  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    // The buddy itself IS a button, so it must stay draggable — only the
    // controls inside the query box are off limits. The 3px threshold below is
    // what keeps a press on the mascot working as a click.
    if ((e.target as HTMLElement).closest(".keel-panel")) return;
    drag.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y, moved: false, active: true };
    rootRef.current?.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    if (!drag.current.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
    drag.current.moved = true;
    setDragPos({ x: drag.current.ox + dx, y: drag.current.oy + dy });
  }
  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    drag.current.active = false;
    rootRef.current?.releasePointerCapture(e.pointerId);
    if (drag.current.moved && dragPos) keel.setPos(clamp(dragPos));
    setDragPos(null);
  }

  // Clicking anywhere else swaps the bubble for the "select some text" hint.
  // Tying it to the reply id means a fresh answer clears the hint by itself.
  const currentReplyId = keel.lastReply?.id ?? null;
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setHintFor(currentReplyId);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [currentReplyId]);

  const hint = hintFor !== null && hintFor === currentReplyId;

  function pressBuddy() {
    if (drag.current.moved) return;
    if (keel.selection) {
      void keel.ask("What does this mean?", keel.selection);
      return;
    }
    keel.toggle();
  }

  useEffect(() => {
    if (keel.open) textareaRef.current?.focus({ preventScroll: true });
  }, [keel.open]);
  useEffect(() => {
    if (!keel.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        keel.setOpen(false);
        dockRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [keel]);

  function onDragOver(e: DragEvent) {
    if (!hasKeelPayload(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!keel.dragOver) keel.setDragOver(true);
    if (!keel.open && !hoverTimer.current)
      hoverTimer.current = setTimeout(() => {
        keel.setOpen(true);
        hoverTimer.current = null;
      }, 400);
  }
  function onDragLeave(e: DragEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    keel.setDragOver(false);
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }
  function onDrop(e: DragEvent) {
    if (!hasKeelPayload(e.dataTransfer)) return;
    e.preventDefault();
    const asset = decodeAsset(e.dataTransfer);
    keel.setDragOver(false);
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    if (!asset) return;
    keel.attach(asset);
    keel.setOpen(true);
    requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }));
  }

  const mood = keel.busy ? "thinking" : keel.dragOver || keel.dragging ? "wave" : keel.open ? "point" : "idle";
  const dockClass = [
    "keel-dock",
    keel.dragging ? "is-drop-target" : "",
    keel.dragOver ? "is-drag-over" : "",
    keel.open ? "is-open" : "",
  ].join(" ");

  return (
    <div
      ref={rootRef}
      className={`keel-overlay ${keel.paused ? "motion-paused" : ""} ${dragPos ? "is-moving" : ""} ${flip ? "is-flipped" : ""}`}
      style={{ "--kx": `${pos.x}px`, "--ky": `${pos.y}px` } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {keel.open && (
        <section
          id="keel-panel"
          className="keel-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Ask Keel"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <header className="keel-panel-head">
            <KeelMascot size={40} mood={mood} paused={keel.paused} />
            <div>
              <strong>Keel</strong>
              <small>{keel.demo ? "Example mode" : "Your investing companion"}</small>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-pressed={keel.paused}
              aria-label={keel.paused ? "Resume motion" : "Pause motion"}
              onClick={() => keel.setPaused(!keel.paused)}
            >
              <Icon name={keel.paused ? "play" : "pause"} size={16} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Close Keel"
              onClick={() => {
                keel.setOpen(false);
                dockRef.current?.focus();
              }}
            >
              <Icon name="close" size={16} />
            </button>
          </header>
          <div className="keel-panel-body">
            <div className="keel-reply" role="status" aria-live="polite">
              <p>{keel.busy ? "Thinking it through…" : keel.lastReply?.text ?? "Ask me anything about what you see."}</p>
              {keel.lastReply && keel.lastReply.sourceIds.length > 0 && (
                <ul className="source-chips" aria-label="Sources">
                  {keel.lastReply.sourceIds.map((url) => (
                    <li key={url}>
                      <a href={url} target="_blank" rel="noreferrer">
                        <Icon name="link" size={12} /> {sourceHost(url)}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {keel.error && (
              <p role="alert" className="error-message">
                {keel.error}
              </p>
            )}
            {keel.notice && !keel.error && <p className="keel-notice">{keel.notice}</p>}
            <div className="attached-chips" aria-label="Attached to this conversation">
              {keel.attached.length === 0 ? (
                <small className="fine-print">
                  <Icon name="grip" size={12} /> Drag any option here to talk about it.
                </small>
              ) : (
                keel.attached.map((a) => (
                  <span key={a.id} className={`attached-chip ${a.locked ? "is-locked" : ""}`}>
                    {a.ticker}
                    {a.locked ? (
                      <small>this page</small>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Remove ${a.ticker} from Keel's context`}
                        onClick={() => keel.detach(a.id)}
                      >
                        <Icon name="close" size={12} />
                      </button>
                    )}
                  </span>
                ))
              )}
            </div>
            <ul className="quick-asks" aria-label="Suggested questions">
              {keel.quickAsks.map((q) => (
                <li key={q}>
                  <button type="button" disabled={keel.busy} onClick={() => void keel.ask(q)}>
                    {q}
                  </button>
                </li>
              ))}
            </ul>
            {keel.turns.length > 0 && (
              <details
                className="conversation-toggle"
                open={showHistory}
                onToggle={(e) => setShowHistory((e.target as HTMLDetailsElement).open)}
              >
                <summary>
                  View conversation <span>{keel.turns.length}</span>
                </summary>
                <div className="conversation-history">
                  {keel.turns.slice(-8).map((t) => (
                    <div className="conversation-turn" key={t.id}>
                      <strong>{t.question}</strong>
                      <p>{t.reply}</p>
                      {t.sourceIds.length > 0 && (
                        <span>
                          {t.sourceIds.map((url) => (
                            <a key={url} href={url} target="_blank" rel="noreferrer">
                              {sourceHost(url)}
                            </a>
                          ))}
                        </span>
                      )}
                    </div>
                  ))}
                  <button type="button" className="text-button new-conversation" onClick={() => void keel.newConversation()}>
                    Start a new conversation
                  </button>
                </div>
              </details>
            )}
            {!keel.hasProfile && !keel.demo && (
              <p className="fine-print">
                <Link href="/">Answer a few questions</Link> so Keel can talk about your situation.
              </p>
            )}
          </div>
          <form
            className="ask-form keel-panel-foot"
            onSubmit={(e) => {
              e.preventDefault();
              const text = question;
              setQuestion("");
              void keel.ask(text);
            }}
          >
            <label htmlFor="ask-keel" className="sr-only">
              Ask Keel a question
            </label>
            <textarea
              id="ask-keel"
              ref={textareaRef}
              rows={2}
              maxLength={500}
              placeholder={keel.attached.length ? `Ask about ${keel.attached.map((a) => a.ticker).join(", ")}…` : "Ask Keel anything…"}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const text = question;
                  setQuestion("");
                  void keel.ask(text);
                }
              }}
            />
            <div>
              <span className="fine-print">Keel explains. It never tells you to buy or sell.</span>
              <button type="submit" className="send-button" disabled={keel.busy || !question.trim()} aria-label="Send">
                <Icon name="arrow" size={18} />
              </button>
            </div>
          </form>
        </section>
      )}
      {!keel.open && (
        <div className="keel-bubble" role="status" aria-live="polite">
          <p>
            {keel.busy
              ? "Thinking it through…"
              : keel.selection
                ? "Press me and I'll explain what you selected."
                : hint || !keel.lastReply
                  ? "Select any text on the page and press me to learn more about it."
                  : keel.lastReply.text}
          </p>
        </div>
      )}
      <button
        ref={dockRef}
        type="button"
        className={dockClass}
        aria-expanded={keel.open}
        aria-controls="keel-panel"
        aria-label={`${keel.open ? "Close" : "Open"} Keel${keel.attached.length ? `, ${keel.attached.length} attached` : ""}`}
        onClick={pressBuddy}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <KeelMascot size={84} mood={mood} paused={keel.paused} />
        {keel.attached.length > 0 && <span className="keel-badge">{keel.attached.length}</span>}
        {keel.unread && !keel.open && <span className="keel-unread" aria-hidden="true" />}
        <span className="keel-dock-hint" aria-hidden="true">
          {keel.dragging ? "Drop to ask Keel" : keel.selection ? "Explain this" : "Ask Keel"}
        </span>
      </button>
    </div>
  );
}
