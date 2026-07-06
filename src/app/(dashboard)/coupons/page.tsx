import { createClient } from "@/lib/supabase/server";
import { currentMonthStr } from "@/lib/constants";
import { CouponsClient } from "./coupons-client";

export default async function CouponsPage() {
  const supabase = await createClient();
  const month = currentMonthStr();

  const [vehiclesRes, fuelTypesRes, batchesRes] = await Promise.all([
    supabase.from("vehicles").select("*, departments(name), fuel_types(name), vehicle_types(name)").eq("is_deleted", false).order("plate"),
    supabase.from("fuel_types").select("*").order("name"),
    supabase.from("coupon_batches").select("*, fuel_types(name), vehicles(name, plate), departments(name)").eq("month", month).order("created_at", { ascending: false }),
  ]);

  return (
    <CouponsClient
      vehicles={vehiclesRes.data || []}
      fuelTypes={fuelTypesRes.data || []}
      batches={batchesRes.data || []}
      month={month}
    />
  );
}
