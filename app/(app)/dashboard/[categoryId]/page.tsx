import { notFound } from "next/navigation";
import { CategoryDashboard } from "@/components/dashboard/CategoryDashboard";
import { isCategoryId } from "@/lib/market/categories";

export default async function CategoryPage({ params }: PageProps<"/dashboard/[categoryId]">) {
  const { categoryId } = await params;
  if (!isCategoryId(categoryId)) notFound();
  return <CategoryDashboard categoryId={categoryId} />;
}
