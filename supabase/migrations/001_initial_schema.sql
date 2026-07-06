-- Waqood App: Initial Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ORGANIZATIONS (for future multi-tenant)
-- ============================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. LOOKUP TABLES
-- ============================================================
CREATE TABLE fuel_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('بنزين', 'سولار')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fuel_types ENABLE ROW LEVEL SECURITY;

CREATE TABLE vehicle_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE vehicle_types ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_departments_org ON departments(organization_id);
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. VEHICLES
-- ============================================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  plate TEXT NOT NULL,
  vehicle_type_id UUID REFERENCES vehicle_types(id),
  fuel_type_id UUID REFERENCES fuel_types(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, plate)
);

CREATE INDEX idx_vehicles_org ON vehicles(organization_id);
CREATE INDEX idx_vehicles_dept ON vehicles(department_id);
CREATE INDEX idx_vehicles_active ON vehicles(organization_id) WHERE is_deleted = false;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. FUEL PRICES (historical, with effective date)
-- ============================================================
CREATE TABLE fuel_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fuel_type_id UUID NOT NULL REFERENCES fuel_types(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fuel_prices_type ON fuel_prices(fuel_type_id);
CREATE INDEX idx_fuel_prices_effective ON fuel_prices(fuel_type_id, effective_from DESC);
ALTER TABLE fuel_prices ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. COUPON BATCHES (issuance records)
-- ============================================================
CREATE TABLE coupon_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  month TEXT NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'),
  count INTEGER NOT NULL CHECK (count > 0),
  coupon_capacity NUMERIC(10,2) NOT NULL CHECK (coupon_capacity > 0),
  start_serial INTEGER NOT NULL CHECK (start_serial > 0),
  end_serial INTEGER NOT NULL CHECK (end_serial >= start_serial),
  fuel_type_id UUID NOT NULL REFERENCES fuel_types(id),
  litres NUMERIC(10,2) NOT NULL CHECK (litres > 0),
  cost NUMERIC(10,2) NOT NULL CHECK (cost > 0),
  is_excess BOOLEAN NOT NULL DEFAULT false,
  issued_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coupon_batches_org ON coupon_batches(organization_id);
CREATE INDEX idx_coupon_batches_vehicle ON coupon_batches(vehicle_id);
CREATE INDEX idx_coupon_batches_month ON coupon_batches(month);
CREATE INDEX idx_coupon_batches_fuel ON coupon_batches(fuel_type_id);
ALTER TABLE coupon_batches ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. DEDUCTIONS (financial)
-- ============================================================
CREATE TABLE deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  month TEXT NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deductions_org ON deductions(organization_id);
CREATE INDEX idx_deductions_month ON deductions(month);
ALTER TABLE deductions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================
-- Simple policy: authenticated users can CRUD their org's data
-- For single-admin MVP, we use a default org approach

CREATE POLICY "authenticated users can read their org" ON organizations
  FOR SELECT USING (true);

CREATE POLICY "authenticated users can read fuel_types" ON fuel_types
  FOR SELECT USING (true);

CREATE POLICY "authenticated users can read vehicle_types" ON vehicle_types
  FOR SELECT USING (true);

CREATE POLICY "authenticated users can manage their org departments" ON departments
  FOR ALL USING (
    organization_id = (SELECT id FROM organizations LIMIT 1)
  );

CREATE POLICY "authenticated users can manage their org vehicles" ON vehicles
  FOR ALL USING (
    organization_id = (SELECT id FROM organizations LIMIT 1)
  );

CREATE POLICY "authenticated users can manage their org prices" ON fuel_prices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fuel_types ft
      WHERE ft.id = fuel_prices.fuel_type_id
    )
  );

CREATE POLICY "authenticated users can manage their org coupons" ON coupon_batches
  FOR ALL USING (
    organization_id = (SELECT id FROM organizations LIMIT 1)
  );

CREATE POLICY "authenticated users can manage their org deductions" ON deductions
  FOR ALL USING (
    organization_id = (SELECT id FROM organizations LIMIT 1)
  );
