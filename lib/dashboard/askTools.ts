import { tool, type ToolSet } from "ai";
import { z } from "zod";
import {
  lookupCurrentFacts,
  lookupNews,
  lookupSecurities,
  lookupSnapshot,
} from "./marketLookup";
import { rememberUrl } from "./marketLookup";
import { tavilySearch } from "../market/sources/tavily";

export function createAskTools(bag: string[]): ToolSet {
  const tools: ToolSet = {
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
  if (process.env.TAVILY_API_KEY?.trim())
    tools.searchWeb = tool({
      description:
        "Search the web for recent, citable facts about an investment, a risk, or a market event. Results include URLs you must cite. Use when dashboard facts and the market tools do not answer the question.",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .max(120)
          .describe("Plain-English search, for example 'NVIDIA export restrictions 2026'"),
      }),
      execute: async ({ query }) => {
        const result = await tavilySearch(query, { maxResults: 5 });
        for (const fact of result.facts) rememberUrl(bag, fact.url);
        return result.available
          ? {
              query,
              results: result.facts,
              note: "Cite only these URLs. Snippets are claims from articles, not verified facts.",
            }
          : { query, error: "Web search is unavailable right now. Say the live lookup did not run." };
      },
    });
  return tools;
}
