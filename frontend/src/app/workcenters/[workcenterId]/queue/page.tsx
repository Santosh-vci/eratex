import { WorkcenterQueuePage } from "@/features/operations/Eos04Pages";

export default async function QueuePage({
  params,
}: {
  params: Promise<{ workcenterId: string }>;
}) {
  const { workcenterId } = await params;
  return <WorkcenterQueuePage workcenterId={workcenterId} />;
}
