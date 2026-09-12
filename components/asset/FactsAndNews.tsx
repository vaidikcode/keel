import { Icon } from "@/components/ui/Icon";
import { sourceHost, type AssetResponse } from "@/lib/dashboard/api";

export function FactsAndNews({ details, officialUrl, historySource }: { details: AssetResponse["details"]; officialUrl: string; historySource: string }) {
  const facts = [
    ...details.secFacts.map((f) => ({ key: f.url + f.text, label: f.label, text: f.text, asOf: f.asOf, url: f.url })),
    ...details.facts.map((f) => ({ key: f.url, label: "From the web", text: `${f.title}. ${f.snippet}`, asOf: f.publishedAt ?? "", url: f.url })),
  ];
  return (
    <section className="asset-card" id="facts" aria-labelledby="facts-heading">
      <div className="section-head">
        <div>
          <h2 id="facts-heading">Facts and news</h2>
          <p className="fine-print">Filings are the source. Headlines are claims. Both link to where they came from.</p>
        </div>
      </div>
      <h3 className="label">FACTS</h3>
      {facts.length === 0 ? (
        <p className="fine-print">No filings or web facts were found for this one yet.</p>
      ) : (
        <ul className="fact-list">
          {facts.slice(0, 5).map((f) => (
            <li key={f.key}>
              <a href={f.url} target="_blank" rel="noreferrer">
                <strong>{f.label}</strong>
                <span>{f.text}</span>
                <small>
                  {f.asOf ? `${f.asOf} · ` : ""}
                  {sourceHost(f.url)} <Icon name="external" size={11} />
                </small>
              </a>
            </li>
          ))}
        </ul>
      )}
      <h3 className="label">RECENT NEWS</h3>
      {details.news.length === 0 ? (
        <p className="fine-print">No recent articles came through.</p>
      ) : (
        <ul className="news-list">
          {details.news.slice(0, 4).map((n) => (
            <li key={n.url}>
              <a href={n.url} target="_blank" rel="noreferrer">
                <span>{n.headline}</span>
                <small>
                  {n.source}
                  {n.asOf ? ` · ${n.asOf}` : ""}
                </small>
              </a>
            </li>
          ))}
        </ul>
      )}
      {details.news.length > 4 && (
        <details className="asset-details">
          <summary>More articles</summary>
          <ul className="news-list">
            {details.news.slice(4).map((n) => (
              <li key={n.url}>
                <a href={n.url} target="_blank" rel="noreferrer">
                  <span>{n.headline}</span>
                  <small>{n.source}</small>
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="fine-print sources-line">
        <a href={officialUrl} target="_blank" rel="noreferrer">
          Official page <Icon name="external" size={11} />
        </a>
        <a href={historySource} target="_blank" rel="noreferrer">
          Price history <Icon name="external" size={11} />
        </a>
      </p>
    </section>
  );
}
