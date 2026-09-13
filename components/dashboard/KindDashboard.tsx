"use client";
import Link from "next/link";
import { useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Icon } from "@/components/ui/Icon";
import { KeelMascot } from "@/components/dashboard/KeelMascot";
import { useKeel } from "@/components/keel/KeelContext";
import { RefreshControl } from "./RefreshControl";
import { CategorySection } from "./CategorySection";
import { KindSections } from "./KindSections";
import { Disclaimer } from "./Disclaimer";
import { categoryIdsForKind, NAV_LABEL } from "@/lib/market/navGroups";
import type { AssetKind } from "@/lib/market/categories";

const LEAD: Record<AssetKind, string> = {
  stocks: "Shares in single companies. Each one carries that company's own risks.",
  funds: "One purchase that holds many investments at once, which spreads the risk out.",
  crypto: "Digital assets that trade around the clock and can move very sharply.",
};

export function KindDashboard({ kind }: { kind: AssetKind }) {
  const keel = useKeel();
  const sections = categoryIdsForKind(kind);
  const first = sections[0];

  useEffect(() => {
    keel.setPageContext({ page: "dashboard", categoryId: first });
    return () => keel.setPageContext({ page: "none" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- context identity changes each render.
  }, [first]);

  if (keel.isLoaded && !keel.demo && !keel.sessionId)
    return (
      <main className="loading-page">
        <KeelMascot mood="thinking" size={120} />
        <h1>Signing you in…</h1>
      </main>
    );

  return (
    <AppShell activeCategory={kind}>
      <header className="app-header">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link href={keel.withDemo("/dashboard")}>Dashboard</Link>
          <Icon name="chevron" size={12} />
          <span aria-current="page">{NAV_LABEL[kind]}</span>
        </nav>
        <div className="header-actions">
          <RefreshControl />
        </div>
      </header>

      <Disclaimer />
      <p className="kind-lead">{LEAD[kind]}</p>

      <KindSections key={kind} kind={kind} categoryIds={sections} />

      {sections.map((id) => (
        <CategorySection key={id} categoryId={id} />
      ))}

      <footer className="app-footer">
        <span>Keel explains investing. It does not give personal financial advice.</span>
        <span>Prices exclude dividends, fees and taxes.</span>
      </footer>
    </AppShell>
  );
}
