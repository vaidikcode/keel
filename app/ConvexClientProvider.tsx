"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode, useMemo } from "react";

function readConvexUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!raw) {
    return null;
  }
  const url = raw.trim().split(/\s+/)[0];
  if (!url) {
    return null;
  }
  return url;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = readConvexUrl();
  const client = useMemo(() => {
    if (!convexUrl) {
      return null;
    }
    try {
      return new ConvexReactClient(convexUrl);
    } catch (error) {
      console.error("Invalid NEXT_PUBLIC_CONVEX_URL", convexUrl, error);
      return null;
    }
  }, [convexUrl]);

  if (!client) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-lg rounded-2xl border border-white/10 bg-[#101828] p-8 text-zinc-100 shadow-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-teal-300">
            Convex not connected
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            Missing or invalid Convex URL
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Set <code>NEXT_PUBLIC_CONVEX_URL</code> to a single URL with no extra
            lines. Local: <code>http://127.0.0.1:3210</code>. Production:{" "}
            <code>https://youthful-manatee-537.convex.cloud</code>.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-black/50 p-4 font-mono text-sm text-teal-200">
            bunx convex dev
          </pre>
        </div>
      </div>
    );
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
