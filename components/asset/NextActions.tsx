import type { AssetResponse } from "@/lib/dashboard/api";

export function NextActions({ items }: { items: AssetResponse["actionItems"] }) {
  return (
    <section className="asset-card" id="next" aria-labelledby="next-heading">
      <h2 id="next-heading">What you can do next</h2>
      <ol className="next-actions">
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
          </li>
        ))}
      </ol>
      <p className="fine-print">Ideas to explore, not instructions to buy or sell.</p>
    </section>
  );
}
