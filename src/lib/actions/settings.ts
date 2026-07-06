"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import {
  FuelTypeSchema,
  UpdateFuelTypeSchema,
  VehicleTypeSchema,
  UpdateVehicleTypeSchema,
} from "@/lib/schemas";
import type { z } from "zod";

const ALLOWED_SETTINGS_KEYS = ["company_name", "report_footer"] as const;
type SettingsKey = (typeof ALLOWED_SETTINGS_KEYS)[number];

// ───────────────────────────────
// Fuel Types
// ───────────────────────────────

export async function getFuelTypes() {
  const supabase = await createClient();
  await requireAuth();
  const { data } = await supabase
    .from("fuel_types")
    .select("*")
    .order("name");
  return data ?? [];
}

export async function createFuelType(input: z.infer<typeof FuelTypeSchema>) {
  const validated = FuelTypeSchema.parse(input);
  const supabase = await createClient();
  await requireAuth();

  const { error } = await supabase
    .from("fuel_types")
    .insert({
      name: validated.name,
      category: validated.category,
      default_litres: validated.default_litres,
    });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updateFuelType(input: z.infer<typeof UpdateFuelTypeSchema>) {
  const validated = UpdateFuelTypeSchema.parse(input);
  const supabase = await createClient();
  await requireAuth();

  const { error } = await supabase
    .from("fuel_types")
    .update({
      name: validated.name,
      category: validated.category,
      default_litres: validated.default_litres,
    })
    .eq("id", validated.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function deleteFuelType(id: string) {
  const supabase = await createClient();
  await requireAuth();

  const { count: vehicleCount } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true })
    .eq("fuel_type_id", id);

  if (vehicleCount && vehicleCount > 0) {
    throw new Error("لا يمكن حذف هذا النوع لأنه مرتبط بمركبات");
  }

  const { error } = await supabase.from("fuel_types").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

// ───────────────────────────────
// Vehicle Types
// ───────────────────────────────

export async function getVehicleTypes() {
  const supabase = await createClient();
  await requireAuth();
  const { data } = await supabase
    .from("vehicle_types")
    .select("*")
    .order("category")
    .order("name");
  return data ?? [];
}

export async function createVehicleType(input: z.infer<typeof VehicleTypeSchema>) {
  const validated = VehicleTypeSchema.parse(input);
  const supabase = await createClient();
  await requireAuth();

  const { error } = await supabase
    .from("vehicle_types")
    .insert({ category: validated.category, name: validated.name });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updateVehicleType(input: z.infer<typeof UpdateVehicleTypeSchema>) {
  const validated = UpdateVehicleTypeSchema.parse(input);
  const supabase = await createClient();
  await requireAuth();

  const { error } = await supabase
    .from("vehicle_types")
    .update({ category: validated.category, name: validated.name })
    .eq("id", validated.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function deleteVehicleType(id: string) {
  const supabase = await createClient();
  await requireAuth();

  const { count: vehicleCount } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true })
    .eq("vehicle_type_id", id);

  if (vehicleCount && vehicleCount > 0) {
    throw new Error("لا يمكن حذف هذه الفئة لأنها مرتبطة بمركبات");
  }

  const { error } = await supabase.from("vehicle_types").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

// ───────────────────────────────
// General Settings (key-value)
// ───────────────────────────────

export async function getSettings() {
  const supabase = await createClient();
  await requireAuth();
  const { data } = await supabase.from("settings").select("*");
  const map: Record<string, string> = {};
  for (const s of data ?? []) {
    map[s.key] = s.value;
  }
  return map;
}

export async function updateSetting(key: string, value: string) {
  const supabase = await createClient();
  await requireAuth();
  if (!ALLOWED_SETTINGS_KEYS.includes(key as SettingsKey))
    throw new Error("مفتاح الإعداد غير مسموح به");
  if (!value?.trim() || value.trim().length > 500) throw new Error("القيمة غير صالحة");
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value: value.trim() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
