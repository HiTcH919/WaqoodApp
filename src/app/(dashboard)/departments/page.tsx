import { getDepartments } from "@/lib/actions/departments";
import { DepartmentsClient } from "./departments-client";

export default async function DepartmentsPage() {
  const departments = await getDepartments();
  return     <DepartmentsClient initialDepartments={departments} />;
}
