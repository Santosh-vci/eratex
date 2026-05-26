import { BomTechnicalPage, MaterialReadinessPanel } from "@/features/technical/TechnicalPages";

export default function Page() {
  return (
    <div className="space-y-5">
      <BomTechnicalPage />
      <MaterialReadinessPanel />
    </div>
  );
}

