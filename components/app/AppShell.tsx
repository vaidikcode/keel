"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import type { CategoryId } from "@/lib/market/categories";
import { CategorySidebar } from "./CategorySidebar";
import { useKeel } from "@/components/keel/KeelContext";

export function AppShell({
  activeCategory,
  children,
  slim = false,
}: {
  activeCategory: CategoryId | null;
  children: ReactNode;
  slim?: boolean;
}) {
  const keel = useKeel();
  return (
    <div className={`app-shell ${slim ? "is-slim" : ""} ${keel.paused ? "motion-paused" : ""}`}>
      <CategorySidebar activeId={activeCategory} />
      <main className="app-main">
        {keel.demo && (
          <div className="sample-note" role="note">
            <span className="sample-dot" /> Example with made-up prices. <Link href="/">Add your answers</Link> to see real data.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
