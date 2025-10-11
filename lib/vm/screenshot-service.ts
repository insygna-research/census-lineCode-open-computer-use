import type { VMScreenshot, VMContext, VMActionResponse } from "@/types/vm-context.types";
import type { UserMachine } from "@/types/machines.types";

/**
 * Service for capturing screenshots from virtual machines
 */
export class VMScreenshotService {
  private static instance: VMScreenshotService;
  private activeConnections: Map<string, WebSocket> = new Map();

  private constructor() {}

  static getInstance(): VMScreenshotService {
    if (!VMScreenshotService.instance) {
      VMScreenshotService.instance = new VMScreenshotService();
    }
    return VMScreenshotService.instance;
  }

  /**
   * Capture a screenshot from a virtual machine
   */
  async captureScreenshot(
    machineId: string,
    sessionId?: string
  ): Promise<VMScreenshot | null> {
    try {
      const response = await fetch(`/api/machines/${machineId}/screenshot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to capture screenshot:", error);
        return null;
      }

      const data = await response.json();
      return data.screenshot;
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      return null;
    }
  }

  /**
   * Create VM context with screenshot for chat integration
   */
  async createVMContext(
    machine: UserMachine,
    includeScreenshot: boolean = true,
    sessionId?: string
  ): Promise<VMContext> {
    const context: VMContext = {
      machineId: machine.id,
      machineName: machine.displayName,
      status: machine.status === "running" ? "running" : 
              machine.status === "starting" ? "starting" :
              machine.status === "stopped" ? "stopped" : "error",
      sessionId,
      connectionDetails: machine.publicIpAddress ? {
        publicIp: machine.publicIpAddress,
        vncPort: machine.vncPort,
        websocketUrl: `ws://${machine.publicIpAddress}:8080`, // AI agent port
        websocketPort: 8080, // AI agent always runs on 8080
      } : undefined,
    };

    if (includeScreenshot && machine.status === "running") {
      const screenshot = await this.captureScreenshot(machine.id, sessionId);
      if (screenshot) {
        context.screenshot = screenshot;
      }
    }

    return context;
  }

  /**
   * Establish WebSocket connection to VM agent
   */
  async connectToVM(
    machineId: string,
    wsToken: string,
    publicIp?: string,
    agentPort?: number,
    onMessage?: (data: any) => void
  ): Promise<WebSocket | null> {
    try {
      // Check if we already have an active connection
      const existing = this.activeConnections.get(machineId);
      if (existing && existing.readyState === WebSocket.OPEN) {
        return existing;
      }

      // Connect directly to the agent if we have the IP and port
      let wsUrl: string;
      if (publicIp && agentPort) {
        // Direct connection to AI agent
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        wsUrl = `${protocol}//${publicIp}:${agentPort}`;
      } else {
        // Proxy through our API
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        wsUrl = `${protocol}//${window.location.host}/api/machines/${machineId}/agent?token=${wsToken}`;
      }
      
      const ws = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        ws.onopen = () => {
          console.log(`WebSocket connected to VM ${machineId}`);
          this.activeConnections.set(machineId, ws);
          resolve(ws);
        };

        ws.onerror = (error) => {
          console.error(`WebSocket error for VM ${machineId}:`, error);
          reject(error);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (onMessage) {
              onMessage(data);
            }
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        ws.onclose = () => {
          console.log(`WebSocket disconnected from VM ${machineId}`);
          this.activeConnections.delete(machineId);
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close();
            reject(new Error("WebSocket connection timeout"));
          }
        }, 10000);
      });
    } catch (error) {
      console.error("Failed to connect to VM:", error);
      return null;
    }
  }

  /**
   * Send action to VM via WebSocket
   */
  async sendVMAction(
    machineId: string,
    action: string,
    parameters?: any
  ): Promise<VMActionResponse> {
    const ws = this.activeConnections.get(machineId);
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return {
        success: false,
        action,
        error: "WebSocket not connected",
        timestamp: new Date().toISOString(),
      };
    }

    return new Promise((resolve) => {
      const messageId = `msg-${Date.now()}`;
      
      const handleResponse = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.messageId === messageId) {
            ws.removeEventListener("message", handleResponse);
            resolve({
              success: data.success || false,
              action,
              result: data.result,
              screenshot: data.screenshot,
              error: data.error,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error("Failed to parse action response:", error);
        }
      };

      ws.addEventListener("message", handleResponse);
      
      ws.send(JSON.stringify({
        type: "action",
        messageId,
        action,
        parameters,
        timestamp: new Date().toISOString(),
      }));

      // Timeout after 30 seconds
      setTimeout(() => {
        ws.removeEventListener("message", handleResponse);
        resolve({
          success: false,
          action,
          error: "Action timeout",
          timestamp: new Date().toISOString(),
        });
      }, 30000);
    });
  }

  /**
   * Disconnect from a VM
   */
  disconnectFromVM(machineId: string): void {
    const ws = this.activeConnections.get(machineId);
    if (ws) {
      ws.close();
      this.activeConnections.delete(machineId);
    }
  }

  /**
   * Disconnect from all VMs
   */
  disconnectAll(): void {
    this.activeConnections.forEach((ws) => ws.close());
    this.activeConnections.clear();
  }

  /**
   * Check if connected to a VM
   */
  isConnected(machineId: string): boolean {
    const ws = this.activeConnections.get(machineId);
    return ws ? ws.readyState === WebSocket.OPEN : false;
  }
}

// Export singleton instance
export const vmScreenshotService = VMScreenshotService.getInstance();