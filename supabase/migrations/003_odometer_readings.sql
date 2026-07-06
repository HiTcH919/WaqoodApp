CREATE TABLE odometer_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  month TEXT NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'),
  start_reading NUMERIC(10,2) NOT NULL DEFAULT 0,
  end_reading NUMERIC(10,2) NOT NULL DEFAULT 0,
  distance NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(vehicle_id, month)
);

CREATE INDEX idx_odometer_vehicle ON odometer_readings(vehicle_id);
CREATE INDEX idx_odometer_month ON odometer_readings(month);
ALTER TABLE odometer_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can manage odometer readings" ON odometer_readings
  FOR ALL USING (
    organization_id = (SELECT id FROM organizations LIMIT 1)
  );
