import type { AssetFacts, SourceAnswers } from "../pack";
import { pickAssets, type UniverseAsset } from "../universe";
import {
  fetchCoinFiling,
  fetchCoinPrice,
  fetchCoinSleep,
  fetchTrendingNote,
} from "./coingecko";
import {
  fetchCompanyNews,
  fetchMarketNews,
  fetchQuote,
} from "./finnhub";
import { fetchFilingLines } from "./sec";
import { fetchYahooSleep } from "./yahooSleep";

async function factsForAsset(
  asset: UniverseAsset,
  answers: SourceAnswers,
  trendingNote: string | null,
): Promise<AssetFacts> {
  if (asset.kind === "crypto" && asset.coingeckoId) {
    const [price, filing, sleep] = await Promise.all([
      fetchCoinPrice(asset.coingeckoId),
      fetchCoinFiling(asset.coingeckoId),
      fetchCoinSleep(asset.coingeckoId),
    ]);
    const news =
      answers.noise === "headlines" || answers.noise === "friends"
        ? await fetchCompanyNews(asset.finnhubSymbol).then(async (items) => {
            if (items.length > 0) {
              return items;
            }
            return fetchMarketNews("crypto");
          })
        : [];

    return {
      asset,
      priceLabel: price.label,
      headlines: news.map((item) => item.headline),
      filingFacts: filing.length > 0 ? filing : [asset.filingSeed],
      nights: sleep?.nights ?? asset.sleepSeed.nights,
      maxDrawdownPct: sleep?.maxDrawdownPct ?? asset.sleepSeed.maxDrawdownPct,
      pulse: sleep?.pulse ?? [0.3, 0.5, 0.4, 0.7, 0.55, 0.8, 0.6],
      trendingNote:
        answers.noise === "viral" ? trendingNote : null,
    };
  }

  const [quote, sleep] = await Promise.all([
    fetchQuote(asset.finnhubSymbol),
    fetchYahooSleep(asset.ticker),
  ]);

  let headlines: string[] = [];
  if (answers.noise === "headlines" || answers.noise === "friends") {
    const company = await fetchCompanyNews(asset.finnhubSymbol);
    headlines =
      company.length > 0
        ? company.map((item) => item.headline)
        : (await fetchMarketNews("general")).map((item) => item.headline);
  }

  let filingFacts: string[] = [asset.filingSeed];
  if (asset.cik) {
    const sec = await fetchFilingLines(asset.cik);
    if (sec.length > 0) {
      filingFacts = sec;
    }
  }

  return {
    asset,
    priceLabel: quote.label,
    headlines,
    filingFacts,
    nights: sleep?.nights ?? asset.sleepSeed.nights,
    maxDrawdownPct: sleep?.maxDrawdownPct ?? asset.sleepSeed.maxDrawdownPct,
    pulse: sleep?.pulse ?? [0.4, 0.42, 0.45, 0.43, 0.48, 0.5, 0.47],
    trendingNote:
      answers.noise === "viral" && asset.kind === "crypto"
        ? trendingNote
        : null,
  };
}

export async function gatherFacts(
  answers: SourceAnswers,
): Promise<AssetFacts[]> {
  const assets = pickAssets(answers.watch, answers.noise);
  const trending =
    answers.noise === "viral" ? await fetchTrendingNote() : null;
  return Promise.all(
    assets.map((asset) => factsForAsset(asset, answers, trending)),
  );
}
