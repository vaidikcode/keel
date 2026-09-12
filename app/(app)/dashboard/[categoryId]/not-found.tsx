import Link from "next/link";
import { KeelMascot } from "@/components/dashboard/KeelMascot";

export default function NotFound() {
  return (
    <main className="loading-page">
      <KeelMascot mood="question" size={120} />
      <h1>That category doesn’t exist.</h1>
      <p>Keel groups options into seven categories. Pick one from the dashboard.</p>
      <Link href="/dashboard" className="button primary">
        Back to your dashboard
      </Link>
    </main>
  );
}
