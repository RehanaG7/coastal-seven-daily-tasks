# Day 05 — SQLAlchemy ORM, Alembic Migrations & Modular CRUD

<p align="left">
  <img src="https://img.shields.io/badge/FASTAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLALCHEMY_2.0-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white" />
  <img src="https://img.shields.io/badge/ALEMBIC-MIGRATIONS-000000?style=for-the-badge&logo=alembic&logoColor=white" />
  <img src="https://img.shields.io/badge/PYDANTIC_V2-E92063?style=for-the-badge&logo=pydantic&logoColor=white" />
  <img src="https://img.shields.io/badge/PYTEST-AUTOMATED-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 05 elevates database operations from raw SQL queries to an enterprise Object-Relational Mapping (ORM) architecture with **SQLAlchemy 2.0** and schema version control using **Alembic**.

### 🌟 Key Deliverables:
1. **Layered Modular Architecture (`app/`)**:
   - `models/`: Declarative Base ORM models for `User` and `Product` with column constraints and timestamps.
   - `schemas/`: Pydantic V2 schemas for input validation and output serialization with ORM mode (`from_attributes = True`).
   - `crud/`: Dedicated repository pattern isolating database business logic from route handlers.
   - `routers/`: APIRouters modularly handling `/users` and `/products` resources.

2. **Alembic Database Version Control (`alembic/`, `alembic.ini`)**:
   - Automated revision generation tracking entity schema evolutions.
   - Forward and backward rollback migration workflows (`upgrade head`, `downgrade -1`).

3. **FastAPI Dependency Injection (`database.py`)**:
   - `get_db` session generator leveraging Python context managers for deterministic session commit and cleanup.

4. **Integration Testing (`tests/`)**:
   - Pytest fixtures mocking test client requests and verifying end-to-end CRUD persistence.

---

## 📂 Directory Structure

```text
Day-05/
├── README.md               # Module documentation & execution guide
├── alembic.ini             # Alembic migration configuration
├── requirements.txt        # Python dependency manifest
├── run.py                  # Server bootstrap script
├── alembic/                # Migration scripts & version history
│   ├── env.py
│   └── versions/
├── app/
│   ├── config.py           # Environment settings & DB URL
│   ├── database.py         # SQLAlchemy engine and SessionLocal
│   ├── main.py             # FastAPI entry point & router mounting
│   ├── crud/               # Repository logic (crud_user.py, crud_product.py)
│   ├── models/             # SQLAlchemy ORM definitions
│   ├── routers/            # Endpoint handlers (user_router.py, product_router.py)
│   └── schemas/            # Pydantic validation schemas
└── tests/                  # Automated integration tests
```

---

## 🚀 How to Run & Verify

### 1. Run Migrations
```bash
alembic upgrade head
```

### 2. Launch FastAPI Server
```bash
python run.py
# or: uvicorn app.main:app --reload --port 8000
```

### 3. Run Automated Tests
```bash
pytest -v tests
```
