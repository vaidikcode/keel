"use client";
import Link from "next/link";
import { useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Icon } from "@/components/ui/Icon";
import { KeelMascot } from "@/components/dashboard/KeelMascot";
import { useKeel } from "@/components/keel/KeelContext";
import { Carousel } from "./Carousel";
import { Disclaimer } from "./Disclaimer";
import { RankedCard } from "./RankedCard";
import { RefreshControl } from "./RefreshControl";
import { TrendingSection } from "./TrendingSection";
import { useAllAssets } from "./useAllAssets";
import { rankObjectively } from "@/lib/market/objective";

/**
 * One place that spans all three asset classes, rather than making someone open
 * Stocks, Funds and Crypto in turn to compare. Same two orderings as an asset
 * class page — the objective list and the fit list — just drawn from everything.
 */
export function OverviewDashboard() {
  const keel = useKeel();
  const { items, loading } = useAllAssets();

  useEffect(() => {
    keel.setPageContext({ page: "dashboard", categoryId: "broad-funds" });
    return () => keel.setPageContext({ page: "none" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- context identity changes each render.
  }, []);

  const top = rankObjectively(items.map((i) => i.asset), 10);
  const byFit = [...items]
    .sort((a, b) => (b.asset.fit?.score ?? -1) - (a.asset.fit?.score ?? -1))
    .slice(0, 12)
    .map((m, i) => ({ ...m, asset: { ...m.asset, rank: i + 1 } }));
  const homeOf = (id: string) =>
    items.find((m) => m.asset.id === id)?.categoryId ?? "broad-funds";

  const skeletons = Array.from({ length: 5 }, (_, i) => (
    <li className="ranked-card is-skeleton" key={i} aria-hidden="true">
      <span className="ranked-card-main" />
    </li>
  ));

  return (
    <AppShell activeCategory="overview">
      <header className="app-header">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link href={keel.withDemo("/dashboard")}>Dashboard</Link>
          <Icon name="chevron" size={12} />
          <span aria-current="page">Overview</span>
        </nav>
        <div className="header-actions">
          <RefreshControl />
        </div>
      </header>

      <Disclaimer />
      <p className="kind-lead">
        Everything Keel follows, across stocks, funds and crypto, in one place.
      </p>

      <Carousel
        title="Top 10 overall"
        note="The largest and steadiest of everything Keel follows, in the same order for everyone. Not ranked against your answers."
        resetKey={top.map((a) => a.id).join()}
      >
        {loading
          ? skeletons
          : top.map((a) => (
              <RankedCard key={a.id} asset={a} categoryId={homeOf(a.id)} total={top.length} />
            ))}
      </Carousel>

      <Carousel
        title="You might be interested"
        note="Ordered by fit with your answers, across all three asset classes. Not a recommendation."
        resetKey={byFit.map((m) => m.asset.id).join()}
      >
        {loading
          ? skeletons
          : byFit.map((m) => (
              <RankedCard
                key={m.asset.id}
                asset={m.asset}
                categoryId={m.categoryId}
                total={byFit.length}
              />
            ))}
      </Carousel>

      {!loading && <TrendingSection kind="stocks" assets={items} titleOverride="Trending now" />}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <KeelMascot mood="question" size={90} />
          <h3>Nothing loaded yet.</h3>
          <p>Prices didn’t come through. Try refreshing in a moment.</p>
        </div>
      )}

      <footer className="app-footer">
        <span>Keel explains investing. It does not give personal financial advice.</span>
        <span>Prices exclude dividends, fees and taxes.</span>
      </footer>
    </AppShell>
  );
}
