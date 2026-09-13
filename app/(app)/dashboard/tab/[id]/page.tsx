import { AnalyzedDashboard } from "@/components/dashboard/AnalyzedDashboard";

export default async function AnalyzedTabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AnalyzedDashboard id={decodeURIComponent(id)} />;
}
