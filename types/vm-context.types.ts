// VM Context Types for Chat Integration

export interface VMScreenshot {
  id: string;
  machineId: string;
  sessionId?: string;
  imageData: string; // Base64 encoded image
  mimeType: string;
  capturedAt: string;
  width: number;
  height: number;
  error?: string;
}

export interface VMContext {
  machineId: string;
  machineName: string;
  status: "running" | "starting" | "stopped" | "error";
  sessionId?: string;
  screenshot?: VMScreenshot;
  connectionDetails?: {
    vncUrl?: string;
    websocketUrl?: string;
    publicIp?: string;
    vncPort?: number;
    websocketPort?: number;
  };
}

export interface VMActionRequest {
  action: "screenshot" | "connect" | "execute";
  machineId: string;
  sessionId?: string;
  parameters?: Record<string, any>;
}

export interface VMActionResponse {
  success: boolean;
  action: string;
  result?: any;
  screenshot?: VMScreenshot;
  error?: string;
  timestamp: string;
}

export interface ChatWithVMContext {
  message: string;
  vmContext?: VMContext;
  includeScreenshot: boolean;
  autoExecute?: boolean;
}

export interface VMWebSocketMessage {
  type: "screenshot_request" | "screenshot_response" | "action" | "status" | "error";
  payload: any;
  timestamp: string;
}

export interface VMConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
  lastConnectedAt?: string;
  websocket?: WebSocket;
}