-- Waqood App: Settings & Lookup Management
-- Adds default_litres to fuel_types, creates settings table, adds RLS policies

-- ============================================================
-- 1. Add default_litres to fuel_types
-- ============================================================
ALTER TABLE fuel_types ADD COLUMN default_litres NUMERIC(10,2) NOT NULL DEFAULT 20;

-- Update existing defaults
UPDATE fuel_types SET default_litres = 20 WHERE category = 'بنزين';
UPDATE fuel_types SET default_litres = 40 WHERE category = 'سولار';

-- ============================================================
-- 2. General settings table (key-value)
-- ============================================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('company_name', ''),
  ('report_footer', 'تقرير مصدّر من نظام واقود');

-- ============================================================
-- 3. RLS policies for management
-- ============================================================
CREATE POLICY "authenticated users can manage fuel_types" ON fuel_types
  FOR ALL USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated users can manage vehicle_types" ON vehicle_types
  FOR ALL USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated users can read settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "authenticated users can manage settings" ON settings
  FOR ALL USING (true)
  WITH CHECK (true);
