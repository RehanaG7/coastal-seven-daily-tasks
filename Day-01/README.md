# Day 01 — Python Foundations & FastAPI Student Management API

<p align="left">
  <img src="https://img.shields.io/badge/PYTHON-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FASTAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/PYDANTIC-v2-E92063?style=for-the-badge&logo=pydantic&logoColor=white" />
  <img src="https://img.shields.io/badge/SWAGGER_UI-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" />
  <img src="https://img.shields.io/badge/UVICORN-499848?style=for-the-badge&logo=gunicorn&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 01 marks the initial milestone in building production-ready, asynchronous web applications. The daily objectives focus on establishing robust Python core programming fundamentals and designing a high-performance RESTful API using FastAPI and Pydantic validation schemas.

### 🌟 Key Deliverables:
1. **Python Core Fundamentals (`python_basics.py`)**:
   - Primitive data types (`int`, `float`, `str`, `bool`) and collection primitives (`list`, `dict`, `set`, `tuple`).
   - String manipulation, format strings (f-strings), and type annotations.
   - Conditional branching (`if/elif/else`) and looping constructs (`for/while`).
   - Function definitions with default arguments, return annotations, and docstrings.

2. **Student Management REST API (`main.py`)**:
   - Production FastAPI application instance with custom metadata and auto-generated OpenAPI documentation.
   - **Pydantic Validation**: `StudentCreate`, `StudentUpdate`, and `StudentResponse` data validation with constraints (`ge=18`, `le=60`).
   - **CRUD Endpoints**:
     - `GET /` — Welcome & API health ping.
     - `GET /students` — Retrieve all registered students.
     - `GET /students/{student_id}` — Fetch specific student record with `404 Not Found` exception handling.
     - `POST /students` — Create new student with automatic ID sequencing and payload validation (`201 Created`).
     - `PUT /students/{student_id}` — Partial or complete update of student attributes.
     - `DELETE /students/{student_id}` — Delete existing student record.

---

## 📂 Directory Structure

```text
Day-01/
├── README.md              # Module documentation & execution guide
├── main.py                # FastAPI Student Management CRUD application
└── python_basics.py       # Comprehensive Python fundamental exercises
```

---

## 🚀 How to Run & Verify

### 1. Execute Core Python Basics
```bash
python python_basics.py
```

### 2. Start FastAPI Server
```bash
uvicorn main:app --reload --port 8000
```

### 3. Interactive API Documentation
Open your browser and navigate to:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

---

## 🧪 API Endpoints Reference

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :---: |
| `GET` | `/` | Root health ping | `200 OK` |
| `GET` | `/students` | List all student records | `200 OK` |
| `GET` | `/students/{student_id}` | Retrieve student by ID | `200 OK` / `404` |
| `POST` | `/students` | Register a new student | `201 Created` |
| `PUT` | `/students/{student_id}` | Update student details | `200 OK` / `404` |
| `DELETE` | `/students/{student_id}` | Remove student record | `200 OK` / `404` |
