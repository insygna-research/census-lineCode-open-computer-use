"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Monitor, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { UserMachine, MachineSession } from "@/types/machines.types";

// Dynamically import viewers to avoid SSR issues
const NoVNCViewer = dynamic(
  () => import("./novnc-viewer").then(mod => ({ default: mod.NoVNCViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading remote desktop viewer...</p>
        </div>
      </div>
    ),
  }
);

const SimpleVNCViewer = dynamic(
  () => import("./simple-vnc-viewer").then(mod => ({ default: mod.SimpleVNCViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    ),
  }
);

interface MachineViewerProps {
  machine: UserMachine;
  session: MachineSession;
}

export function MachineViewer({ machine, session }: MachineViewerProps) {
  const [viewMode, setViewMode] = useState<'simple' | 'embedded'>('simple');

  return (
    <div className="h-full flex flex-col">
      {/* Viewer Mode Toggle */}
      <div className="border-b bg-background/95 backdrop-blur p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            <span className="font-medium">Remote Desktop</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'simple' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('simple')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              External Window
            </Button>
            <Button
              variant={viewMode === 'embedded' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('embedded')}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Embedded View
            </Button>
          </div>
        </div>
      </div>

      {/* Viewer Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'simple' ? (
          <SimpleVNCViewer machine={machine} session={session} />
        ) : (
          <NoVNCViewer machine={machine} session={session} />
        )}
      </div>
    </div>
  );
}