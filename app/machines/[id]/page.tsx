import { LayoutApp } from "@/app/components/layout/layout-app";
import { MachineDetailContent } from "@/app/components/machines/machine-detail-content";

export const dynamic = "force-dynamic";

interface MachineDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MachineDetailPage({ params }: MachineDetailPageProps) {
  const { id } = await params;
  return (
    <LayoutApp>
      <MachineDetailContent machineId={id} />
    </LayoutApp>
  );
}