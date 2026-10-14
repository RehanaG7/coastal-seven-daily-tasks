export type WebSocketStatus =
  | "CONNECTING"
  | "OPEN"
  | "CLOSING"
  | "CLOSED"
  | "RECONNECTING";

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  heartbeatInterval?: number;
  onOpen?: (event: WebSocketEventMap["open"]) => void;
  onClose?: (event: WebSocketEventMap["close"]) => void;
  onError?: (event: WebSocketEventMap["error"]) => void;
  onMessage?: (data: any, event: WebSocketEventMap["message"]) => void;
}

export interface UseWebSocketResult {
  status: WebSocketStatus;
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastMessage: any;
  messages: any[];
  sendMessage: (data: any) => boolean;
  connect: () => void;
  disconnect: () => void;
  clearMessages: () => void;
}

export declare const ReadyState: Record<string, WebSocketStatus>;

export declare function useWebSocket(
  url: string,
  options?: UseWebSocketOptions
): UseWebSocketResult;

export default useWebSocket;
