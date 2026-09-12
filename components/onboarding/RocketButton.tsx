"use client";
import { useRef, useState } from "react";

/**
 * The rocket idles in a charging shake, then launches to the right when
 * pressed. The navigation waits for the launch so the action reads as the
 * cause of it rather than something that happened alongside.
 */
export function RocketButton({
  onLaunch,
  disabled,
  children,
}: {
  onLaunch: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [launching, setLaunching] = useState(false);
  const timer = useRef<number | null>(null);

  function press() {
    if (launching || disabled) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      onLaunch();
      return;
    }
    setLaunching(true);
    timer.current = window.setTimeout(() => {
      setLaunching(false);
      onLaunch();
    }, 620);
  }

  return (
    <button
      type="button"
      className={`button primary rocket-button ${launching ? "is-launching" : ""}`}
      disabled={disabled}
      onClick={press}
    >
      <span className="rocket-label">{children}</span>
      <span className="rocket-slot" aria-hidden="true">
        <svg viewBox="0 0 24 26" className="rocket-svg" fill="none">
          {/* Exhaust, only drawn once the burn starts. */}
          <g className="rocket-trail" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M4 21v4" />
            <path d="M8 22v5" />
            <path d="M12 21v4" />
          </g>
          <g className="rocket-body">
            <path
              d="M11 1c3.2 2.8 4.8 7 4.6 11.4l2.2 2.2c.5 1.6.6 3.3.3 5l-3.3-3.3H6.2L2.9 19.6c-.3-1.7-.2-3.4.3-5l2.2-2.2C5.2 8 6.8 3.8 11 1Z"
              fill="currentColor"
            />
            <circle cx="11" cy="10" r="2.1" fill="var(--harbor-deep)" />
          </g>
        </svg>
      </span>
    </button>
  );
}
