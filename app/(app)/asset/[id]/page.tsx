import { AssetPage } from "@/components/asset/AssetPage";

export default async function Page({ params }: PageProps<"/asset/[id]">) {
  const { id } = await params;
  return <AssetPage id={id.toLowerCase().slice(0, 30)} />;
}
