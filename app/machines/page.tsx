import { LayoutApp } from "@/app/components/layout/layout-app";
import { MachinesContent } from "@/app/components/machines/machines-content";

export const dynamic = "force-dynamic";

export default function MachinesPage() {
  return (
    <LayoutApp>
      <MachinesContent />
    </LayoutApp>
  );
}