"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  type Dashboard,
  type Turn,
  drawdown,
  lossScenario,
} from "@/lib/dashboard/model";
import {
  currencyFormat,
  goalLabels,
  horizonLabels,
  nextStep,
  type Profile,
} from "@/lib/onboarding/questions";
import { UserButton } from "@clerk/nextjs";
import { Icon } from "@/components/ui/Icon";
import { KeelMascot } from "./KeelMascot";
import { PriceChart } from "./PriceChart";

type View = "overview" | "explore" | "saved";
type Mode = "history" | "compare" | "scenario";
function sourceHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
export function Spread({
  dashboard,
  profile,
  sessionId,
  turns,
  savedAssets,
  onRefresh,
  refreshing,
}: {
  dashboard: Dashboard;
  profile: Profile;
  sessionId: string;
  turns: Turn[];
  savedAssets: string[];
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const [view, setView] = useState<View>("overview"),
    [mode, setMode] = useState<Mode>("history");
  const [selected, setSelected] = useState(dashboard.assets[0]?.id ?? "vti"),
    [comparison, setComparison] = useState<string[]>([]),
    [days, setDays] = useState(365);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all");
  const [amount, setAmount] = useState(profile.amount ?? 1000),
    [drop, setDrop] = useState(20);
  const [paused, setPaused] = useState(false),
    [minimized, setMinimized] = useState(false);
  const [message, setMessage] = useState(nextStep(profile)),
    [question, setQuestion] = useState(""),
    [busy, setBusy] = useState(false),
    [chatError, setChatError] = useState("");
  const [localTurns, setLocalTurns] = useState<Turn[]>([]),
    [sampleSaved, setSampleSaved] = useState<string[]>([]);
  const [showSources, setShowSources] = useState(false),
    [showConversation, setShowConversation] = useState(false);
  const [activeContext, setActiveContext] = useState("overview"),
    [notice, setNotice] = useState("");
  const [cited, setCited] = useState<string[]>([]);
  const toggleSaved = useMutation(api.profiles.toggleSaved),
    newConversation = useMutation(api.profiles.newConversation);
  const interaction = useRef(0);
  const prepared = useRef(false),
    requestId = useRef<{
      id: string;
      question: string;
      assetId: string;
    } | null>(null);
  const asset =
    dashboard.assets.find((a) => a.id === selected) ?? dashboard.assets[0];
  const saved = dashboard.sample ? sampleSaved : savedAssets;
  const allTurns = [
    ...turns,
    ...localTurns.filter((t) => !turns.some((p) => p.id === t.id)),
  ];
  const chartAssets = [
    asset,
    ...comparison
      .filter((id) => id !== asset?.id)
      .map((id) => dashboard.assets.find((a) => a.id === id)!),
  ]
    .filter(Boolean)
    .slice(0, 3);
  const biggestDrop = asset ? drawdown(asset.history) : null;
  const outcome = lossScenario(amount, drop);
  function applyAction(action: string) {
    if (action === "compare") {
      setMode("compare");
      setActiveContext("compare");
      if (!comparison.length)
        setComparison(
          dashboard.assets
            .filter((a) => a.id !== asset.id)
            .slice(0, 1)
            .map((a) => a.id),
        );
    }
    if (action === "scenario") {
      setMode("scenario");
      setActiveContext("scenario");
    }
    if (action === "sources") setShowSources(true);
    if (action === "profile")
      setNotice(
        "You can update your time frame and financial context in Edit your answers.",
      );
  }
  useEffect(() => {
    if (
      dashboard.sample ||
      !asset ||
      prepared.current ||
      turns.some((t) => t.id.startsWith("prepare:"))
    )
      return;
    prepared.current = true;
    // One preparation sequence per mount; server IDs deduplicate across tabs.
    async function prepare() {
      const initialInteraction = interaction.current;
      const run = async (mode: "prepare" | "guidance", question: string) => {
        const response = await fetch("/api/keel-ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            assetId: asset.id,
            requestId: crypto.randomUUID(),
            question,
            mode,
          }),
        });
        if (!response.ok) return false;
        const reply = await response.json();
        if (interaction.current === initialInteraction) setMessage(reply.text);
        return true;
      };
      if (await run("prepare", "What can I learn from these options?"))
        await run("guidance", "What is a useful next step for my goal?");
    }
    void prepare().catch(() => {});
  }, [dashboard.sample, asset, sessionId, turns]);
  if (!asset)
    return (
      <div className="empty-state">
        <h1>No options available yet.</h1>
        <button className="button primary" onClick={onRefresh}>
          Try again
        </button>
      </div>
    );
  function explain(text: string, context = "chart") {
    interaction.current += 1;
    setMessage(text);
    setCited([]);
    setActiveContext(context);
    setMinimized(false);
  }
  function changeMode(next: Mode) {
    setMode(next);
    setActiveContext(next);
    if (next === "compare") {
      if (!comparison.length)
        setComparison(
          dashboard.assets
            .filter((a) => a.id !== asset.id)
            .slice(0, 1)
            .map((a) => a.id),
        );
      explain(
        "Start both options with the same amount. Then compare the ups and downs over the same dates.",
        "compare",
      );
    }
    if (next === "scenario")
      explain(
        "Move the slider to see what a drop would mean for your amount. This is a hypothetical scenario, not a prediction.",
        "scenario",
      );
  }
  async function saveAsset(id: string) {
    if (dashboard.sample)
      setSampleSaved((s) =>
        s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
      );
    else
      try {
        await toggleSaved({ sessionId, assetId: id });
      } catch {
        setNotice("We couldn't save that option. Please try again.");
      }
  }
  async function ask(text: string) {
    if (!text.trim() || busy) return;
    interaction.current += 1;
    const askedAtInteraction = interaction.current;
    setMinimized(false);
    setChatError("");
    if (dashboard.sample) {
      const reply = text.toLowerCase().includes("risk")
        ? "Explore the drop scenario to see how a change in price affects an amount. These charts use sample data, so they can't tell us the real risk of an investment."
        : "This is an example dashboard. Try comparing two paths or changing the drop scenario. Add your goals to ask Keel questions about real data.";
      setMessage(reply);
      setCited([]);
      setLocalTurns((t) => [
        ...t,
        {
          id: crypto.randomUUID(),
          question: text,
          reply,
          action: "none",
          sourceIds: [],
        },
      ]);
      setQuestion("");
      setShowConversation(true);
      return;
    }
    setBusy(true);
    if (
      requestId.current?.question !== text ||
      requestId.current.assetId !== asset.id
    )
      requestId.current = {
        id: crypto.randomUUID(),
        question: text,
        assetId: asset.id,
      };
    try {
      const response = await fetch("/api/keel-ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          assetId: asset.id,
          requestId: requestId.current.id,
          question: text,
          mode: "ask",
          context: `${mode}; comparisons: ${comparison.join(",")}; period: ${days} days; hypothetical amount ${amount} ${profile.currency}; hypothetical drop ${drop}%`,
        }),
      });
      const reply = await response.json();
      if (!response.ok) {
        requestId.current = null;
        throw new Error(
          reply.error ?? "I couldn't answer that. Please try again.",
        );
      }
      if (interaction.current === askedAtInteraction) {
        setMessage(reply.text);
        setCited(Array.isArray(reply.sourceIds) ? reply.sourceIds : []);
        applyAction(reply.action);
      }
      setLocalTurns((t) => [
        ...t,
        {
          id: reply.id,
          question: text,
          reply: reply.text,
          action: reply.action,
          sourceIds: reply.sourceIds,
        },
      ]);
      setQuestion("");
      setShowConversation(true);
      requestId.current = null;
    } catch (e) {
      setChatError(
        e instanceof TypeError
          ? "I couldn't connect just now. Your question is still here—please try again."
          : e instanceof Error
            ? e.message
            : "I couldn't answer. Please try again.",
      );
      // Keep the same ID after an uncertain transport failure; retries cannot spend twice.
    } finally {
      setBusy(false);
    }
  }
  const filtered = dashboard.assets.filter(
    (a) =>
      (view !== "saved" || saved.includes(a.id)) &&
      (category === "all" || a.kind === category) &&
      `${a.name} ${a.ticker}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className={`dashboard-shell ${paused ? "motion-paused" : ""}`}>
      <aside className="sidebar">
        <Link href="/" className="wordmark">
          <span className="brand-mark">k.</span>keel
          <span className="brand-dot">●</span>
        </Link>
        <span className="sidebar-caption">A LITTLE MORE CLARITY</span>
        <nav aria-label="Main navigation">
          {(
            [
              { id: "overview", label: "Overview", icon: "home" },
              { id: "explore", label: "Explore", icon: "compass" },
              { id: "saved", label: "Saved", icon: "bookmark" },
            ] as const
          ).map((n) => (
            <button
              key={n.id}
              className={view === n.id ? "active" : ""}
              aria-current={view === n.id ? "page" : undefined}
              onClick={() => setView(n.id)}
            >
              <Icon name={n.icon} />
              {n.label}
              {n.id === "saved" && saved.length > 0 && (
                <span className="nav-count">{saved.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-goal">
          <span className="label">YOUR STARTING POINT</span>
          <Icon name="compass" size={28} />
          <strong>{goalLabels[profile.goal]}</strong>
          <span>{horizonLabels[profile.horizon]}</span>
          <Link href="/?edit=1">
            Edit your answers <Icon name="arrow" size={15} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          {dashboard.sample ? (
            <span className="tiny-avatar">Y</span>
          ) : (
            <UserButton />
          )}
          <span>
            Your space<small>One step at a time</small>
          </span>
          <Link href="/?edit=1" aria-label="Edit your answers">
            <Icon name="settings" />
          </Link>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="breadcrumb">
              Your space <Icon name="chevron" size={12} />
            </span>
            <span>
              {view === "overview"
                ? "Overview"
                : view === "explore"
                  ? "Explore"
                  : "Saved"}
            </span>
          </div>
          <div className="header-actions">
            <span className="data-status">
              <span
                className={`status-dot ${dashboard.sample ? "sample-dot" : ""}`}
              />
              {dashboard.sample ? "Example dashboard" : "Selected US markets"}
            </span>
            <button
              className="icon-button"
              aria-label={
                paused ? "Resume mascot movement" : "Pause mascot movement"
              }
              onClick={() => setPaused(!paused)}
            >
              <Icon name={paused ? "play" : "pause"} size={17} />
            </button>
          </div>
        </header>
        {dashboard.sample && (
          <div className="sample-banner">
            <span>
              You’re exploring an example. All chart values are illustrative.
            </span>
            <Link href="/">
              Make it yours <Icon name="arrow" size={14} />
            </Link>
          </div>
        )}
        <div className="dashboard-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {view === "overview"
                  ? "A CLEARER PICTURE"
                  : view === "explore"
                    ? "GET TO KNOW YOUR OPTIONS"
                    : "KEEP YOUR CURIOSITY CLOSE"}
              </span>
              <h1>
                {view === "overview"
                  ? "Let's find your bearings."
                  : view === "explore"
                    ? "A little exploring goes a long way."
                    : "Worth another look."}
              </h1>
              <p>
                {view === "overview"
                  ? "Understand the possibilities. Find a next step that makes sense to you."
                  : view === "explore"
                    ? "A small collection to compare, question and understand."
                    : "The options you've saved, all in one place."}
              </p>
            </div>
            <button
              className="button secondary refresh-button"
              onClick={onRefresh}
              disabled={refreshing || dashboard.sample}
            >
              <Icon name="chart" size={16} />
              {refreshing ? "Refreshing…" : "Refresh data"}
            </button>
          </div>
          {notice && (
            <div role="status" className="notice">
              <span>{notice}</span>
              <button
                className="icon-button"
                aria-label="Dismiss notice"
                onClick={() => setNotice("")}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          <div className="workspace">
            <div className="main-column">
              {view !== "overview" && (
                <section className="explore-section">
                  <div className="explore-search">
                    <Icon name="search" size={18} />
                    <input
                      aria-label="Search supported investments"
                      placeholder="Search a name or ticker"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <div className="segment category-tabs">
                    {["all", "funds", "stocks", "crypto"].map((c) => (
                      <button
                        key={c}
                        className={category === c ? "active" : ""}
                        aria-pressed={category === c}
                        onClick={() => setCategory(c)}
                      >
                        {c === "all"
                          ? "All options"
                          : c[0].toUpperCase() + c.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="asset-grid">
                    {filtered.map((a) => (
                      <article
                        className={
                          a.id === asset.id
                            ? "selected asset-card"
                            : "asset-card"
                        }
                        key={a.id}
                      >
                        <button
                          className="asset-card-main"
                          onClick={() => {
                            setSelected(a.id);
                            setComparison([]);
                            setMode("history");
                            explain(a.description);
                          }}
                        >
                          <span className={`asset-symbol symbol-${a.kind}`}>
                            {a.ticker.slice(0, 1)}
                          </span>
                          <strong>{a.name}</strong>
                          <small>
                            {a.ticker} ·{" "}
                            {a.kind === "funds"
                              ? "Fund"
                              : a.kind === "stocks"
                                ? "Stock"
                                : "Crypto"}
                          </small>
                        </button>
                        <button
                          className={`icon-button ${saved.includes(a.id) ? "is-saved" : ""}`}
                          aria-label={`${saved.includes(a.id) ? "Unsave" : "Save"} ${a.name}`}
                          onClick={() => void saveAsset(a.id)}
                        >
                          <Icon name="bookmark" size={17} />
                        </button>
                      </article>
                    ))}
                  </div>
                  {!filtered.length && (
                    <div className="empty-state">
                      <Icon name="bookmark" size={28} />
                      <h3>
                        {view === "saved"
                          ? "Your shortlist starts here."
                          : "No matching options."}
                      </h3>
                      <p>
                        {view === "saved"
                          ? "Save an investment while exploring to come back to it later."
                          : "Try another name in our supported collection."}
                      </p>
                      <button
                        className="text-button"
                        onClick={() => {
                          setView("explore");
                          setQuery("");
                          setCategory("all");
                        }}
                      >
                        Explore all options <Icon name="arrow" size={16} />
                      </button>
                    </div>
                  )}
                </section>
              )}
              <section className="chart-card" aria-label="Investment explorer">
                <div className="chart-card-top">
                  <div className="card-title">
                    <span className="section-number">01</span>
                    <h2>Your investment explorer</h2>
                  </div>
                  <span className="label">
                    {dashboard.sample ? "SAMPLE DATA" : "PRICES IN USD"}
                  </span>
                </div>
                <div className="asset-selector-row">
                  <div className="asset-title">
                    <span className={`asset-symbol symbol-${asset.kind}`}>
                      {asset.ticker[0]}
                    </span>
                    <div>
                      <label className="sr-only" htmlFor="selected-asset">
                        Selected investment
                      </label>
                      <select
                        id="selected-asset"
                        value={asset.id}
                        onChange={(e) => {
                          setSelected(e.target.value);
                          setComparison([]);
                          const next = dashboard.assets.find(
                            (a) => a.id === e.target.value,
                          );
                          if (next) explain(next.description);
                        }}
                      >
                        {dashboard.assets.map((a) => (
                          <option value={a.id} key={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                      <span>
                        {asset.ticker}{" "}
                        <span className="muted">
                          /{" "}
                          {asset.kind === "funds"
                            ? "Exchange-traded fund"
                            : asset.kind === "stocks"
                              ? "Company stock"
                              : "Digital asset"}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    className={`icon-button save-button ${saved.includes(asset.id) ? "is-saved" : ""}`}
                    aria-label={`${saved.includes(asset.id) ? "Unsave" : "Save"} ${asset.name}`}
                    onClick={() => void saveAsset(asset.id)}
                  >
                    <Icon name="bookmark" />
                  </button>
                </div>
                <div className="chart-toolbar">
                  <div className="segment" aria-label="Chart mode">
                    {(
                      [
                        { id: "history", title: "Price history" },
                        { id: "compare", title: "Compare" },
                        { id: "scenario", title: "What if?" },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        className={mode === m.id ? "active" : ""}
                        aria-pressed={mode === m.id}
                        onClick={() => changeMode(m.id)}
                      >
                        {m.title}
                      </button>
                    ))}
                  </div>
                  {mode !== "scenario" && (
                    <div className="periods" aria-label="Chart period">
                      {[
                        [30, "1M"],
                        [90, "3M"],
                        [180, "6M"],
                        [365, "1Y"],
                      ].map(([d, label]) => (
                        <button
                          key={d}
                          className={days === d ? "active" : ""}
                          aria-pressed={days === d}
                          onClick={() => setDays(Number(d))}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {mode === "compare" && (
                  <div className="comparison-options">
                    <span className="fine-print">Compare with</span>
                    {dashboard.assets
                      .filter((a) => a.id !== asset.id)
                      .map((a) => (
                        <button
                          aria-pressed={comparison.includes(a.id)}
                          className={
                            comparison.includes(a.id) ? "selected" : ""
                          }
                          key={a.id}
                          disabled={
                            comparison.length >= 2 && !comparison.includes(a.id)
                          }
                          onClick={() =>
                            setComparison((c) =>
                              c.includes(a.id)
                                ? c.filter((id) => id !== a.id)
                                : [...c, a.id].slice(0, 2),
                            )
                          }
                        >
                          {comparison.includes(a.id) ? (
                            <Icon name="check" size={12} />
                          ) : (
                            <Icon name="plus" size={12} />
                          )}{" "}
                          {a.ticker}
                        </button>
                      ))}
                  </div>
                )}
                {mode === "scenario" ? (
                  <div className="scenario">
                    <span className="eyebrow">
                      A POSSIBILITY, NOT A PREDICTION
                    </span>
                    <h3>
                      If prices fell <em>{drop}%</em>…
                    </h3>
                    <div className="scenario-visual">
                      <div className="scenario-before">
                        <span>Starting amount</span>
                        <strong>
                          {currencyFormat(amount, profile.currency)}
                        </strong>
                        <div className="scenario-bar" />
                      </div>
                      <Icon name="arrow" size={28} />
                      <div className="scenario-after">
                        <span>After the drop</span>
                        <strong>
                          {currencyFormat(outcome.remaining, profile.currency)}
                        </strong>
                        <div
                          className="scenario-bar"
                          style={{ width: `${100 - drop}%` }}
                        />
                      </div>
                    </div>
                    <div className="scenario-inputs">
                      <div>
                        <label htmlFor="scenario-amount">
                          Your hypothetical amount · {profile.currency}
                        </label>
                        <input
                          id="scenario-amount"
                          type="number"
                          min="0"
                          max="1000000000"
                          value={amount}
                          onChange={(e) =>
                            setAmount(
                              Math.max(
                                0,
                                Math.min(1e9, Number(e.target.value)),
                              ),
                            )
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="scenario-drop">
                          Price drop <strong>{drop}%</strong>
                        </label>
                        <input
                          id="scenario-drop"
                          type="range"
                          min="0"
                          max="80"
                          step="5"
                          value={drop}
                          onChange={(e) => setDrop(Number(e.target.value))}
                        />
                        <span className="range-labels">
                          <span>0%</span>
                          <span>80%</span>
                        </span>
                      </div>
                    </div>
                    <p className="scenario-result">
                      That’s a decrease of{" "}
                      <strong>
                        {currencyFormat(outcome.loss, profile.currency)}
                      </strong>
                      . How would that feel?
                    </p>
                    <button
                      className="text-button"
                      onClick={() =>
                        explain(
                          `A ${drop}% fall would reduce ${currencyFormat(amount, profile.currency)} by ${currencyFormat(outcome.loss, profile.currency)}. This isn't a forecast. Think about whether you could leave that money invested if you needed it soon.`,
                          "scenario",
                        )
                      }
                    >
                      <Icon name="spark" size={16} /> Talk me through this
                    </button>
                  </div>
                ) : (
                  <PriceChart
                    key={`${asset.id}-${comparison.join("-")}-${days}-${mode}`}
                    assets={mode === "compare" ? chartAssets : [asset]}
                    days={days}
                    sample={dashboard.sample}
                    paused={paused}
                    onExplain={explain}
                  />
                )}
              </section>
              <div className="below-chart">
                <section className="understand-card">
                  <div className="card-title">
                    <span className="section-number">02</span>
                    <h2>Know what you’re looking at</h2>
                  </div>
                  <p>{asset.description}</p>
                  <div className="tradeoff">
                    <Icon name="shield" size={19} />
                    <span>{asset.tradeoff}</span>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => {
                      setShowSources(!showSources);
                      setActiveContext("sources");
                    }}
                  >
                    Check the sources <Icon name="link" size={14} />
                  </button>
                </section>
                <section className="risk-card">
                  <span className="label">
                    {dashboard.sample
                      ? "IN THIS EXAMPLE"
                      : "LARGEST DROP IN AVAILABLE HISTORY"}
                  </span>
                  <strong>
                    {biggestDrop === null ? "—" : `−${biggestDrop.toFixed(1)}%`}
                  </strong>
                  <p>
                    {biggestDrop === null
                      ? "Not enough price history to calculate a drop."
                      : "From a high point to a later low. It could fall more in the future."}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => changeMode("scenario")}
                  >
                    See what a drop could mean <Icon name="arrow" size={15} />
                  </button>
                </section>
              </div>
              {!dashboard.sample &&
                asset.evidence.some((e) => e.label !== "Price history") && (
                  <section className="sources-panel recent-facts">
                    <div className="card-title">
                      <span className="section-number">03</span>
                      <h2>News and facts</h2>
                    </div>
                    {asset.evidence
                      .filter((e) => e.label !== "Price history")
                      .slice(0, 4)
                      .map((e) => (
                        <a
                          href={e.url}
                          key={e.url + e.text}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span>
                            <small>
                              {e.label} · {e.asOf}
                            </small>
                            {e.text}
                          </span>
                          <Icon name="link" size={15} />
                        </a>
                      ))}
                  </section>
                )}
              {showSources && (
                <section className="sources-panel">
                  <div className="card-title">
                    <h2>Where this comes from</h2>
                    <button
                      className="icon-button"
                      aria-label="Close sources"
                      onClick={() => setShowSources(false)}
                    >
                      <Icon name="close" size={17} />
                    </button>
                  </div>
                  <p className="fine-print">
                    {dashboard.sample
                      ? "Chart values in this example are made up. The links below are information about the real investments."
                      : `Retrieved ${new Date(asset.retrievedAt).toLocaleString()}. Quotes may be delayed; they are not streaming prices.`}
                  </p>
                  <a href={asset.url} target="_blank" rel="noreferrer">
                    {asset.name} · Official information{" "}
                    <Icon name="link" size={15} />
                  </a>
                  {!dashboard.sample &&
                    asset.evidence.map((e) => (
                      <a
                        href={e.url}
                        key={e.url + e.text}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span>
                          {e.label}
                          <small>
                            {e.text} As of {e.asOf}.
                          </small>
                        </span>
                        <Icon name="link" size={15} />
                      </a>
                    ))}
                  {!dashboard.sample && !asset.evidence.length && (
                    <p>
                      No market observations were returned. Try Refresh data.
                    </p>
                  )}
                </section>
              )}
              <div className="coverage-note">
                <Icon name="globe" size={16} />
                <p>
                  Exploring selected US investments and selected crypto assets.
                  Availability depends on where you live.{" "}
                  {profile.currency !== "USD"
                    ? `Scenarios use ${profile.currency}; market prices remain in USD without currency conversion.`
                    : "Prices are shown in USD."}
                </p>
              </div>
            </div>
            <aside
              className={`companion-column context-${activeContext}`}
              aria-label="Ask Keel"
            >
              <section
                className={`companion-card ${minimized ? "minimized" : ""}`}
              >
                <div className="companion-top">
                  <span>
                    <span className="status-dot" /> YOUR COMPANION
                  </span>
                  <button
                    className="icon-button"
                    aria-label={minimized ? "Open Keel" : "Minimize Keel"}
                    onClick={() => setMinimized(!minimized)}
                  >
                    <Icon name={minimized ? "plus" : "close"} size={16} />
                  </button>
                </div>
                <div className="companion-stage">
                  <span className="companion-halo" />
                  <KeelMascot
                    mood={
                      busy
                        ? "thinking"
                        : activeContext === "scenario"
                          ? "question"
                          : activeContext === "overview"
                            ? "wave"
                            : "point"
                    }
                    size={minimized ? 70 : 150}
                    paused={paused}
                  />
                  {!minimized && <span className="companion-star">✳</span>}
                </div>
                {!minimized && (
                  <>
                    <div className="companion-intro">
                      <h2>A little help from Keel.</h2>
                      <span>Big questions welcome.</span>
                    </div>
                    <div className="speech" role="status">
                      {busy ? "Let me look at that with you…" : message}
                      {!busy &&
                        cited
                          .filter((id) => /^https:\/\//.test(id))
                          .map((id) => (
                            <a
                              className="speech-source"
                              key={id}
                              href={id}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {sourceHost(id)} ↗
                            </a>
                          ))}
                    </div>
                    <div className="quick-asks">
                      <button
                        onClick={() => {
                          changeMode("compare");
                          setView("overview");
                        }}
                      >
                        Help me compare <Icon name="arrow" size={14} />
                      </button>
                      <button onClick={() => changeMode("scenario")}>
                        Show me the risk <Icon name="arrow" size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setMessage(nextStep(profile));
                          setCited([]);
                          if (profile.horizon === "unknown")
                            setNotice(
                              "Set your time frame in Edit your answers to make comparisons more useful.",
                            );
                        }}
                      >
                        What’s my next step? <Icon name="arrow" size={14} />
                      </button>
                    </div>
                    <form
                      className="ask-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void ask(question);
                      }}
                    >
                      <label className="sr-only" htmlFor="ask-keel">
                        Ask Keel a question
                      </label>
                      <textarea
                        id="ask-keel"
                        rows={2}
                        maxLength={500}
                        placeholder="Ask about these options or another stock…"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        disabled={busy}
                      />
                      <div>
                        <span>Let’s make it make sense.</span>
                        <button
                          className="send-button"
                          aria-label="Send question"
                          disabled={busy || !question.trim()}
                        >
                          <Icon name="arrow" size={18} />
                        </button>
                      </div>
                    </form>
                    {chatError && (
                      <p className="error-message" role="alert">
                        {chatError}
                      </p>
                    )}
                    {allTurns.some(
                      (t) =>
                        !t.id.startsWith("prepare:") &&
                        !t.id.startsWith("guidance:"),
                    ) && (
                      <button
                        className="text-button new-conversation"
                        onClick={async () => {
                          if (dashboard.sample) {
                            setLocalTurns([]);
                            setCited([]);
                            setMessage(nextStep(profile));
                            setChatError("");
                            return;
                          }
                          const ok = await newConversation({ sessionId });
                          if (ok) {
                            setLocalTurns([]);
                            setCited([]);
                            setMessage(nextStep(profile));
                            setChatError("");
                          } else
                            setChatError(
                              "I couldn't start a new conversation. Please try again.",
                            );
                        }}
                      >
                        Start a new conversation <Icon name="plus" size={14} />
                      </button>
                    )}
                    <button
                      className="conversation-toggle text-button"
                      aria-expanded={showConversation}
                      onClick={() => setShowConversation(!showConversation)}
                    >
                      {showConversation ? "Hide" : "View"} conversation{" "}
                      <span>
                        {
                          allTurns.filter(
                            (t) =>
                              !t.id.startsWith("prepare:") &&
                              !t.id.startsWith("guidance:"),
                          ).length
                        }
                      </span>
                    </button>
                    {showConversation && (
                      <div
                        className="conversation-history"
                        aria-label="Conversation history"
                      >
                        {!allTurns.length && (
                          <p className="fine-print">
                            Your questions and Keel’s answers will stay here.
                          </p>
                        )}
                        {allTurns.map((t) => (
                          <div key={t.id} className="conversation-turn">
                            <strong>{t.question}</strong>
                            <p>{t.reply}</p>
                            {t.sourceIds
                              .filter((id) => /^https:\/\//.test(id))
                              .map((id) => (
                                <a
                                  key={id}
                                  href={id}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {sourceHost(id)} ↗
                                </a>
                              ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
              <div className="next-step-note">
                <span className="label">ONE THING TO REMEMBER</span>
                <p>
                  You don’t have to decide today.
                  <br />
                  Understanding is a step forward.
                </p>
                <span className="note-doodle">↝</span>
              </div>
            </aside>
          </div>
          <footer className="dashboard-footer">
            <span>Small steps. Clearer choices.</span>
            <span>KEEL · YOUR MONEY, UNDERSTOOD</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
