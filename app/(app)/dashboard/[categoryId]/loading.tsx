import { KeelMascot } from "@/components/dashboard/KeelMascot";

export default function Loading() {
  return (
    <main className="loading-page">
      <KeelMascot mood="thinking" size={120} />
      <h1>Ranking your options…</h1>
      <p>Prices, risk and fit are on their way.</p>
    </main>
  );
}
