export const CATEGORY_IDS = [
  "broad-funds",
  "bond-cash",
  "large-stable",
  "growth-tech",
  "dividend",
  "crypto",
  "international",
] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];
export type AssetKind = "funds" | "stocks" | "crypto";

export type Asset = {
  id: string;
  name: string;
  ticker: string;
  /** Symbol Yahoo Finance understands (crypto uses X-USD). */
  yahooSymbol: string;
  kind: AssetKind;
  coinId?: string;
  url: string;
  description: string;
  tradeoff: string;
};

export type Category = {
  id: CategoryId;
  label: string;
  short: string;
  kind: AssetKind;
  blurb: string;
  icon: string;
  assets: Asset[];
};

export const BENCHMARK = { id: "voo", ticker: "VOO", yahooSymbol: "VOO" };

const fund = (
  ticker: string,
  name: string,
  description: string,
  tradeoff: string,
  url: string,
): Asset => ({
  id: ticker.toLowerCase().replace(/[^a-z0-9]/g, "-"),
  name,
  ticker,
  yahooSymbol: ticker,
  kind: "funds",
  url,
  description,
  tradeoff,
});
const stock = (
  ticker: string,
  name: string,
  description: string,
  tradeoff: string,
  url: string,
): Asset => ({ ...fund(ticker, name, description, tradeoff, url), kind: "stocks" });
const coin = (
  ticker: string,
  coinId: string,
  name: string,
  description: string,
  tradeoff: string,
  url: string,
): Asset => ({
  id: ticker.toLowerCase(),
  name,
  ticker,
  yahooSymbol: `${ticker}-USD`,
  kind: "crypto",
  coinId,
  url,
  description,
  tradeoff,
});

const FUND_TRADEOFF =
  "Spreads your money across many holdings, but its value still falls when the market it tracks falls.";
const BOND_TRADEOFF =
  "Bond prices can fall when interest rates rise. This is an investment, not an insured savings account.";
const CASH_TRADEOFF =
  "Income changes with interest rates. Fund shares are not an insured bank deposit.";
const STOCK_TRADEOFF =
  "Your investment depends on one company's business and the price you pay for it.";
const GROWTH_TRADEOFF =
  "Expectations for future growth can cause large price changes in either direction.";
const DIVIDEND_TRADEOFF =
  "Regular payouts can be cut, and the share price still moves with the company and the market.";
const CRYPTO_TRADEOFF =
  "Large price changes and custody risks matter. Owning it does not give you company earnings.";
const INTL_TRADEOFF =
  "Adds companies outside the US, so currency moves and local events affect its value too.";

const ishares = (id: string, slug: string) =>
  `https://www.ishares.com/us/products/${id}/${slug}`;
const vanguard = (t: string) =>
  `https://investor.vanguard.com/investment-products/etfs/profile/${t.toLowerCase()}`;
const spdr = (t: string) =>
  `https://www.ssga.com/us/en/intermediary/etfs/funds/${t.toLowerCase()}`;
const schwab = (t: string) =>
  `https://www.schwabassetmanagement.com/products/${t.toLowerCase()}`;

