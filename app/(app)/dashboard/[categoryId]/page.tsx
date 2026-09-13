import { notFound } from "next/navigation";
import { CategoryDashboard } from "@/components/dashboard/CategoryDashboard";
import { KindDashboard } from "@/components/dashboard/KindDashboard";
import { OverviewDashboard } from "@/components/dashboard/OverviewDashboard";
import { PortfolioDashboard } from "@/components/dashboard/PortfolioDashboard";
import { isCategoryId } from "@/lib/market/categories";
import { isKindView } from "@/lib/market/navGroups";

/**
 * One segment serves the five nav destinations and the seven category ids that
 * cards still deep-link to. "crypto" is both a kind and a category — as a route
 * it means the kind, whose page includes that category.
 */
export default async function DashboardSegment({ params }: PageProps<"/dashboard/[categoryId]">) {
  const { categoryId } = await params;
  if (isKindView(categoryId)) return <KindDashboard kind={categoryId} />;
  if (categoryId === "overview") return <OverviewDashboard />;
  if (categoryId === "portfolio") return <PortfolioDashboard />;
  if (isCategoryId(categoryId)) return <CategoryDashboard categoryId={categoryId} />;
  notFound();
}
