import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SneakPeekAiAssistant from "../components/SneakPeekAiAssistant";
import Navbar from "../components/Navbar";
import { useAuthStore, useUIStore, useCartStore } from "../store/useStore";

describe("Day 20 – SneakPeek Robo Assistant & Segmented Role Switcher", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: { id: 1, name: "Valued Shopper", role: "customer" },
      token: "test_token"
    });
    useUIStore.setState({ theme: "dark" });
    useCartStore.setState({ cart: [] });
  });

  it("renders the SneakPeek Robo container and speech bubble in bottom right", () => {
    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
      </MemoryRouter>
    );

    const roboContainer = screen.getByTestId("sneakpeek-robo-container");
    expect(roboContainer).toBeInTheDocument();

    const speechBubble = screen.getByTestId("robo-speech-bubble");
    expect(speechBubble).toBeInTheDocument();

    const avatar = screen.getByTestId("sneakpeek-robo-avatar");
    expect(avatar).toBeInTheDocument();
  });

  it("activates dark screen backdrop and opens AI chat modal when robo is clicked", async () => {
    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
      </MemoryRouter>
    );

    const roboContainer = screen.getByTestId("sneakpeek-robo-container");
    fireEvent.click(roboContainer);

    // Screen goes dark
    const backdrop = screen.getByTestId("ai-dark-backdrop");
    expect(backdrop).toBeInTheDocument();

    // AI Chat modal opens
    const chatModal = screen.getByTestId("ai-chat-modal");
    expect(chatModal).toBeInTheDocument();
    expect(screen.getAllByText(/Sparky AI Assistant/i).length).toBeGreaterThan(0);
  });

  it("renders watch history suggestions if user viewed items", () => {
    // Populate watch history
    localStorage.setItem(
      "rmart_viewed_products",
      JSON.stringify([
        { id: 1, title: "Apple iPhone 15 Pro Max", price: 1199.99, stock: 10 }
      ])
    );

    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
      </MemoryRouter>
    );

    const roboContainer = screen.getByTestId("sneakpeek-robo-container");
    fireEvent.click(roboContainer);

    expect(screen.getByText(/Tell me about Apple iPhone 15 Pro Max/i)).toBeInTheDocument();
    expect(screen.getByText(/Tell me a shopping joke!/i)).toBeInTheDocument();
  });

  it("allows user to type a query and submit it", async () => {
    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("sneakpeek-robo-container"));

    const input = screen.getByTestId("ai-chat-input");
    const sendBtn = screen.getByTestId("ai-chat-send-btn");

    fireEvent.change(input, { target: { value: "Tell me a joke" } });
    expect(input.value).toBe("Tell me a joke");

    fireEvent.click(sendBtn);

    // User message renders
    expect(screen.getByText("Tell me a joke")).toBeInTheDocument();
  });

  it("keeps navbar clean without redundant switcher and opens transparent command modal", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // Redundant role-switcher is removed from top navbar
    expect(screen.queryByTestId("role-switcher")).not.toBeInTheDocument();

    // Menu toggle button is present
    const menuBtn = screen.getByTitle(/Open Account Menu|Open Admin Console/i);
    expect(menuBtn).toBeInTheDocument();
  });

  it("handles 'What's new in R-Mart Sparkyyy?' suggestion chip and logs inquiry for Admin", async () => {
    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("sneakpeek-robo-container"));

    // Find and click the What's new chip
    const chip = screen.getByText(/What's new in R-Mart Sparkyyy\? 🎁/i);
    expect(chip).toBeInTheDocument();
    fireEvent.click(chip);

    // Verify ticket logged to localStorage for admin
    await waitFor(() => {
      const tickets = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
      expect(tickets.length).toBeGreaterThan(0);
      expect(tickets[0].subject).toContain("What's new in R-Mart & latest offers?");
    });
  });
});

