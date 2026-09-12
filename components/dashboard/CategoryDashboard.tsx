"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Icon } from "@/components/ui/Icon";
import { KeelMascot } from "@/components/dashboard/KeelMascot";
import { useKeel } from "@/components/keel/KeelContext";
import { CATEGORY_BY_ID, type CategoryId } from "@/lib/market/categories";
import { thoughtsSchema } from "@/lib/dashboard/api";
import { KeelThoughts } from "./KeelThoughts";
import { RankedRow } from "./RankedRow";
import { TrendingStrip } from "./TrendingStrip";
import { useCategoryData } from "./useCategoryData";

type ThoughtsStatus = "idle" | "loading" | "ready" | "error" | "unavailable";

export function CategoryDashboard({ categoryId }: { categoryId: CategoryId }) {
  const keel = useKeel();
  const category = CATEGORY_BY_ID[categoryId];
  const { status, data, error, refresh, setThoughts } = useCategoryData(categoryId, keel.sessionId, keel.revision, keel.authHeaders);
  const [thoughtsStatus, setThoughtsStatus] = useState<ThoughtsStatus>("idle");
  const requested = useRef("");

  useEffect(() => {
    keel.setPageContext({ page: "dashboard", categoryId });
    return () => keel.setPageContext({ page: "none" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setPageContext is stable; only the category matters.
  }, [categoryId]);

  useEffect(() => {
    if (!data || data.sample || !keel.sessionId) return;
    if (data.thoughts) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reflect cached thoughts from the category response.
      setThoughtsStatus("ready");
      return;
    }
    const key = `${keel.sessionId}:${keel.revision}:${categoryId}:${data.fetchedAt}`;
    if (requested.current === key) return;
    requested.current = key;
    setThoughtsStatus("loading");
    keel
      .authHeaders()
      .then((headers) =>
        fetch("/api/thoughts", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ sessionId: keel.sessionId, categoryId }),
        }),
      )
      .then(async (r) => {
        const body = await r.json();
        if (r.status === 503) {
          setThoughtsStatus("unavailable");
          return;
        }
        if (!r.ok) throw new Error(body.error);
        setThoughts(thoughtsSchema.parse(body.thoughts));
        setThoughtsStatus("ready");
      })
      .catch(() => setThoughtsStatus("error"));
  }, [categoryId, data, keel, setThoughts]);

  if (keel.isLoaded && !keel.demo && !keel.sessionId)
    return (
      <main className="loading-page">
        <KeelMascot mood="thinking" size={120} />
        <h1>Signing you in…</h1>
      </main>
    );

  const fallbackReasons = data?.assets[0]?.fit?.reasons ?? [];
  return (
    <AppShell activeCategory={categoryId}>
      <header className="app-header">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link href={keel.withDemo("/dashboard")}>Dashboard</Link>
          <Icon name="chevron" size={12} />
          <span aria-current="page">{category.label}</span>
        </nav>
        <div className="header-actions">
          {data && (
            <span className={`data-status ${data.stale ? "is-stale" : ""}`}>
              <i aria-hidden="true" />
              {data.sample
                ? "Example prices"
                : data.refreshing
                  ? "Refreshing prices…"
                  : data.stale
                    ? "Prices may be a little old"
                    : `Prices as of ${new Date(data.fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
            </span>
          )}
          <button type="button" className="text-button" onClick={refresh} disabled={status === "loading"}>
            <Icon name="play" size={14} /> Refresh
          </button>
        </div>
      </header>

      <KeelThoughts
        category={category}
        data={data?.thoughts ?? null}
        status={data?.sample ? "ready" : thoughtsStatus}
        fallbackReasons={fallbackReasons}
      />

      {status === "error" && !data ? (
        <div className="empty-state" role="alert">
          <KeelMascot mood="question" size={90} />
          <h3>Let’s try that again.</h3>
          <p>{error}</p>
          <div className="ranked-actions">
            <button type="button" className="button primary small" onClick={refresh}>
              Retry
            </button>
            <Link href="/dashboard/broad-funds?demo=1" className="text-button">
              Explore an example
            </Link>
          </div>
        </div>
      ) : (
        <RankedRow assets={data?.assets ?? []} categoryId={categoryId} loading={status !== "ready" && !data} />
      )}

      {data && data.facts.length > 0 && (
        <section className="facts-section" aria-labelledby="facts-heading">
          <div className="section-head">
            <div>
              <h2 id="facts-heading">Recent facts Keel found</h2>
              <p className="fine-print">Headlines are claims from their publishers, not verified facts.</p>
            </div>
          </div>
          <ul className="fact-list">
            {data.facts.slice(0, 4).map((f) => (
              <li key={f.url}>
                <a href={f.url} target="_blank" rel="noreferrer">
                  <strong>{f.title}</strong>
                  <span>{f.snippet}</span>
                  <small>
                    {f.publishedAt ? `${f.publishedAt} · ` : ""}
                    {new URL(f.url).hostname.replace(/^www\./, "")}
                  </small>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <TrendingStrip items={data?.trending ?? []} />

      <footer className="app-footer">
        <span>Keel explains investing. It does not give personal financial advice.</span>
        <span>Prices exclude dividends, fees and taxes.</span>
      </footer>
    </AppShell>
  );
}
