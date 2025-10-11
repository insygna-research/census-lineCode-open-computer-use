import { LayoutApp } from "@/app/components/layout/layout-app";
import { MachineSessionsContent } from "@/app/components/machines/machine-sessions-content";

export const dynamic = "force-dynamic";

interface MachineSessionsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MachineSessionsPage({ params }: MachineSessionsPageProps) {
  const { id } = await params;
  return (
    <LayoutApp>
      <MachineSessionsContent machineId={id} />
    </LayoutApp>
  );
}