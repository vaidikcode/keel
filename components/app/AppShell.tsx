"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import type { CategoryId } from "@/lib/market/categories";
import type { NavView } from "@/lib/market/navGroups";
import { CategorySidebar } from "./CategorySidebar";
import { useKeel } from "@/components/keel/KeelContext";

export function AppShell({
  activeCategory,
  activeTab = null,
  children,
  slim = false,
}: {
  activeCategory: CategoryId | NavView | null;
  /** Id of an analysed tab, which is not one of the fixed nav views. */
  activeTab?: string | null;
  children: ReactNode;
  slim?: boolean;
}) {
  const keel = useKeel();
  return (
    <div className={`app-shell ${slim ? "is-slim" : ""} ${keel.paused ? "motion-paused" : ""}`}>
      <CategorySidebar activeId={activeCategory} activeTab={activeTab} />
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
