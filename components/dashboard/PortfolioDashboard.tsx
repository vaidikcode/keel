"use client";
import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { Icon } from "@/components/ui/Icon";
import { KeelMascot } from "@/components/dashboard/KeelMascot";
import { useKeel } from "@/components/keel/KeelContext";
import { Carousel } from "./Carousel";
import { Disclaimer } from "./Disclaimer";
import { RankedCard } from "./RankedCard";
import { RefreshControl } from "./RefreshControl";
import { useAllAssets } from "./useAllAssets";
import { capacityFor } from "@/lib/market/fit";
import { CATEGORY_BY_ID } from "@/lib/market/categories";

/**
 * What this person has actually saved, drawn from every category so a bookmark
 * made on any page shows up here.
 */
export function PortfolioDashboard() {
  const keel = useKeel();
  const { items, loading } = useAllAssets();
  const saved = keel.savedAssets;

  // Keep the order the person saved them in rather than re-ranking their own list.
  const mine = saved
    .map((id) => items.find((i) => i.asset.id === id))
    .filter((i): i is NonNullable<typeof i> => Boolean(i))
    .map((i, index) => ({ ...i, asset: { ...i.asset, rank: index + 1 } }));

  const capacity = keel.profile ? capacityFor(keel.profile) : null;
  const withRisk = mine.filter((m) => m.asset.risk);
  const averageRisk = withRisk.length
    ? Math.round(withRisk.reduce((sum, m) => sum + (m.asset.risk?.score ?? 0), 0) / withRisk.length)
    : null;
  const kinds = new Set(mine.map((m) => CATEGORY_BY_ID[m.categoryId].kind));

  return (
    <AppShell activeCategory="portfolio">
      <header className="app-header">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link href={keel.withDemo("/dashboard")}>Dashboard</Link>
          <Icon name="chevron" size={12} />
          <span aria-current="page">Portfolio</span>
        </nav>
        <div className="header-actions">
          <RefreshControl />
        </div>
      </header>

      {saved.length === 0 ? (
        <div className="empty-state">
          <KeelMascot mood="question" size={110} />
          <h3>Nothing saved yet.</h3>
          <p>
            Press the bookmark on any card and it will collect here, with how the set sits
            against your answers.
          </p>
          <p className="kind-lead">
            <Disclaimer />
          </p>
          <Link href={keel.withDemo("/dashboard/stocks")} className="button primary">
            Browse stocks
          </Link>
        </div>
      ) : (
        <>
          <p className="kind-lead">
            {saved.length} saved {saved.length === 1 ? "option" : "options"}
            {kinds.size > 1 ? ` across ${kinds.size} asset classes` : ""}. Saving is a
            shortlist, not a holding — Keel does not track money you have invested.{" "}
            <Disclaimer />
          </p>

          {capacity && averageRisk !== null && (
            <section className="portfolio-fit" aria-labelledby="portfolio-fit-heading">
              <div className="section-head">
                <div>
                  <h2 id="portfolio-fit-heading">How this set sits with you</h2>
                  <p className="fine-print">
                    Average risk across what you saved, against the capacity your answers
                    suggest. Neither number predicts a price.
                  </p>
                </div>
              </div>
              <div className="portfolio-gauges">
                <div>
                  <span className="gauge-label">Average risk of your list</span>
                  <div className="risk-meter">
                    <span style={{ width: `${averageRisk}%` }} />
                  </div>
                  <b>{averageRisk} / 100</b>
                </div>
                <div>
                  <span className="gauge-label">Capacity from your answers</span>
                  <div className="risk-meter">
                    <span style={{ width: `${capacity.score}%` }} />
                  </div>
                  <b>{capacity.score} / 100</b>
                </div>
              </div>
              <p className="fine-print">
                {averageRisk > capacity.score + 10
                  ? "Your list moves around more than your answers suggest you are comfortable with. Worth a look, not an alarm."
                  : averageRisk < capacity.score - 20
                    ? "Your list is steadier than your answers suggest you need. That is a choice, not a mistake."
                    : "Your list is broadly in line with what your answers suggest."}
              </p>
            </section>
          )}

          <Carousel
            title="Saved"
            note="In the order you saved them. Press the bookmark again on any card to remove it."
            resetKey={mine.map((m) => m.asset.id).join()}
          >
            {loading
              ? Array.from({ length: Math.min(5, saved.length) }, (_, i) => (
                  <li className="ranked-card is-skeleton" key={i} aria-hidden="true">
                    <span className="ranked-card-main" />
                  </li>
                ))
              : mine.map((m) => (
                  <RankedCard
                    key={m.asset.id}
                    asset={m.asset}
                    categoryId={m.categoryId}
                    total={mine.length}
                  />
                ))}
          </Carousel>

          {!loading && mine.length < saved.length && (
            <p className="fine-print">
              {saved.length - mine.length} saved{" "}
              {saved.length - mine.length === 1 ? "option is" : "options are"} not in Keel’s
              current lists and can’t be shown.
            </p>
          )}
        </>
      )}

      <footer className="app-footer">
        <span>Keel explains investing. It does not give personal financial advice.</span>
        <span>Saving is a shortlist. Keel does not know what you own.</span>
      </footer>
    </AppShell>
  );
}
