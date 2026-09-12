import { tool } from "ai";
import { z } from "zod";
import {
  lookupCurrentFacts,
  lookupNews,
  lookupSecurities,
  lookupSnapshot,
} from "./marketLookup";

export function createAskTools(bag: string[]) {
  return {
    searchSecurities: tool({
      description:
        "Find listed US stocks, ETFs, or coins when the dashboard facts do not include the name or ticker the user asked about. Call this before guessing a ticker.",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .max(40)
          .describe("Company name, fund name, or ticker, for example Microsoft or MSFT"),
      }),
      execute: async ({ query }) => lookupSecurities(query, bag),
    }),
    getMarketSnapshot: tool({
      description:
        "Get a delayed quote and company snapshot for a known ticker. Use when the dashboard facts are missing the live price, industry, or filing notes the question needs.",
      inputSchema: z.object({
        symbol: z
          .string()
          .min(1)
          .max(20)
          .describe("Exchange ticker such as AAPL, VOO, or BTC-USD"),
      }),
      execute: async ({ symbol }) => lookupSnapshot(symbol, bag),
    }),
    getRecentNews: tool({
      description:
        "Fetch recent articles for a ticker, with URLs to cite. Use when the user asks what happened, why a price moved, or wants current news.",
      inputSchema: z.object({
        symbol: z
          .string()
          .min(1)
          .max(20)
          .describe("Exchange ticker such as NVDA or BTC-USD"),
      }),
      execute: async ({ symbol }) => lookupNews(symbol, bag),
    }),
    searchCurrentFacts: tool({
      description:
        "Search current market headlines and listings when dashboard facts and the other tools still do not cover the question. Prefer this last. Results include URLs you must cite.",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .max(80)
          .describe(
            "Plain-English search, for example 'Microsoft latest earnings' or 'SGOV yield'",
          ),
      }),
      execute: async ({ query }) => lookupCurrentFacts(query, bag),
    }),
  };
}
