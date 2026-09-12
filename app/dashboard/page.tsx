"use client";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Spread } from "@/components/dashboard/Spread";
import { KeelMascot } from "@/components/dashboard/KeelMascot";
import { readSessionId } from "@/lib/session";
import { defaultProfile, migrateProfile } from "@/lib/onboarding/questions";
import { sampleDashboard } from "@/lib/dashboard/catalog";
import { dashboardSchema, type Dashboard } from "@/lib/dashboard/model";
export default function DashboardPage() {
  const [sessionId, setSessionId] = useState<string | null>(null),
    [demo, setDemo] = useState(false);
  useEffect(() => {
    // Read browser storage after hydration, preserving older session IDs.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser identity is read once after SSR hydration.
    setSessionId(readSessionId());
    setDemo(new URLSearchParams(location.search).get("demo") === "1");
  }, []);
  return demo ? (
    <Spread
      dashboard={sampleDashboard()}
      profile={{ ...defaultProfile, goal: "wealth", horizon: "future" }}
      sessionId="demo"
      turns={[]}
      savedAssets={[]}
      onRefresh={() => {}}
      refreshing={false}
    />
  ) : sessionId ? (
    <LiveDashboard sessionId={sessionId} />
  ) : (
    <Loading />
  );
}
function Loading() {
  return (
    <main className="loading-page">
      <KeelMascot mood="thinking" size={135} />
      <h1>Finding a little clarity…</h1>
      <p>Your dashboard is on its way.</p>
    </main>
  );
}
function LiveDashboard({ sessionId }: { sessionId: string }) {
  const profile = useQuery(api.profiles.getBySession, { sessionId });
  const [boot, setBoot] = useState<{
      data: Dashboard;
      revision: number;
    } | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [refresh, setRefresh] = useState(0);
  const fetched = useRef("");
  const saveProfile = useMutation(api.profiles.saveExperience);
  const revision = profile?.revision ?? 0;
  useEffect(() => {
    if (!profile) return;
    const key = `${sessionId}:${revision}:${refresh}`;
    if (fetched.current === key) return;
    fetched.current = key;
    let cancelled = false;
    async function fetchDashboard() {
      setBusy(true);
      setError("");
      try {
        const response = await fetch("/api/spread", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, force: refresh > 0 }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        const dashboard = dashboardSchema.parse(data.dashboard);
        if (!cancelled) setBoot({ data: dashboard, revision });
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error
              ? e.message
              : "We couldn't load your dashboard. Please try again.",
          );
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void fetchDashboard();
    return () => {
      cancelled = true;
      fetched.current = "";
    };
    // Fetch on profile revision, never on generation/conversation updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, revision, refresh, Boolean(profile)]);
  if (profile === undefined) return <Loading />;
  if (!profile)
    return (
      <main className="loading-page">
        <KeelMascot mood="question" size={130} />
        <h1>Let’s start with you.</h1>
        <p>A few simple questions will help Keel explain your options.</p>
        <Link href="/" className="button primary">
          Find my first step
        </Link>
        <Link href="/dashboard?demo=1" className="text-button">
          Explore an example
        </Link>
      </main>
    );
  const dashboard =
    profile.dashboard ?? (boot?.revision === revision ? boot.data : null);
  if (!dashboard)
    return error ? (
      <main className="loading-page">
        <KeelMascot mood="question" size={125} />
        <h1>Let’s try that again.</h1>
        <p role="alert">{error}</p>
        <button
          className="button primary"
          onClick={() => setRefresh((r) => r + 1)}
        >
          Retry dashboard
        </button>
        <Link href="/dashboard?demo=1" className="text-button">
          Explore an example while you wait
        </Link>
      </main>
    ) : (
      <Loading />
    );
  return (
    <>
      {!profile.profileV2 && (
        <div className="migration-banner">
          We’ve made Keel easier to understand. Your earlier preferences are
          kept; add your goal when you’re ready.
          <button
            onClick={() =>
              void saveProfile({
                sessionId,
                profile: migrateProfile(profile.answers),
              })
            }
          >
            Keep exploring
          </button>
          <Link href="/?edit=1">Add my goal</Link>
        </div>
      )}
      {error && (
        <div role="alert" className="migration-banner">
          {error} Showing your last available data.
        </div>
      )}
      <Spread
        key={revision}
        dashboard={dashboard}
        profile={migrateProfile(profile.profileV2 ?? profile.answers)}
        sessionId={sessionId}
        turns={profile.conversation ?? []}
        savedAssets={profile.savedAssets ?? []}
        onRefresh={() => setRefresh((r) => r + 1)}
        refreshing={busy}
        generationUsed={profile.generation?.requests.length ?? 0}
      />
    </>
  );
}
