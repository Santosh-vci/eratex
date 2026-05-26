import { StyleTechnicalDetailPage } from "@/features/technical/TechnicalPages";

export default async function Page({ params }: { params: Promise<{ styleId: string }> }) {
  const { styleId } = await params;
  return <StyleTechnicalDetailPage styleId={styleId} />;
}
