# Day 06 — JWT Authentication & Role-Based Access Control (RBAC)

<p align="left">
  <img src="https://img.shields.io/badge/FASTAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-TOKENS-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/BCRYPT-PASSWORD_HASHING-2B5B84?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/RBAC-ADMIN_&_USER-10B981?style=for-the-badge&logo=auth0&logoColor=white" />
  <img src="https://img.shields.io/badge/OAUTH2-BEARER_FLOW-EB5424?style=for-the-badge&logo=auth0&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 06 builds a secure authentication and authorization subsystem. It implements OAuth2 password flow, cryptographic password hashing via Passlib (Bcrypt), JSON Web Token (JWT) issuance and verification, and Role-Based Access Control (RBAC) protecting sensitive administrative resources.

### 🌟 Key Deliverables:
1. **Security & Cryptography (`core/security.py`)**:
   - `pwd_context` using Bcrypt for non-reversible salted password hashing.
   - `create_access_token` issuing signed JWT tokens with configurable expiration (`ACCESS_TOKEN_EXPIRE_MINUTES`).
   - `decode_access_token` verifying HMAC-SHA256 signature and extracting subject claims.

2. **Role-Based Access Control (RBAC) Dependencies (`core/dependencies.py` / `utils/`)**:
   - `get_current_user`: OAuth2PasswordBearer dependency validating incoming `Authorization: Bearer <token>` headers.
   - `require_role("admin")`: Reusable role guard ensuring only users with administrative privileges can access privileged endpoints.

3. **Modular API Routers (`routers/`)**:
   - `auth.py`:
     - `POST /auth/register` — Registers user with hashed password.
     - `POST /auth/login` — Verifies credentials and returns access token.
   - `protected.py`:
     - `GET /protected/profile` — Returns current authenticated user's profile.
     - `GET /protected/admin-only` — Strict admin-only endpoint returning `403 Forbidden` for normal users.

---

## 📂 Directory Structure

```text
Day-06/
├── README.md               # Module documentation & execution guide
├── database.py             # Database engine & session maker
├── main.py                 # FastAPI application instance & router registry
├── requirements.txt        # Python dependency manifest
├── core/                   # Security algorithms & configuration
│   ├── config.py
│   └── security.py
├── models/                 # User ORM entity with roles
│   └── user.py
├── routers/                # Endpoints (auth.py, protected.py)
├── schemas/                # Pydantic schemas (token, user)
└── utils/                  # Helper utilities & dependencies
```

---

## 🚀 How to Run & Verify

### 1. Launch FastAPI Auth Server
```bash
uvicorn main:app --reload --port 8000
```

### 2. Verify with Swagger UI
Navigate to `http://127.0.0.1:8000/docs`:
1. Register an admin user via `POST /auth/register` with `role: "admin"`.
2. Authorize using the green **Authorize** button in Swagger UI using your email and password.
3. Access `GET /protected/admin-only` to verify `200 OK`.
4. Try accessing with a non-admin account to observe the automatic `403 Forbidden` enforcement.
