"use client";

import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { RefreshCw, Monitor, Activity, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MachineSession } from "@/types/machines.types";

interface SessionsListProps {
  sessions: MachineSession[];
  onRefresh: () => void;
}

export function SessionsList({ sessions, onRefresh }: SessionsListProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const getSessionDuration = (session: MachineSession) => {
    try {
      const start = new Date(session.startedAt);
      if (!isValid(start)) return "0h 0m";
      
      const end = session.endedAt ? new Date(session.endedAt) : new Date();
      if (!isValid(end)) return "0h 0m";
      
      const durationMs = end.getTime() - start.getTime();
      if (durationMs < 0) return "0h 0m";
      
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (error) {
      return "0h 0m";
    }
  };

  const getStatusBadge = (session: MachineSession) => {
    if (!session.endedAt) {
      return (
        <Badge variant="default" className="gap-1">
          <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
          Active
        </Badge>
      );
    }

    if ((session.sessionType as string) === "ai_controlled") {
      switch (session.aiCompletionStatus) {
        case "completed":
          return (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Completed
            </Badge>
          );
        case "failed":
          return (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              Failed
            </Badge>
          );
        case "cancelled":
          return (
            <Badge variant="outline" className="gap-1">
              <XCircle className="h-3 w-3" />
              Cancelled
            </Badge>
          );
        default:
          return <Badge variant="secondary">Ended</Badge>;
      }
    }

    return <Badge variant="secondary">Ended</Badge>;
  };

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
            <p className="text-muted-foreground">
              Start a session to begin using this machine
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Session History</CardTitle>
            <CardDescription>
              All sessions for this machine
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {(session.sessionType as string) === "ai_controlled" ? (
                        <>
                          <Activity className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">AI Controlled</span>
                        </>
                      ) : (
                        <>
                          <Monitor className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Manual</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {(() => {
                        try {
                          const date = new Date(session.startedAt);
                          if (!isValid(date)) {
                            return <div className="text-muted-foreground">Invalid date</div>;
                          }
                          return (
                            <>
                              <div>{format(date, "MMM d, yyyy")}</div>
                              <div className="text-muted-foreground">
                                {format(date, "h:mm a")}
                              </div>
                            </>
                          );
                        } catch (error) {
                          return <div className="text-muted-foreground">Invalid date</div>;
                        }
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{getSessionDuration(session)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">{session.commandsExecuted || 0}</span> commands
                      </div>
                      <div>
                        <span className="font-medium">{session.screenshotsCaptured || 0}</span> screenshots
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(session)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}