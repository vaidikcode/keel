"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { KeelMascot } from "@/components/dashboard/KeelMascot";
import { useKeel } from "@/components/keel/KeelContext";
import { capacityFor } from "@/lib/market/fit";
import { landingCategory } from "@/lib/market/select";

export default function DashboardIndex() {
  const keel = useKeel();
  const router = useRouter();
  useEffect(() => {
    if (!keel.isLoaded) return;
    if (keel.demo) {
      router.replace("/dashboard/broad-funds?demo=1");
      return;
    }
    if (keel.profile) router.replace(`/dashboard/${landingCategory(keel.profile, capacityFor(keel.profile))}`);
  }, [keel.demo, keel.isLoaded, keel.profile, router]);
  if (keel.isLoaded && !keel.demo && keel.sessionId && !keel.hasProfile && keel.profile === null)
    return (
      <main className="loading-page">
        <KeelMascot mood="question" size={130} />
        <h1>Let’s start with you.</h1>
        <p>A few simple questions will help Keel rank your options.</p>
        <Link href="/" className="button primary">
          Find my first step
        </Link>
        <Link href="/dashboard?demo=1" className="text-button">
          Explore an example
        </Link>
      </main>
    );
  return (
    <main className="loading-page">
      <KeelMascot mood="thinking" size={135} />
      <h1>Finding a little clarity…</h1>
      <p>Your dashboard is on its way.</p>
    </main>
  );
}
