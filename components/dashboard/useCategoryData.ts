"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { categoryResponseSchema, type CategoryResponse } from "@/lib/dashboard/api";

type Status = "idle" | "loading" | "ready" | "error";
const cache = new Map<string, CategoryResponse>();

/**
 * Freshness is a property of the page, not of one section: an asset-class page
 * pulls several categories at once, so the header cannot read it off a single
 * response. This little store is what every section reports into and what the
 * refresh control reads back out.
 */
type Freshness = { fetchedAt: number; inFlight: number; generation: number; stale: boolean; sample: boolean };
const EMPTY: Freshness = { fetchedAt: 0, inFlight: 0, generation: 0, stale: false, sample: false };
let freshness: Freshness = EMPTY;
const listeners = new Set<() => void>();

function setFreshness(patch: Partial<Freshness>) {
  freshness = { ...freshness, ...patch };
  for (const notify of listeners) notify();
}
function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

/** Drops every cached category and makes each mounted section fetch again. */
export function refreshAllCategories() {
  cache.clear();
  setFreshness({ generation: freshness.generation + 1 });
}

export function useFreshness(): Freshness {
  return useSyncExternalStore(
    subscribe,
    () => freshness,
    () => EMPTY,
  );
}

export function useCategoryData(categoryId: string, sessionId: string | null, revision: number) {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<CategoryResponse | null>(null);
  const [error, setError] = useState("");
  const [nonce, setNonce] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const forceNext = useRef(false);
  const seenGeneration = useRef(0);
  const key = `${sessionId}:${revision}:${categoryId}`;
  // This section's own refresh and a page-wide one both re-run the fetch.
  const generation = useFreshness().generation;
  const bust = nonce + generation;

  useEffect(() => {
    if (!sessionId) return;
    // `refreshAllCategories` empties the cache, so a generation bump misses
    // here anyway; `nonce` alone decides whether a cached reply may be replayed.
    const cached = nonce === 0 ? cache.get(key) : undefined;
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- replaying a synchronous cache hit.
      setData(cached);
      setStatus("ready");
      return;
    }
    controller.current?.abort();
    const ac = new AbortController();
    let recheck: ReturnType<typeof setTimeout> | undefined;
    // Every generation bump comes from someone pressing refresh, so it forces.
    // The recheck below only bumps `nonce`, which deliberately does not.
    const refreshed = seenGeneration.current !== generation;
    seenGeneration.current = generation;
    const force = forceNext.current || refreshed;
    forceNext.current = false;
    controller.current = ac;
    setStatus("loading");
    setError("");
    setFreshness({ inFlight: freshness.inFlight + 1 });
    let counted = true;
    const done = () => {
      if (!counted) return;
      counted = false;
      setFreshness({ inFlight: Math.max(0, freshness.inFlight - 1) });
    };
    fetch("/api/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, categoryId, force }),
      signal: ac.signal,
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "We couldn't load this category.");
        const parsed = categoryResponseSchema.parse(body);
        cache.set(key, parsed);
        done();
        setFreshness({
          fetchedAt: Math.max(freshness.fetchedAt, parsed.fetchedAt),
          stale: parsed.stale,
          sample: parsed.sample,
        });
        if (!ac.signal.aborted) {
          setData(parsed);
          setStatus("ready");
          // A stale response starts a server-side refresh. Recheck without
          // forcing another refresh so the new market data and ranking appear
          // as soon as that background work finishes.
          if (parsed.refreshing) {
            recheck = setTimeout(
              () => setNonce((current) => current + 1),
              4_000,
            );
          }
        }
      })
      .catch((e) => {
        done();
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : "We couldn't load this category.");
        setStatus("error");
      });
    return () => {
      done();
      ac.abort();
      if (recheck) clearTimeout(recheck);
    };
  }, [bust, categoryId, generation, key, nonce, sessionId]);

  const refresh = useCallback(() => {
    forceNext.current = true;
    setNonce((current) => current + 1);
  }, []);
  const setThoughts = useCallback(
    (thoughts: CategoryResponse["thoughts"]) => {
      setData((d) => {
        if (!d) return d;
        const next = { ...d, thoughts };
        cache.set(key, next);
        return next;
      });
    },
    [key],
  );
  return { status, data, error, refresh, setThoughts };
}
