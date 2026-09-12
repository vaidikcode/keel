"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode, useMemo } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const client = useMemo(() => {
    if (!convexUrl) {
      return null;
    }
    return new ConvexReactClient(convexUrl);
  }, [convexUrl]);

  if (!client) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-lg rounded-2xl border border-white/10 bg-[#101828] p-8 text-zinc-100 shadow-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-teal-300">
            Convex not connected
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            Start the local backend
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Next.js is running, but it does not have a Convex deployment URL
            yet. In a second terminal from the repo root:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-black/50 p-4 font-mono text-sm text-teal-200">
            bunx convex dev
          </pre>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            That command writes <code>NEXT_PUBLIC_CONVEX_URL</code> to{" "}
            <code>.env.local</code>. Restart <code>bun run dev</code> after it
            finishes the first sync, then refresh this page.
          </p>
        </div>
      </div>
    );
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
