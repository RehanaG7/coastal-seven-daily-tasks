# Day 18 — Enterprise Background Tasks, PDF Invoices & Bulk CSV Ingestion

<p align="left">
  <img src="https://img.shields.io/badge/FASTAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/CELERY-ASYNC_POLLING-37814A?style=for-the-badge&logo=celery&logoColor=white" />
  <img src="https://img.shields.io/badge/REPORTLAB-PDF_GENERATION-E23636?style=for-the-badge&logo=adobeacrobatreader&logoColor=white" />
  <img src="https://img.shields.io/badge/BULK_CSV-IMPORT_PIPELINE-217346?style=for-the-badge&logo=microsoftexcel&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLALCHEMY-N%2B1_OPTIMIZATION-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white" />
  <img src="https://img.shields.io/badge/PYTEST-34_PASSED-brightgreen?style=for-the-badge&logo=pytest&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 18 completes the production-grade enterprise requirements for the e-commerce platform. It introduces asynchronous Celery task tracking with non-blocking polling, automated PDF invoice generation via ReportLab, resilient chunked bulk CSV catalog ingestion with row-level validation, multi-token advanced product search, SQLAlchemy $N+1$ query optimization, and synchronized administrative catalog deletion.

### 🌟 Key Deliverables:
1. **Asynchronous Task Lifecycle Polling (`routers/tasks.py`)**:
   - Universal task status polling endpoint `GET /api/v1/tasks/{task_id}`.
   - Non-blocking client polling reporting status (`PENDING`, `PROGRESS`, `SUCCESS`, `FAILURE`) with progress percentage and payload results.

2. **Automated PDF Invoice Generation (`tasks/invoice_tasks.py`, `routers/invoices.py`)**:
   - ReportLab PDF generator rendering professional, branded R-Mart commercial invoices.
   - Includes order ID, customer details, itemized product tables with prices, subtotals, tax computation, and payment status.
   - Static file persistence and download endpoints (`GET /api/v1/orders/{order_id}/invoice/download` & `/api/v1/orders/{order_id}/invoice/generate-sync`).

3. **Chunked Bulk CSV Catalog Ingestion (`tasks/csv_tasks.py`, `routers/csv_import.py`)**:
   - Ingestion of large product catalog CSV files in 500-record chunks.
   - Case-insensitive, whitespace-trimmed, and format-resilient header parsing (`Product Name` / `title`, `Price` / `unit_price`, etc.).
   - Granular row validation capturing row-level errors/warnings without halting valid row imports.
   - Downloadable official sample CSV template endpoint (`GET /api/v1/admin/products/sample-csv`).

4. **Advanced Multi-Token Product Search (`routers/products.py`)**:
   - Multi-word search tokenization executing individual `%term%` filters across title, description, and category.
   - Solves search relevance issues, ensuring queries like `"iPhone Pro"` return matching iPhone Pro devices accurately.

5. **SQLAlchemy $N+1$ Query Optimization**:
   - Replaced naive lazy-loading queries with eager loading (`joinedload(Order.items).joinedload(OrderItem.product)`).
   - Eliminates redundant $N+1$ database roundtrips on bulk order retrievals.

6. **Unified Admin Portal & Synchronized Catalog Management**:
   - Integrated product creation, stock modification, bulk CSV import, and product deletion into a single unified Admin Dashboard.
   - Instant state synchronization: deleting a product removes it across both the Admin table and customer catalog views.

7. **34-Test Pytest Verification Matrix (`backend/tests/`)**:
   - 100% passing test suite across `test_day18_suite.py` and `test_ecommerce_suite.py` validating task lifecycle, PDF generation, CSV imports, search tokenization, query performance, and deletion sync.

---

## 📂 Directory Structure

```text
Day-18/
├── README.md               # Module documentation & setup guide
├── index.html              # Frontend template
├── package.json            # Frontend dependencies
├── vite.config.js          # Vite configuration
├── backend/                # Full-Stack FastAPI backend
│   ├── main.py             # Server entry point
│   ├── core/               # Configuration, security, DB sessions, Redis
│   ├── models/             # User, Product, Order, OrderItem models
│   ├── routers/            # tasks.py, invoices.py, csv_import.py, products.py
│   ├── tasks/              # Celery worker application & tasks
│   │   ├── celery_app.py
│   │   ├── csv_tasks.py
│   │   └── invoice_tasks.py
│   └── tests/              # 34-test automated Pytest suite
└── src/
    ├── components/         # AdminProductStudio, OrderTrackerModal, Navbar
    └── pages/              # ProductsPage, AdminDashboard, OrdersPage
```

---

## 🚀 How to Run & Verify

### 1. Launch FastAPI Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 2. Start Celery Worker
```bash
cd backend
celery -A tasks.celery_app.celery_app worker --loglevel=info
```

### 3. Launch React Frontend
```bash
npm install
npm run dev
```

### 4. Run Automated 34-Test Pytest Suite
```bash
cd backend
pytest -v tests
```
*(All 34 tests pass with 100% green status)*
