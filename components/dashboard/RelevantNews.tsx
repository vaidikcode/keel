"use client";
import type { MarketNewsItem } from "./useMarketExtras";

/**
 * Headlines about the things this person saved.
 *
 * Passed through exactly as the publisher wrote them, with the publisher named
 * and the link intact. Keel does not summarise or rank them: a summary would
 * mean sending every headline through a model on every page view, and a
 * headline is a claim by its publisher, not a fact Keel can vouch for.
 */
export function RelevantNews({ news }: { news: MarketNewsItem[] }) {
  if (news.length === 0) return null;
  return (
    <section className="relevant-news" aria-labelledby="relevant-news-heading">
      <div className="section-head">
        <div>
          <h2 id="relevant-news-heading">In the news</h2>
          <p className="fine-print">
            About what you have saved. Headlines are claims by their publishers, not checked by
            Keel, and are not a reason on their own to do anything.
          </p>
        </div>
      </div>
      <ul className="news-list">
        {news.map((item) => (
          <li key={item.url}>
            <a href={item.url} target="_blank" rel="noreferrer">
              <span className="news-ticker">{item.ticker}</span>
              <span className="news-headline">{item.headline}</span>
              <small>
                {[item.publisher, item.asOf].filter(Boolean).join(" · ")}
              </small>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
