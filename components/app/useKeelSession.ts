"use client";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";

export type KeelSession = {
  /** Clerk user id, "demo" in sample mode, or null while resolving. */
  sessionId: string | null;
  demo: boolean;
  isLoaded: boolean;
  /** Append ?demo=1 to internal links while in sample mode. */
  withDemo: (href: string) => string;
  /** Headers carrying the Convex-template Clerk token, or none when signed out. */
  authHeaders: () => Promise<Record<string, string>>;
};

export function useKeelSession(): KeelSession {
  const { userId, isLoaded, getToken } = useAuth();
  const [demo, setDemo] = useState<boolean | null>(null);
  const tokenRef = useRef(getToken);
  useEffect(() => {
    tokenRef.current = getToken;
  }, [getToken]);
  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    try {
      const token = await tokenRef.current({ template: "convex" });
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  }, []);
  useEffect(() => {
    // Demo mode is read after hydration so server and client markup agree.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL is only available on the client.
    setDemo(new URLSearchParams(location.search).get("demo") === "1");
  }, []);
  const resolvedDemo = demo === true;
  const sessionId = resolvedDemo ? "demo" : isLoaded && userId ? userId : null;
  return {
    sessionId,
    demo: resolvedDemo,
    isLoaded: demo !== null && isLoaded,
    withDemo: (href: string) =>
      resolvedDemo ? `${href}${href.includes("?") ? "&" : "?"}demo=1` : href,
    authHeaders,
  };
}
