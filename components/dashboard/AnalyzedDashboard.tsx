"use client";
import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { Icon } from "@/components/ui/Icon";
import { KeelMascot } from "@/components/dashboard/KeelMascot";
import { useKeel } from "@/components/keel/KeelContext";
import { Disclaimer } from "./Disclaimer";
import { RefreshControl } from "./RefreshControl";

function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}

/**
 * A tab someone analysed, opened as a page of its own rather than trapped in
 * the modal it was created in. The sidebar lists these alongside the asset
 * classes, so returning to one is the same gesture as opening any other page.
 */
export function AnalyzedDashboard({ id }: { id: string }) {
  const keel = useKeel();
  const asset = keel.analyzedAssets.find((a) => a.id === id) ?? null;

  if (!asset)
    return (
      <AppShell activeCategory={null} activeTab={id}>
        <main className="loading-page">
          <KeelMascot mood="question" size={120} />
          <h1>That tab isn’t here.</h1>
          <p>Analysed tabs live with your answers. Share the page again to bring it back.</p>
          <Link href={keel.withDemo("/dashboard")} className="button primary">
            Back to dashboard
          </Link>
        </main>
      </AppShell>
    );

  const meta = [asset.exchange, asset.platform].filter(Boolean).join(" · ");

  return (
    <AppShell activeCategory={null} activeTab={asset.id}>
      <header className="app-header">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link href={keel.withDemo("/dashboard")}>Dashboard</Link>
          <Icon name="chevron" size={12} />
          <span aria-current="page">{asset.ticker}</span>
        </nav>
        <div className="header-actions">
          <RefreshControl />
        </div>
      </header>

      <p className="kind-lead">
        <Disclaimer />
      </p>

      <section className="analyzed-page" aria-labelledby="analyzed-heading">
        <div className="analyzed-identity">
          <span className="ticker">{asset.ticker}</span>
          <div>
            <h2 id="analyzed-heading">{asset.name}</h2>
            {meta && <small>{meta}</small>}
          </div>
        </div>

        <p className="analyzed-question">
          <Icon name="help" size={15} /> {asset.question}
        </p>
        <p className="analyzed-summary">{asset.summary}</p>

        {asset.sourceIds.length > 0 && (
          <div className="result-sources">
            {asset.sourceIds.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                {sourceHost(url)}
              </a>
            ))}
          </div>
        )}

        <div className="ranked-actions">
          <button
            type="button"
            className="button primary"
            onClick={() => {
              keel.attach({ id: asset.id, ticker: asset.ticker, name: asset.name });
              keel.setOpen(true);
            }}
          >
            Continue with Keel <Icon name="chat" size={16} />
          </button>
        </div>
      </section>

      <footer className="app-footer">
        <span>Keel explains investing. It does not give personal financial advice.</span>
        <span>Read from a page you shared. Check the source before acting on it.</span>
      </footer>
    </AppShell>
  );
}
