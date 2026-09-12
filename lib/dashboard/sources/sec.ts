type CompanyFacts = {
  facts?: {
    "us-gaap"?: Record<
      string,
      {
        units?: Record<string, Array<{ val?: number; form?: string; fy?: number }>>;
      }
    >;
  };
};

function userAgent(): string {
  return (
    process.env.SEC_USER_AGENT?.trim() || "Keel keel@example.com"
  );
}

function pickFact(
  facts: CompanyFacts,
  tags: string[],
): { label: string; value: string } | null {
  const gaap = facts.facts?.["us-gaap"];
  if (!gaap) {
    return null;
  }
  for (const tag of tags) {
    const concept = gaap[tag];
    const units = concept?.units;
    if (!units) {
      continue;
    }
    const series =
      units.USD ??
      units["USD/shares"] ??
      Object.values(units)[0] ??
      [];
    const annual = series
      .filter((row) => row.form === "10-K" && typeof row.val === "number")
      .sort((a, b) => (b.fy ?? 0) - (a.fy ?? 0));
    const latest = annual[0] ?? series.find((row) => typeof row.val === "number");
    if (!latest || typeof latest.val !== "number") {
      continue;
    }
    const value =
      Math.abs(latest.val) >= 1_000_000_000
        ? `$${(latest.val / 1_000_000_000).toFixed(1)}B`
        : Math.abs(latest.val) >= 1_000_000
          ? `$${(latest.val / 1_000_000).toFixed(0)}M`
          : `$${latest.val.toLocaleString("en-US")}`;
    return { label: tag, value };
  }
  return null;
}

export async function fetchFilingLines(cik: string): Promise<string[]> {
  const padded = cik.replace(/\D/g, "").padStart(10, "0");
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": userAgent(),
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      return [];
    }
    const facts = (await response.json()) as CompanyFacts;
    const lines: string[] = [];
    const revenue = pickFact(facts, [
      "Revenues",
      "RevenueFromContractWithCustomerExcludingAssessedTax",
      "SalesRevenueNet",
      "NetSales",
    ]);
    if (revenue) {
      lines.push(`Revenue about ${revenue.value}.`);
    }
    const cash = pickFact(facts, [
      "CashAndCashEquivalentsAtCarryingValue",
      "Cash",
    ]);
    if (cash) {
      lines.push(`Cash about ${cash.value}.`);
    }
    const debt = pickFact(facts, [
      "LongTermDebt",
      "LongTermDebtNoncurrent",
      "DebtCurrent",
    ]);
    if (debt) {
      lines.push(`Debt about ${debt.value}.`);
    }
    const assets = pickFact(facts, ["Assets"]);
    if (assets) {
      lines.push(`Assets about ${assets.value}.`);
    }
    return lines.slice(0, 4);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
