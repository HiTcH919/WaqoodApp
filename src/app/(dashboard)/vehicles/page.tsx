import { requireAuth } from "@/lib/auth-utils";
import { getVehicles } from "@/lib/actions/vehicles";
import { getDepartments } from "@/lib/actions/departments";
import { createClient } from "@/lib/supabase/server";
import { VehiclesClient } from "./vehicles-client";

export default async function VehiclesPage() {
  await requireAuth();
  const [vehicles, departments] = await Promise.all([
    getVehicles(),
    getDepartments(),
  ]);

  const supabase = await createClient();

  const { data: vehicleTypes } = await supabase
    .from("vehicle_types")
    .select("*")
    .order("category");

  const { data: fuelTypes } = await supabase
    .from("fuel_types")
    .select("*")
    .order("name");

  return (
    <VehiclesClient
      initialVehicles={vehicles}
      departments={departments}
      vehicleTypes={vehicleTypes ?? []}
      fuelTypes={fuelTypes ?? []}
    />
  );
}
