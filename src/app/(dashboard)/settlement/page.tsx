import { createClient } from "@/lib/supabase/server";
import { currentMonthStr } from "@/lib/constants";
import { getSettings } from "@/lib/actions/settings";
import { SettlementClient } from "./settlement-client";

function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface Props {
  searchParams: Promise<{ month?: string; department_id?: string }>;
}

export default async function SettlementPage({ searchParams }: Props) {
  const { month, department_id } = await searchParams;
  const selectedMonth = month || currentMonthStr();
  const prevMonthStr = prevMonth(selectedMonth);

  const supabase = await createClient();

  let vehiclesQuery = supabase
    .from("vehicles")
    .select("id, name, plate, department_id, departments(name), fuel_types(name)")
    .eq("is_deleted", false)
    .order("name");

  if (department_id) {
    vehiclesQuery = vehiclesQuery.eq("department_id", department_id);
  }

  const [departmentsRes, vehiclesRes, batchesRes, readingsRes, prevReadingsRes] =
    await Promise.all([
      supabase.from("departments").select("id, name").order("name"),
      vehiclesQuery,
      supabase
        .from("coupon_batches")
        .select("vehicle_id, start_serial, end_serial, litres, count")
        .eq("month", selectedMonth),
      supabase
        .from("odometer_readings")
        .select("*")
        .eq("month", selectedMonth),
      supabase
        .from("odometer_readings")
        .select("*")
        .eq("month", prevMonthStr),
    ]);

  const departments = departmentsRes.data ?? [];
  const vehicles = (vehiclesRes.data ?? []) as unknown as {
    id: string; name: string; plate: string; department_id: string;
    departments: { name: string } | null; fuel_types: { name: string } | null;
  }[];
  const batches = batchesRes.data ?? [];
  const readings = readingsRes.data ?? [];
  const prevReadings = prevReadingsRes.data ?? [];

  const batchesByVehicle = new Map<string, { start: number; end: number }[]>();
  const litersByVehicle = new Map<string, number>();
  for (const b of batches) {
    const arr = batchesByVehicle.get(b.vehicle_id) ?? [];
    arr.push({ start: b.start_serial, end: b.end_serial });
    batchesByVehicle.set(b.vehicle_id, arr);
    const prevLiters = litersByVehicle.get(b.vehicle_id) ?? 0;
    litersByVehicle.set(b.vehicle_id, prevLiters + (b.litres ?? 0) * (b.count ?? 0));
  }

  const readingsByVehicle = new Map(readings.map((r) => [r.vehicle_id, r]));
  const prevReadingsByVehicle = new Map(prevReadings.map((r) => [r.vehicle_id, r]));

  const rows = vehicles.map((v) => {
    const r = readingsByVehicle.get(v.id);
    const pr = prevReadingsByVehicle.get(v.id);
    const vehicleBatches = batchesByVehicle.get(v.id) ?? [];
    const serialRanges = vehicleBatches
      .map((b) => `#${b.start}-#${b.end}`)
      .join(", ");
    const fuelType = vehicleBatches.length > 0
      ? (v.fuel_types?.name ?? "—")
      : (v.fuel_types?.name ?? "—");

    return {
      vehicle_id: v.id,
      name: v.name || v.plate,
      plate: v.plate,
      department_id: v.department_id,
      department_name: v.departments?.name ?? "—",
      fuel_type: fuelType,
      serial_ranges: serialRanges || "—",
      total_liters: litersByVehicle.get(v.id) ?? 0,
      current_start: r?.start_reading ?? null,
      current_end: r?.end_reading ?? null,
      distance: r?.distance ?? null,
      prev_start: pr?.start_reading ?? null,
      prev_end: pr?.end_reading ?? null,
    };
  });

  const settings = await getSettings();

  return (
    <SettlementClient
      departments={departments}
      rows={rows}
      selectedMonth={selectedMonth}
      selectedDepartmentId={department_id ?? ""}
      settings={settings}
    />
  );
}
