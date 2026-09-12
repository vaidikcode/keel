/**
 * ISO 3166-1 alpha-2 -> ISO 4217 currency.
 *
 * Bundled as a static table on purpose: CI runs `bun install --frozen-lockfile`,
 * so adding a dependency for this would fail the build, and a runtime lookup
 * would put a network call in front of a cosmetic default.
 *
 * Country display names are not stored here — they come from Intl.DisplayNames
 * at runtime, which keeps this table to one fact per country.
 */
export const COUNTRY_CURRENCY: Record<string, string> = {
  AD: "EUR", AE: "AED", AF: "AFN", AG: "XCD", AI: "XCD", AL: "ALL", AM: "AMD",
  AO: "AOA", AR: "ARS", AS: "USD", AT: "EUR", AU: "AUD", AW: "AWG", AX: "EUR",
  AZ: "AZN", BA: "BAM", BB: "BBD", BD: "BDT", BE: "EUR", BF: "XOF", BG: "BGN",
  BH: "BHD", BI: "BIF", BJ: "XOF", BL: "EUR", BM: "BMD", BN: "BND", BO: "BOB",
  BQ: "USD", BR: "BRL", BS: "BSD", BT: "BTN", BW: "BWP", BY: "BYN", BZ: "BZD",
  CA: "CAD", CC: "AUD", CD: "CDF", CF: "XAF", CG: "XAF", CH: "CHF", CI: "XOF",
  CK: "NZD", CL: "CLP", CM: "XAF", CN: "CNY", CO: "COP", CR: "CRC", CU: "CUP",
  CV: "CVE", CW: "ANG", CX: "AUD", CY: "EUR", CZ: "CZK", DE: "EUR", DJ: "DJF",
  DK: "DKK", DM: "XCD", DO: "DOP", DZ: "DZD", EC: "USD", EE: "EUR", EG: "EGP",
  EH: "MAD", ER: "ERN", ES: "EUR", ET: "ETB", FI: "EUR", FJ: "FJD", FK: "FKP",
  FM: "USD", FO: "DKK", FR: "EUR", GA: "XAF", GB: "GBP", GD: "XCD", GE: "GEL",
  GF: "EUR", GG: "GBP", GH: "GHS", GI: "GIP", GL: "DKK", GM: "GMD", GN: "GNF",
  GP: "EUR", GQ: "XAF", GR: "EUR", GT: "GTQ", GU: "USD", GW: "XOF", GY: "GYD",
  HK: "HKD", HN: "HNL", HR: "EUR", HT: "HTG", HU: "HUF", ID: "IDR", IE: "EUR",
  IL: "ILS", IM: "GBP", IN: "INR", IO: "USD", IQ: "IQD", IR: "IRR", IS: "ISK",
  IT: "EUR", JE: "GBP", JM: "JMD", JO: "JOD", JP: "JPY", KE: "KES", KG: "KGS",
  KH: "KHR", KI: "AUD", KM: "KMF", KN: "XCD", KP: "KPW", KR: "KRW", KW: "KWD",
  KY: "KYD", KZ: "KZT", LA: "LAK", LB: "LBP", LC: "XCD", LI: "CHF", LK: "LKR",
  LR: "LRD", LS: "LSL", LT: "EUR", LU: "EUR", LV: "EUR", LY: "LYD", MA: "MAD",
  MC: "EUR", MD: "MDL", ME: "EUR", MF: "EUR", MG: "MGA", MH: "USD", MK: "MKD",
  ML: "XOF", MM: "MMK", MN: "MNT", MO: "MOP", MP: "USD", MQ: "EUR", MR: "MRU",
  MS: "XCD", MT: "EUR", MU: "MUR", MV: "MVR", MW: "MWK", MX: "MXN", MY: "MYR",
  MZ: "MZN", NA: "NAD", NC: "XPF", NE: "XOF", NF: "AUD", NG: "NGN", NI: "NIO",
  NL: "EUR", NO: "NOK", NP: "NPR", NR: "AUD", NU: "NZD", NZ: "NZD", OM: "OMR",
  PA: "PAB", PE: "PEN", PF: "XPF", PG: "PGK", PH: "PHP", PK: "PKR", PL: "PLN",
  PM: "EUR", PN: "NZD", PR: "USD", PS: "ILS", PT: "EUR", PW: "USD", PY: "PYG",
  QA: "QAR", RE: "EUR", RO: "RON", RS: "RSD", RU: "RUB", RW: "RWF", SA: "SAR",
  SB: "SBD", SC: "SCR", SD: "SDG", SE: "SEK", SG: "SGD", SH: "SHP", SI: "EUR",
  SJ: "NOK", SK: "EUR", SL: "SLE", SM: "EUR", SN: "XOF", SO: "SOS", SR: "SRD",
  SS: "SSP", ST: "STN", SV: "USD", SX: "ANG", SY: "SYP", SZ: "SZL", TC: "USD",
  TD: "XAF", TG: "XOF", TH: "THB", TJ: "TJS", TK: "NZD", TL: "USD", TM: "TMT",
  TN: "TND", TO: "TOP", TR: "TRY", TT: "TTD", TV: "AUD", TW: "TWD", TZ: "TZS",
  UA: "UAH", UG: "UGX", US: "USD", UY: "UYU", UZ: "UZS", VA: "EUR", VC: "XCD",
  VE: "VES", VG: "USD", VI: "USD", VN: "VND", VU: "VUV", WF: "XPF", WS: "WST",
  YE: "YER", YT: "EUR", ZA: "ZAR", ZM: "ZMW", ZW: "ZWG",
};