export const CATEGORIES: Category[] = [
  {
    id: "broad-funds",
    label: "Broad-market funds",
    short: "Broad funds",
    kind: "funds",
    icon: "globe",
    blurb:
      "One purchase that holds hundreds or thousands of companies. Often the calmest way to own stocks.",
    assets: [
      fund("VTI", "Vanguard Total Stock Market ETF", "One fund holding companies across the US stock market.", FUND_TRADEOFF, vanguard("VTI")),
      fund("VOO", "Vanguard S&P 500 ETF", "A fund tracking an index of about 500 large US companies.", FUND_TRADEOFF, vanguard("VOO")),
      fund("SPY", "SPDR S&P 500 ETF Trust", "The oldest US fund tracking the S&P 500 index.", FUND_TRADEOFF, spdr("SPY")),
      fund("IVV", "iShares Core S&P 500 ETF", "A low-cost fund tracking the S&P 500 index.", FUND_TRADEOFF, ishares("239726", "ishares-core-sp-500-etf")),
      fund("ITOT", "iShares Core S&P Total U.S. Stock Market ETF", "A fund holding large, mid and small US companies.", FUND_TRADEOFF, ishares("239724", "ishares-core-sp-total-us-stock-market-etf")),
      fund("SCHB", "Schwab U.S. Broad Market ETF", "A fund holding about 2,500 US companies.", FUND_TRADEOFF, schwab("schb")),
      fund("SPLG", "SPDR Portfolio S&P 500 ETF", "A very low-cost fund tracking the S&P 500 index.", FUND_TRADEOFF, spdr("SPLG")),
      fund("VV", "Vanguard Large-Cap ETF", "A fund holding the largest US companies.", FUND_TRADEOFF, vanguard("VV")),
      fund("VT", "Vanguard Total World Stock ETF", "A fund holding companies from the US and the rest of the world.", FUND_TRADEOFF, vanguard("VT")),
      fund("IWM", "iShares Russell 2000 ETF", "A fund holding about 2,000 smaller US companies.", "Smaller companies tend to move more sharply than large ones, up and down.", ishares("239710", "ishares-russell-2000-etf")),
    ],
  },
  {
    id: "bond-cash",
    label: "Bond and cash funds",
    short: "Bonds & cash",
    kind: "funds",
    icon: "shield",
    blurb:
      "Funds that lend money to governments and companies. Usually steadier than stocks, with smaller ups and downs.",
    assets: [
      fund("BND", "Vanguard Total Bond Market ETF", "A fund holding a broad collection of US investment-grade bonds.", BOND_TRADEOFF, vanguard("BND")),
      fund("SGOV", "iShares 0–3 Month Treasury Bond ETF", "A fund holding US Treasury securities with very short maturities.", CASH_TRADEOFF, ishares("314116", "ishares-0-3-month-treasury-bond-etf")),
      fund("AGG", "iShares Core U.S. Aggregate Bond ETF", "A fund holding thousands of US investment-grade bonds.", BOND_TRADEOFF, ishares("239458", "ishares-core-total-us-bond-market-etf")),
      fund("BIL", "SPDR Bloomberg 1-3 Month T-Bill ETF", "A fund holding very short-term US Treasury bills.", CASH_TRADEOFF, spdr("BIL")),
      fund("SHV", "iShares Short Treasury Bond ETF", "A fund holding US Treasuries maturing within a year.", CASH_TRADEOFF, ishares("239466", "ishares-short-treasury-bond-etf")),
      fund("VGSH", "Vanguard Short-Term Treasury ETF", "A fund holding US Treasuries maturing in 1–3 years.", BOND_TRADEOFF, vanguard("VGSH")),
      fund("VGIT", "Vanguard Intermediate-Term Treasury ETF", "A fund holding US Treasuries maturing in 3–10 years.", BOND_TRADEOFF, vanguard("VGIT")),
      fund("TIP", "iShares TIPS Bond ETF", "A fund holding US Treasuries whose value adjusts with inflation.", BOND_TRADEOFF, ishares("239467", "ishares-tips-bond-etf")),
      fund("LQD", "iShares iBoxx $ Investment Grade Corporate Bond ETF", "A fund holding bonds issued by large, well-rated companies.", "Company bonds pay more than Treasuries but can fall when businesses struggle or rates rise.", ishares("239566", "ishares-iboxx-investment-grade-corporate-bond-etf")),
      fund("TLT", "iShares 20+ Year Treasury Bond ETF", "A fund holding US Treasuries maturing in 20 years or more.", "Long-dated bonds swing far more than short ones when interest rates change.", ishares("239454", "ishares-20-year-treasury-bond-etf")),
    ],
  },
  {
    id: "large-stable",
    label: "Large, established companies",
    short: "Large stable",
    kind: "stocks",
    icon: "home",
    blurb:
      "Shares of big, long-running businesses. Still single companies, so each one carries its own risks.",
    assets: [
      stock("AAPL", "Apple", "A company making devices, software and services.", STOCK_TRADEOFF, "https://investor.apple.com/"),
      stock("JNJ", "Johnson & Johnson", "A healthcare company making medicines and medical technologies.", "One company's business, product and legal risks can affect its share price.", "https://www.investor.jnj.com/"),
      stock("MSFT", "Microsoft", "A company making software, cloud services and devices.", STOCK_TRADEOFF, "https://www.microsoft.com/en-us/investor"),
      stock("BRK-B", "Berkshire Hathaway", "A holding company owning insurers, railroads, utilities and large stock positions.", STOCK_TRADEOFF, "https://www.berkshirehathaway.com/"),
      stock("PG", "Procter & Gamble", "A company selling everyday household and personal-care brands.", STOCK_TRADEOFF, "https://www.pginvestor.com/"),
      stock("KO", "Coca-Cola", "A beverage company selling drinks worldwide.", STOCK_TRADEOFF, "https://investors.coca-colacompany.com/"),
      stock("WMT", "Walmart", "A large retailer with stores and online shopping.", STOCK_TRADEOFF, "https://stock.walmart.com/"),
      stock("JPM", "JPMorgan Chase", "A large bank offering consumer and business banking.", "Banks are sensitive to interest rates, loan losses and the wider economy.", "https://www.jpmorganchase.com/ir"),
      stock("COST", "Costco", "A membership warehouse retailer.", STOCK_TRADEOFF, "https://investor.costco.com/"),
      stock("PEP", "PepsiCo", "A food and beverage company with snack and drink brands.", STOCK_TRADEOFF, "https://www.pepsico.com/investors"),
      stock("UNH", "UnitedHealth Group", "A health insurance and health services company.", "Healthcare rules and costs can change quickly and affect the business.", "https://www.unitedhealthgroup.com/investors.html"),
      stock("HD", "Home Depot", "A home improvement retailer.", STOCK_TRADEOFF, "https://ir.homedepot.com/"),
    ],
  },
  {
    id: "growth-tech",
    label: "Growth and technology",
    short: "Growth & tech",
    kind: "stocks",
    icon: "spark",
    blurb:
      "Companies expected to grow quickly. Prices can rise fast and fall fast as expectations change.",
    assets: [
      stock("NVDA", "NVIDIA", "A company designing computing hardware and software.", GROWTH_TRADEOFF, "https://investor.nvidia.com/"),
      stock("TSLA", "Tesla", "A company making electric vehicles and energy products.", "Its share price can move sharply as expectations for the business change.", "https://ir.tesla.com/"),
      stock("AMZN", "Amazon", "An online retailer and cloud computing company.", GROWTH_TRADEOFF, "https://ir.aboutamazon.com/"),
      stock("GOOGL", "Alphabet", "The parent company of Google, YouTube and Google Cloud.", GROWTH_TRADEOFF, "https://abc.xyz/investor/"),
      stock("META", "Meta Platforms", "The company behind Facebook, Instagram and WhatsApp.", GROWTH_TRADEOFF, "https://investor.atmeta.com/"),
      stock("AMD", "Advanced Micro Devices", "A company designing computer processors and graphics chips.", GROWTH_TRADEOFF, "https://ir.amd.com/"),
      stock("AVGO", "Broadcom", "A semiconductor and infrastructure software company.", GROWTH_TRADEOFF, "https://investors.broadcom.com/"),
      stock("NFLX", "Netflix", "A streaming entertainment company.", GROWTH_TRADEOFF, "https://ir.netflix.net/"),
      stock("CRM", "Salesforce", "A company selling business software in the cloud.", GROWTH_TRADEOFF, "https://investor.salesforce.com/"),
      { ...fund("QQQ", "Invesco QQQ Trust", "A fund tracking 100 large non-financial companies listed on Nasdaq, heavy in technology.", "Concentrated in technology, so it moves more than the whole market.", "https://www.invesco.com/qqq-etf/en/home.html") },
      stock("PLTR", "Palantir Technologies", "A data analysis software company.", GROWTH_TRADEOFF, "https://investors.palantir.com/"),
    ],
  },
  {
    id: "dividend",
    label: "Dividend payers",
    short: "Dividend",
    kind: "stocks",
    icon: "bookmark",
    blurb:
      "Companies and funds that pay part of their profits to owners regularly. Payouts help, but prices still move.",
    assets: [
      fund("SCHD", "Schwab U.S. Dividend Equity ETF", "A fund holding US companies with a record of paying dividends.", DIVIDEND_TRADEOFF, schwab("schd")),
      fund("VYM", "Vanguard High Dividend Yield ETF", "A fund holding US companies that pay above-average dividends.", DIVIDEND_TRADEOFF, vanguard("VYM")),
      fund("VIG", "Vanguard Dividend Appreciation ETF", "A fund holding companies that have raised dividends for years.", DIVIDEND_TRADEOFF, vanguard("VIG")),
      fund("HDV", "iShares Core High Dividend ETF", "A fund holding US companies paying higher dividends.", DIVIDEND_TRADEOFF, ishares("239563", "ishares-core-high-dividend-etf")),
      fund("DGRO", "iShares Core Dividend Growth ETF", "A fund holding companies growing their dividends.", DIVIDEND_TRADEOFF, ishares("264623", "ishares-core-dividend-growth-etf")),
      stock("O", "Realty Income", "A property company that pays dividends monthly.", "Property values and interest rates strongly affect this kind of company.", "https://www.realtyincome.com/investors"),
      stock("VZ", "Verizon", "A telecommunications company.", DIVIDEND_TRADEOFF, "https://www.verizon.com/about/investors"),
      stock("MO", "Altria", "A tobacco company with a high dividend.", "Its products face declining use and heavy regulation.", "https://investor.altria.com/"),
      stock("XOM", "ExxonMobil", "An oil and gas company.", "Oil prices swing widely and drive this company's results.", "https://investor.exxonmobil.com/"),
      stock("PFE", "Pfizer", "A pharmaceutical company.", "Drug approvals, patents and lawsuits can change the outlook quickly.", "https://investors.pfizer.com/"),
      stock("IBM", "IBM", "A technology and consulting company.", DIVIDEND_TRADEOFF, "https://www.ibm.com/investor"),
    ],
  },
  {
    id: "crypto",
    label: "Crypto",
    short: "Crypto",
    kind: "crypto",
    icon: "spark",
    blurb:
      "Digital assets traded around the clock. Prices can halve or double within months. No company earnings behind them.",
    assets: [
      coin("BTC", "bitcoin", "Bitcoin", "A digital asset transferred on a decentralized network.", CRYPTO_TRADEOFF, "https://bitcoin.org/en/you-need-to-know"),
      coin("ETH", "ethereum", "Ethereum", "A network for digital applications, with ether as its native asset.", "Network use does not guarantee investment returns. Price and custody risks remain.", "https://ethereum.org/en/eth/"),
      coin("SOL", "solana", "Solana", "A network for digital applications, with SOL as its native asset.", "Technical, network and custody risks sit alongside substantial price uncertainty.", "https://solana.com/"),
      coin("DOGE", "dogecoin", "Dogecoin", "A digital currency supported by an open-source network.", "Attention and sentiment can drive large price changes. Popularity is not a measure of investment value.", "https://dogecoin.com/"),
      coin("XRP", "ripple", "XRP", "A digital asset used on the XRP Ledger for payments.", CRYPTO_TRADEOFF, "https://xrpl.org/"),
      coin("ADA", "cardano", "Cardano", "A blockchain network with ADA as its native asset.", CRYPTO_TRADEOFF, "https://cardano.org/"),
      coin("BNB", "binancecoin", "BNB", "The native asset of the BNB Chain, linked to the Binance exchange.", "Closely tied to one exchange's fortunes and regulation.", "https://www.bnbchain.org/"),
      coin("AVAX", "avalanche-2", "Avalanche", "A blockchain network with AVAX as its native asset.", CRYPTO_TRADEOFF, "https://www.avax.network/"),
      coin("LINK", "chainlink", "Chainlink", "A network that feeds outside data to blockchains.", CRYPTO_TRADEOFF, "https://chain.link/"),
      coin("LTC", "litecoin", "Litecoin", "An early digital currency based on Bitcoin's design.", CRYPTO_TRADEOFF, "https://litecoin.org/"),
      coin("DOT", "polkadot", "Polkadot", "A network connecting different blockchains.", CRYPTO_TRADEOFF, "https://polkadot.com/"),
    ],
  },
  {
    id: "international",
    label: "International funds",
    short: "International",
    kind: "funds",
    icon: "compass",
    blurb:
      "Funds holding companies outside the US. A way to avoid relying on one country's economy.",
    assets: [
      fund("VXUS", "Vanguard Total International Stock ETF", "A fund holding companies from developed and emerging markets outside the US.", INTL_TRADEOFF, vanguard("VXUS")),
      fund("VEA", "Vanguard FTSE Developed Markets ETF", "A fund holding companies in developed countries outside the US.", INTL_TRADEOFF, vanguard("VEA")),
      fund("VWO", "Vanguard FTSE Emerging Markets ETF", "A fund holding companies in emerging economies.", "Emerging markets can swing more and face political and currency shocks.", vanguard("VWO")),
      fund("IEFA", "iShares Core MSCI EAFE ETF", "A fund holding companies in Europe, Australasia and the Far East.", INTL_TRADEOFF, ishares("244049", "ishares-core-msci-eafe-etf")),
      fund("IEMG", "iShares Core MSCI Emerging Markets ETF", "A fund holding companies in emerging economies.", "Emerging markets can swing more and face political and currency shocks.", ishares("244050", "ishares-core-msci-emerging-markets-etf")),
      fund("EFA", "iShares MSCI EAFE ETF", "A fund holding large and mid-size companies in developed markets outside North America.", INTL_TRADEOFF, ishares("239623", "ishares-msci-eafe-etf")),
      fund("EEM", "iShares MSCI Emerging Markets ETF", "A fund holding large and mid-size companies in emerging markets.", "Emerging markets can swing more and face political and currency shocks.", ishares("239637", "ishares-msci-emerging-markets-etf")),
      fund("VEU", "Vanguard FTSE All-World ex-US ETF", "A fund holding companies worldwide except the US.", INTL_TRADEOFF, vanguard("VEU")),
      fund("INDA", "iShares MSCI India ETF", "A fund holding large and mid-size Indian companies.", "One country's politics, currency and economy drive this fund.", ishares("239659", "ishares-msci-india-etf")),
      fund("EWJ", "iShares MSCI Japan ETF", "A fund holding large and mid-size Japanese companies.", "One country's politics, currency and economy drive this fund.", ishares("239665", "ishares-msci-japan-etf")),
      fund("EWU", "iShares MSCI United Kingdom ETF", "A fund holding large and mid-size UK companies.", "One country's politics, currency and economy drive this fund.", ishares("239690", "ishares-msci-united-kingdom-etf")),
    ],
  },
];

