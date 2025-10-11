"use client";

import { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Monitor, Activity, Terminal, Settings, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface MachineLayoutProps {
  children: ReactNode;
  machineId?: string;
  machineName?: string;
  machineStatus?: string;
  showBackButton?: boolean;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

export function MachineLayout({ 
  children, 
  machineId, 
  machineName,
  machineStatus,
  showBackButton = true 
}: MachineLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Build breadcrumb items based on current path
  const breadcrumbItems: BreadcrumbItem[] = [];

  // Add page-specific breadcrumb based on path
  if (pathname.includes("/sessions")) {
    breadcrumbItems.push({
      label: "Sessions",
      icon: <Activity className="h-4 w-4" />
    });
  } else if (pathname.includes("/terminal")) {
    breadcrumbItems.push({
      label: "Terminal",
      icon: <Terminal className="h-4 w-4" />
    });
  } else if (pathname.includes("/settings")) {
    breadcrumbItems.push({
      label: "Settings",
      icon: <Settings className="h-4 w-4" />
    });
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-invisible bg-transparent relative">
      {/* Header with breadcrumbs */}
      <div className="sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between min-h-[3.5rem] py-2 gap-2">
            {/* Left side - Back button with background */}
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
              <div className="bg-white dark:bg-black border rounded-lg px-2 py-1 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-auto sm:px-2 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-1">Back</span>
                </Button>

                {/* Machine name or page-specific breadcrumb */}
                {(machineName || breadcrumbItems.length > 0) && (
                  <div className="flex items-center text-xs sm:text-sm">
                    {machineName && (
                      <div className="flex items-center gap-1 sm:gap-1.5 text-foreground font-medium">
                        <Monitor className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{machineName}</span>
                      </div>
                    )}
                    {breadcrumbItems.map((item, index) => (
                      <div key={index} className="flex items-center flex-shrink-0">
                        {(machineName || index > 0) && (
                          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 mx-0.5 sm:mx-1 text-muted-foreground" />
                        )}
                        <span className="flex items-center gap-1 sm:gap-1.5 text-foreground font-medium">
                          <span className="flex-shrink-0">{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Status indicator with background */}
            {machineStatus && (
              <div className="bg-white dark:bg-black border rounded-lg px-3 py-1 flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Status:</span>
                <StatusBadge status={machineStatus} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    running: { label: "Running", className: "bg-green-500/10 text-green-500 border-green-500/20" },
    starting: { label: "Starting", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    stopping: { label: "Stopping", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    stopped: { label: "Stopped", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
    error: { label: "Error", className: "bg-red-500/10 text-red-500 border-red-500/20" },
    creating: { label: "Creating", className: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    deleting: { label: "Deleting", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.stopped;

  return (
    <div className={cn(
      "inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap",
      config.className
    )}>
      {config.label}
    </div>
  );
}