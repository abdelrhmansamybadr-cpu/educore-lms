# LMS Build — Steps Summary

## Process (followed for every step)
1. User sends step
2. I read the project current state
3. I tell user: what I understand + what I will do + **which files I will touch**
4. User adjusts scope if needed
5. I implement
6. I test
7. I update this file with results

---

## Step 1 — Student Billing & Fees

### Step as Written by User

> Create advanced fee management including:
>
> Fee Types: Tuition, Registration, Admission, Bus, Books, Uniform, Exam, Activity, Lab, Hostel, Cafeteria, Insurance, Re-enrollment, Graduation, Custom
>
> Features: Fee categories, Fee groups, Fee templates, Grade-based fees, Curriculum-based fees, Student-specific fee overrides, Installment plans, Auto installment generation, Due dates, Late fines, Penalty rules, Discounts, Scholarships, Sibling discounts, Employee children discounts, VAT/Tax support, Credit notes, Debit notes, Refund management

---

### What I Understood

A complete Student Billing & Fees management system covering:
- 15 fee types organized by category
- Full fee lifecycle: create → assign to grade/curriculum → apply to students → collect → fine → discount → refund
- Accounting side: credit notes, debit notes, VAT, refunds
- Automation: auto installments, sibling detection, employee child detection

---

### Current State Found in Project

| Layer | What Exists | What's Missing |
|---|---|---|
| Prisma DB | Invoice, InvoiceItem, Payment, FeeStructure, FeeTemplate, PaymentPlan, PaymentInstallment, DiscountRule, Scholarship, FineRule, CreditNote | FeeCategory, FeeGroup, DebitNote, Refund |
| API Endpoints | Fee structures, templates, discounts, fines, credit notes, invoices, payments | Debit notes, Refunds, VAT auto-calc, sibling auto-detect, employee-child detect |
| Frontend UI | Plain list of fee structures only | Everything else |

---

### Files I Will Work On

#### Database
| File | Change |
|---|---|
| `prisma/schema.prisma` | Add FeeCategory, FeeGroup, DebitNote, Refund models. Add missing FeeType enum values |

#### Backend
| File | Change |
|---|---|
| `api/src/modules/finance/finance.service.ts` | Add methods: fee categories, fee groups, debit notes, refunds, VAT calc, sibling/employee-child discount detection |
| `api/src/modules/finance/finance.controller.ts` | Add new endpoints for all above |
| `api/src/modules/finance/finance.module.ts` | No change expected (PrismaService already added) |
| `api/src/modules/finance/dto/` | Add new DTOs: CreateFeeCategoryDto, CreateFeeGroupDto, CreateDebitNoteDto, CreateRefundDto |

#### Frontend
| File | Change |
|---|---|
| `web/src/app/[locale]/admin/finance/page.tsx` | Rebuild the `fees` tab into full sub-tabbed billing UI |

#### Types (shared)
| File | Change |
|---|---|
| `packages/types/src/` | Add FeeCategory, FeeGroup, DebitNote, Refund types if needed |

---

### Scope — PENDING ADJUSTMENT

Awaiting user answers to scope questions:
1. Priority order (fee structures first? invoicing first?)
2. Debit notes — needed in Step 1 or later?
3. VAT — simple % field or complex per-type rates?
4. Sibling & employee discounts — auto-detect or manual?
5. Refunds — simple mark-as-refunded or full workflow?
6. Frontend location — inside existing fees tab or new dedicated page?

---

### Implementation Plan

**Scope confirmed:** Frontend UI only — no backend changes

**File:** `web/src/app/[locale]/admin/finance/page.tsx`

**What gets built:**
1. Add `feesSubTab` state + 4 new queries (fee templates, discount rules, fine rules, credit notes)
2. Add mutations: create/update/delete fee structure, create/delete template, apply template, create/delete discount rule, create fine rule, apply fines, create/approve/apply credit note
3. Add 5 modals: New Fee Structure, New Fee Template, New Discount Rule, New Fine Rule, New Credit Note
4. Replace the plain fees tab with a full sub-tabbed UI:
   - Fee Structures tab (table + create/edit/delete)
   - Fee Templates tab (cards + create/apply/delete)
   - Discount Rules tab (table + create/delete)
   - Fine Rules tab (table + create + apply fines button)
   - Credit Notes tab (table + create/approve/apply)

### Test Results

**TypeScript diagnostics:** ✅ 0 errors

**What was built:**
- `feesSubTab` state managing 5 sub-sections
- 4 new React Query fetches: fee templates, discount rules, fine rules, credit notes (all enabled when `tab === 'fees'`)
- 13 new mutations: create/update/delete fee structure, create/apply/delete template, create/delete discount rule, create fine rule, apply fines, create/approve/apply credit note
- 5 new modals: New/Edit Fee Structure, New Fee Template, New Discount Rule, New Fine Rule, New Credit Note
- Full sub-tabbed fees UI replacing the old plain list:
  - **Fee Structures** — table with create/edit/delete, all 9 fee types, installments flag
  - **Templates** — cards with create/apply/delete, multi-item with fee type + amount + due date per item
  - **Discounts** — table with create/delete, color-coded by type (sibling, employee child, scholarship, etc.)
  - **Fine Rules** — table with create + "Apply Fines Now" button (runs `/finance/apply-fines`)
  - **Credit Notes** — table with create/approve/apply workflow

