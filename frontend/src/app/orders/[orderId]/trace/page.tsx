import { OrderTracePage } from "@/features/pre-production/PreProductionPages";

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <OrderTracePage orderId={orderId} />;
}
