"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";

export interface VehicleWithRelations {
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
  departments: { name: string } | null;
  vehicle_types: { name: string; category: string } | null;
  fuel_types: { name: string } | null;
}

export async function getVehicles() {
  const supabase = await createClient();
  await requireAuth();
  const { data, error } = await supabase
    .from("vehicles")
    .select("name, *, departments(name), vehicle_types(name, category), fuel_types(name)")
    .eq("is_deleted", false)
    .order("plate");
  if (error) throw new Error(error.message);
  return data as unknown as VehicleWithRelations[];
}

export async function createVehicle(formData: FormData) {
  const supabase = await createClient();
  await requireAuth();
  const name = formData.get("name") as string;
  const plate = formData.get("plate") as string;
  const department_id = formData.get("department_id") as string;
  const vehicle_type_id = formData.get("vehicle_type_id") as string;
  const fuel_type_id = formData.get("fuel_type_id") as string;

  if (!plate?.trim() || plate.trim().length > 50) throw new Error("رقم اللوحة مطلوب");
  if (!department_id) throw new Error("القسم مطلوب");

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .limit(1)
    .single();
  if (!org) throw new Error("لا توجد منظمة مرتبطة");

  const { error } = await supabase.from("vehicles").insert({
    organization_id: org.id,
    department_id,
    name: name?.trim() || plate.trim(),
    plate: plate.trim(),
    vehicle_type_id: vehicle_type_id || null,
    fuel_type_id: fuel_type_id || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/vehicles");
}

export async function updateVehicle(formData: FormData) {
  const supabase = await createClient();
  await requireAuth();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const plate = formData.get("plate") as string;
  const department_id = formData.get("department_id") as string;
  const vehicle_type_id = formData.get("vehicle_type_id") as string;
  const fuel_type_id = formData.get("fuel_type_id") as string;

  if (!id || !plate?.trim() || plate.trim().length > 50) throw new Error("بيانات غير صالحة");
  if (!department_id) throw new Error("القسم مطلوب");

  const { error } = await supabase
    .from("vehicles")
    .update({
      name: name?.trim() || plate.trim(),
      plate: plate.trim(),
      department_id,
      vehicle_type_id: vehicle_type_id || null,
      fuel_type_id: fuel_type_id || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/vehicles");
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient();
  await requireAuth();
  const { error } = await supabase
    .from("vehicles")
    .update({ is_deleted: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/vehicles");
}
