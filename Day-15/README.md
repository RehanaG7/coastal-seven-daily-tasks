# Day 15 — TypeScript Strict Typing, Vitest Testing & Playwright E2E

<p align="left">
  <img src="https://img.shields.io/badge/TYPESCRIPT-STRICT-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/VITEST-FAST_TESTING-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" />
  <img src="https://img.shields.io/badge/MSW-API_MOCKING-FF6A00?style=for-the-badge&logo=mockserviceworker&logoColor=white" />
  <img src="https://img.shields.io/badge/PLAYWRIGHT-E2E_AUTOMATION-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" />
  <img src="https://img.shields.io/badge/TESTING_LIBRARY-REACT-E33332?style=for-the-badge&logo=testinglibrary&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 15 introduces rigorous software testing and enterprise type safety. It migrates the frontend to **TypeScript strict type definitions**, establishes an isolated unit/component test matrix with **Vitest** and **React Testing Library**, intercepts network traffic with **Mock Service Worker (MSW)**, and implements cross-browser End-to-End (E2E) testing with **Playwright**.

### 🌟 Key Deliverables:
1. **Strict TypeScript Typing (`tsconfig.json`, `src/types/index.ts`)**:
   - Explicit domain interfaces: `Product`, `User`, `CartItem`, `Order`, `AuthResponse`, and `OrderStatus`.
   - Compiler configuration with strict null checks, no implicit `any`, and module resolution for Vite.

2. **Component & Unit Testing with Vitest (`src/components/ProductCard.test.jsx`)**:
   - Headless DOM testing with `@testing-library/react` and `jsdom`.
   - Verifies product rendering, pricing typography, stock badges, and interactive callback triggers.

3. **Network Mocking with MSW (`src/mocks/handlers.js`, `src/test/apiMock.test.js`)**:
   - Declarative HTTP request interception matching `/api/v1/products` and `/api/v1/auth/login`.
   - Enables tests to execute reliably offline without dependence on a live database or running backend server.

4. **Cross-Browser Playwright E2E Automation (`playwright.config.js`, `e2e/`)**:
   - Automated user journey tests covering user login, catalog filtering, cart additions, multi-step checkout form submissions, and order confirmation.

---

## 📂 Directory Structure

```text
Day-15/
├── README.md               # Module documentation & test guide
├── index.html              # HTML root
├── package.json            # Vitest, Playwright, MSW dependencies
├── playwright.config.js    # Playwright E2E configuration
├── tsconfig.json           # TypeScript strict compiler options
├── vite.config.js          # Vite and Vitest configuration
├── backend/                # Linked FastAPI backend
├── e2e/                    # Playwright End-to-End test suites
│   └── userJourney.spec.js
└── src/
    ├── types/              # TypeScript type definitions (index.ts)
    ├── mocks/              # Mock Service Worker handlers & server setup
    ├── components/         # ProductCard, Cart, Navbar and tests
    └── test/               # Vitest suites (apiMock.test.js, ProductCard.test.jsx)
```

---

## 🚀 How to Run & Verify

### 1. TypeScript Static Type Check
```bash
npx tsc --noEmit
```

### 2. Run Vitest Component & Unit Tests
```bash
npx vitest run
```

### 3. Run Playwright E2E Suite
```bash
npx playwright test
```

### 4. Build Production Bundle
```bash
npm run build
```
