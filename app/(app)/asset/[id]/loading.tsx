import { KeelMascot } from "@/components/dashboard/KeelMascot";

export default function Loading() {
  return (
    <main className="loading-page">
      <KeelMascot mood="thinking" size={120} />
      <h1>Opening this option…</h1>
      <p>The chart, risk and facts are on their way.</p>
    </main>
  );
}