**Status:** ✅ Complete — frontend fees UI built using existing API endpoints only

### Bug Fix (Post-Implementation)

**Root causes found:**
1. `Sidebar.tsx` — No `?tab=fees` link existed for any role (CFO, FINANCE_MANAGER, AUDITOR, SCHOOL_ACCOUNTANT). Users had no sidebar entry point to the Fees tab.
2. `finance/page.tsx` — `bank` tab was missing from the inline tab strip (existed in code/content but not in the clickable tab bar).

**Fixes applied:**
- `web/src/components/layout/Sidebar.tsx` — Added `Fee Structures → ?tab=fees` to `financeFullNav` (Overview section), used by CFO, FINANCE_MANAGER, AUDITOR
- `web/src/app/[locale]/admin/finance/page.tsx` — Added `bank` tab back to the inline tab strip

**TypeScript after fix:** ✅ 0 errors on both files

---

## Bug Fix — Input Focus Loss (Typing Stops After 1 Character)

### Root Cause
Components defined **inside** another component function get recreated on every render. When a user types → state updates → parent re-renders → inline component is a brand-new function → React unmounts and remounts it → input loses focus.

### Files Fixed

| File | What was inside | Fix |
|---|---|---|
| `web/src/app/[locale]/admin/finance/page.tsx` | `Modal`, `InputField`, `SelectField` defined inside `AdminFinancePageInner` | Moved all 3 outside as top-level functions. `Modal` now calls `useLocale()` internally for RTL text. |
| `web/src/app/[locale]/admin/events/page.tsx` | `EventForm` defined inside `EventsAdminView` | Moved outside as top-level function. Props added: `isEditing`, `form`, `setForm`. Call sites updated. |

### TypeScript after fix
- `finance/page.tsx` ✅ 0 errors
- `events/page.tsx` ✅ 0 errors

---

## Bug Fix — "New Fee Structure" Saves with Error

### Root Cause
The `academicYearId` field was a free-text input. User typed `"2025-2026"` but the API requires a valid UUID referencing an `AcademicYear` record in the database. The API rejected it with a foreign key constraint error.

### Files Changed

| File | Change |
|---|---|
| `api/src/modules/finance/finance.controller.ts` | Added `GET /finance/academic-years` endpoint — returns school's academic years with id + name |
| `web/src/app/[locale]/admin/finance/page.tsx` | Added `academicYears` query; replaced `academicYearId` text input with a `SelectField` dropdown showing year names (current year marked) |

### TypeScript after fix
- `finance/page.tsx` ✅ 0 errors

---

## Bug Fix — "New Fee Structure" Still Shows Error After Academic Year Fix

### Root Cause
Prisma's `DateTime` field at runtime rejects date-only strings like `"2026-05-14"` (from `<input type="date">`). It requires either a `Date` object or a full ISO 8601 datetime string like `"2026-05-14T00:00:00.000Z"`. The `createFeeStructure` service method was passing the raw date string directly to Prisma via `data: dto as any`, bypassing TypeScript type checking but not Prisma's runtime validation. This triggered a `PrismaClientValidationError` ("Some data you entered is invalid").

**Diagnosis method:** Generated a test JWT, called the API directly, confirmed success without `dueDate` and failure with `dueDate: "2026-05-14"`, then confirmed success with `dueDate: "2026-05-14T00:00:00.000Z"`.

### Files Changed

| File | Change |
|---|---|
| `api/src/modules/finance/finance.service.ts` | `createFeeStructure`: convert `dto.dueDate` string to `Date` object before Prisma insert |

### TypeScript after fix
- `finance.service.ts` ✅ 0 errors

### Live API Test
- `POST /finance/fee-structures` with `dueDate: "2026-05-14"` → ✅ `200 OK`, record created correctly

---

## Feature — Finance School Scope Selector

### What Was Built

Finance is now split into two scopes:

| Scope | Tabs | Backed by |
|---|---|---|
| **Company/Org** | Accounts, Journal, Payroll, Loans, Expenses, Bank, Budget | `organizationId` |
| **School (per school)** | Fees, Invoices, Reports | `schoolId` — each school separate |

A pill selector at the top of the Finance page lets CFO/FINANCE_MANAGER choose which scope to view.
SCHOOL_ADMIN users auto-select their own school (no picker needed).

### How It Works

- `web/src/lib/api.ts` — Added `setFinanceSchoolScope(id)` + module-level `_financeSchoolOverride`. The Axios interceptor now uses `_financeSchoolOverride ?? getSelectedSchoolId()` as the `x-school-id` header, so Finance page calls automatically use the selected school without changing any individual API call.
- `web/src/app/[locale]/admin/finance/page.tsx`:
  - `selectedSchoolId` state + `mySchools` query (`GET /schools/my-list`)
  - `useEffect` auto-selects when user has exactly 1 school
  - `useEffect` syncs `selectedSchoolId` → interceptor override (with cleanup on unmount)
  - School-scoped query keys include `selectedSchoolId` → auto-refetch when school changes
  - School-scoped queries have `enabled: ... && !!selectedSchoolId`
  - `SchoolRequired` component shown for fees/invoices/reports when no school selected
  - Pill selector UI shows only when user has >0 schools; "Company" pill only shown for multi-school users

### TypeScript
- `finance/page.tsx` ✅ 0 errors
- `api.ts` ✅ 0 errors
