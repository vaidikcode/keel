"use client";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Icon } from "@/components/ui/Icon";
import { CATEGORIES, type CategoryId } from "@/lib/market/categories";
import { capacityFor } from "@/lib/market/fit";
import { selectCategories } from "@/lib/market/select";
import { useKeel } from "@/components/keel/KeelContext";

const ICONS: Record<CategoryId, "layers" | "shield" | "building" | "rocket" | "coins" | "drop" | "globe"> = {
  "broad-funds": "layers",
  "bond-cash": "shield",
  "large-stable": "building",
  "growth-tech": "rocket",
  dividend: "coins",
  crypto: "drop",
  international: "globe",
};

export function categoryIcon(id: CategoryId) {
  return ICONS[id];
}

export function CategorySidebar({ activeId }: { activeId: CategoryId | null }) {
  const keel = useKeel();
  const yours = keel.profile ? selectCategories(keel.profile, capacityFor(keel.profile)) : [];
  const ordered = [
    ...yours.map((id) => CATEGORIES.find((c) => c.id === id)!),
    ...CATEGORIES.filter((c) => !yours.includes(c.id)),
  ];
  return (
    <aside className="app-sidebar">
      <Link href="/dashboard" className="wordmark" aria-label="Back to dashboard">
        <span className="brand-mark">k.</span>keel<span className="brand-dot">●</span>
      </Link>
      <p className="sidebar-caption">Ranked for your answers, explained in plain words.</p>
      <nav aria-label="Categories">
        <ul>
          {ordered.map((c, index) => {
            const isYours = yours.includes(c.id);
            const divider = yours.length > 0 && index === yours.length;
            return (
              <li key={c.id} className={divider ? "nav-divider" : undefined}>
                <Link
                  href={keel.withDemo(`/dashboard/${c.id}`)}
                  aria-current={activeId === c.id ? "page" : undefined}
                  title={c.blurb}
                >
                  <Icon name={ICONS[c.id]} size={18} />
                  <span>{c.short}</span>
                  {isYours && <i className="nav-yours" aria-label="Chosen for you" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="sidebar-meta">
        <span>
          <Icon name="bookmark" size={14} /> Saved · {keel.savedAssets.length}
        </span>
        <Link href="/?edit=1">
          <Icon name="settings" size={14} /> Edit your answers
        </Link>
      </div>
      <div className="sidebar-bottom">
        {keel.demo ? <span className="tiny-avatar" aria-hidden="true">k</span> : <UserButton />}
        <small>{keel.demo ? "Example mode" : "Signed in"}</small>
      </div>
    </aside>
  );
}
