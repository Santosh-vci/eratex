import { OperationBulletinsPage, WashRouteStatusPanel } from "@/features/technical/TechnicalPages";

export default function Page() {
  return (
    <div className="space-y-5">
      <OperationBulletinsPage />
      <WashRouteStatusPanel />
    </div>
  );
}

