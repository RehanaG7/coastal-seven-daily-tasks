# Day 07 — Task Management API with JWT Auth, RBAC & Project Lifecycles

<p align="left">
  <img src="https://img.shields.io/badge/FASTAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLALCHEMY-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white" />
  <img src="https://img.shields.io/badge/ALEMBIC-MIGRATIONS-000000?style=for-the-badge&logo=alembic&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT_RBAC-SECURITY-10B981?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/CORS-ENABLED-5C2D91?style=for-the-badge&logo=w3c&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 07 integrates previous database, ORM, and authentication architectures into a cohesive, multi-tenant **Task & Project Management REST API**. It features project scoping, relational cascade rules, status lifecycle tracking, and role-based permissions.

### 🌟 Key Deliverables:
1. **Domain Models & Relational Architecture (`models/`)**:
   - `User`: Accounts with role tiers (`Admin`, `Manager`, `Developer`).
   - `Project`: Workspaces grouping related task backlogs with ownership mapping.
   - `Task`: Detailed work items featuring status enum (`TODO`, `IN_PROGRESS`, `DONE`), priority level (`LOW`, `MEDIUM`, `HIGH`), due dates, and assignee foreign keys.

2. **Modular APIRouters (`routers/`)**:
   - `/auth`: Registration, OAuth2 Bearer token generation, and `/me` profile inspection.
   - `/projects`: Project CRUD, listing user-accessible workspaces, and permission checks.
   - `/tasks`: Comprehensive task filtering by status, priority, and project ID, with status transition validation.

3. **Database Migration Pipeline (`alembic/`)**:
   - Version-controlled relational schema changes tracking index definitions and foreign key constraints.

---

## 📂 Directory Structure

```text
Day-07/
├── README.md               # Module documentation & execution guide
├── database.py             # Database engine & SessionLocal factory
├── main.py                 # FastAPI application instance & router registry
├── requirements.txt        # Python dependency manifest
├── alembic/                # Migration scripts & version history
├── core/                   # Security algorithms, JWT, and settings
│   ├── config.py
│   └── security.py
├── models/                 # SQLAlchemy models (User, Project, Task)
├── routers/                # Endpoints (auth.py, projects.py, tasks.py)
├── schemas/                # Pydantic input/output schemas
└── utils/                  # RBAC dependencies & permission checkers
```

---

## 🚀 How to Run & Verify

### 1. Launch Server
```bash
uvicorn main:app --reload --port 8000
```

### 2. Swagger Documentation
Visit `http://127.0.0.1:8000/docs` to test:
- User signup and token generation
- Creating projects under authenticated ownership
- Adding and transitioning task cards across status stages
