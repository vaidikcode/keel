"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Spread } from "@/components/dashboard/Spread";
import { SESSION_KEY } from "@/components/onboarding/Onboarding";
import type { SpreadPack } from "@/lib/dashboard/pack";
import { spreadPackSchema } from "@/lib/dashboard/pack";

function readSessionIdClient(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }
  const next = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, next);
  return next;
}

export default function DashboardPage() {
  const [sessionId] = useState<string | null>(() => readSessionIdClient());
  const [bootPack, setBootPack] = useState<SpreadPack | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const fetchStarted = useRef(false);

  const profile = useQuery(
    api.profiles.getBySession,
    sessionId ? { sessionId } : "skip",
  );

  useEffect(() => {
    if (!sessionId || profile === undefined || profile === null) {
      return;
    }
    if (profile.spread || bootPack || fetchStarted.current) {
      return;
    }
    fetchStarted.current = true;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/spread", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (!response.ok) {
          if (!cancelled) {
            setFetchError(true);
          }
          return;
        }
        const body: unknown = await response.json();
        const raw =
          typeof body === "object" && body !== null && "pack" in body
            ? body.pack
            : null;
        const parsed = spreadPackSchema.safeParse(raw);
        if (!cancelled) {
          if (parsed.success) {
            setBootPack(parsed.data);
          } else {
            setFetchError(true);
          }
        }
      } catch {
        if (!cancelled) {
          setFetchError(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bootPack, profile, sessionId]);

  if (!sessionId || profile === undefined) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-paper-white px-6">
        <span className="relative mb-6 inline-flex size-11 items-center justify-center rounded-[16px] border border-carbon bg-sunburst">
          <span className="font-aeonik-pro text-[13px] font-bold">K</span>
        </span>
        <p className="keel-in font-aeonik-pro text-[24px] font-bold">
          Opening the spread…
        </p>
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-sky-wash px-6 text-center">
        <h1 className="font-aeonik-pro text-[30px] font-bold">No profile yet</h1>
        <p className="mt-3 max-w-md font-aeonik-pro text-[15px] font-medium">
          Finish the five questions first. Keel packs the board from your sources.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-full border border-carbon bg-carbon px-5 py-3 font-aeonik-pro text-[14px] font-bold tracking-[0.032em] text-paper-white"
        >
          Start onboarding
        </Link>
      </div>
    );
  }

  const pack = (profile.spread as SpreadPack | undefined) ?? bootPack;
  if (!pack && !fetchError) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-paper-white px-6">
        <span className="relative mb-6 inline-flex size-11 items-center justify-center rounded-[16px] border border-carbon bg-sunburst">
          <span className="font-aeonik-pro text-[13px] font-bold">K</span>
        </span>
        <p className="keel-in font-aeonik-pro text-[24px] font-bold">
          Keel is reading the filing…
        </p>
      </div>
    );
  }

  if (!pack || fetchError) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-sky-wash px-6 text-center">
        <h1 className="font-aeonik-pro text-[30px] font-bold">
          Could not pack the board
        </h1>
        <p className="mt-3 max-w-md font-aeonik-pro text-[15px] font-medium">
          Try again from onboarding. Seeded lines still work when APIs are quiet.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-full border border-carbon bg-carbon px-5 py-3 font-aeonik-pro text-[14px] font-bold tracking-[0.032em] text-paper-white"
        >
          Start over
        </Link>
      </div>
    );
  }

  return (
    <Spread
      pack={pack}
      sessionId={sessionId}
      sleepChip={profile.answers.sleep}
      noise={profile.answers.noise}
      priorAsks={profile.asks ?? []}
    />
  );
}
