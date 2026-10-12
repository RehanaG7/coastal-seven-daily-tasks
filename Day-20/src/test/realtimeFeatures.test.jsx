// ==============================================================================
// DAY 17: REAL-TIME NOTIFICATIONS, LIVE CHAT & JWT INTERCEPTOR TEST SUITE
// ==============================================================================

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import NotificationsPanel from "../components/NotificationsPanel";
import LiveChatModal from "../components/LiveChatModal";
import { apiClient } from "../api/apiClient";
import { useNotificationStore } from "../store/useStore";

describe("Day 17 - Real-Time Notifications Panel", () => {
  beforeEach(() => {
    localStorage.clear();
    useNotificationStore.setState({
      notifications: [
        {
          id: 1,
          title: "Welcome to R-Mart Real-Time!",
          message: "WebSocket live order tracking and support chat active.",
          category: "promo",
          is_read: 0,
          timestamp: "Just now",
        },
        {
          id: 2,
          title: "Order Fulfillment Stream",
          message: "Celery worker pool operational with Redis pub/sub.",
          category: "order",
          is_read: 0,
          timestamp: "5m ago",
        },
      ],
    });
  });

  it("renders notifications drawer when isOpen is true", () => {
    render(<NotificationsPanel isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId("notifications-panel")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Welcome to R-Mart Real-Time!")).toBeInTheDocument();
  });

  it("filters notifications by categories (Orders vs Promos)", () => {
    render(<NotificationsPanel isOpen={true} onClose={vi.fn()} />);

    const ordersFilterBtn = screen.getByText("Orders");
    fireEvent.click(ordersFilterBtn);

    expect(screen.getByText("Order Fulfillment Stream")).toBeInTheDocument();
  });

  it("marks notifications as read on click", () => {
    render(<NotificationsPanel isOpen={true} onClose={vi.fn()} />);

    const unreadPill = screen.getByText(/Unread/);
    expect(unreadPill).toBeInTheDocument();

    const markAllBtn = screen.getByText("Mark all as read");
    fireEvent.click(markAllBtn);

    expect(screen.getByText("Unread (0)")).toBeInTheDocument();
  });
});

describe("Day 17 - Live Support Chat Modal", () => {
  it("renders live chat modal with input and initial concierge greeting", () => {
    render(<LiveChatModal isOpen={true} onClose={vi.fn()} roomId="general" />);

    expect(screen.getByTestId("live-chat-modal")).toBeInTheDocument();
    expect(screen.getByTestId("chat-input")).toBeInTheDocument();
    expect(screen.getByText(/R-Mart Concierge/i)).toBeInTheDocument();
  });

  it("appends customer messages and dispatches via WebSocket", () => {
    render(<LiveChatModal isOpen={true} onClose={vi.fn()} roomId="general" />);

    const input = screen.getByTestId("chat-input");
    const sendBtn = screen.getByTestId("chat-send-btn");

    fireEvent.change(input, { target: { value: "Where is my ordered mechanical keyboard?" } });
    fireEvent.click(sendBtn);

    expect(screen.getByText("Where is my ordered mechanical keyboard?")).toBeInTheDocument();
  });
});

describe("Day 17 - JWT Interceptor & Auth Flow", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("attaches Authorization Bearer token to outgoing HTTP requests", async () => {
    localStorage.setItem("token", "mock-jwt-token-2026");

    // Test request interceptor directly
    const mockConfig = { headers: {} };
    const interceptedConfig = await apiClient.interceptors.request.handlers[0].fulfilled(mockConfig);

    expect(interceptedConfig.headers.Authorization).toBe("Bearer mock-jwt-token-2026");
  });

  it("clears stored token upon 401 Unauthorized response error", async () => {
    localStorage.setItem("token", "expired-token");
    localStorage.setItem("rmart_user", JSON.stringify({ email: "user@example.com" }));

    const mockError = {
      response: {
        status: 401,
        data: { detail: "Token expired" },
      },
    };

    try {
      await apiClient.interceptors.response.handlers[0].rejected(mockError);
    } catch (e) {
      // Expected rejection
    }

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("rmart_user")).toBeNull();
  });
});
