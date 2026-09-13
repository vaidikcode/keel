"use client";
import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { Icon } from "@/components/ui/Icon";
import { KeelMascot } from "@/components/dashboard/KeelMascot";
import { useKeel } from "@/components/keel/KeelContext";
import { QuestionsForm } from "./QuestionsForm";

export function AccountPage() {
  const keel = useKeel();

  if (!keel.isLoaded)
    return (
      <main className="loading-page">
        <KeelMascot mood="thinking" size={120} />
        <h1>Opening your answers…</h1>
      </main>
    );

  return (
    <AppShell activeCategory={null}>
      <header className="app-header">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link href={keel.withDemo("/dashboard")}>Dashboard</Link>
          <Icon name="chevron" size={12} />
          <span aria-current="page">Account</span>
        </nav>
      </header>

      <div className="account-panel">
        {keel.profile ? (
          <QuestionsForm profile={keel.profile} />
        ) : (
          <div className="empty-state">
            <KeelMascot mood="question" size={90} />
            <h3>No answers yet.</h3>
            <p>Answer a few questions and Keel can start ranking things for you.</p>
            <Link href="/" className="button primary">
              Find my first step
            </Link>
          </div>
        )}
      </div>

      <footer className="app-footer">
        <span>Keel explains investing. It does not give personal financial advice.</span>
        <span>Your answers change the ranking, never the prices.</span>
      </footer>
    </AppShell>
  );
}
