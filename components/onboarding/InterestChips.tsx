"use client";
import { Icon } from "@/components/ui/Icon";
import { CATEGORIES, type CategoryId } from "@/lib/market/categories";
import { categoryIcon } from "@/components/app/CategorySidebar";

export function InterestChips({ value, onChange }: { value: CategoryId[]; onChange: (next: CategoryId[]) => void }) {
  const toggle = (id: CategoryId) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div className="interest-chips" role="group" aria-label="Categories you want to explore">
      {CATEGORIES.map((c) => {
        const selected = value.includes(c.id);
        const first = value[0] === c.id;
        return (
          <button
            key={c.id}
            type="button"
            className={`interest-chip ${selected ? "selected" : ""}`}
            aria-pressed={selected}
            onClick={() => toggle(c.id)}
          >
            <Icon name={categoryIcon(c.id)} size={18} />
            <span>
              <strong>{c.label}</strong>
              <small>{c.blurb}</small>
            </span>
            {first && <em className="chip-first">We’ll start here</em>}
            <span className="choice-check">{selected ? <Icon name="check" size={16} /> : null}</span>
          </button>
        );
      })}
      {value.length === 0 && (
        <button type="button" className="text-button" onClick={() => onChange(["broad-funds"])}>
          Not sure? Start with broad-market funds <Icon name="chevron" size={14} />
        </button>
      )}
    </div>
  );
}
