import type { Investment } from "../model";
import { resolveCik } from "../../market/sources/secTickers";
type Evidence = Investment["evidence"][number];
export async function fetchEvidence(ticker: string): Promise<Evidence[]> {
  const key = process.env.FINNHUB_API_KEY?.trim();
  if (!key) return [];
  try {
    const today = new Date(),
      from = new Date(today.getTime() - 14 * 86400000);
    const url = new URL("https://finnhub.io/api/v1/company-news");
    url.searchParams.set("symbol", ticker);
    url.searchParams.set("from", from.toISOString().slice(0, 10));
    url.searchParams.set("to", today.toISOString().slice(0, 10));
    url.searchParams.set("token", key);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];
    return data
      .flatMap((row): Evidence[] => {
        if (
          !row ||
          typeof row.headline !== "string" ||
          typeof row.url !== "string" ||
          !/^https:\/\//.test(row.url) ||
          !Number.isFinite(row.datetime) ||
          row.datetime <= 0
        )
          return [];
        return [
          {
            label: "Recent news",
            text: row.headline.slice(0, 240),
            asOf: new Date(row.datetime * 1000).toISOString().slice(0, 10),
            url: row.url,
          },
        ];
      })
      .slice(0, 3);
  } catch {
    return [];
  }
}
export async function fetchFinancialEvidence(
  ticker: string,
  cache?: Parameters<typeof resolveCik>[1],
): Promise<Evidence[]> {
  if (!process.env.SEC_USER_AGENT?.trim()) return [];
  const cik = await resolveCik(ticker, cache);
  if (!cik) return [];
  try {
    const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          process.env.SEC_USER_AGENT?.trim() || "Keel contact@keel.app",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = await response.json();
    type Row = {
      val: number;
      end: string;
      start?: string;
      filed: string;
      form: string;
      accn: string;
    };
    const out: Evidence[] = [];
    for (const [label, tags] of [
      [
        "Revenue",
        [
          "RevenueFromContractWithCustomerExcludingAssessedTax",
          "Revenues",
          "SalesRevenueNet",
        ],
      ],
      ["Cash and cash equivalents", ["CashAndCashEquivalentsAtCarryingValue"]],
      ["Total assets", ["Assets"]],
    ] as const) {
      const rows: Row[] = tags
        .flatMap((tag) => data.facts?.["us-gaap"]?.[tag]?.units?.USD ?? [])
        .filter(
          (r: Row) =>
            Number.isFinite(r.val) &&
            r.form === "10-K" &&
            /^\d{4}-\d{2}-\d{2}$/.test(r.end) &&
            /^\d{4}-\d{2}-\d{2}$/.test(r.filed) &&
            /^\d+-\d+-\d+$/.test(r.accn) &&
            (label !== "Revenue" ||
              (r.start &&
                Date.parse(r.end) - Date.parse(r.start) > 300 * 86400000 &&
                Date.parse(r.end) - Date.parse(r.start) < 380 * 86400000)),
        );
      rows.sort(
        (a, b) => b.end.localeCompare(a.end) || b.filed.localeCompare(a.filed),
      );
      const row = rows[0];
      if (!row) continue;
      const value = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(row.val);
      out.push({
        label: "Company filing",
        text: `${label}: ${value}${label === "Revenue" ? " for the year ending" : " at"} ${row.end}. Filed ${row.filed}.`,
        asOf: row.end,
        url: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${row.accn.replaceAll("-", "")}/${row.accn}-index.html`,
      });
    }
    return out;
  } catch {
    return [];
  }
}
