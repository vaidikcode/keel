"use client";
import { useEffect, useState } from "react";
import { useKeel } from "@/components/keel/KeelContext";

export type MarketIndexData = {
  symbol: string;
  name: string;
  isLocal: boolean;
  price: number | null;
  change1dPct: number | null;
  change30dPct: number | null;
  change1yPct: number | null;
  history: { date: string; value: number }[];
};
export type MarketNewsItem = {
  ticker: string;
  name: string;
  headline: string;
  url: string;
  publisher: string | null;
  asOf: string | null;
};

/**
 * The home market index and headlines for saved assets.
 *
 * One request per country-and-saved-set, and the route behind it is cached and
 * spends no model tokens, so this stays cheap enough to run on page load.
 */
export function useMarketExtras(): { index: MarketIndexData | null; news: MarketNewsItem[] } {
  const keel = useKeel();
  const [data, setData] = useState<{ index: MarketIndexData | null; news: MarketNewsItem[] }>({
    index: null,
    news: [],
  });
  const country = keel.profile?.country ?? "US";
  // Saved assets decide the headlines, so the key has to move when they do.
  const saved = keel.savedAssets.join(",");

  useEffect(() => {
    if (!keel.sessionId) return;
    const controller = new AbortController();
    fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, assetIds: saved ? saved.split(",") : [] }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (body && !controller.signal.aborted)
          setData({ index: body.index ?? null, news: body.news ?? [] });
      })
      .catch(() => {
        /* The page works without it; there is nothing useful to say here. */
      });
    return () => controller.abort();
  }, [country, saved, keel.sessionId]);

  return data;
}