export const DEFAULT_COUNTRY = "US";
export const DEFAULT_CURRENCY = "USD";

export function currencyFor(country: string): string {
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? DEFAULT_CURRENCY;
}

export function isSupportedCountry(country: string): boolean {
  return country.toUpperCase() in COUNTRY_CURRENCY;
}

let cached: Array<{ code: string; name: string }> | null = null;

/** Every country, sorted by localized display name. Built once per session. */
export function countryOptions(): Array<{ code: string; name: string }> {
  if (cached) return cached;
  let display: Intl.DisplayNames | null = null;
  try {
    display = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    display = null;
  }
  cached = Object.keys(COUNTRY_CURRENCY)
    .map((code) => ({
      code,
      name: (() => {
        try {
          return display?.of(code) ?? code;
        } catch {
          return code;
        }
      })(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return cached;
}

/**
 * Best-effort country guess with no permission prompt and no third-party call.
 * The browser has no "share my IP" permission, and the Geolocation prompt
 * returns coordinates rather than a country, so neither is appropriate for
 * picking a default currency. The timezone is already public to the page.
 */
export function guessCountryFromTimeZone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return null;
    const region = TIMEZONE_COUNTRY[tz];
    if (region) return region;
    // navigator.language often carries a region subtag, e.g. "en-IN".
    const locale =
      typeof navigator !== "undefined" ? navigator.language : undefined;
    const part = locale?.split("-")[1]?.toUpperCase();
    return part && isSupportedCountry(part) ? part : null;
  } catch {
    return null;
  }
}

/** Only the ambiguous/high-traffic zones; anything else falls back to locale. */
const TIMEZONE_COUNTRY: Record<string, string> = {
  "Asia/Kolkata": "IN", "Asia/Calcutta": "IN", "Europe/London": "GB",
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US",
  "America/Los_Angeles": "US", "America/Phoenix": "US", "America/Toronto": "CA",
  "America/Vancouver": "CA", "Europe/Paris": "FR", "Europe/Berlin": "DE",
  "Europe/Madrid": "ES", "Europe/Rome": "IT", "Europe/Amsterdam": "NL",
  "Europe/Dublin": "IE", "Europe/Lisbon": "PT", "Europe/Zurich": "CH",
  "Europe/Stockholm": "SE", "Europe/Oslo": "NO", "Europe/Copenhagen": "DK",
  "Europe/Warsaw": "PL", "Europe/Moscow": "RU", "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR", "Asia/Shanghai": "CN", "Asia/Hong_Kong": "HK",
  "Asia/Singapore": "SG", "Asia/Dubai": "AE", "Asia/Karachi": "PK",
  "Asia/Dhaka": "BD", "Asia/Jakarta": "ID", "Asia/Manila": "PH",
  "Asia/Bangkok": "TH", "Asia/Kuala_Lumpur": "MY", "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU", "Pacific/Auckland": "NZ",
  "Africa/Lagos": "NG", "Africa/Johannesburg": "ZA", "Africa/Nairobi": "KE",
  "Africa/Cairo": "EG", "America/Sao_Paulo": "BR", "America/Mexico_City": "MX",
  "America/Bogota": "CO", "America/Buenos_Aires": "AR", "America/Santiago": "CL",
};
