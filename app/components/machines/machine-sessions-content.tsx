"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Loader2, AlertCircle, RefreshCw, Monitor, Clock, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MachineLayout } from "./machine-layout";
import { SessionsList } from "./sessions-list";
import type { UserMachine, MachineSession } from "@/types/machines.types";

interface MachineSessionsContentProps {
  machineId: string;
}

export function MachineSessionsContent({ machineId }: MachineSessionsContentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [machine, setMachine] = useState<UserMachine | null>(null);
  const [sessions, setSessions] = useState<MachineSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [machineId]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/machines/${machineId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Machine not found");
        } else if (response.status === 401) {
          router.push("/auth");
        } else {
          setError("Failed to load machine");
        }
        return;
      }

      const data = await response.json();
      setMachine(data.machine);
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Error fetching machine:", error);
      setError("Failed to load machine");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MachineLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MachineLayout>
    );
  }

  if (error || !machine) {
    return (
      <MachineLayout>
        <div className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Machine not found"}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => router.push("/machines")}
            className="mt-4"
          >
            Back to Machines
          </Button>
        </div>
      </MachineLayout>
    );
  }

  // Calculate session statistics
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => !s.endedAt).length;
  const aiSessions = sessions.filter(s => (s.sessionType as string) === "ai_controlled").length;
  const totalDuration = sessions.reduce((sum, session) => {
    const start = new Date(session.startedAt);
    const end = session.endedAt ? new Date(session.endedAt) : new Date();
    return sum + (end.getTime() - start.getTime());
  }, 0);
  const totalHours = totalDuration / (1000 * 60 * 60);

  return (
    <MachineLayout
      machineId={machine.id}
      machineName={machine.displayName}
      machineStatus={machine.status}
    >
      <div className="py-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Session History</h1>
          <p className="text-muted-foreground mt-1">
            View and manage sessions for {machine.displayName}
          </p>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold">{totalSessions}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-green-500 rounded-full animate-pulse" />
                <span className="text-2xl font-bold">{activeSessions}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                AI Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-500" />
                <span className="text-2xl font-bold">{aiSessions}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-2xl font-bold">{totalHours.toFixed(1)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push(`/machines/${machineId}`)}
            className="gap-2"
          >
            <Monitor className="h-4 w-4" />
            View Machine
          </Button>
          <Button
            variant="outline"
            onClick={fetchData}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Sessions List */}
        <SessionsList sessions={sessions} onRefresh={fetchData} />
      </div>
    </MachineLayout>
  );
}