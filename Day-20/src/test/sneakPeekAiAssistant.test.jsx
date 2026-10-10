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
    expect(screen.getByText(/Sparky AI Assistant/i)).toBeInTheDocument();
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

  it("renders the Segmented Role Switcher in Navbar and toggles user/admin modes", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const roleSwitcher = screen.getByTestId("role-switcher");
    expect(roleSwitcher).toBeInTheDocument();

    const customerBtn = screen.getByTestId("role-toggle-customer");
    const adminBtn = screen.getByTestId("role-toggle-admin");

    expect(customerBtn).toBeInTheDocument();
    expect(adminBtn).toBeInTheDocument();

    // Switch to Admin
    fireEvent.click(adminBtn);
    expect(useAuthStore.getState().user.role).toBe("admin");
    expect(localStorage.getItem("user_role")).toBe("admin");

    // Switch to Customer
    fireEvent.click(customerBtn);
    expect(useAuthStore.getState().user.role).toBe("customer");
    expect(localStorage.getItem("user_role")).toBe("customer");
  });
});
