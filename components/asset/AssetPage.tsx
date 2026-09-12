"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Icon } from "@/components/ui/Icon";
import { KeelMascot } from "@/components/dashboard/KeelMascot";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { RiskPill } from "@/components/dashboard/RiskPill";
import { useKeel } from "@/components/keel/KeelContext";
import { formatPct, formatPrice, type AssetResponse } from "@/lib/dashboard/api";
import { drawdown, type Investment } from "@/lib/dashboard/model";
import { CATEGORY_BY_ID, isCategoryId, type CategoryId } from "@/lib/market/categories";
import { FactsAndNews } from "./FactsAndNews";
import { NextActions } from "./NextActions";
import { RiskExplained } from "./RiskExplained";
import { WhatCouldHappen } from "./WhatCouldHappen";
import { useAssetData } from "./useAssetData";

function toInvestment(a: AssetResponse["asset"]): Investment {
  return {
    id: a.id,
    name: a.name,
    ticker: a.ticker,
    kind: a.kind,
    description: a.description,
    tradeoff: a.tradeoff,
    url: a.url,
    history: a.history,
    historySource: a.historySource,
    retrievedAt: 0,
    evidence: [],
  };
}

export function AssetPage({ id }: { id: string }) {
  return (
    <Suspense fallback={null}>
      <AssetPageInner id={id} />
    </Suspense>
  );
}

