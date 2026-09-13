"use client";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Icon } from "@/components/ui/Icon";
import { CATEGORIES, type CategoryId } from "@/lib/market/categories";
import {
  NAV_ICON,
  NAV_LABEL,
  NAV_VIEWS,
  viewForCategory,
  type NavView,
} from "@/lib/market/navGroups";
import { useKeel } from "@/components/keel/KeelContext";
import { TabAnalyzer } from "@/components/dashboard/TabAnalyzer";
import { LogOutButton } from "@/components/auth/AuthControls";

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

export function CategorySidebar({
  activeId,
  activeTab = null,
}: {
  activeId: CategoryId | NavView | null;
  activeTab?: string | null;
}) {
  const keel = useKeel();
  const { user } = useUser();
  const activeView: string | null =
    activeId && CATEGORIES.some((c) => c.id === activeId)
      ? viewForCategory(activeId as CategoryId)
      : activeId;
  return (
    <aside className="app-sidebar">
      <Link href="/dashboard" className="wordmark" aria-label="Back to dashboard">
        <span className="brand-mark">k.</span>keel<span className="brand-dot">●</span>
      </Link>
      <p className="sidebar-caption">Ranked for your answers, explained in plain words.</p>
      <nav aria-label="Sections">
        <ul>
          {NAV_VIEWS.map((view) => (
            <li key={view}>
              <Link
                href={keel.withDemo(`/dashboard/${view}`)}
                aria-current={activeView === view ? "page" : undefined}
              >
                <Icon name={NAV_ICON[view]} size={18} />
                <span>{NAV_LABEL[view]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {keel.analyzedAssets.length > 0 && (
        <nav aria-label="Analysed tabs" className="sidebar-tabs">
          <p className="sidebar-section-title">Analysed tabs</p>
          <ul>
            {keel.analyzedAssets.slice(0, 6).map((asset) => (
              <li key={asset.id}>
                <Link
                  href={keel.withDemo(`/dashboard/tab/${encodeURIComponent(asset.id)}`)}
                  aria-current={activeTab === asset.id ? "page" : undefined}
                  title={asset.name}
                >
                  <Icon name="link" size={16} />
                  <span>{asset.ticker}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="sidebar-meta">
        <span>
          <Icon name="bookmark" size={14} /> Saved · {keel.savedAssets.length}
        </span>
      </div>
      {/* The way in to a new analysis is the last thing on the panel, so it
          sits beside the tabs it produces rather than in a page header. */}
      <div className="sidebar-analyze">
        <TabAnalyzer />
      </div>

      {keel.demo ? (
        <div className="sidebar-account">
          <div className="sidebar-bottom">
            <span className="tiny-avatar" aria-hidden="true">k</span>
            <small>Example mode</small>
          </div>
          <LogOutButton variant="sidebar" />
        </div>
      ) : (
        <div className="sidebar-account">
          <Link href="/account" className="sidebar-bottom is-link">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Clerk serves this from its own CDN.
              <img className="tiny-avatar" src={user.imageUrl} alt="" width={26} height={26} />
            ) : (
              <span className="tiny-avatar" aria-hidden="true">
                {(user?.firstName ?? user?.username ?? "k").slice(0, 1).toLowerCase()}
              </span>
            )}
            <small>
              <strong>{user?.firstName ?? user?.username ?? "Your account"}</strong>
              Answers and sign-in
            </small>
            <Icon name="chevron" size={14} />
          </Link>
          <LogOutButton variant="sidebar" />
        </div>
      )}
    </aside>
  );
}
