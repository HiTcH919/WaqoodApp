# Waqood App — Architecture Design Doc

**Date:** 2026-07-05
**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Supabase (Auth, PostgreSQL, Realtime) + Vercel

## System Architecture

Vercel hosts the Next.js app. Server Components query Supabase PostgreSQL directly. Client Components use Supabase JS SDK with RLS. Server Actions handle all mutations with business logic server-side. Supabase Realtime provides live dashboard updates. Auth via Supabase email/password with session cookies and middleware protection.

### Data Flow
- **Reads**: Server Components query Supabase directly, render HTML. Client components use Supabase JS SDK with RLS.
- **Writes**: Server Actions validate input, check business rules (serial conflicts, budget limits), write to Supabase, return result.
- **Live Updates**: Dashboard uses Supabase Realtime subscriptions for instant card updates.
- **Auth**: Supabase Auth (email/password), session managed via cookies, middleware protects routes.

## Database Schema (PostgreSQL)

### Tables
- **organizations**: id, name, slug (unique), created_at
- **fuel_types**: id, name (unique), category (بنزين/سولار), created_at
- **vehicle_types**: id, category, name, created_at
- **departments**: id (PK), organization_id (FK), name, created_at, updated_at
- **vehicles**: id (PK), organization_id (FK), department_id (FK), plate (unique per org), vehicle_type_id (FK), fuel_type_id (FK), is_deleted, created_at, updated_at
- **fuel_prices**: id (PK), fuel_type_id (FK), price (DECIMAL), effective_from (DATE), created_at
- **coupon_batches**: id (PK), organization_id (FK), vehicle_id (FK), department_id (FK), month (YYYY-MM), count, coupon_capacity, start_serial, end_serial, fuel_type_id (FK), litres, cost, is_excess, issued_by (FK → auth.users), created_at — constraint: no overlapping serials per fuel category + month
- **deductions**: id (PK), organization_id (FK), vehicle_id (FK nullable), department_id (FK), amount, reason, month (YYYY-MM), created_by (FK → auth.users), created_at

### RLS
Simple policy: authenticated users can CRUD their org's data.

### Key Logic
- **Current price**: `SELECT * FROM fuel_prices WHERE fuel_type_id = $id ORDER BY effective_from DESC LIMIT 1`
- **Serial conflict**: `SELECT 1 FROM coupon_batches WHERE fuel_type IN (same category) AND month = $m AND start_serial <= $new_end AND end_serial >= $new_start` — enforced in Server Action before insert

## File Structure
```
waqood-app/
├── .github/workflows/ci.yml
├── docs/superpowers/   # Specs and plans
├── src/
│   ├── app/
│   │   ├── layout.tsx | page.tsx (redirect → /dashboard)
│   │   ├── login/page.tsx
│   │   ├── (dashboard)/layout.tsx (sidebar + header shell)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── departments/page.tsx
│   │   │   ├── vehicles/page.tsx
│   │   │   ├── coupons/page.tsx
│   │   │   ├── prices/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── deductions/page.tsx
│   │   └── api/auth/callback/route.ts
│   ├── components/{ui/ (shadcn-style), layout/, shared/, vehicles/, coupons/, reports/}
│   ├── lib/supabase/{client,server}.ts | utils.ts | constants.ts
│   ├── hooks/{use-realtime,use-current-price}.ts
│   └── types/database.ts
├── supabase/migrations/001_initial_schema.sql
└── standard config: next.config.ts, tailwind.config.ts, package.json, etc.
```

## Data Layer
- Mutations via Server Actions (type-safe, server-side business logic)
- Reads via Server Components
- Realtime only on dashboard
- All 7 features: Dashboard, Departments, Vehicles, Coupons, Prices, Reports, Deductions

## UI Architecture
- RTL layout, Arabic font (Cairo)
- shadcn/ui-style components (Button, Card, Input, Select, Table, AlertDialog, Badge, Skeleton)
- Sidebar (desktop) + bottom nav (mobile)
- Server Component shells with Client Component forms
- States: loading (skeleton), empty, error (toast), success (optimistic update)
- Reports: print-optimized A4 CSS page with government header