function AssetPageInner({ id }: { id: string }) {
  const keel = useKeel();
  const params = useSearchParams();
  const fromParam = params.get("from");
  const { status, data, error } = useAssetData(id, keel.sessionId, keel.authHeaders);
  const [days, setDays] = useState(365);
  const from: CategoryId | null = isCategoryId(fromParam) ? fromParam : data && isCategoryId(data.category.id) ? data.category.id : null;

  useEffect(() => {
    keel.setPageContext({ page: "asset", assetId: id });
    return () => {
      keel.setPageContext({ page: "none" });
      keel.detach(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- provider callbacks are stable.
  }, [id]);
  useEffect(() => {
    if (data) keel.attach({ id: data.asset.id, ticker: data.asset.ticker, name: data.asset.name, locked: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- attach is stable.
  }, [data?.asset.id]);

  if (status === "missing")
    return (
      <main className="loading-page">
        <KeelMascot mood="question" size={120} />
        <h1>We couldn’t find that option.</h1>
        <Link href={keel.withDemo("/dashboard")} className="button primary">
          Back to your dashboard
        </Link>
      </main>
    );
  if (status === "error")
    return (
      <main className="loading-page">
        <KeelMascot mood="question" size={120} />
        <h1>Let’s try that again.</h1>
        <p role="alert">{error}</p>
        <Link href={keel.withDemo(from ? `/dashboard/${from}` : "/dashboard")} className="button primary">
          Back
        </Link>
      </main>
    );
  if (!data)
    return (
      <main className="loading-page">
        <KeelMascot mood="thinking" size={120} />
        <h1>Opening this option…</h1>
      </main>
    );

  const { asset } = data;
  const saved = keel.savedAssets.includes(asset.id);
  const largest = drawdown(asset.history);
  const backLabel = from ? CATEGORY_BY_ID[from].label : "Dashboard";
  return (
    <AppShell activeCategory={from} slim>
      <article className="asset-page">
        <Link href={keel.withDemo(from ? `/dashboard/${from}` : "/dashboard")} className="asset-back text-button">
          <Icon name="back" size={16} /> Back to {backLabel}
        </Link>
        <header className="asset-header">
          <div className="asset-heading">
            <span className="eyebrow">
              {asset.ticker} · {asset.kind === "funds" ? "Fund" : asset.kind === "stocks" ? "Company" : "Crypto"} · Ranked {data.rank} of {data.of} in {data.category.short}
            </span>
            <h1>{asset.name}</h1>
            <p className="asset-oneliner">{asset.description}</p>
          </div>
          <div className="asset-numbers">
            <strong className="asset-price">{formatPrice(asset.price, asset.kind)}</strong>
            <span className="asset-changes">
              <span className={(asset.change1dPct ?? 0) >= 0 ? "positive" : "negative"}>{formatPct(asset.change1dPct)} today</span>
              <span className={(asset.change1yPct ?? 0) >= 0 ? "positive" : "negative"}>{formatPct(asset.change1yPct)} in a year</span>
            </span>
            <span className="asset-pills">
              <RiskPill label={data.risk?.label ?? null} score={data.risk?.score} size="md" />
              {data.fit && <span className="fit-pill">Fit {data.fit.score}/100</span>}
              <button
                type="button"
                className={`icon-button ${saved ? "is-saved" : ""}`}
                aria-pressed={saved}
                aria-label={saved ? "Remove from saved" : "Save this option"}
                onClick={() => void keel.toggleSaved(asset.id)}
              >
                <Icon name="bookmark" size={18} />
              </button>
            </span>
          </div>
        </header>
        <p className="tradeoff">
          <Icon name="info" size={16} /> {asset.tradeoff}
        </p>
        <details className="asset-details key-numbers">
          <summary>Key numbers</summary>
          <dl>
            <div>
              <dt>Price</dt>
              <dd>{formatPrice(asset.price, asset.kind)}</dd>
            </div>
            <div>
              <dt>30 days</dt>
              <dd>{formatPct(asset.change30dPct)}</dd>
            </div>
            <div>
              <dt>1 year</dt>
              <dd>{formatPct(asset.change1yPct)}</dd>
            </div>
            {asset.fundamentals.marketCapUsd !== null && (
              <div>
                <dt>Size (market value)</dt>
                <dd>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(asset.fundamentals.marketCapUsd)}</dd>
              </div>
            )}
            {asset.fundamentals.industry && (
              <div>
                <dt>Industry</dt>
                <dd>{asset.fundamentals.industry}</dd>
              </div>
            )}
            {asset.fundamentals.rank !== null && (
              <div>
                <dt>Crypto rank by size</dt>
                <dd>#{asset.fundamentals.rank}</dd>
              </div>
            )}
          </dl>
        </details>

        <section className="asset-card chart-section" aria-labelledby="chart-heading">
          <div className="section-head">
            <div>
              <h2 id="chart-heading">Price over time</h2>
              <p className="fine-print">Daily prices in USD. Dividends, fees and taxes are not included.</p>
            </div>
            <div className="periods" role="group" aria-label="Time period">
              {[
                [30, "1M"],
                [90, "3M"],
                [180, "6M"],
                [365, "1Y"],
              ].map(([d, label]) => (
                <button key={d} type="button" className={days === d ? "active" : ""} aria-pressed={days === d} onClick={() => setDays(Number(d))}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <PriceChart key={days} assets={[toInvestment(asset)]} days={days} sample={data.sample} paused={keel.paused} onExplain={(text) => keel.say(text)} />
        </section>

        <RiskExplained risk={data.risk} beginner={keel.profile?.experience === "new"} />
        <WhatCouldHappen profile={keel.profile} largestDrop={largest} ticker={asset.ticker} />
        <FactsAndNews details={data.details} officialUrl={asset.url} historySource={asset.historySource} />
        <NextActions items={data.actionItems} />

        {data.peers.length > 0 && (
          <section className="asset-card" aria-labelledby="peers-heading">
            <h2 id="peers-heading">Others in {data.category.short}</h2>
            <ul className="peer-list">
              {data.peers.map((p) => (
                <li key={p.id}>
                  <Link href={keel.withDemo(`/asset/${p.id}?from=${data.category.id}`)}>
                    <span className="rank-small">#{p.rank}</span>
                    <strong>{p.ticker}</strong>
                    <span>{p.name}</span>
                    <small>Risk {p.risk ?? "—"} · Fit {p.fit ?? "—"}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <footer className="app-footer">
          <span>Keel explains investing. It does not give personal financial advice.</span>
        </footer>
      </article>
    </AppShell>
  );
}
