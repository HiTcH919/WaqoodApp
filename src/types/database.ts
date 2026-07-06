export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface FuelType {
  id: string;
  name: string;
  category: "بنزين" | "سولار";
  default_litres: number;
  created_at: string;
}

export interface VehicleType {
  id: string;
  category: string;
  name: string;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export interface Department {
  id: string;
  organization_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  organization_id: string;
  department_id: string;
  name: string;
  plate: string;
  vehicle_type_id: string | null;
  fuel_type_id: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface FuelPrice {
  id: string;
  fuel_type_id: string;
  price: number;
  effective_from: string;
  created_at: string;
}

export interface CouponBatch {
  id: string;
  organization_id: string;
  vehicle_id: string;
  department_id: string;
  month: string;
  count: number;
  coupon_capacity: number;
  start_serial: number;
  end_serial: number;
  fuel_type_id: string;
  litres: number;
  cost: number;
  is_excess: boolean;
  issued_by: string | null;
  created_at: string;
}

export interface Deduction {
  id: string;
  organization_id: string;
  vehicle_id: string | null;
  department_id: string | null;
  amount: number;
  reason: string;
  month: string;
  created_by: string | null;
  created_at: string;
}

export interface OdometerReading {
  id: string;
  organization_id: string;
  vehicle_id: string;
  month: string;
  start_reading: number;
  end_reading: number;
  distance: number | null;
  created_at: string;
  updated_at: string;
}
