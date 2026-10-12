import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SneakPeekAiAssistant, { isLegitimateProduct, getDisplayAiEngine } from "../components/SneakPeekAiAssistant";
import Navbar from "../components/Navbar";
import RightMenuDrawer from "../components/RightMenuDrawer";
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

  it("renders the SneakPeek Robo container and shows speech bubble only on hover ('sparkyyy here !' for user, 'bosss' for admin)", () => {
    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
      </MemoryRouter>
    );

    const roboContainer = screen.getByTestId("sneakpeek-robo-container");
    expect(roboContainer).toBeInTheDocument();

    // No persistent side texts when unhovered
    expect(screen.queryByTestId("robo-speech-bubble")).not.toBeInTheDocument();

    // When hovered as user -> says 'sparkyyy here !'
    fireEvent.mouseEnter(roboContainer);
    const speechBubble = screen.getByTestId("robo-speech-bubble");
    expect(speechBubble).toBeInTheDocument();
    expect(speechBubble).toHaveTextContent("sparkyyy here !");

    // When unhovered -> disappears
    fireEvent.mouseLeave(roboContainer);
    expect(screen.queryByTestId("robo-speech-bubble")).not.toBeInTheDocument();

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
    expect(screen.getByText(/What offers are active today\?/i)).toBeInTheDocument();
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

    fireEvent.change(input, { target: { value: "Tell me about Sony headphones" } });
    expect(input.value).toBe("Tell me about Sony headphones");

    fireEvent.click(sendBtn);

    // User message renders
    expect(screen.getByText("Tell me about Sony headphones")).toBeInTheDocument();
  });

  it("politely declines off-topic or joke queries and suggests trending products and offers", async () => {
    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("sneakpeek-robo-container"));

    const input = screen.getByTestId("ai-chat-input");
    const sendBtn = screen.getByTestId("ai-chat-send-btn");

    fireEvent.change(input, { target: { value: "Tell me a joke" } });
    fireEvent.click(sendBtn);

    expect(screen.getByText(/Apologise, I only can solve queries regarding our website!/i)).toBeInTheDocument();
    expect(screen.getByText(/What would you like to buy today\?/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Samsung Galaxy S24 Ultra/i).length).toBeGreaterThan(0);
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

  it("cancels speech synthesis and closes assistant when close button is clicked", () => {
    const cancelMock = vi.fn();
    window.speechSynthesis = {
      cancel: cancelMock,
      speak: vi.fn(),
      getVoices: vi.fn().mockReturnValue([])
    };

    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("sneakpeek-robo-container"));
    expect(screen.getByTestId("ai-chat-modal")).toBeInTheDocument();

    const closeBtn = screen.getByTitle(/Close Assistant/i);
    fireEvent.click(closeBtn);

    expect(cancelMock).toHaveBeenCalled();
    expect(screen.queryByTestId("ai-chat-modal")).not.toBeInTheDocument();
  });

  it("clears chat messages and shows clean assistance prompt when Clear Chat is clicked", async () => {
    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("sneakpeek-robo-container"));
    expect(screen.getByTestId("ai-chat-modal")).toBeInTheDocument();

    const clearBtn = screen.getByText(/Clear Chat/i);
    fireEvent.click(clearBtn);

    expect(screen.getByText(/How can I assist you with products, orders, or store offers today\?/i)).toBeInTheDocument();
  });

  it("triggers live chat handover when user says problem not resolved or wants to talk to admin", async () => {
    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("sneakpeek-robo-container"));

    const input = screen.getByTestId("ai-chat-input");
    const sendBtn = screen.getByTestId("ai-chat-send-btn");

    fireEvent.change(input, { target: { value: "My problem not resolved, I want to talk to admin" } });
    fireEvent.click(sendBtn);

    // Verify empathy response and handover message
    expect(
      screen.getByText(/connecting you directly to our human Store Administrator right away via Live Support Chat/i)
    ).toBeInTheDocument();

    // Verify ticket logged to localStorage for Admin Customer Queries desk
    const tickets = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
    expect(tickets.length).toBeGreaterThan(0);
    expect(tickets[0].subject).toContain("Customer Escalation");

    // Verify urgent alert logged to localStorage for Admin Boss
    const adminNotifs = JSON.parse(localStorage.getItem("rmart_admin_notifications") || "[]");
    expect(adminNotifs.length).toBeGreaterThan(0);
    expect(adminNotifs[0].title).toContain("URGENT: Customer Escalation");
    expect(adminNotifs[0].message).toContain("Admin boss, resolve this immediately!");
  });

  it("handles Customer Support from Orders tab, answers order query, and routes to Admin Live Chat if problem not resolved", async () => {
    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
      </MemoryRouter>
    );

    // Simulate clicking 'Customer Support' button on an order in Orders tab
    act(() => {
      window.dispatchEvent(
        new CustomEvent("rmart:open_chat", {
          detail: {
            type: "order_support",
            orderId: "ORD-9999",
            status: "Out for Delivery",
            total: "249.99"
          }
        })
      );
    });

    // Chatbot opens and displays order details
    expect(screen.getByTestId("ai-chat-modal")).toBeInTheDocument();
    expect(screen.getAllByText(/Order #ORD-9999/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Out for Delivery/i).length).toBeGreaterThan(0);

    // User reports problem is not resolved
    const input = screen.getByTestId("ai-chat-input");
    const sendBtn = screen.getByTestId("ai-chat-send-btn");
    fireEvent.change(input, { target: { value: "Package damaged, problem not resolved, talk to admin" } });
    fireEvent.click(sendBtn);

    // Directly connects to Admin Live Chat
    expect(screen.getByText(/connecting you directly to our human Store Administrator right away via Live Support Chat/i)).toBeInTheDocument();

    // Verify urgent alert logged with order ID context
    const adminNotifs = JSON.parse(localStorage.getItem("rmart_admin_notifications") || "[]");
    expect(adminNotifs[0].message).toContain("ORD-9999");
    expect(adminNotifs[0].message).toContain("Admin boss, resolve this immediately!");
  });

  it("filters out synthetic test fixtures (N+1 Item, Invoice Test) and formats AI provider names properly", () => {
    // 1. Verify test fixture filter
    expect(isLegitimateProduct({ title: "N+1 Item 2" })).toBe(false);
    expect(isLegitimateProduct({ title: "N+1 Item 0" })).toBe(false);
    expect(isLegitimateProduct({ title: "Invoice Test Laptop" })).toBe(false);
    expect(isLegitimateProduct({ title: "Mock Item 4" })).toBe(false);
    expect(isLegitimateProduct({ title: "Dummy Product" })).toBe(false);
    expect(isLegitimateProduct({ title: "Samsung Galaxy S24 Ultra" })).toBe(true);
    expect(isLegitimateProduct({ title: "Sony WH-1000XM5 Wireless Headphones" })).toBe(true);
    expect(isLegitimateProduct({ title: "Apple iPhone 15 Pro Max 256GB" })).toBe(true);

    // 2. Verify AI Provider formatter
    expect(getDisplayAiEngine("Groq (Llama-3.3-70b)")).toContain("Llama-3.3-70B");
    expect(getDisplayAiEngine("Google Gemini 2.0 Flash")).toContain("Gemini 2.0 Flash");
    expect(getDisplayAiEngine("R-Mart Intelligent RAG Engine (Local Safety Net)")).toContain("RAG Intelligence");
    expect(getDisplayAiEngine("")).toBe("Grok & Gemini RAG Intelligence");
  });

  it("renders AI provider badge under each assistant message and executes thorough Log Out", async () => {
    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
        <RightMenuDrawer isOpen={true} />
      </MemoryRouter>
    );

    // 1. Open AI Assistant and submit an off-topic query
    fireEvent.click(screen.getByTestId("sneakpeek-robo-container"));
    const input = screen.getByTestId("ai-chat-input");
    const sendBtn = screen.getByTestId("ai-chat-send-btn");
    fireEvent.change(input, { target: { value: "Tell me a joke" } });
    fireEvent.click(sendBtn);

    // AI Provider Badge is rendered under the message
    const badges = screen.getAllByTestId("ai-provider-badge");
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0]).toHaveTextContent(/Powered by:/i);

    // 2. Test Log Out button
    const logoutBtn = screen.getByTestId("logout-button");
    expect(logoutBtn).toBeInTheDocument();
    expect(logoutBtn).toHaveTextContent("Log Out");

    // Click Log Out
    fireEvent.click(logoutBtn);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("access_token")).toBeNull();
  });

  it("handles Damaged Product flow: prompts for photo upload, verifies validity on upload, and approves 100% refund", async () => {
    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("sneakpeek-robo-container"));

    const input = screen.getByTestId("ai-chat-input");
    const sendBtn = screen.getByTestId("ai-chat-send-btn");

    // 1. Report damaged product
    fireEvent.change(input, { target: { value: "My product is damaged and cracked" } });
    fireEvent.click(sendBtn);

    // Assistant asks for photo upload and renders upload button
    expect(screen.getByText(/We are so sorry your item arrived damaged!/i)).toBeInTheDocument();
    expect(screen.getByText(/Please upload or share images of the damaged product/i)).toBeInTheDocument();
    const uploadCardBtn = screen.getByTestId("upload-damage-photo-card-btn");
    expect(uploadCardBtn).toBeInTheDocument();

    // 2. Upload photo through file input
    const fileInput = screen.getByTestId("damage-photo-input");
    const testFile = new File(["dummy content"], "broken_screen.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    // Assistant verifies and approves refund
    expect(screen.getByText(/Thank you for sharing the photo!/i)).toBeInTheDocument();
    expect(screen.getByText(/confirmed your claim is valid/i)).toBeInTheDocument();
    expect(screen.getByText(/100% full refund has been approved/i)).toBeInTheDocument();

    // Urgent alert dispatched to Admin Boss
    const adminNotifs = JSON.parse(localStorage.getItem("rmart_admin_notifications") || "[]");
    expect(adminNotifs.length).toBeGreaterThan(0);
    expect(adminNotifs[0].title).toContain("Damaged Item");
    expect(adminNotifs[0].message).toContain("100% full refund approved");

    // Ticket logged
    const tickets = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
    expect(tickets.some((t) => t.subject.includes("Damaged Item Verified"))).toBe(true);
  });

  it("handles Not Received Order flow: apologizes, alerts Admin Boss immediately, and offers Live Admin Chat", async () => {
    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("sneakpeek-robo-container"));

    const input = screen.getByTestId("ai-chat-input");
    const sendBtn = screen.getByTestId("ai-chat-send-btn");

    fireEvent.change(input, { target: { value: "I have not received my order yet" } });
    fireEvent.click(sendBtn);

    // Assistant message
    expect(screen.getByText(/We are truly sorry for the delay and inconvenience!/i)).toBeInTheDocument();
    expect(screen.getByText(/We will talk to our Admin Boss about this right away/i)).toBeInTheDocument();

    // Admin alert logged
    const adminNotifs = JSON.parse(localStorage.getItem("rmart_admin_notifications") || "[]");
    expect(adminNotifs.some((n) => n.title.includes("Order Not Received"))).toBe(true);

    // Live Admin Chat button is rendered
    expect(screen.getByTestId("live-admin-chat-btn")).toBeInTheDocument();
  });

  it("handles Return Complaint flow: asks reason, registers pickup & invoice packing, and allows 1-click Re-order", async () => {
    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("sneakpeek-robo-container"));

    const input = screen.getByTestId("ai-chat-input");
    const sendBtn = screen.getByTestId("ai-chat-send-btn");

    // 1. Initial return request without reason
    fireEvent.change(input, { target: { value: "I want to return my order" } });
    fireEvent.click(sendBtn);

    // Assistant asks for reason and displays reason options
    expect(screen.getByText(/Could you please tell us the reason for returning the item/i)).toBeInTheDocument();
    const reasonChip = screen.getByText(/Defective \/ Damaged/i);
    expect(reasonChip).toBeInTheDocument();

    // 2. User clicks reason chip
    fireEvent.click(reasonChip);

    // Assistant registers return complaint and gives invoice & delivery partner instructions
    expect(screen.getByText(/Your return complaint has been registered!/i)).toBeInTheDocument();
    expect(screen.getByText(/assign a delivery partner to receive it/i)).toBeInTheDocument();
    expect(screen.getByText(/Kindly pack it with your invoice/i)).toBeInTheDocument();
    expect(screen.getByText(/Would you like to place the same order again\?/i)).toBeInTheDocument();

    // Re-order button is available
    const reorderBtn = screen.getByTestId("reorder-item-btn");
    expect(reorderBtn).toBeInTheDocument();

    // 3. Click re-order button -> adds item to cart
    fireEvent.click(reorderBtn);
    expect(useCartStore.getState().cart.length).toBeGreaterThan(0);
    expect(screen.getByText(/re-added .* to your shopping bag/i)).toBeInTheDocument();
  });

  it("handles Generic Complaint flow: responds with empathy and asks for more details", async () => {
    render(
      <MemoryRouter>
        <SneakPeekAiAssistant />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("sneakpeek-robo-container"));

    const input = screen.getByTestId("ai-chat-input");
    const sendBtn = screen.getByTestId("ai-chat-send-btn");

    fireEvent.change(input, { target: { value: "I want to file a complaint about bad service" } });
    fireEvent.click(sendBtn);

    expect(screen.getByText(/We are sorry for the inconvenience!/i)).toBeInTheDocument();
    expect(screen.getByText(/Could you please share more details about the issue so we can help you right away\?/i)).toBeInTheDocument();

    // Ticket logged
    const tickets = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
    expect(tickets.some((t) => t.subject.includes("Complaint"))).toBe(true);
  });
});


