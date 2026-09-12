import type { Investment, Dashboard } from "./model";
import type { Profile } from "../onboarding/questions";
type CatalogEntry = Omit<Investment, "history" | "retrievedAt" | "evidence"> & {
  coinId?: string;
};
export const CATALOG: CatalogEntry[] = [
  {
    id: "vti",
    name: "Vanguard Total Stock Market ETF",
    ticker: "VTI",
    kind: "funds",
    description: "One fund holding companies across the US stock market.",
    tradeoff:
      "Spreads your investment across companies, but its value still falls when the market falls.",
    url: "https://investor.vanguard.com/investment-products/etfs/profile/vti",
    historySource: "https://finance.yahoo.com/quote/VTI/history/",
  },
  {
    id: "voo",
    name: "Vanguard S&P 500 ETF",
    ticker: "VOO",
    kind: "funds",
    description: "A fund tracking an index of large US companies.",
    tradeoff:
      "A single purchase gives exposure to many companies, concentrated in large US businesses.",
    url: "https://investor.vanguard.com/investment-products/etfs/profile/voo",
    historySource: "https://finance.yahoo.com/quote/VOO/history/",
  },
  {
    id: "bnd",
    name: "Vanguard Total Bond Market ETF",
    ticker: "BND",
    kind: "funds",
    description:
      "A fund holding a broad collection of US investment-grade bonds.",
    tradeoff:
      "Bond prices can fall when interest rates rise. This is an investment, not a savings account.",
    url: "https://investor.vanguard.com/investment-products/etfs/profile/bnd",
    historySource: "https://finance.yahoo.com/quote/BND/history/",
  },
  {
    id: "aapl",
    name: "Apple",
    ticker: "AAPL",
    kind: "stocks",
    description: "A company making devices, software and services.",
    tradeoff:
      "Your investment depends on one company's business and the price you pay for it.",
    url: "https://investor.apple.com/",
    historySource: "https://finance.yahoo.com/quote/AAPL/history/",
  },
  {
    id: "nvda",
    name: "NVIDIA",
    ticker: "NVDA",
    kind: "stocks",
    description: "A company designing computing hardware and software.",
    tradeoff:
      "Expectations for future growth can cause large price changes in either direction.",
    url: "https://investor.nvidia.com/",
    historySource: "https://finance.yahoo.com/quote/NVDA/history/",
  },
  {
    id: "btc",
    name: "Bitcoin",
    ticker: "BTC",
    kind: "crypto",
    coinId: "bitcoin",
    description: "A digital asset transferred on a decentralized network.",
    tradeoff:
      "Large price changes and custody risks matter. Owning it does not give you company earnings.",
    url: "https://bitcoin.org/en/you-need-to-know",
    historySource: "https://www.coingecko.com/en/coins/bitcoin/historical_data",
  },
  {
    id: "jnj",
    name: "Johnson & Johnson",
    ticker: "JNJ",
    kind: "stocks",
    description:
      "A healthcare company making medicines and medical technologies.",
    tradeoff:
      "One company's business, product and legal risks can affect its share price.",
    url: "https://www.investor.jnj.com/",
    historySource: "https://finance.yahoo.com/quote/JNJ/history/",
  },
  {
    id: "tsla",
    name: "Tesla",
    ticker: "TSLA",
    kind: "stocks",
    description: "A company making electric vehicles and energy products.",
    tradeoff:
      "Its share price can move sharply as expectations for the business change.",
    url: "https://ir.tesla.com/",
    historySource: "https://finance.yahoo.com/quote/TSLA/history/",
  },
  {
    id: "sgov",
    name: "iShares 0–3 Month Treasury Bond ETF",
    ticker: "SGOV",
    kind: "funds",
    description:
      "A fund holding US Treasury securities with very short maturities.",
    tradeoff:
      "Income changes with interest rates. Fund shares are not an insured bank deposit.",
    url: "https://www.ishares.com/us/products/314116/ishares-0-3-month-treasury-bond-etf",
    historySource: "https://finance.yahoo.com/quote/SGOV/history/",
  },
  {
    id: "eth",
    name: "Ethereum",
    ticker: "ETH",
    kind: "crypto",
    coinId: "ethereum",
    description:
      "A network for digital applications, with ether as its native asset.",
    tradeoff:
      "Network use does not guarantee investment returns. Price and custody risks remain.",
    url: "https://ethereum.org/en/eth/",
    historySource:
      "https://www.coingecko.com/en/coins/ethereum/historical_data",
  },
  {
    id: "doge",
    name: "Dogecoin",
    ticker: "DOGE",
    kind: "crypto",
    coinId: "dogecoin",
    description: "A digital currency supported by an open-source network.",
    tradeoff:
      "Attention and sentiment can drive large price changes. Popularity is not a measure of investment value.",
    url: "https://dogecoin.com/",
    historySource:
      "https://www.coingecko.com/en/coins/dogecoin/historical_data",
  },
  {
    id: "sol",
    name: "Solana",
    ticker: "SOL",
    kind: "crypto",
    coinId: "solana",
    description:
      "A network for digital applications, with SOL as its native asset.",
    tradeoff:
      "Technical, network and custody risks sit alongside substantial price uncertainty.",
    url: "https://solana.com/",
    historySource: "https://www.coingecko.com/en/coins/solana/historical_data",
  },
];
export function catalogFor(profile: Profile) {
  return profile.watch === "all"
    ? CATALOG
    : CATALOG.filter(
        (a) => a.kind === profile.watch || a.id === "vti" || a.id === "bnd",
      ).sort(
        (a, b) =>
          Number(b.kind === profile.watch) - Number(a.kind === profile.watch),
      );
}
export function sampleDashboard(): Dashboard {
  const start = Date.UTC(2025, 8, 12);
  const assets = CATALOG.slice(0, 6).map((a, index) => ({
    ...a,
    retrievedAt: 0,
    evidence: [],
    history: Array.from({ length: 366 }, (_, day) => ({
      date: new Date(start + day * 86400000).toISOString().slice(0, 10),
      value:
        Math.round(
          (100 +
            day * [0.045, 0.055, 0.009, 0.07, 0.11, 0.16][index] +
            Math.sin(day / 17 + index) * (index === 2 ? 1.8 : 5 + index) -
            Math.exp(-(((day - 170) / 28) ** 2)) *
              (index === 2 ? 2 : 16 + index * 3) +
            Math.sin(day * 1.6) * (index === 2 ? 0.3 : 1.4)) *
            100,
        ) / 100,
    })),
  }));
  return { version: 2, assets, generatedAt: 0, sample: true };
}
