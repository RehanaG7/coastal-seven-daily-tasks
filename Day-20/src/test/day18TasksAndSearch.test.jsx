import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import TaskProgressModal from "../components/TaskProgressModal";
import ProductsPage from "../pages/ProductsPage";
import OrdersPage from "../pages/OrdersPage";
import AdminDashboard from "../pages/AdminDashboard";
import { taskService } from "../api/apiClient";

vi.mock("../api/apiClient", async () => {
  const actual = await vi.importActual("../api/apiClient");
  return {
    ...actual,
    taskService: {
      getTaskStatus: vi.fn(),
      listTasks: vi.fn(),
    },
    invoiceService: {
      generateInvoice: vi.fn().mockResolvedValue({ task_id: "test-inv-task-1", status: "PENDING" }),
      downloadInvoiceUrl: vi.fn().mockReturnValue("http://127.0.0.1:8000/orders/1/invoice/download"),
    },
    csvService: {
      importCsv: vi.fn().mockResolvedValue({ task_id: "test-csv-task-1", status: "PENDING" }),
      getSampleTemplateUrl: vi.fn().mockReturnValue("http://127.0.0.1:8000/products/sample-csv-template"),
    },
    orderService: {
      getOrders: vi.fn().mockResolvedValue([
        {
          id: 1,
          order_id: 1,
          user_id: 2,
          total_amount: 1199.99,
          status: "PROCESSING",
          items: [{ id: 1, product_id: 20, product_name: "iPhone 15 Pro", quantity: 1, price_at_purchase: 1199.99 }],
        },
      ]),
    },
  };
});

describe("Day 18 Frontend: Celery Task Lifecycle, PDF Invoices, Bulk CSV & Advanced Search", () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    localStorage.clear();
    localStorage.setItem("user_role", "admin");
    localStorage.setItem("rmart_user", JSON.stringify({ id: 1, email: "admin@rmart.com", role: "admin" }));
    vi.clearAllMocks();
  });

  it("TaskProgressModal polls status and displays animated progress bar", async () => {
    taskService.getTaskStatus
      .mockResolvedValueOnce({
        task_id: "test-task-123",
        status: "PROGRESS",
        progress: 60,
        message: "Rendering ReportLab PDF invoice...",
      })
      .mockResolvedValueOnce({
        task_id: "test-task-123",
        status: "SUCCESS",
        progress: 100,
        message: "Invoice generation complete!",
        result: { download_url: "/api/v1/orders/1/invoice/download" },
      });

    render(
      <TaskProgressModal
        isOpen={true}
        onClose={vi.fn()}
        taskId="test-task-123"
        title="Generating PDF Invoice"
      />
    );

    // Initial title and task ID
    expect(screen.getByText("Generating PDF Invoice")).toBeInTheDocument();
    expect(screen.getByText(/test-task-123/)).toBeInTheDocument();

    // Progress percentage
    await waitFor(() => {
      expect(screen.getByText("60%")).toBeInTheDocument();
      expect(screen.getByText(/Rendering ReportLab PDF invoice/)).toBeInTheDocument();
    });

    // Success state
    await waitFor(() => {
      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("COMPLETED")).toBeInTheDocument();
      expect(screen.getByText("Download PDF Invoice")).toBeInTheDocument();
    });
  });

  it("ProductsPage renders PostgreSQL Search Mode Selector and query inputs", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProductsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Search input
    const searchInput = screen.getByPlaceholderText(/Search products/i);
    expect(searchInput).toBeInTheDocument();

    // Search mode selector with options
    const select = screen.getByTitle(/Select PostgreSQL Search Algorithm/i);
    expect(select).toBeInTheDocument();
    expect(screen.getByText(/Smart Auto/i)).toBeInTheDocument();
    expect(screen.getByText(/PostgreSQL FTS/i)).toBeInTheDocument();
    expect(screen.getByText(/Typo-Tolerant Trigram/i)).toBeInTheDocument();

    // Change mode
    fireEvent.change(select, { target: { value: "fuzzy" } });
    expect(select.value).toBe("fuzzy");

    // Enter query and verify search telemetry badge appears
    fireEvent.change(searchInput, { target: { value: "iphne" } });
    expect(screen.getByText(/pg_trgm Trigram Similarity Match/i)).toBeInTheDocument();
  });

  it("OrdersPage displays Download PDF Invoice button and triggers task dispatch", async () => {
    localStorage.setItem(
      "rmart_orders",
      JSON.stringify([
        {
          id: 101,
          orderId: "ORD-101",
          totalAmount: 499.0,
          status: "Processing",
          items: [{ name: "Headphones", price: 499.0, quantity: 1 }],
        },
      ])
    );

    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const invoiceBtns = screen.getAllByText(/Download PDF Invoice/i);
      expect(invoiceBtns.length).toBeGreaterThan(0);
    });

    const invoiceBtns = screen.getAllByText(/Download PDF Invoice/i);
    fireEvent.click(invoiceBtns[0]);

    // Verify modal appears
    await waitFor(() => {
      expect(screen.getByText(/Celery Distributed Task Pipeline/i)).toBeInTheDocument();
    });
  });

  it("AdminDashboard renders Bulk CSV Import tab and starts async task", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Bulk CSV import tab button
    const bulkTabBtn = screen.getByTestId("admin-bulk-import-tab");
    expect(bulkTabBtn).toBeInTheDocument();
    fireEvent.click(bulkTabBtn);

    // Container and form fields
    expect(screen.getByTestId("admin-bulk-import-container")).toBeInTheDocument();
    expect(screen.getByTestId("bulk-csv-textarea")).toBeInTheDocument();
    expect(screen.getByText(/Download Sample CSV Template/i)).toBeInTheDocument();

    // Trigger import
    const startBtn = screen.getByTestId("start-bulk-import-btn");
    fireEvent.click(startBtn);

    // Task modal opens
    await waitFor(() => {
      expect(screen.getByText(/Bulk Product CSV Import/i)).toBeInTheDocument();
    });
  });
});
