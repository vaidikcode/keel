export type AssetKind = "stocks" | "funds" | "crypto";

export type UniverseAsset = {
  id: string;
  kind: AssetKind;
  title: string;
  ticker: string;
  finnhubSymbol: string;
  cik: string | null;
  coingeckoId: string | null;
  twinId: string;
  filingSeed: string;
  sleepSeed: {
    nights: number;
    maxDrawdownPct: number;
    line: string;
  };
  feedSeed: string;
  cannedBeats: {
    feed: string;
    filing: string;
    sleep: string;
    twin: string;
    jargon: string;
    mismatch: string;
  };
};

export const UNIVERSE: UniverseAsset[] = [
  {
    id: "jnj",
    kind: "stocks",
    title: "A slow stock",
    ticker: "JNJ",
    finnhubSymbol: "JNJ",
    cik: "0000200406",
    coingeckoId: null,
    twinId: "voo",
    filingSeed: "A company that already makes money. Price still moves. We show why, in one line.",
    sleepSeed: {
      nights: 2,
      maxDrawdownPct: 12,
      line: "About 2 bad nights last year. Mostly sleepable.",
    },
    feedSeed: "Quiet headlines. Rarely the reel.",
    cannedBeats: {
      feed: "This is the noise side. For JNJ it is usually calm — still not the document.",
      filing: "The filing is the snapshot. Cash, debt, sales — not the vibe.",
      sleep: "Steady enough for most first-timers. Check the nights bar anyway.",
      twin: "Next to a whole-market fund, this is one company with one story.",
      jargon: "Tap a word. Keel peels it into plain English.",
      mismatch: "Your sleep chip and this bar disagree. Pause before you chase.",
    },
  },
  {
    id: "aapl",
    kind: "stocks",
    title: "A household name",
    ticker: "AAPL",
    finnhubSymbol: "AAPL",
    cik: "0000320193",
    coingeckoId: null,
    twinId: "voo",
    filingSeed: "Phones, services, cash pile. Famous does not mean calm.",
    sleepSeed: {
      nights: 4,
      maxDrawdownPct: 22,
      line: "About 4 nights that would have woken a calm sleeper.",
    },
    feedSeed: "Always on the feed. Product launches look like tips.",
    cannedBeats: {
      feed: "Headlines love this ticker. Love is not a balance sheet.",
      filing: "Look at cash vs debt and how sales move — not the keynote.",
      sleep: "More swing than a dull fund. Match it to your sleep chip.",
      twin: "A whole-market twin owns this plus hundreds of others.",
      jargon: "Market cap and P/E get loud here. Tap if it turns to soup.",
      mismatch: "Your chip says calm. This chart does not. Name why you still want it.",
    },
  },
  {
    id: "nvda",
    kind: "stocks",
    title: "A story stock",
    ticker: "NVDA",
    finnhubSymbol: "NVDA",
    cik: "0001045810",
    coingeckoId: null,
    twinId: "voo",
    filingSeed: "Chips and a narrative. Price follows the story hard.",
    sleepSeed: {
      nights: 8,
      maxDrawdownPct: 45,
      line: "About 8 bad nights. The story can go quiet for months.",
    },
    feedSeed: "AI hype lives here. Screenshots travel faster than filings.",
    cannedBeats: {
      feed: "This is where the feed gets loud. Treat every tip as a claim to check.",
      filing: "Sales and margins are the document. The slogan is the feed.",
      sleep: "Spicy for a first timer. The nights bar is honest on purpose.",
      twin: "Same dollars in VOO own a slice of this without the single bet.",
      jargon: "Drawdown and volatility matter more than the meme here.",
      mismatch: "Hype says buy. Sleep says wait. Keel sides with sleep until you write a reason.",
    },
  },
  {
    id: "tsla",
    kind: "stocks",
    title: "The thing on your feed",
    ticker: "TSLA",
    finnhubSymbol: "TSLA",
    cik: "0001318605",
    coingeckoId: null,
    twinId: "voo",
    filingSeed: "Cars, energy, and a personality. Price can lurch without a filing.",
    sleepSeed: {
      nights: 9,
      maxDrawdownPct: 55,
      line: "About 9 nights. Viral and volatile travel together.",
    },
    feedSeed: "Viral by default. Friend screenshots arrive before numbers.",
    cannedBeats: {
      feed: "Friend tips and reels love this. Ask for a number that is not a screenshot.",
      filing: "Deliveries and cash burn beat the timeline. Open the right pane.",
      sleep: "Hot meter territory. If you cannot sleep through it, it is not for you yet.",
      twin: "Put this next to a dull fund. Same imagined dollars. Different pulse.",
      jargon: "FOMO is the word. Tap it. Then look at the filing.",
      mismatch: "Your chip and this bar fight. That fight is the product.",
    },
  },
  {
    id: "voo",
    kind: "funds",
    title: "A whole-market fund",
    ticker: "VOO",
    finnhubSymbol: "VOO",
    cik: null,
    coingeckoId: null,
    twinId: "sgov",
    filingSeed: "Owns a slice of the S&P 500. Boring on purpose. The chart is the market.",
    sleepSeed: {
      nights: 3,
      maxDrawdownPct: 18,
      line: "About 3 rough nights when the whole market dips.",
    },
    feedSeed: "Rarely a tip. Usually the dull twin.",
    cannedBeats: {
      feed: "Little hype here. That is the point of a whole-market fund.",
      filing: "No 10-K for the fund itself — it owns a basket. The seed is the story.",
      sleep: "Market weather, not one company drama. Still not a piggy bank.",
      twin: "Park cash in SGOV if you want even less drama than this.",
      jargon: "Index means you are not picking winners. You are paying for average.",
      mismatch: "If this feels too jumpy, your chip may want parking cash first.",
    },
  },
  {
    id: "vti",
    kind: "funds",
    title: "A first mix",
    ticker: "VTI",
    finnhubSymbol: "VTI",
    cik: null,
    coingeckoId: null,
    twinId: "bnd",
    filingSeed: "Whole US market in one fund. Broader than the big-500 alone.",
    sleepSeed: {
      nights: 3,
      maxDrawdownPct: 20,
      line: "About 3 nights. Broad does not mean flat.",
    },
    feedSeed: "Quiet. Built for I do not know yet.",
    cannedBeats: {
      feed: "Almost no feed drama. Good place to learn without a chase.",
      filing: "One fund, many companies. You are not picking the next tip.",
      sleep: "Similar weather to a big-500 fund. Match your sleep chip.",
      twin: "Bonds next door if you want less equity weather.",
      jargon: "Market cap weighting means big companies dominate the basket.",
      mismatch: "Broad still swings. Your chip and this bar should roughly agree.",
    },
  },
  {
    id: "bnd",
    kind: "funds",
    title: "A bond mix",
    ticker: "BND",
    finnhubSymbol: "BND",
    cik: null,
    coingeckoId: null,
    twinId: "voo",
    filingSeed: "Many bonds in one fund. Less drama than stocks. Not free money.",
    sleepSeed: {
      nights: 1,
      maxDrawdownPct: 8,
      line: "About 1 rough stretch when rates moved hard.",
    },
    feedSeed: "Almost never viral. Rates news, not tips.",
    cannedBeats: {
      feed: "Headlines here are about rates, not memes. Still check the filing side.",
      filing: "Bonds pay and prices move when rates move. The seed says what you own.",
      sleep: "Calmer than equities for most years. Still not zero nights.",
      twin: "Compare to a stock fund if someone sold you excitement.",
      jargon: "Yield is not a stock tip. Tap if the word turns to soup.",
      mismatch: "If you picked spicy sleep, this may feel too quiet — that can be good.",
    },
  },
  {
    id: "sgov",
    kind: "funds",
    title: "A parking spot",
    ticker: "SGOV",
    finnhubSymbol: "SGOV",
    cik: null,
    coingeckoId: null,
    twinId: "voo",
    filingSeed: "Short US Treasuries. Less drama. You give up growth for calm.",
    sleepSeed: {
      nights: 0,
      maxDrawdownPct: 2,
      line: "Almost no bad nights. Calm on purpose.",
    },
    feedSeed: "Never a reel. Pure parking.",
    cannedBeats: {
      feed: "No hype lane. If a friend tips this, they want calm, not a moonshot.",
      filing: "Short Treasuries. You are parking, not picking winners.",
      sleep: "Built for sleep-through-it. The nights bar should stay near zero.",
      twin: "Put a story stock next to this to see the pulse gap.",
      jargon: "Treasury and duration — tap if those words fog up.",
      mismatch: "Spicy chip plus this fund is fine — you chose calm on purpose.",
    },
  },
  {
    id: "btc",
    kind: "crypto",
    title: "Bitcoin, un-memed",
    ticker: "BTC",
    finnhubSymbol: "BINANCE:BTCUSDT",
    cik: null,
    coingeckoId: "bitcoin",
    twinId: "sgov",
    filingSeed: "No new coins are printed the same way. Price still swings hard. No 10-K — supply and history are the document.",
    sleepSeed: {
      nights: 10,
      maxDrawdownPct: 60,
      line: "About 10 nights. Un-memed still means spicy.",
    },
    feedSeed: "Always loud. Treat the feed as noise until you read supply.",
    cannedBeats: {
      feed: "Reels and tips never sleep. Left pane is noise on purpose.",
      filing: "No SEC filing. Supply and what it is replace the 10-K.",
      sleep: "High swing. Match your chip or park first.",
      twin: "Parking cash next door shows what calm feels like.",
      jargon: "Market cap and volatility get shouted. Tap for plain English.",
      mismatch: "Steady chip vs this bar is a hard no until you can name a non-hype reason.",
    },
  },
  {
    id: "eth",
    kind: "crypto",
    title: "Ethereum, plain",
    ticker: "ETH",
    finnhubSymbol: "BINANCE:ETHUSDT",
    cik: null,
    coingeckoId: "ethereum",
    twinId: "btc",
    filingSeed: "A network people build on. Still a coin with a chart. Description and supply stand in for a filing.",
    sleepSeed: {
      nights: 11,
      maxDrawdownPct: 65,
      line: "About 11 nights. Network story, stock-like swings.",
    },
    feedSeed: "Tech tips mix with price tips. Separate them.",
    cannedBeats: {
      feed: "Headlines mix product and price. Keel keeps them apart.",
      filing: "Read what it is and how supply works — that is the document here.",
      sleep: "As jumpy as most coins. Be honest with your chip.",
      twin: "BTC is the slower twin in this lane — still not calm.",
      jargon: "Gas, staking, market cap — tap the fog.",
      mismatch: "If sleep says no, the feed does not get a vote.",
    },
  },
  {
    id: "doge",
    kind: "crypto",
    title: "A smaller coin",
    ticker: "DOGE",
    finnhubSymbol: "BINANCE:DOGEUSDT",
    cik: null,
    coingeckoId: "dogecoin",
    twinId: "btc",
    filingSeed: "Often a slogan with a chart. Keel treats it as high-fog until the facts exist.",
    sleepSeed: {
      nights: 14,
      maxDrawdownPct: 80,
      line: "About 14 nights. Memes move the price.",
    },
    feedSeed: "Pure viral. Friend tips and jokes arrive first.",
    cannedBeats: {
      feed: "This is the feed winning. Ask for a claim that is not a joke.",
      filing: "Thin document side. That gap is the warning.",
      sleep: "Hottest bar in the set. First-timers usually wait.",
      twin: "BTC is the boring twin in crypto — still spicy, less slogan.",
      jargon: "FOMO and market cap are the fog. Peel them.",
      mismatch: "Almost always a mismatch with a calm chip. That is intentional.",
    },
  },
  {
    id: "sol",
    kind: "crypto",
    title: "A fast chain coin",
    ticker: "SOL",
    finnhubSymbol: "BINANCE:SOLUSDT",
    cik: null,
    coingeckoId: "solana",
    twinId: "btc",
    filingSeed: "Speed story plus a chart. Description and supply are the filing analog.",
    sleepSeed: {
      nights: 12,
      maxDrawdownPct: 70,
      line: "About 12 nights. Fast chain, fast swings.",
    },
    feedSeed: "Trending often. Speed is the slogan.",
    cannedBeats: {
      feed: "Trending noise is common. Check the right pane before you feel late.",
      filing: "What it is and supply beat the speed slogan.",
      sleep: "Spicy. Same honesty as the other coins.",
      twin: "BTC next to this dampens the slogan without promising calm.",
      jargon: "Throughput words are marketing. Tap what you need translated.",
      mismatch: "Chip vs bar — write a reason that is not everyone is buying.",
    },
  },
];

export const UNIVERSE_BY_ID: Record<string, UniverseAsset> = Object.fromEntries(
  UNIVERSE.map((asset) => [asset.id, asset]),
);

const DEFAULT_BY_KIND: Record<AssetKind, string[]> = {
  stocks: ["jnj", "aapl", "nvda"],
  funds: ["voo", "vti", "sgov"],
  crypto: ["btc", "eth", "doge"],
};

const LOUD_BY_KIND: Record<AssetKind, string> = {
  stocks: "tsla",
  funds: "voo",
  crypto: "doge",
};

export function pickAssets(
  watch: AssetKind,
  noise: string,
): UniverseAsset[] {
  const base = [...DEFAULT_BY_KIND[watch]];
  if (noise === "viral" || noise === "friends") {
    const loud = LOUD_BY_KIND[watch];
    if (!base.includes(loud)) {
      base[2] = loud;
    }
  }
  return base
    .map((id) => UNIVERSE_BY_ID[id])
    .filter((asset): asset is UniverseAsset => Boolean(asset))
    .slice(0, 3);
}

export function twinFor(asset: UniverseAsset): UniverseAsset | null {
  return UNIVERSE_BY_ID[asset.twinId] ?? null;
}
