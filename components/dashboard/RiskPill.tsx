import { riskLabelText, type RiskLabel } from "@/lib/market/risk";

export function RiskPill({ label, score, size = "sm" }: { label: RiskLabel | null; score?: number | null; size?: "sm" | "md" }) {
  if (!label)
    return (
      <span className={`risk-pill risk-unknown risk-${size}`} title="Not enough price history yet">
        No history yet
      </span>
    );
  return (
    <span className={`risk-pill risk-${label} risk-${size}`} title={typeof score === "number" ? `Risk score ${score} of 100` : undefined}>
      {riskLabelText[label]} risk
    </span>
  );
}
