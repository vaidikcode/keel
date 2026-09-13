"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { categoryResponseSchema, type CategoryResponse } from "@/lib/dashboard/api";

type Status = "idle" | "loading" | "ready" | "error";
const cache = new Map<string, CategoryResponse>();

export function useCategoryData(categoryId: string, sessionId: string | null, revision: number) {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<CategoryResponse | null>(null);
  const [error, setError] = useState("");
  const [nonce, setNonce] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const forceNext = useRef(false);
  const key = `${sessionId}:${revision}:${categoryId}`;

  useEffect(() => {
    if (!sessionId) return;
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
    const force = forceNext.current;
    forceNext.current = false;
    controller.current = ac;
    setStatus("loading");
    setError("");
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
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : "We couldn't load this category.");
        setStatus("error");
      });
    return () => {
      ac.abort();
      if (recheck) clearTimeout(recheck);
    };
  }, [categoryId, key, nonce, sessionId]);

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
