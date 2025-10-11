"use client";

import { useState, useEffect } from "react";
import { Clock, User, Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { MachineSession } from "@/types/machines.types";

interface SessionInfoProps {
  session: MachineSession;
  onEndSession: () => void;
}

export function SessionInfo({ session, onEndSession }: SessionInfoProps) {
  const [duration, setDuration] = useState("");
  const [showEndDialog, setShowEndDialog] = useState(false);

  useEffect(() => {
    const updateDuration = () => {
      const start = new Date(session.startedAt);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setDuration(`${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [session.startedAt]);

  const handleEndSession = () => {
    setShowEndDialog(false);
    onEndSession();
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-mono">{duration}</span>
        </div>
        
        <Badge variant="outline" className="gap-1">
          {(session.sessionType as string) === "ai_controlled" ? (
            <>
              <Bot className="h-3 w-3" />
              AI Controlled
            </>
          ) : (
            <>
              <User className="h-3 w-3" />
              User Controlled
            </>
          )}
        </Badge>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowEndDialog(true)}
          className="text-destructive hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this session? Any unsaved work may be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndSession}>
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}