import { RoutingBuilderPage } from "@/features/technical/TechnicalPages";

export default async function Page({ params }: { params: Promise<{ bulletinId: string }> }) {
  const { bulletinId } = await params;
  return <RoutingBuilderPage bulletinId={bulletinId} />;
}
