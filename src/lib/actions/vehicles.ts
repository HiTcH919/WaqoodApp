"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { VehicleSchema, UpdateVehicleSchema } from "@/lib/schemas";

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

export async function createVehicle(input: { name: string; plate: string; department_id: string; vehicle_type_id?: string | null; fuel_type_id?: string | null }) {
  const validated = VehicleSchema.parse(input);
  const supabase = await createClient();
  await requireAuth();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .limit(1)
    .single();
  if (!org) throw new Error("لا توجد منظمة مرتبطة");

  const { error } = await supabase.from("vehicles").insert({
    organization_id: org.id,
    department_id: validated.department_id,
    name: validated.name?.trim() || validated.plate.trim(),
    plate: validated.plate.trim(),
    vehicle_type_id: validated.vehicle_type_id || null,
    fuel_type_id: validated.fuel_type_id || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/vehicles");
}

export async function updateVehicle(input: { id: string; name: string; plate: string; department_id: string; vehicle_type_id?: string | null; fuel_type_id?: string | null }) {
  const validated = UpdateVehicleSchema.parse({ ...input });
  const supabase = await createClient();
  await requireAuth();

  const { error } = await supabase
    .from("vehicles")
    .update({
      name: validated.name?.trim() || validated.plate.trim(),
      plate: validated.plate.trim(),
      department_id: validated.department_id,
      vehicle_type_id: validated.vehicle_type_id || null,
      fuel_type_id: validated.fuel_type_id || null,
    })
    .eq("id", validated.id);
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
