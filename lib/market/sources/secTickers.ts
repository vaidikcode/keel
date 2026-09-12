import { fetchJson } from "../../http/fetchJson";
import { ASSETS_BY_ID } from "../categories";

type Row = { cik_str?: unknown; ticker?: unknown };
export type CikMap = Record<string, string>;

let memory: { map: CikMap; at: number } | null = null;
const MEMORY_TTL = 6 * 3600_000;

export function reduceTickers(body: unknown, wanted: Set<string>): CikMap {
  const out: CikMap = {};
  if (!body || typeof body !== "object") return out;
  for (const row of Object.values(body as Record<string, Row>)) {
    if (!row || typeof row.ticker !== "string") continue;
    const ticker = row.ticker.toUpperCase();
    if (!wanted.has(ticker)) continue;
    const cik = typeof row.cik_str === "number" ? row.cik_str : Number(row.cik_str);
    if (Number.isFinite(cik) && cik > 0) out[ticker] = String(cik).padStart(10, "0");
  }
  return out;
}

export function universeTickers(): Set<string> {
  return new Set(
    [...ASSETS_BY_ID.values()]
      .filter((a) => a.kind === "stocks")
      .map((a) => a.ticker.toUpperCase()),
  );
}

/**
 * Ticker -> 10-digit CIK from SEC's public list, reduced to our universe.
 * `cache` lets the caller plug in the Convex kv table; memory covers the rest.
 */
export async function loadCikMap(cache?: {
  get: () => Promise<CikMap | null>;
  put: (map: CikMap) => Promise<void>;
}): Promise<CikMap> {
  if (memory && Date.now() - memory.at < MEMORY_TTL) return memory.map;
  const cached = cache ? await cache.get().catch(() => null) : null;
  if (cached && Object.keys(cached).length) {
    memory = { map: cached, at: Date.now() };
    return cached;
  }
  const agent = process.env.SEC_USER_AGENT?.trim();
  if (!agent) return {};
  const body = await fetchJson<unknown>("https://www.sec.gov/files/company_tickers.json", {
    headers: { "User-Agent": agent },
    timeoutMs: 10000,
    retries: 1,
  });
  const map = reduceTickers(body, universeTickers());
  if (Object.keys(map).length) {
    memory = { map, at: Date.now() };
    if (cache) await cache.put(map).catch(() => {});
  }
  return map;
}

export async function resolveCik(
  ticker: string,
  cache?: Parameters<typeof loadCikMap>[0],
): Promise<string | null> {
  const map = await loadCikMap(cache);
  return map[ticker.toUpperCase()] ?? null;
}