export const CATEGORY_BY_ID: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;

export const ASSETS_BY_ID: Map<string, Asset> = new Map(
  CATEGORIES.flatMap((c) => c.assets.map((a) => [a.id, a] as const)),
);
export const ALL_ASSET_IDS: string[] = [...ASSETS_BY_ID.keys()];
export const CRYPTO_TICKERS: string[] = CATEGORY_BY_ID.crypto.assets.map(
  (a) => a.ticker,
);

export function isCategoryId(value: unknown): value is CategoryId {
  return (
    typeof value === "string" && (CATEGORY_IDS as readonly string[]).includes(value)
  );
}
export function categoryOf(assetId: string): Category | undefined {
  return CATEGORIES.find((c) => c.assets.some((a) => a.id === assetId));
}
export function assetById(assetId: string): Asset | undefined {
  return ASSETS_BY_ID.get(assetId);
}
export function historySourceFor(asset: Asset): string {
  return asset.kind === "crypto" && asset.coinId
    ? `https://www.coingecko.com/en/coins/${asset.coinId}/historical_data`
    : `https://finance.yahoo.com/quote/${encodeURIComponent(asset.yahooSymbol)}/history/`;
}
export function quotePageFor(asset: Asset): string {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(asset.yahooSymbol)}/`;
}
