"use client";
import type { ReactNode } from "react";
import { KeelProvider } from "@/components/keel/KeelContext";
import { KeelOverlay } from "@/components/keel/KeelOverlay";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <KeelProvider>
      <div className="app-root">{children}</div>
      <KeelOverlay />
    </KeelProvider>
  );
}
