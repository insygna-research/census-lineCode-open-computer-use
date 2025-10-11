/**
 * WebSocket Ready State Constants
 * These match the standard WebSocket readyState values
 */
export const WS_READY_STATE = {
  CONNECTING: 0,  // Socket has been created. The connection is not yet open.
  OPEN: 1,        // The connection is open and ready to communicate.
  CLOSING: 2,     // The connection is in the process of closing.
  CLOSED: 3       // The connection is closed or couldn't be opened.
} as const;

export type WebSocketReadyState = typeof WS_READY_STATE[keyof typeof WS_READY_STATE];

/**
 * Check if a WebSocket is in a usable state
 */
export function isWebSocketOpen(ws: { readyState: number } | undefined): boolean {
  return ws?.readyState === WS_READY_STATE.OPEN;
}

/**
 * Check if a WebSocket is closed or closing
 */
export function isWebSocketClosed(ws: { readyState: number } | undefined): boolean {
  return !ws || ws.readyState === WS_READY_STATE.CLOSING || ws.readyState === WS_READY_STATE.CLOSED;
}

/**
 * WebSocket connection configuration
 */
export const WS_CONFIG = {
  // Connection timeouts
  CONNECT_TIMEOUT: 10000,      // 10 seconds for initial connection
  COMMAND_TIMEOUT: 30000,       // 30 seconds for command execution
  PING_INTERVAL: 30000,         // 30 seconds between pings
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY: 2000,       // 2 seconds base delay
  RETRY_MAX_DELAY: 30000,       // 30 seconds max delay
  
  // Agent configuration
  AGENT_PORT: 8080,
  AGENT_PATH: '/',
} as const;