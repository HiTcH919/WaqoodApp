# Waqood App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the fuel management system from a single Firebase TSX file into a production-ready Next.js + Supabase app with the same feature set.

**Architecture:** Server Components for reads, Server Actions for writes, Supabase Realtime for live dashboard, Supabase Auth for login, RTL-first layout with Arabic UI.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, custom UI components (shadcn/ui-style), Supabase (Auth + PostgreSQL + Realtime), Vercel

## Global Constraints

- All UI text in Arabic
- RTL layout (`dir="rtl"`)
- Arabic font: Cairo
- Database: Supabase PostgreSQL with RLS
- Auth: Supabase email/password
- Deploy target: Vercel
- Version control: GitHub

---

### Task 1: Project Scaffolding [DONE]

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`
- Create: `.env.local`, `next-env.d.ts`
- Create: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/lib/utils.ts`, `src/lib/constants.ts`
- Create: `src/components/ui/button.tsx`, `card.tsx`, `input.tsx`, `select.tsx`, `badge.tsx`, `table.tsx`, `alert-dialog.tsx`, `skeleton.tsx`

- [x] **Step 1: Initialize project manually with package.json and dependencies**
- [x] **Step 2: Configure TypeScript, Next.js, PostCSS, ESLint**
- [x] **Step 3: Create Tailwind globals.css with RTL + custom theme + animations**
- [x] **Step 4: Create root layout with Arabic font (Cairo) and RTL**
- [x] **Step 5: Create lib/utils.ts (cn helper) and lib/constants.ts (fuel types, vehicle types, defaults)**
- [x] **Step 6: Create UI components (Button, Card, Input, Select, Badge, Table, AlertDialog, Skeleton)**
- [x] **Step 7: Verify build succeeds**

### Task 2: Supabase Database + Auth

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/seed.sql`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/app/api/auth/callback/route.ts`
- Modify: `.env.local`

- [ ] **Step 1: Write migration SQL — all 8 tables + indexes + RLS policies**
- [ ] **Step 2: Write seed SQL — default departments, fuel types, vehicle types**
- [ ] **Step 3: Create Supabase browser client (client.ts)**
- [ ] **Step 4: Create Supabase server client (server.ts) with cookie handling**
- [ ] **Step 5: Create auth callback route**
- [ ] **Step 6: Verify migration can be applied (dry-run with supabase CLI)**

### Task 3: Auth Flow + Dashboard Layout

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/nav-items.ts`
- Create: `src/middleware.ts`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write middleware.ts — protect /dashboard/* routes, redirect to /login**
- [ ] **Step 2: Create login page — email/password form with Supabase Auth**
- [ ] **Step 3: Create nav-items.ts — sidebar navigation items with icons**
- [ ] **Step 4: Create sidebar component — desktop sidebar with nav items + logo**
- [ ] **Step 5: Create header component — mobile menu toggle + logout**
- [ ] **Step 6: Create dashboard layout — sidebar + header + content area**
- [ ] **Step 7: Verify login → dashboard → logout flow**

### Task 4: Departments CRUD (TDD)

**Files:**
- Create: `src/app/(dashboard)/departments/page.tsx`
- Create: `src/components/shared/confirm-modal.tsx`
- Create: `src/app/actions/departments.ts`

- [ ] **Step 1: Write failing test — create department, edit, delete**
- [ ] **Step 2: Verify test fails (RED)**
- [ ] **Step 3: Create Server Actions (createDepartment, updateDepartment, deleteDepartment)**
- [ ] **Step 4: Create departments page — server component + client form**
- [ ] **Step 5: Verify test passes (GREEN)**
- [ ] **Step 6: Test delete with linked vehicles — should be blocked**

### Task 5: Vehicles CRUD (TDD)

**Files:**
- Create: `src/app/(dashboard)/vehicles/page.tsx`
- Create: `src/components/vehicles/vehicle-form.tsx`
- Create: `src/components/vehicles/vehicle-list.tsx`
- Create: `src/app/actions/vehicles.ts`

- [ ] **Step 1: Write failing test — create vehicle, edit, soft-delete**
- [ ] **Step 2: Verify test fails (RED)**
- [ ] **Step 3: Create Server Actions (createVehicle, updateVehicle, softDeleteVehicle)**
- [ ] **Step 4: Create vehicle form — plate, department, type (cascading), fuel type**
- [ ] **Step 5: Create vehicle list — table view**
- [ ] **Step 6: Verify test passes (GREEN)**

### Task 6: Fuel Prices

**Files:**
- Create: `src/app/(dashboard)/prices/page.tsx`
- Create: `src/app/actions/prices.ts`

- [ ] **Step 1: Create Server Action (updateFuelPrice) — inserts new row with effective_from=today**
- [ ] **Step 2: Create prices page — 4 cards with inline edit**
- [ ] **Step 3: Verify price update → new price shown, old price preserved in DB**

### Task 7: Coupon Issuance (TDD — Core Feature)

**Files:**
- Create: `src/app/(dashboard)/coupons/page.tsx`
- Create: `src/components/coupons/coupon-form.tsx`
- Create: `src/components/coupons/coupon-cost-sidebar.tsx`
- Create: `src/app/actions/coupons.ts`

- [ ] **Step 1: Write failing test — issue valid batch, detect serial overlap, excess flag**
- [ ] **Step 2: Verify test fails (RED)**
- [ ] **Step 3: Create issueCoupons Server Action — validate serial overlap, calculate litres/cost**
- [ ] **Step 4: Create coupon form — vehicle select, month, count, capacity, serials**
- [ ] **Step 5: Create cost sidebar — animated cost calculation display**
- [ ] **Step 6: Verify test passes (GREEN)**
- [ ] **Step 7: Test overlapping serials — should be rejected**

### Task 8: Dashboard + Alerts + Realtime

**Files:**
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/hooks/use-realtime.ts`

- [ ] **Step 1: Create dashboard server component — fetch stats (active vehicles, total litres, total cost)**
- [ ] **Step 2: Create stats cards — 3 cards with icons**
- [ ] **Step 3: Create quick actions grid — 4 buttons linking to coupons, vehicles, reports, deductions**
- [ ] **Step 4: Create AI alerts panel — excess coupons + fast consumption detection**
- [ ] **Step 5: Create use-realtime hook — subscribe to coupon_batches for current month**
- [ ] **Step 6: Verify dashboard loads and realtime updates work**

### Task 9: Reports + A4 Print

**Files:**
- Create: `src/app/(dashboard)/reports/page.tsx`
- Create: `src/components/reports/print-report.tsx`

- [ ] **Step 1: Create reports page — month picker + department filter**
- [ ] **Step 2: Fetch and aggregate coupon data server-side — join with vehicles**
- [ ] **Step 3: Create print preview modal — A4 layout with government header**
- [ ] **Step 4: Add @media print CSS rules for clean A4 output**
- [ ] **Step 5: Verify month filter → preview → print**

### Task 10: Deductions

**Files:**
- Create: `src/app/(dashboard)/deductions/page.tsx`
- Create: `src/app/actions/deductions.ts`

- [ ] **Step 1: Create Server Action (createDeduction) — validate month, amount**
- [ ] **Step 2: Create deductions page — list view with add form**
- [ ] **Step 3: Verify add deduction → appears in list**
