"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Offset = { x: number; y: number };
type Phase = "waiting" | "pasting" | "stuck" | "peeling";

const STORE = "keel-sticker-pos";

function readOffsets(): Record<string, Offset> {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Record<string, Offset>) : {};
  } catch {
    return {};
  }
}

/** Somewhere else on the board to land, kept loose so no two runs match. */
function scatter(spread = 1): Offset {
  return {
    x: Math.round((Math.random() - 0.5) * 200 * spread),
    y: Math.round((Math.random() - 0.5) * 160 * spread),
  };
}

/**
 * A sticker that gets pasted down rather than faded in: it lands from the
 * top-right and is smoothed toward the bottom-left, stopping short so that
 * corner stays lifted. Clicking peels it back the other way, and once the peel
 * is far enough along the sticker comes away and re-pastes somewhere else.
 *
 * Timings are randomised per sticker so a group never moves in lockstep. They
 * are generated after mount, which also keeps them out of the server's markup.
 */
export function StickerNote({
  id,
  className = "",
  delay = 0,
  children,
}: {
  id: string;
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [timing, setTiming] = useState({ paste: 900, wait: 0 });
  const [dragging, setDragging] = useState(false);
  const node = useRef<HTMLDivElement>(null);
  const origin = useRef({ px: 0, py: 0, ox: 0, oy: 0 });
  const latest = useRef<Offset>({ x: 0, y: 0 });
  const moved = useRef(false);
  const timers = useRef<number[]>([]);

  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    // Random order and duration, seeded off the caller's stagger. All of it
    // runs on a timer rather than in the effect body, which also keeps
    // localStorage and Math.random out of the render path.
    const wait = delay + 260 + Math.random() * 900;
    const paste = 780 + Math.random() * 620;
    after(0, () => {
      // No saved spot means scatter: a fresh visit should never lay the
      // stickers down in the same arrangement twice.
      const saved = readOffsets()[id] ?? scatter(0.7);
      latest.current = saved;
      setOffset(saved);
      setTiming({ paste, wait });
    });
    after(wait, () => {
      setPhase("pasting");
      after(paste, () => setPhase("stuck"));
    });
    const t = timers.current;
    return () => t.forEach(window.clearTimeout);
  }, [id, delay, after]);

  const persist = useCallback(
    (next: Offset) => {
      try {
        localStorage.setItem(
          STORE,
          JSON.stringify({ ...readOffsets(), [id]: next }),
        );
      } catch {
        /* Placement is cosmetic; losing it is fine. */
      }
    },
    [id],
  );

  function peel() {
    if (phase !== "stuck") return;
    setPhase("peeling");
    // Peel runs to 60%, then the sticker detaches and is re-pasted elsewhere.
    after(820, () => {
      const next = scatter();
      latest.current = next;
      setOffset(next);
      persist(next);
      setPhase("waiting");
      after(140, () => {
        setPhase("pasting");
        after(timing.paste, () => setPhase("stuck"));
      });
    });
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("a,button,input,select")) return;
    moved.current = false;
    origin.current = {
      px: e.clientX,
      py: e.clientY,
      ox: latest.current.x,
      oy: latest.current.y,
    };
    setDragging(true);
    node.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const dx = e.clientX - origin.current.px;
    const dy = e.clientY - origin.current.py;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true;
    const next = { x: origin.current.ox + dx, y: origin.current.oy + dy };
    latest.current = next;
    setOffset(next);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDragging(false);
    node.current?.releasePointerCapture(e.pointerId);
    if (moved.current) persist(latest.current);
    else peel();
  }

  return (
    <div
      ref={node}
      className={`sticker-note ${className} is-${phase} ${
        dragging ? "is-dragging" : ""
      }`}
      style={
        {
          "--sx": `${offset.x}px`,
          "--sy": `${offset.y}px`,
          "--paste-dur": `${timing.paste}ms`,
          // Exposed so the stagger is observable without instrumenting time.
          "--paste-wait": `${Math.round(timing.wait)}ms`,
        } as React.CSSProperties
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          peel();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <span className="sticker-peel" aria-hidden="true" />
      {children}
    </div>
  );
}
