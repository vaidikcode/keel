export type FetchJsonOptions = {
  headers?: Record<string, string>;
  method?: "GET" | "POST";
  body?: string;
  timeoutMs?: number;
  retries?: number;
};

const DEFAULT_TIMEOUT = 8000;
const BACKOFF_MS = [400, 1200];

function retryAfterMs(response: Response, attempt: number): number {
  const header = response.headers.get("retry-after");
  const seconds = header ? Number(header) : NaN;
  if (Number.isFinite(seconds) && seconds > 0 && seconds <= 10)
    return seconds * 1000;
  return BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch + JSON parse with a timeout and bounded retries on 429/5xx.
 * Returns null on any failure so callers degrade instead of throwing.
 */
export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<T | null> {
  const retries = options.retries ?? 2;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: { Accept: "application/json", ...options.headers },
        body: options.body,
        signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT),
        cache: "no-store",
      });
      if (response.ok) return (await response.json()) as T;
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === retries) return null;
      await sleep(retryAfterMs(response, attempt));
    } catch {
      if (attempt === retries) return null;
      await sleep(BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]);
    }
  }
  return null;
}

/** Run tasks with at most `limit` in flight; preserves result order. */
export async function pLimit<T, R>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await task(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}
