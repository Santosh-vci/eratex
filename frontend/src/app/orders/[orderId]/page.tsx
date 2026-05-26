import { OrderDetailPage } from "@/features/pre-production/PreProductionPages";

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <OrderDetailPage orderId={orderId} />;
}
