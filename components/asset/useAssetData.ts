"use client";
import { useEffect, useState } from "react";
import { assetResponseSchema, type AssetResponse } from "@/lib/dashboard/api";

export function useAssetData(
  id: string,
  sessionId: string | null,
  authHeaders: () => Promise<Record<string, string>>,
) {
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "missing">("loading");
  const [data, setData] = useState<AssetResponse | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!sessionId) return;
    const ac = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mark the new request as loading before fetching.
    setStatus("loading");
    authHeaders()
      .then((headers) =>
        fetch(`/api/asset/${encodeURIComponent(id)}?sessionId=${encodeURIComponent(sessionId)}`, {
          signal: ac.signal,
          headers,
        }),
      )
      .then(async (r) => {
        const body = await r.json();
        if (r.status === 404) {
          setStatus("missing");
          return;
        }
        if (!r.ok) throw new Error(body.error ?? "We couldn't load this option.");
        setData(assetResponseSchema.parse(body));
        setStatus("ready");
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : "We couldn't load this option.");
        setStatus("error");
      });
    return () => ac.abort();
  }, [authHeaders, id, sessionId]);
  return { status, data, error };
}
