"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
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
      <div className="flex flex-1 items-center justify-center bg-sky-wash px-6">
        <div className="max-w-lg rounded-[20px] border border-carbon bg-paper-white p-8 text-carbon">
          <p className="font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase">
            Convex not connected
          </p>
          <h1 className="mt-3 font-aeonik-pro text-[30px] font-bold leading-[1.1]">
            Missing Convex URL
          </h1>
          <p className="mt-3 font-aeonik-pro text-[15px] font-medium leading-[1.39] tracking-[-0.01em]">
            Set <code>NEXT_PUBLIC_CONVEX_URL</code> to a single URL. Local:{" "}
            <code>http://127.0.0.1:3210</code>. Production:{" "}
            <code>https://youthful-manatee-537.convex.cloud</code>.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-[20px] border border-carbon bg-carbon px-4 py-3 font-mono text-sm text-paper-white">
            bun run dev:backend
          </pre>
        </div>
      </div>
    );
  }

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
