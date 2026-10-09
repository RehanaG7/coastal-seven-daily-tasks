# Day 12 — Tailwind CSS, Shadcn/ui & Zod Form Validation

<p align="left">
  <img src="https://img.shields.io/badge/TAILWIND_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/REACT_HOOK_FORM-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white" />
  <img src="https://img.shields.io/badge/ZOD-SCHEMA_VALIDATION-3E67B1?style=for-the-badge&logo=zod&logoColor=white" />
  <img src="https://img.shields.io/badge/REACT_DROPZONE-DRAG_&_DROP-000000?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/LUCIDE_ICONS-F56565?style=for-the-badge&logo=react&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 12 transforms the user interface into a modern design system utilizing **Tailwind CSS**, accessible **Shadcn/ui** patterns, and robust form management via **React Hook Form** paired with strict **Zod** validation schemas.

### 🌟 Key Deliverables:
1. **Utility-First Styling System (`tailwind.config.js`, `postcss.config.js`)**:
   - Modern Tailwind CSS configuration supporting clean responsive breakpoints, custom animations, and dark mode toggling.
   - Reusable `cn()` helper leveraging `clsx` and `tailwind-merge` for conflict-free dynamic class merging.

2. **Strict Schema Validation (`zod`, `react-hook-form`)**:
   - Complex client-side schemas validating shipping address, zip codes, payment credentials, and phone numbers.
   - Synchronous error feedback displaying inline error indicators with accessible ARIA descriptions.

3. **Multi-Step Dynamic Checkout Wizard**:
   - Step 1: Customer details & shipping address with field validation.
   - Step 2: Payment method selection with conditional fields (Credit Card vs Cash on Delivery).
   - Step 3: Order summary review and final confirmation dispatch.

4. **Drag-and-Drop Image Ingestion (`react-dropzone`)**:
   - Accessible dropzone zone for product images with instant local client preview using the `FileReader` API.
   - Format and file size restrictions preventing unauthorized file types.

---

## 📂 Directory Structure

```text
Day-12/
├── README.md               # Module documentation & setup guide
├── index.html              # HTML root template
├── package.json            # NPM dependencies (tailwind, zod, hook-form, dropzone)
├── postcss.config.js       # PostCSS plugins
├── tailwind.config.js      # Tailwind theme extensions
├── vite.config.js          # Vite build config
├── backend/                # Linked FastAPI backend
└── src/
    ├── components/         # Accessible UI components (Buttons, Modals, Dropzones)
    ├── pages/              # Checkout wizard, Products, Admin forms
    └── schemas/            # Zod validation schemas
```

---

## 🚀 How to Run & Verify

### 1. Install Dependencies & Launch Dev Server
```bash
npm install
npm run dev
```

### 2. Verify Multi-Step Checkout & Validation
- Add items to the cart and click **Proceed to Checkout**.
- Test validation guards (attempting to proceed with invalid email or empty address triggers immediate Zod feedback).
- Test image drag-and-drop on the Admin Add Product form.
