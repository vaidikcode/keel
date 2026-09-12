import type { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { tavilySearch } from "./sources/tavily";
import type { TavilyFact } from "./snapshotModel";
import { loadCikMap, type CikMap } from "./sources/secTickers";

export async function kvGet<T>(client: ConvexHttpClient, key: string): Promise<T | null> {
  const row = await client.query(api.kv.get, { key }).catch(() => null);
  if (!row || row.expiresAt < Date.now()) return null;
  return row.value as T;
}
export async function kvPut(
  client: ConvexHttpClient,
  key: string,
  value: unknown,
  ttlMs: number,
): Promise<void> {
  await client.mutation(api.kv.put, { key, value, ttlMs }).catch(() => {});
}

async function hash(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Tavily with a one-hour shared cache so repeated questions do not re-spend. */
export async function cachedTavily(
  client: ConvexHttpClient,
  query: string,
): Promise<{ facts: TavilyFact[]; available: boolean }> {
  if (!process.env.TAVILY_API_KEY?.trim()) return { facts: [], available: false };
  const key = `tavily:${await hash(query.trim().toLowerCase())}`;
  const cached = await kvGet<TavilyFact[]>(client, key);
  if (cached) return { facts: cached, available: true };
  const result = await tavilySearch(query);
  if (result.available) await kvPut(client, key, result.facts, 3600_000);
  return result;
}

export function cikCache(client: ConvexHttpClient) {
  return {
    get: () => kvGet<CikMap>(client, "sec:tickers"),
    put: (map: CikMap) => kvPut(client, "sec:tickers", map, 7 * 86400_000),
  };
}
export async function cikMapFor(client: ConvexHttpClient): Promise<CikMap> {
  return loadCikMap(cikCache(client));
}
