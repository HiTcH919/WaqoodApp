import { getDeductions } from "@/lib/actions/deductions";
import { getDepartments } from "@/lib/actions/departments";
import { getVehicles } from "@/lib/actions/vehicles";
import { DeductionsClient } from "./deductions-client";

export default async function DeductionsPage() {
  const [deductions, vehicles, departments] = await Promise.all([
    getDeductions(),
    getVehicles(),
    getDepartments(),
  ]);
  return (
    <DeductionsClient
      initialDeductions={deductions}
      vehicles={vehicles}
      departments={departments}
    />
  );
}
