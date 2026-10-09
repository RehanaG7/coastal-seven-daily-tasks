# Day 09 — File Processing Pipeline, Pillow Thumbnails & WebSockets

<p align="left">
  <img src="https://img.shields.io/badge/FASTAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/PILLOW-IMAGE_PROCESSING-8993BE?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/WEBSOCKETS-REAL--TIME-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/STATIC_FILES-SERVING-FF9900?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/TEST_COVERAGE-95%25+-brightgreen?style=for-the-badge&logo=pytest&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 09 implements an asynchronous binary file ingestion pipeline and bidirectional real-time communication via WebSockets. It enforces strict MIME type security, byte size thresholds, procedural image resizing with Pillow, and event broadcasting to connected frontend clients.

### 🌟 Key Deliverables:
1. **Multipart File Processing (`routers/uploads.py`)**:
   - `UploadFile` stream processing preventing server memory exhaustion.
   - Validation against MIME spoofing (`image/jpeg`, `image/png`, `image/webp`).
   - Hard upper limits on file sizes (5 MB) rejecting payload overages with `413 Request Entity Too Large`.

2. **Pillow Image Manipulation**:
   - Automatic thumbnail downscaling to uniform dimensions (300x300 px) preserving aspect ratios.
   - Output saved under `static/uploads/` and exposed via FastAPI `StaticFiles`.

3. **Real-Time WebSocket Engine (`routers/ws.py`)**:
   - Connection manager maintaining an active registry of client WebSocket sessions.
   - Immediate push notifications triggered whenever a file upload or catalog update occurs.
   - Resilient disconnect lifecycle handling preventing broken pipe exceptions.

4. **Rigorous Test Suite (`tests/`)**:
   - Pytest test cases covering valid uploads, invalid MIME rejections, oversized payload rejections, and WebSocket connections with 95%+ line coverage.

---

## 📂 Directory Structure

```text
Day-09/
├── README.md               # Module documentation & execution guide
├── main.py                 # FastAPI application instance & static mount
├── pyproject.toml          # Pytest & coverage configuration
├── requirements.txt        # Python dependency manifest
├── core/                   # Shared settings
├── routers/                # Upload and WebSocket endpoints
│   ├── uploads.py
│   └── ws.py
├── static/                 # Served public files
│   └── uploads/            # Resized product images & thumbnails
└── tests/                  # 95%+ Pytest test coverage suite
```

---

## 🚀 How to Run & Verify

### 1. Launch FastAPI Server
```bash
uvicorn main:app --reload --port 8000
```

### 2. Run Pytest Suite with Coverage
```bash
pytest --cov=. --cov-report=term-missing tests/
```
