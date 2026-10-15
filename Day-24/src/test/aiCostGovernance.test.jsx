import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AiCostGovernanceDashboard from "../components/AiCostGovernanceDashboard";

describe("Day 22 Capstone: Responsible AI & Cost Governance Dashboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the $0.00 spend target badge and core metric cards", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "COMPLIANT",
        target_spend: "$0.00",
        actual_spend: "$0.00",
        free_tier_status: "100% Free-Tier / Zero Cost Compliant",
        total_requests: 25,
        cache_hits: 20,
        cache_misses: 5,
        cache_hit_ratio_percent: 80.0,
        total_tokens_consumed: 12500,
        prompt_tokens: 7500,
        completion_tokens: 5000,
        estimated_dollars_saved: 0.0185,
        rate_limits: {
          anonymous: "5 req/min",
          customer: "20 req/min",
          admin: "60 req/min"
        },
        active_providers: [
          { name: "Google Gemini (Free Tier)", tier: "Free", quota: "15 RPM / 1M TPM" },
          { name: "Groq LPU (Free Tier)", tier: "Free", quota: "30 RPM / 14.4k RPD" },
          { name: "R-Mart Local RAG Engine", tier: "Offline Safety Net", quota: "Unlimited ($0.00)" }
        ],
        recent_transactions: [
          {
            id: "gov_1",
            timestamp: new Date().toISOString(),
            endpoint: "/api/v1/ai/chat/stream",
            provider: "Groq LPU",
            total_tokens: 450,
            was_cached: false,
            latency_ms: 210.0,
            actual_cost: 0.0
          }
        ]
      })
    });

    render(<AiCostGovernanceDashboard theme="dark" />);

    expect(screen.getByTestId("ai-cost-governance-dashboard")).toBeInTheDocument();
    expect(screen.getByText(/Responsible AI & Cost Governance/i)).toBeInTheDocument();
    expect(screen.getByText(/\$0.00 Spend Target Met/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("80%")).toBeInTheDocument();
      expect(screen.getByText("12,500")).toBeInTheDocument();
      expect(screen.getByText(/\$0.0185/)).toBeInTheDocument();
    });
  });

  it("displays rate limiting policies and provider cascade", async () => {
    render(<AiCostGovernanceDashboard theme="dark" />);

    await waitFor(() => {
      expect(screen.getByText(/Sliding-Window Rate Limit Policies/i)).toBeInTheDocument();
      expect(screen.getByText(/Anonymous Visitors:/i)).toBeInTheDocument();
      expect(screen.getByText(/Authenticated Shoppers:/i)).toBeInTheDocument();
      expect(screen.getByText(/Store Administrators:/i)).toBeInTheDocument();
    });
  });

  it("handles test AI request simulation", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "COMPLIANT",
        target_spend: "$0.00",
        actual_spend: "$0.00",
        cache_hit_ratio_percent: 85.0
      })
    });

    render(<AiCostGovernanceDashboard theme="dark" />);

    const simBtn = screen.getByTestId("simulate-ai-request-btn");
    expect(simBtn).toBeInTheDocument();

    fireEvent.click(simBtn);

    await waitFor(() => {
      expect(screen.getByText(/Simulated request recorded/i)).toBeInTheDocument();
    });
  });
});
