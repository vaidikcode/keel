import type { TavilyFact } from "../snapshotModel";

export type TavilyResult = { facts: TavilyFact[]; available: boolean };

type Fetcher = typeof fetch;

export function parseTavily(body: unknown): TavilyFact[] {
  const results = (body as { results?: unknown })?.results;
  if (!Array.isArray(results)) return [];
  return results
    .flatMap((row): TavilyFact[] => {
      if (
        !row ||
        typeof row !== "object" ||
        typeof row.url !== "string" ||
        !/^https:\/\//.test(row.url) ||
        typeof row.title !== "string"
      )
        return [];
      const snippet = typeof row.content === "string" ? row.content : "";
      const published =
        typeof row.published_date === "string" && row.published_date
          ? row.published_date.slice(0, 10)
          : null;
      return [
        {
          title: row.title.slice(0, 160),
          url: row.url,
          snippet: snippet.replace(/\s+/g, " ").trim().slice(0, 300),
          publishedAt: published,
          source: "tavily",
        },
      ];
    })
    .slice(0, 5);
}

/** Never throws. `available:false` means no key or the call failed. */
export async function tavilySearch(
  query: string,
  options: { maxResults?: number; fetcher?: Fetcher } = {},
): Promise<TavilyResult> {
  const key = process.env.TAVILY_API_KEY?.trim();
  const q = query.trim().slice(0, 300);
  if (!key || !q) return { facts: [], available: false };
  const fetcher = options.fetcher ?? fetch;
  try {
    const response = await fetcher("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        query: q,
        search_depth: "basic",
        max_results: Math.min(options.maxResults ?? 5, 8),
        include_answer: false,
        include_raw_content: false,
      }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) return { facts: [], available: false };
    return { facts: parseTavily(await response.json()), available: true };
  } catch {
    return { facts: [], available: false };
  }
}
