/**
 * The headline stock index for a country, so someone in India sees NIFTY 50
 * rather than the S&P 500.
 *
 * Every symbol here was checked against Yahoo's spark endpoint and returns a
 * year of daily closes. Symbols that returned nothing — Poland, Chile and
 * Egypt among them — are deliberately absent rather than guessed at: a country
 * with no entry falls back to the S&P 500 and the interface says so, which is
 * design.md's rule that missing data is named, never invented.
 */
export type MarketIndex = {
  symbol: string;
  /** What the index is called where it trades. */
  name: string;
  /** Country whose index this is, or "US" when it is the fallback. */
  country: string;
};

export const COUNTRY_INDEX: Record<string, MarketIndex> = {
  US: { symbol: "^GSPC", name: "S&P 500", country: "US" },
  IN: { symbol: "^NSEI", name: "NIFTY 50", country: "IN" },
  GB: { symbol: "^FTSE", name: "FTSE 100", country: "GB" },
  JP: { symbol: "^N225", name: "Nikkei 225", country: "JP" },
  DE: { symbol: "^GDAXI", name: "DAX", country: "DE" },
  FR: { symbol: "^FCHI", name: "CAC 40", country: "FR" },
  CA: { symbol: "^GSPTSE", name: "S&P/TSX Composite", country: "CA" },
  AU: { symbol: "^AXJO", name: "S&P/ASX 200", country: "AU" },
  HK: { symbol: "^HSI", name: "Hang Seng", country: "HK" },
  CN: { symbol: "000001.SS", name: "SSE Composite", country: "CN" },
  KR: { symbol: "^KS11", name: "KOSPI", country: "KR" },
  BR: { symbol: "^BVSP", name: "Ibovespa", country: "BR" },
  MX: { symbol: "^MXX", name: "S&P/BMV IPC", country: "MX" },
  SG: { symbol: "^STI", name: "Straits Times Index", country: "SG" },
  TW: { symbol: "^TWII", name: "TAIEX", country: "TW" },
  CH: { symbol: "^SSMI", name: "SMI", country: "CH" },
  NL: { symbol: "^AEX", name: "AEX", country: "NL" },
  ES: { symbol: "^IBEX", name: "IBEX 35", country: "ES" },
  IT: { symbol: "FTSEMIB.MI", name: "FTSE MIB", country: "IT" },
  SE: { symbol: "^OMX", name: "OMX Stockholm 30", country: "SE" },
  ID: { symbol: "^JKSE", name: "IDX Composite", country: "ID" },
  MY: { symbol: "^KLSE", name: "FTSE Bursa Malaysia KLCI", country: "MY" },
  TH: { symbol: "^SET.BK", name: "SET Index", country: "TH" },
  NZ: { symbol: "^NZ50", name: "S&P/NZX 50", country: "NZ" },
  SA: { symbol: "^TASI.SR", name: "Tadawul All Share", country: "SA" },
  TR: { symbol: "XU100.IS", name: "BIST 100", country: "TR" },
  IL: { symbol: "TA35.TA", name: "TA-35", country: "IL" },
  NO: { symbol: "OSEBX.OL", name: "OSEBX", country: "NO" },
  DK: { symbol: "^OMXC25", name: "OMX Copenhagen 25", country: "DK" },
  FI: { symbol: "^OMXH25", name: "OMX Helsinki 25", country: "FI" },
  AT: { symbol: "^ATX", name: "ATX", country: "AT" },
  BE: { symbol: "^BFX", name: "BEL 20", country: "BE" },
  PT: { symbol: "PSI20.LS", name: "PSI", country: "PT" },
  AR: { symbol: "^MERV", name: "S&P Merval", country: "AR" },
  PH: { symbol: "PSEI.PS", name: "PSEi", country: "PH" },
};

export const FALLBACK_INDEX = COUNTRY_INDEX.US;

/** The index to show someone in this country, and whether it is theirs. */
export function indexFor(country: string | null | undefined): {
  index: MarketIndex;
  isLocal: boolean;
} {
  const code = (country ?? "").trim().toUpperCase();
  const found = COUNTRY_INDEX[code];
  return found ? { index: found, isLocal: true } : { index: FALLBACK_INDEX, isLocal: false };
}

export function isIndexSymbol(symbol: string): boolean {
  return Object.values(COUNTRY_INDEX).some((i) => i.symbol === symbol);
}
