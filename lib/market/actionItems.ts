import { currencyFormat, type Profile } from "../onboarding/questions";
import { lossScenario } from "../dashboard/model";
import type { Asset, Category } from "./categories";
import type { Risk } from "./risk";

export type ActionItem = {
  id: string;
  kind: "compare" | "cost" | "loss" | "time" | "learn" | "cash";
  title: string;
  detail: string;
};

export function actionItems(input: {
  asset: Asset;
  category: Category;
  profile: Profile | null;
  risk: Risk | null;
  topBroadFund?: { ticker: string; name: string } | null;
}): ActionItem[] {
  const { asset, category, profile, risk, topBroadFund } = input;
  const items: ActionItem[] = [];
  const amount = profile?.amount ?? 1000;
  const currency = profile?.currency ?? "USD";

  if (profile?.emergency === "no")
    items.push({
      id: "cash-first",
      kind: "cash",
      title: "Set aside cash for surprises first",
      detail:
        "You said you don't have a buffer yet. Money you might need suddenly is usually better kept somewhere you can reach without selling at a bad moment.",
    });
  if (risk && (risk.label === "high" || risk.label === "very-high")) {
    const drop = Math.round(risk.raw.maxDrawdownPct);
    const { loss } = lossScenario(amount, drop);
    items.push({
      id: "loss-check",
      kind: "loss",
      title: "Decide how much you could lose",
      detail: `In the last year its biggest fall was about ${drop}%. With ${currencyFormat(amount, currency)} that would have meant roughly ${currencyFormat(loss, currency)} less, at least for a while.`,
    });
  }
  if (profile?.horizon === "soon")
    items.push({
      id: "time-check",
      kind: "time",
      title: "Ask whether you might need this money within a year",
      detail:
        "Short time frames leave little room to wait out a fall. Compare with a bond or cash fund if you need the money soon.",
    });
  if (asset.kind === "funds")
    items.push({
      id: "expense-ratio",
      kind: "cost",
      title: "Check the fund's yearly cost",
      detail:
        "Funds charge a small percentage each year, called the expense ratio. It's listed on the fund's official page.",
    });
  if (asset.kind === "stocks" && topBroadFund)
    items.push({
      id: "compare-fund",
      kind: "compare",
      title: `Compare with ${topBroadFund.ticker}`,
      detail: `${asset.name} is one company. ${topBroadFund.name} holds many. Ask Keel to compare how differently their prices moved.`,
    });
  if (asset.kind === "crypto")
    items.push({
      id: "custody",
      kind: "learn",
      title: "Learn how you'd store it",
      detail:
        "Crypto is held either on an exchange or in a wallet you control. Each has its own risks. Understand this before buying any.",
    });
  items.push({
    id: "peers",
    kind: "compare",
    title: `See how it ranks against the rest of ${category.short}`,
    detail: "Go back to the category to see calmer and livelier options side by side.",
  });
  items.push({
    id: "learn-more",
    kind: "learn",
    title: "Read the official page",
    detail: "Every fund and company publishes what it does and what it holds. That page is the source, not the headlines.",
  });
  return items.slice(0, 5);
}
