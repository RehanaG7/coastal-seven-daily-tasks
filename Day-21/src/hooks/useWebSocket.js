// ==============================================================================
// DAY 17: PRODUCTION-GRADE useWebSocket CUSTOM HOOK
// Features:
// - Automatic Connection & Cleanup on Unmount
// - Reconnection with Exponential Backoff
// - Heartbeat Keepalive (Ping / Pong)
// - Typed JSON Serialization & Deserialization
// - Reconnect Attempt State for Real-Time UI Badges
// ==============================================================================

import { useState, useEffect, useRef, useCallback } from "react";

export const ReadyState = {
  CONNECTING: "CONNECTING",
  OPEN: "OPEN",
  CLOSING: "CLOSING",
  CLOSED: "CLOSED",
  RECONNECTING: "RECONNECTING",
};

/**
 * Custom React hook for robust WebSocket communication with exponential backoff.
 * 
 * @param {string} url - Target WebSocket endpoint (e.g. ws://127.0.0.1:8000/ws/live)
 * @param {object} options - Configuration options
 * @returns {object} WebSocket controller and reactive state
 */
export function useWebSocket(url, options = {}) {
  const {
    autoConnect = true,
    reconnect = true,
    maxReconnectAttempts = 5,
    baseDelay = 1000,
    maxDelay = 16000,
    heartbeatInterval = 30000,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options;

  const [status, setStatus] = useState(ReadyState.CLOSED);
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const isManuallyClosedRef = useRef(false);

  // Store callbacks in refs to avoid reconnection loops when parent re-renders
  const callbacksRef = useRef({ onOpen, onClose, onError, onMessage });
  useEffect(() => {
    callbacksRef.current = { onOpen, onClose, onError, onMessage };
  }, [onOpen, onClose, onError, onMessage]);

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Connection Handler
  const connect = useCallback(() => {
    if (!url || typeof window === "undefined" || typeof WebSocket === "undefined") return;

    // Close any previous instance cleanly
    if (socketRef.current) {
      try {
        socketRef.current.close(1000, "Reconnecting");
      } catch (e) {
        // Ignored
      }
    }

    clearTimers();
    isManuallyClosedRef.current = false;
    setStatus(ReadyState.CONNECTING);

    // Append JWT token if available in storage and not in query
    let resolvedUrl = url;
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    if (token && !resolvedUrl.includes("token=")) {
      const sep = resolvedUrl.includes("?") ? "&" : "?";
      resolvedUrl = `${resolvedUrl}${sep}token=${encodeURIComponent(token)}`;
    }

    try {
      const ws = new WebSocket(resolvedUrl);
      socketRef.current = ws;

      ws.onopen = (event) => {
        setStatus(ReadyState.OPEN);
        setReconnectAttempts(0);

        // Start heartbeat keep-alive
        if (heartbeatInterval > 0) {
          heartbeatIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              try {
                ws.send(JSON.stringify({ type: "PING", timestamp: Date.now() }));
              } catch (e) {
                // Heartbeat failed
              }
            }
          }, heartbeatInterval);
        }

        if (callbacksRef.current.onOpen) {
          callbacksRef.current.onOpen(event);
        }
      };

      ws.onmessage = (event) => {
        let parsedData = event.data;
        try {
          parsedData = JSON.parse(event.data);
        } catch (e) {
          // If not JSON, leave as raw string
        }

        // Ignore pong responses from heartbeat
        if (parsedData && parsedData.type === "PONG") {
          return;
        }

        setLastMessage(parsedData);
        setMessages((prev) => [...prev.slice(-49), parsedData]); // Keep last 50 messages

        if (callbacksRef.current.onMessage) {
          callbacksRef.current.onMessage(parsedData, event);
        }
      };

      ws.onerror = (event) => {
        if (callbacksRef.current.onError) {
          callbacksRef.current.onError(event);
        }
      };

      ws.onclose = (event) => {
        clearTimers();
        setStatus(ReadyState.CLOSED);

        if (callbacksRef.current.onClose) {
          callbacksRef.current.onClose(event);
        }

        // Exponential backoff automatic reconnection
        if (
          !isManuallyClosedRef.current &&
          reconnect &&
          event.code !== 1000
        ) {
          setReconnectAttempts((prev) => {
            const nextAttempt = prev + 1;
            if (nextAttempt <= maxReconnectAttempts) {
              // Exponential backoff calculation: min(maxDelay, baseDelay * 2^(attempt - 1))
              const delay = Math.min(
                maxDelay,
                baseDelay * Math.pow(2, nextAttempt - 1)
              );

              setStatus(ReadyState.RECONNECTING);
              reconnectTimeoutRef.current = setTimeout(() => {
                connect();
              }, delay);

              return nextAttempt;
            } else {
              setStatus(ReadyState.CLOSED);
              return prev;
            }
          });
        }
      };
    } catch (err) {
      setStatus(ReadyState.CLOSED);
      if (callbacksRef.current.onError) {
        callbacksRef.current.onError(err);
      }
    }
  }, [url, reconnect, maxReconnectAttempts, baseDelay, maxDelay, heartbeatInterval, clearTimers]);

  // Clean Disconnect Handler
  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    clearTimers();
    setReconnectAttempts(0);
    if (socketRef.current) {
      try {
        socketRef.current.close(1000, "Client disconnected");
      } catch (e) {
        // Ignored
      }
      socketRef.current = null;
    }
    setStatus(ReadyState.CLOSED);
  }, [clearTimers]);

  // Safe Message Dispatcher
  const sendMessage = useCallback((data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = typeof data === "string" ? data : JSON.stringify(data);
      socketRef.current.send(payload);
      return true;
    }
    return false;
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastMessage(null);
  }, []);

  // LifeCycle Effect
  useEffect(() => {
    if (autoConnect && url) {
      connect();
    }
    return () => {
      isManuallyClosedRef.current = true;
      clearTimers();
      if (socketRef.current) {
        const ws = socketRef.current;
        socketRef.current = null;
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1000, "Component unmounted");
          } else if (ws.readyState === WebSocket.CONNECTING) {
            ws.onclose = null;
            ws.onerror = null;
            ws.onmessage = null;
            ws.onopen = () => {
              try {
                ws.close(1000, "Component unmounted after handshake");
              } catch (e) {}
            };
          }
        } catch (e) {
          // Ignored
        }
      }
    };
  }, [autoConnect, url, connect, clearTimers]);

  return {
    status,
    isConnected: status === ReadyState.OPEN,
    isReconnecting: status === ReadyState.RECONNECTING,
    reconnectAttempts,
    lastMessage,
    messages,
    sendMessage,
    connect,
    disconnect,
    clearMessages,
  };
}

export default useWebSocket;
