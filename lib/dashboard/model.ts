import { z } from "zod";
export const pointSchema = z.object({
  date: z.string(),
  value: z.number().positive(),
});
export const evidenceSchema = z.object({
  label: z.string(),
  url: z.string().url(),
  asOf: z.string(),
  text: z.string(),
});
export const investmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  ticker: z.string(),
  kind: z.enum(["stocks", "funds", "crypto"]),
  description: z.string(),
  tradeoff: z.string(),
  url: z.string().url(),
  history: z.array(pointSchema),
  historySource: z.string().url(),
  retrievedAt: z.number(),
  evidence: z.array(evidenceSchema),
});
export const dashboardSchema = z.object({
  version: z.literal(2),
  assets: z.array(investmentSchema),
  generatedAt: z.number(),
  sample: z.boolean(),
});
export type Investment = z.infer<typeof investmentSchema>;
export type Dashboard = z.infer<typeof dashboardSchema>;
export type Point = z.infer<typeof pointSchema>;
export const replySchema = z.object({
  text: z.string().max(700),
  action: z.enum(["none", "compare", "scenario", "sources", "profile"]),
  sourceIds: z.array(z.string()).max(5),
});
export type Reply = z.infer<typeof replySchema>;
export type Turn = {
  assetId?: string;
  context?: string;
  id: string;
  question: string;
  reply: string;
  action: string;
  sourceIds: string[];
};

export function drawdown(history: Point[]): number | null {
  if (history.length < 2) return null;
  let peak = history[0].value,
    drop = 0;
  for (const point of history) {
    peak = Math.max(peak, point.value);
    drop = Math.max(drop, ((peak - point.value) / peak) * 100);
  }
  return drop;
}
export function lossScenario(amount: number, drop: number) {
  return { remaining: amount * (1 - drop / 100), loss: (amount * drop) / 100 };
}
// Intersection prevents comparing different dates or interpolating absent observations.
export function alignedSeries(assets: Investment[], days: number) {
  if (!assets.length || assets.some((a) => !a.history.length)) return [];
  const end = Math.min(
    ...assets.map((a) => Date.parse(a.history.at(-1)!.date)),
  );
  const cutoff = end - days * 86400000;
  const maps = assets.map(
    (a) => new Map(a.history.map((p) => [p.date, p.value])),
  );
  const dates = assets[0].history
    .map((p) => p.date)
    .filter(
      (d) =>
        Date.parse(d) >= cutoff &&
        Date.parse(d) <= end &&
        maps.every((m) => m.has(d)),
    );
  return assets.map((a, i) => ({
    id: a.id,
    name: a.name,
    ticker: a.ticker,
    points: dates.map((date) => ({ date, value: maps[i].get(date)! })),
  }));
}
