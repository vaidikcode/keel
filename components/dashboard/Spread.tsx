"use client";

import { useMutation } from "convex/react";
import Link from "next/link";
import {
  type KeyboardEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import { api } from "@/convex/_generated/api";
import type { AssetPack, SpreadPack } from "@/lib/dashboard/pack";
import { LogoMark } from "@/components/onboarding/graphics";
import { KeelMascot } from "./KeelMascot";

type BeatKey = keyof AssetPack["beats"] | "greeting" | "prompt" | "ask";
type Side = "center" | "feed" | "filing" | "sleep";
type Pane = "feed" | "filing" | "sleep" | "twin" | null;

function sleepMismatch(asset: AssetPack, sleepChip: string): boolean {
  if (sleepChip === "steady") {
    return asset.nights > 3;
  }
  if (sleepChip === "balanced") {
    return asset.nights > 7;
  }
  return false;
}

function isLivePrice(label: string): boolean {
  return label.trim() !== "—" && label.trim().length > 0 && label.includes("$");
}

function Pulse({ values }: { values: number[] }) {
  const points = values.length > 0 ? values : [0.4, 0.5, 0.45, 0.55, 0.5];
  const w = 160;
  const h = 40;
  const step = w / Math.max(points.length - 1, 1);
  const d = points
    .map((value, index) => {
      const x = index * step;
      const y = h - value * (h - 6) - 3;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-4 h-10 w-full max-w-[180px]"
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke="#000"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaneSurface({
  active,
  onActivate,
  className,
  label,
  children,
}: {
  active: boolean;
  onActivate: () => void;
  className: string;
  label: string;
  children: ReactNode;
}) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-label={label}
      onClick={onActivate}
      onKeyDown={onKeyDown}
      className={`cursor-pointer rounded-[20px] border border-carbon p-5 text-left transition-transform active:scale-[0.99] md:p-6 ${className} ${
        active ? "ring-2 ring-carbon ring-offset-2 ring-offset-sky-wash" : ""
      }`}
    >
      {children}
    </div>
  );
}

export function Spread({
  pack,
  sessionId,
  sleepChip,
  noise,
  priorAsks,
}: {
  pack: SpreadPack;
  sessionId: string;
  sleepChip: string;
  noise: string;
  priorAsks: Array<{ assetId: string; question: string; reply: string }>;
}) {
  const saveAsk = useMutation(api.profiles.saveAsk);
  const [index, setIndex] = useState(0);
  const [line, setLine] = useState(pack.greeting);
  const [lineKey, setLineKey] = useState("greeting");
  const [lineTick, setLineTick] = useState(0);
  const [side, setSide] = useState<Side>("center");
  const [activePane, setActivePane] = useState<Pane>(null);
  const [openJargon, setOpenJargon] = useState<string | null>(null);
  const [askText, setAskText] = useState("");
  const [askBusy, setAskBusy] = useState(false);
  const [localAsks, setLocalAsks] = useState(priorAsks);

  const asset = pack.assets[index] ?? pack.assets[0];
  const mismatch = asset ? sleepMismatch(asset, sleepChip) : false;
  const live = asset ? isLivePrice(asset.priceLabel) : false;

  const askedThisAsset = useMemo(
    () => (asset ? localAsks.some((item) => item.assetId === asset.id) : false),
    [asset, localAsks],
  );

  if (!asset) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <p className="font-aeonik-pro text-[15px]">No assets packed. Start over.</p>
        <Link href="/" className="ml-3 underline">
          Home
        </Link>
      </div>
    );
  }

  function play(
    next: string,
    key: BeatKey,
    nextSide: Side,
    pane: Pane,
    assetId = asset.id,
  ) {
    const nextTick = lineTick + 1;
    setLineTick(nextTick);
    setLine(next);
    setLineKey(`${assetId}-${key}-${nextTick}`);
    setSide(nextSide);
    setActivePane(pane);
  }

  function onSelectAsset(nextIndex: number) {
    const next = pack.assets[nextIndex];
    if (!next) {
      return;
    }
    setIndex(nextIndex);
    setOpenJargon(null);
    setAskText("");
    play(next.assetGreeting, "greeting", "center", null, next.id);
  }

  async function submitAsk(question: string) {
    const trimmed = question.trim();
    if (!trimmed || askBusy) {
      return;
    }
    if (askedThisAsset) {
      play(
        "One live question per asset. Tap a pane or a suggestion chip.",
        "ask",
        "center",
        null,
      );
      return;
    }

    const suggestionHit = pack.asks.includes(trimmed);
    if (suggestionHit) {
      const lower = trimmed.toLowerCase();
      const reply = lower.includes("twin")
        ? asset.beats.twin
        : lower.includes("sleep") || lower.includes("jumpy")
          ? mismatch
            ? asset.beats.mismatch
            : asset.beats.sleep
          : lower.includes("filing") || lower.includes("document")
            ? asset.beats.filing
            : asset.beats.feed;
      play(reply, "ask", "center", null);
      return;
    }

    setAskBusy(true);
    try {
      const response = await fetch("/api/keel-ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          assetId: asset.id,
          question: trimmed,
        }),
      });
      const body: unknown = await response.json();
      const reply =
        typeof body === "object" &&
        body !== null &&
        "reply" in body &&
        typeof body.reply === "string"
          ? body.reply
          : "Tap Feed or Filing — those lines are packed.";
      play(reply, "ask", "center", null);
      setLocalAsks((prev) => [
        ...prev,
        { assetId: asset.id, question: trimmed, reply },
      ]);
      try {
        await saveAsk({
          sessionId,
          assetId: asset.id,
          question: trimmed,
          reply,
        });
      } catch {
        // API may have saved already
      }
    } catch {
      play(
        "Could not ask live. Tap a pane — those beats are free.",
        "ask",
        "center",
        null,
      );
    } finally {
      setAskBusy(false);
      setAskText("");
    }
  }

  const feedBody =
    noise === "charts"
      ? "Pulse of the last year — not a trading chart."
      : asset.feedLine;

  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-sky-wash">
      <header className="flex items-center justify-between gap-3 px-5 py-4 md:px-8">
        <LogoMark />
        <p className="font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase">
          Feed vs filing
        </p>
        <Link
          href="/"
          className="font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase"
        >
          Restart
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 pb-10 md:px-6">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {pack.assets.map((item, dotIndex) => (
            <button
              key={item.id}
              type="button"
              aria-current={dotIndex === index}
              onClick={() => onSelectAsset(dotIndex)}
              className={`rounded-full border border-carbon px-4 py-2 font-aeonik-pro text-[13px] font-bold tracking-[0.032em] transition-colors ${
                dotIndex === index
                  ? "bg-carbon text-paper-white"
                  : "bg-paper-white text-carbon"
              }`}
            >
              {item.ticker}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2 pt-1">
          <div className="flex items-center gap-2">
            <p className="font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase">
              {asset.kind}
            </p>
            <span
              className={`rounded-full border border-carbon px-2 py-0.5 font-aeonik-pro text-[11px] font-bold tracking-[0.032em] uppercase ${
                live ? "bg-mint-pop" : "bg-soft-mist"
              }`}
            >
              {live ? "Live quote" : "Seed data"}
            </span>
            <span className="rounded-full border border-carbon bg-paper-white px-2 py-0.5 font-aeonik-pro text-[11px] font-bold tracking-[0.032em] uppercase">
              {pack.source === "gateway" ? "Keel packed" : "Canned pack"}
            </span>
          </div>
          <h1
            key={`title-${asset.id}`}
            className="keel-in text-center font-aeonik-pro text-[30px] font-bold leading-[1.1] md:text-[48px] md:leading-none"
          >
            {asset.title}
          </h1>
          <p className="font-aeonik-pro text-[15px] font-medium tracking-[-0.01em] text-carbon">
            {asset.ticker} · {asset.priceLabel}
          </p>
          <p className="max-w-md text-center font-aeonik-pro text-[13px] font-medium leading-[1.39]">
            Tap Feed, Filing, Sleep, or Twin — Keel answers in the middle. No
            extra model calls.
          </p>
        </div>

        <div className="grid flex-1 gap-3 md:grid-cols-[1fr_minmax(220px,280px)_1fr] md:items-stretch">
          <PaneSurface
            active={activePane === "feed"}
            label="Feed pane"
            onActivate={() => play(asset.beats.feed, "feed", "feed", "feed")}
            className="bg-lavender text-carbon"
          >
            <p className="font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase">
              Feed · noise
            </p>
            <p
              key={`feed-${asset.id}-${lineTick}`}
              className="keel-in mt-3 font-aeonik-pro text-[22px] font-bold leading-[1.2] md:text-[24px]"
            >
              {feedBody}
            </p>
            <Pulse values={asset.pulse} />
            <p className="mt-4 font-aeonik-pro text-[12px] font-medium">
              {activePane === "feed" ? "Keel is on the noise" : "Tap for Keel"}
            </p>
          </PaneSurface>

          <div className="flex flex-col items-center justify-center gap-4 rounded-[20px] border border-carbon bg-paper-white px-4 py-5">
            <KeelMascot line={line} side={side} lineKey={lineKey} />
            <p className="text-center font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase">
              {pack.prompt}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {pack.promptOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    play(
                      option.id === "feed"
                        ? asset.beats.feed
                        : asset.beats.filing,
                      option.id,
                      option.id,
                      option.id,
                    )
                  }
                  className={`rounded-full border border-carbon px-4 py-2 font-aeonik-pro text-[13px] font-bold tracking-[0.032em] ${
                    activePane === option.id
                      ? "bg-carbon text-paper-white"
                      : "bg-soft-mist text-carbon"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <PaneSurface
            active={activePane === "filing"}
            label="Filing pane"
            onActivate={() =>
              play(asset.beats.filing, "filing", "filing", "filing")
            }
            className="bg-electric-blue text-carbon"
          >
            <p className="font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase">
              Filing · document
            </p>
            <p
              key={`filing-${asset.id}`}
              className="keel-in mt-3 font-aeonik-pro text-[22px] font-bold leading-[1.2] md:text-[24px]"
            >
              {asset.filingLine}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {asset.jargon.map((item) => (
                <li key={item.term}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenJargon(item.term);
                      play(
                        `${item.term}: ${item.plain}`,
                        "jargon",
                        "filing",
                        "filing",
                      );
                    }}
                    className={`rounded-full border border-carbon px-3 py-1.5 font-aeonik-pro text-[12px] font-bold tracking-[0.032em] ${
                      openJargon === item.term
                        ? "bg-carbon text-paper-white"
                        : "bg-paper-white text-carbon"
                    }`}
                  >
                    {item.term}
                  </button>
                </li>
              ))}
            </ul>
            {openJargon ? (
              <p className="mt-3 font-aeonik-pro text-[13px] font-medium leading-[1.39]">
                {asset.jargon.find((item) => item.term === openJargon)?.plain}
              </p>
            ) : (
              <p className="mt-4 font-aeonik-pro text-[12px] font-medium">
                Tap a word chip — or the pane for the filing beat
              </p>
            )}
          </PaneSurface>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <PaneSurface
            active={activePane === "sleep"}
            label="Sleep meter"
            onActivate={() =>
              play(
                mismatch ? asset.beats.mismatch : asset.beats.sleep,
                mismatch ? "mismatch" : "sleep",
                "sleep",
                "sleep",
              )
            }
            className={
              mismatch ? "bg-ember text-paper-white" : "bg-sunburst text-carbon"
            }
          >
            <p className="font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase">
              Sleep
            </p>
            <p className="mt-2 font-aeonik-pro text-[20px] font-bold leading-[1.2]">
              {asset.sleepLine}
            </p>
            <div
              className={`mt-4 h-3 overflow-hidden rounded-full border border-carbon ${
                mismatch ? "border-paper-white bg-paper-white/30" : "bg-paper-white"
              }`}
            >
              <div
                className={`h-full ${mismatch ? "bg-paper-white" : "bg-mint-pop"}`}
                style={{
                  width: `${Math.min(100, Math.max(8, asset.nights * 7))}%`,
                }}
              />
            </div>
            <p className="mt-2 font-aeonik-pro text-[12px] font-medium">
              Your chip: {sleepChip}
              {mismatch ? " · mismatch" : " · match"} · ~{asset.nights} nights ·
              max drop {asset.maxDrawdownPct}%
            </p>
          </PaneSurface>

          <PaneSurface
            active={activePane === "twin"}
            label="Boring twin"
            onActivate={() => play(asset.beats.twin, "twin", "center", "twin")}
            className="bg-voltage-violet text-paper-white"
          >
            <p className="font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase">
              Boring twin
            </p>
            <p className="mt-2 font-aeonik-pro text-[20px] font-bold leading-[1.2]">
              {asset.twinTitle}
            </p>
            <p className="mt-3 font-aeonik-pro text-[14px] font-medium leading-[1.39]">
              {asset.twinLine}
            </p>
          </PaneSurface>
        </div>

        <div className="rounded-[20px] border border-carbon bg-paper-white p-5">
          <p className="font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase">
            Ask Keel
          </p>
          <p className="mt-1 font-aeonik-pro text-[13px] font-medium leading-[1.39]">
            Suggestion chips are free. Typing uses one live call per asset.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pack.asks.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => void submitAsk(chip)}
                className="rounded-full border border-carbon bg-soft-mist px-3 py-2 font-aeonik-pro text-[12px] font-bold tracking-[0.032em]"
              >
                {chip}
              </button>
            ))}
          </div>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void submitAsk(askText);
            }}
          >
            <input
              value={askText}
              onChange={(event) => setAskText(event.target.value)}
              maxLength={200}
              placeholder={
                askedThisAsset
                  ? "Live ask used for this asset"
                  : "Type one live question (once per asset)"
              }
              disabled={askedThisAsset || askBusy}
              className="min-h-11 flex-1 rounded-full border border-carbon bg-paper-white px-4 font-aeonik-pro text-[14px] font-medium outline-none disabled:bg-soft-mist"
            />
            <button
              type="submit"
              disabled={askedThisAsset || askBusy || askText.trim().length === 0}
              className="rounded-full border border-carbon bg-carbon px-5 py-2.5 font-aeonik-pro text-[13px] font-bold tracking-[0.032em] text-paper-white disabled:bg-soft-mist disabled:text-carbon"
            >
              {askBusy ? "…" : "Ask"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
