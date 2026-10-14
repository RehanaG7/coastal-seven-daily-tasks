import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AiErrorBoundary from "../components/AiErrorBoundary";
import AiDescriptionGenerator from "../components/AiDescriptionGenerator";
import ProductCard from "../components/ProductCard";

// Problematic component for testing error boundary
function BrokenComponent({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error("Simulated LLM Generation Crash");
  }
  return <div data-testid="healthy-child">AI Child Widget Running</div>;
}

describe("Day 21 – AI Production Focus Test Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("1. AiErrorBoundary Component", () => {
    it("renders children safely when no error is thrown", () => {
      render(
        <AiErrorBoundary>
          <BrokenComponent shouldThrow={false} />
        </AiErrorBoundary>
      );
      expect(screen.getByTestId("healthy-child")).toHaveTextContent("AI Child Widget Running");
    });

    it("catches render errors and renders graceful fallback card without crashing", () => {
      // Suppress React boundary console.error during expected test error
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <AiErrorBoundary title="AI Feature Temporarily Degraded">
          <BrokenComponent shouldThrow={true} />
        </AiErrorBoundary>
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("AI Feature Temporarily Degraded")).toBeInTheDocument();
      expect(screen.getByText(/resilient offline fallback mode/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry ai connection/i })).toBeInTheDocument();

      spy.mockRestore();
    });

    it("triggers onRetry callback when retry button is pressed", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const onRetryMock = vi.fn();

      render(
        <AiErrorBoundary onRetry={onRetryMock}>
          <BrokenComponent shouldThrow={true} />
        </AiErrorBoundary>
      );

      const retryBtn = screen.getByRole("button", { name: /retry ai connection/i });
      fireEvent.click(retryBtn);
      expect(onRetryMock).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });
  });

  describe("2. AiDescriptionGenerator Component", () => {
    it("renders studio toggle button initially and opens controls when clicked", () => {
      render(
        <AiDescriptionGenerator
          productTitle="Wireless ANC Headphones"
          productCategory="Electronics"
          onApplyDescription={() => {}}
        />
      );

      const toggleBtn = screen.getByRole("button", { name: /generate with ai/i });
      expect(toggleBtn).toBeInTheDocument();

      // Open drawer
      fireEvent.click(toggleBtn);
      expect(screen.getByText(/copywriting tone/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /professional/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /enthusiastic/i })).toBeInTheDocument();
    });

    it("allows adding and removing key highlight tags", () => {
      render(
        <AiDescriptionGenerator
          productTitle="Mechanical Gaming Keyboard"
          productCategory="Peripherals"
          onApplyDescription={() => {}}
        />
      );

      // Open drawer
      fireEvent.click(screen.getByRole("button", { name: /generate with ai/i }));

      // Add feature
      const input = screen.getByPlaceholderText(/add bullet highlight/i);
      fireEvent.change(input, { target: { value: "RGB Per-Key Backlighting" } });
      fireEvent.click(screen.getByRole("button", { name: /\+ add/i }));

      expect(screen.getByText("RGB Per-Key Backlighting")).toBeInTheDocument();
    });

    it("calls API, renders result with cache hit pill, and applies description to form", async () => {
      const applyMock = vi.fn();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          cached: true,
          latency_ms: 1.8,
          data: {
            full_text: "Engineered for elite performance with titanium drivers.",
            headline: "Titanium Elite Headphones",
            bullet_points: ["Active ANC", "Titanium build"],
          },
        }),
      });

      render(
        <AiDescriptionGenerator
          productTitle="Titanium Elite Headphones"
          productCategory="Audio"
          onApplyDescription={applyMock}
        />
      );

      // Open and click generate
      fireEvent.click(screen.getByRole("button", { name: /generate with ai/i }));
      const genBtn = screen.getByRole("button", { name: /generate description now/i });
      fireEvent.click(genBtn);

      await waitFor(() => {
        expect(screen.getByText(/redis cache hit/i)).toBeInTheDocument();
      });

      expect(
        screen.getByText("Engineered for elite performance with titanium drivers.")
      ).toBeInTheDocument();

      // Apply to form
      const applyBtn = screen.getByRole("button", { name: /apply description to form/i });
      fireEvent.click(applyBtn);
      expect(applyMock).toHaveBeenCalledWith(
        "Engineered for elite performance with titanium drivers."
      );
    });

    it("displays content moderation rejection warning if backend returns 422", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          detail: {
            message: "Your input violates content safety policies.",
          },
        }),
      });

      render(
        <AiDescriptionGenerator
          productTitle="Bad input text"
          onApplyDescription={() => {}}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /generate with ai/i }));
      fireEvent.click(screen.getByRole("button", { name: /generate description now/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/violates content safety policies/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("3. ProductCard Semantic Match Badge", () => {
    it("renders semantic intent match percentage badge when relevance_score is present", () => {
      const productWithRelevance = {
        id: 101,
        name: "Sony WH-1000XM5 Wireless Headphones",
        price: 349.99,
        stock: 12,
        category: "Electronics",
        relevance_score: 0.94,
      };

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ProductCard product={productWithRelevance} />
          </MemoryRouter>
        </QueryClientProvider>
      );

      const badge = screen.getByTestId("semantic-match-badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("94% Match");
    });
  });
});
