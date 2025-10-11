"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Maximize2, Minimize2, RefreshCw, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import type { UserMachine, MachineSession } from "@/types/machines.types";

interface NoVNCViewerProps {
  machine: UserMachine;
  session: MachineSession;
}

export function NoVNCViewer({ machine, session }: NoVNCViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [fullscreen, setFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  // Construct the noVNC URL
  const getNoVNCUrl = () => {
    if (!machine.publicIpAddress) {
      return null;
    }

    // Use the public IP and websocket port for noVNC
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const websocketPort = machine.websocketPort || 6080;
    
    // Build noVNC URL with parameters
    const params = new URLSearchParams({
      autoconnect: '1',
      reconnect: '1',
      reconnect_delay: '5',
      resize: 'scale',
      shared: '1',
      view_only: (session.sessionType as string) === 'ai_controlled' ? '1' : '0',
      show_dot: '1',
      path: 'websockify',
      encrypt: '0',
      host: machine.publicIpAddress,
      port: websocketPort.toString(),
      password: machine.vncPassword || '',
    });

    return `${protocol}//${machine.publicIpAddress}:${websocketPort}/vnc.html?${params.toString()}`;
  };

  const vncUrl = getNoVNCUrl();

  useEffect(() => {
    if (!vncUrl) {
      setStatus('error');
      return;
    }

    // Set a timeout to update status if iframe loads successfully
    const timer = setTimeout(() => {
      if (status === 'connecting') {
        setStatus('connected');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [vncUrl, status]);

  const handleFullscreen = async () => {
    const element = iframeRef.current?.parentElement;
    if (!element) return;

    try {
      if (!fullscreen) {
        await element.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current && vncUrl) {
      setStatus('connecting');
      iframeRef.current.src = vncUrl;
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!machine.publicIpAddress) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Card className="max-w-md p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Machine IP address not available. Please wait for the machine to fully start.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-gray-900">
      {/* Info Banner */}
      {showInfo && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <Alert className="bg-background/95 backdrop-blur">
            <Info className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-medium">Remote Desktop Connection</span>
                <span className="ml-2 text-sm">
                  {(session.sessionType as string) === 'ai_controlled' 
                    ? 'View-only mode (AI controlled)' 
                    : 'Full control enabled - Click and type to interact'}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowInfo(false)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Control Bar */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleRefresh}
          className="bg-background/80 backdrop-blur"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleFullscreen}
          className="bg-background/80 backdrop-blur"
        >
          {fullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* VNC iFrame */}
      {vncUrl && (
        <iframe
          ref={iframeRef}
          src={vncUrl}
          className="w-full h-full border-0"
          allow="fullscreen; clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-pointer-lock"
          onLoad={() => {
            console.log('noVNC iframe loaded');
            setStatus('connected');
          }}
          onError={() => {
            console.error('noVNC iframe error');
            setStatus('error');
          }}
        />
      )}

      {/* Loading Overlay */}
      {status === 'connecting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Connecting to remote desktop...</p>
            <p className="text-xs text-muted-foreground mt-2">
              Make sure the machine is running and VNC is enabled
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur z-10">
          <Card className="max-w-md p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to connect to the remote desktop
              </AlertDescription>
            </Alert>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Connection details:
              </p>
              <code className="block text-xs bg-muted p-2 rounded">
                {machine.publicIpAddress}:{machine.websocketPort || 6080}
              </code>
              <Button onClick={handleRefresh} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Alternative Direct Connection Info */}
      <div className="absolute bottom-4 left-4 z-20">
        <details className="bg-background/80 backdrop-blur p-2 rounded text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            Direct VNC Connection
          </summary>
          <div className="mt-2 space-y-1 text-muted-foreground">
            <p>VNC Server: {machine.publicIpAddress}:{machine.vncPort || 5901}</p>
            <p>Password: {machine.vncPassword}</p>
            <p>Use any VNC client to connect directly</p>
          </div>
        </details>
      </div>
    </div>
  );
}