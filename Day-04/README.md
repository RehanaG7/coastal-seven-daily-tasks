# Day 04 — Cloud PostgreSQL & CLI Task Manager

<p align="left">
  <img src="https://img.shields.io/badge/PYTHON-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/POSTGRESQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/NEON_CLOUD-00E599?style=for-the-badge&logo=neon&logoColor=black" />
  <img src="https://img.shields.io/badge/PSYCOPG-3-2F6792?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/PYTEST-AUTOMATED-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 04 connects Python application logic to enterprise relational databases. It provisions a cloud-hosted **Neon PostgreSQL** serverless instance and implements a complete, fault-tolerant **CLI Task Manager** utilizing parameterized SQL queries, relational joins, transactions, JSON exports, and automated testing.

### 🌟 Key Deliverables:
1. **Neon Serverless PostgreSQL Database (`db.py`)**:
   - Connection pooling and SSL connection negotiation (`sslmode=require`).
   - Context manager architecture ensuring automatic transaction commits and resource cleanup.
   - Relational DDL tables: `categories` and `tasks` with foreign key relationships, default timestamps, and uniqueness constraints.

2. **Data Modeling & Domain Logic (`models.py`, `task_manager.py`)**:
   - Python `Task` dataclass handling type coercion and state validation.
   - Idempotent category upserts using PostgreSQL `ON CONFLICT (name) DO UPDATE`.
   - Advanced queries with `INNER JOIN`, filtering by status (`Pending`, `In Progress`, `Completed`), and priority sorting (`Low`, `Medium`, `High`).

3. **Interactive Terminal Interface (`main.py`)**:
   - Interactive command-line menu with colored terminal formatting.
   - Operations: Add Category, Create Task, Update Task Status/Priority, Delete Task, and List Categorized Tasks.
   - Native JSON export pipeline saving tasks to `tasks_export.json`.

4. **Automated Test Suite (`test_task_manager.py`)**:
   - Comprehensive unit and integration tests verifying schema migrations, task creation, category association, and deletion.

---

## 📂 Directory Structure

```text
Day-04/
├── README.md               # Module documentation & setup guide
├── config.py               # Environment configuration loader
├── db.py                   # Neon PostgreSQL connection & DDL initialization
├── main.py                 # Interactive CLI application entry point
├── models.py               # Domain model dataclasses
├── seed.py                 # Sample database seeder
├── task_manager.py         # Business logic & parameterized SQL operations
└── test_task_manager.py    # Pytest automated test suite
```

---

## 🚀 How to Run & Verify

### 1. Configure Environment
Create a `.env` file in `Day-04/` (or update existing):
```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
```

### 2. Initialize Schema & Seed Data
```bash
python db.py
python seed.py
```

### 3. Launch CLI Task Manager
```bash
python main.py
```

### 4. Run Automated Pytest Suite
```bash
pytest -v test_task_manager.py
```
