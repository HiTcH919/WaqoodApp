import { createClient } from "@/lib/supabase/server";
import { currentMonthStr } from "@/lib/constants";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const month = currentMonthStr();

  const [departmentsResult, vehiclesResult, batchesResult, deductionsResult] =
    await Promise.all([
      supabase.from("departments").select("id, name").order("name"),
      supabase.from("vehicles").select("id, name, department_id").eq("is_deleted", false),
      supabase
        .from("coupon_batches")
        .select("id, count, cost, litres, month, vehicle_id, department_id, vehicle:vehicles(name, plate), department:departments(name), created_at")
        .eq("month", month)
        .order("created_at", { ascending: false }),
      supabase
        .from("deductions")
        .select("amount, department_id")
        .eq("month", month),
    ]);

  const departments = departmentsResult.data ?? [];
  const vehicles = vehiclesResult.data ?? [];
  const allBatches = (batchesResult.data ?? []).map((b) => ({
    id: b.id,
    count: b.count,
    cost: Number(b.cost),
    litres: Number(b.litres),
    month: b.month,
    department_id: b.department_id,
    vehicle_name: ((b.vehicle as unknown as { name: string } | null)?.name) ?? "—",
    plate: ((b.vehicle as unknown as { plate: string } | null)?.plate) ?? "—",
    department: ((b.department as unknown as { name: string } | null)?.name) ?? "—",
  }));
  const allDeductions = (deductionsResult.data ?? []).map((d) => ({
    amount: Number(d.amount),
    department_id: d.department_id,
  }));

  return (
    <DashboardClient
      departments={departments}
      allVehicles={vehicles}
      allBatches={allBatches}
      allDeductions={allDeductions}
    />
  );
}
