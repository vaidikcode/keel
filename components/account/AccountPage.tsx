"use client";
import Link from "next/link";
import { useState } from "react";
import { UserProfile } from "@clerk/nextjs";
import { AppShell } from "@/components/app/AppShell";
import { Icon } from "@/components/ui/Icon";
import { KeelMascot } from "@/components/dashboard/KeelMascot";
import { useKeel } from "@/components/keel/KeelContext";
import { ProfileScore } from "./ProfileScore";
import { QuestionsForm } from "./QuestionsForm";

type Tab = "questions" | "account";

/**
 * Two separate things under one roof: the answers Keel ranks with, and the
 * Clerk account. They are deliberately different tabs — signing in is not the
 * same activity as telling Keel what you are saving for, and Clerk owns its own
 * surface entirely.
 */
export function AccountPage() {
  const keel = useKeel();
  const [tab, setTab] = useState<Tab>("questions");

  if (!keel.isLoaded)
    return (
      <main className="loading-page">
        <KeelMascot mood="thinking" size={120} />
        <h1>Opening your account…</h1>
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

      <div className="account-tabs" role="tablist" aria-label="Account sections">
        <button
          type="button"
          role="tab"
          id="tab-questions"
          aria-selected={tab === "questions"}
          aria-controls="panel-questions"
          className={`account-tab ${tab === "questions" ? "selected" : ""}`}
          onClick={() => setTab("questions")}
        >
          Base questions
        </button>
        <button
          type="button"
          role="tab"
          id="tab-account"
          aria-selected={tab === "account"}
          aria-controls="panel-account"
          className={`account-tab ${tab === "account" ? "selected" : ""}`}
          onClick={() => setTab("account")}
        >
          Sign-in and security
        </button>
      </div>

      {tab === "questions" ? (
        <div id="panel-questions" role="tabpanel" aria-labelledby="tab-questions" className="account-panel">
          {keel.profile ? (
            <>
              <ProfileScore profile={keel.profile} />
              <QuestionsForm profile={keel.profile} />
            </>
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
      ) : (
        <div id="panel-account" role="tabpanel" aria-labelledby="tab-account" className="account-panel">
          {keel.demo ? (
            <p className="fine-print">Example mode has no account to manage.</p>
          ) : (
            <UserProfile routing="hash" />
          )}
        </div>
      )}

      <footer className="app-footer">
        <span>Keel explains investing. It does not give personal financial advice.</span>
        <span>Your answers change the ranking, never the prices.</span>
      </footer>
    </AppShell>
  );
}
