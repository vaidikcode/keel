"use client";
import { useEffect, useState } from "react";
import { readSessionId } from "@/lib/session";

export type KeelSession = {
  /** Browser-local session id, "demo" in sample mode, or null while resolving. */
  sessionId: string | null;
  demo: boolean;
  isLoaded: boolean;
  /** Append ?demo=1 to internal links while in sample mode. */
  withDemo: (href: string) => string;
};

export function useKeelSession(): KeelSession {
  const [demo, setDemo] = useState<boolean | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    const isDemo = new URLSearchParams(location.search).get("demo") === "1";
    // Demo mode and the local session id are read after hydration so server and client markup agree.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL and localStorage are only available on the client.
    setDemo(isDemo);
    setSessionId(isDemo ? "demo" : readSessionId());
  }, []);
  const resolvedDemo = demo === true;
  return {
    sessionId,
    demo: resolvedDemo,
    isLoaded: demo !== null,
    withDemo: (href: string) =>
      resolvedDemo ? `${href}${href.includes("?") ? "&" : "?"}demo=1` : href,
  };
}
