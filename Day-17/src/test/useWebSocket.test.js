// ==============================================================================
// DAY 17: useWebSocket HOOK UNIT & RECONNECTION TEST SUITE
// ==============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWebSocket, ReadyState } from "../hooks/useWebSocket";

class MockWebSocket {
  static instances = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.send = vi.fn();
    this.close = vi.fn((code = 1000, reason = "") => {
      this.readyState = 3; // CLOSED
      if (this.onclose) this.onclose({ code, reason });
    });

    MockWebSocket.instances.push(this);
  }

  // Test helper to simulate connection established
  triggerOpen() {
    this.readyState = 1; // OPEN
    if (this.onopen) this.onopen({});
  }

  // Test helper to simulate incoming message
  triggerMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: typeof data === "string" ? data : JSON.stringify(data) });
    }
  }

  // Test helper to simulate connection failure
  triggerError(err) {
    if (this.onerror) this.onerror(err);
  }

  // Test helper to simulate connection drop (non-1000)
  triggerDrop(code = 1006) {
    this.readyState = 3;
    if (this.onclose) this.onclose({ code, reason: "Connection lost" });
  }
}

describe("Day 17 - useWebSocket Hook & Exponential Backoff Reconnection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("initializes in CONNECTING state and reaches OPEN on socket connect", () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://127.0.0.1:8000/ws/live", { autoConnect: true })
    );

    expect(result.current.status).toBe(ReadyState.CONNECTING);
    expect(result.current.isConnected).toBe(false);

    // Simulate socket open
    act(() => {
      MockWebSocket.instances[0].triggerOpen();
    });

    expect(result.current.status).toBe(ReadyState.OPEN);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.reconnectAttempts).toBe(0);
  });

  it("serializes and transmits payloads via sendMessage when OPEN", () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://127.0.0.1:8000/ws/live")
    );

    act(() => {
      MockWebSocket.instances[0].triggerOpen();
    });

    const testPayload = { type: "CHAT_MESSAGE", text: "Hello support" };

    let success;
    act(() => {
      success = result.current.sendMessage(testPayload);
    });

    expect(success).toBe(true);
    expect(MockWebSocket.instances[0].send).toHaveBeenCalledWith(
      JSON.stringify(testPayload)
    );
  });

  it("receives and deserializes JSON messages reactively", () => {
    const onMessageMock = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket("ws://127.0.0.1:8000/ws/live", { onMessage: onMessageMock })
    );

    act(() => {
      MockWebSocket.instances[0].triggerOpen();
    });

    const incomingData = {
      type: "ORDER_STATUS_UPDATE",
      order_id: 101,
      status: "SHIPPED",
    };

    act(() => {
      MockWebSocket.instances[0].triggerMessage(incomingData);
    });

    expect(result.current.lastMessage).toEqual(incomingData);
    expect(result.current.messages).toContainEqual(incomingData);
    expect(onMessageMock).toHaveBeenCalledWith(incomingData, expect.anything());
  });

  it("triggers exponential backoff reconnection on unexpected connection interruption", () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://127.0.0.1:8000/ws/live", {
        reconnect: true,
        baseDelay: 1000,
        maxReconnectAttempts: 3,
      })
    );

    act(() => {
      MockWebSocket.instances[0].triggerOpen();
    });

    expect(result.current.status).toBe(ReadyState.OPEN);

    // Simulate unexpected network disruption (code 1006)
    act(() => {
      MockWebSocket.instances[0].triggerDrop(1006);
    });

    expect(result.current.status).toBe(ReadyState.RECONNECTING);
    expect(result.current.reconnectAttempts).toBe(1);

    // Fast-forward 1000ms timer
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Second socket instance should have been instantiated
    expect(MockWebSocket.instances.length).toBe(2);
  });

  it("disconnect() cleanly closes connection without triggering auto-reconnect", () => {
    const { result } = renderHook(() =>
      useWebSocket("ws://127.0.0.1:8000/ws/live", { reconnect: true })
    );

    act(() => {
      MockWebSocket.instances[0].triggerOpen();
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.status).toBe(ReadyState.CLOSED);
    expect(result.current.isConnected).toBe(false);

    // Advance timers to verify no reconnect happens
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(MockWebSocket.instances.length).toBe(1);
  });
});
