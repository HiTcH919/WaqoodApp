"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";

const ALLOWED_SETTINGS_KEYS = ["company_name", "report_footer"];

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

export async function createFuelType(formData: FormData) {
  const supabase = await createClient();
  await requireAuth();
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const default_litres = parseFloat(formData.get("default_litres") as string) || 20;

  const { error } = await supabase
    .from("fuel_types")
    .insert({ name, category, default_litres });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updateFuelType(formData: FormData) {
  const supabase = await createClient();
  await requireAuth();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const default_litres = parseFloat(formData.get("default_litres") as string) || 20;

  const { error } = await supabase
    .from("fuel_types")
    .update({ name, category, default_litres })
    .eq("id", id);
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

export async function createVehicleType(formData: FormData) {
  const supabase = await createClient();
  await requireAuth();
  const category = formData.get("category") as string;
  const name = formData.get("name") as string;

  const { error } = await supabase
    .from("vehicle_types")
    .insert({ category, name });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updateVehicleType(formData: FormData) {
  const supabase = await createClient();
  await requireAuth();
  const id = formData.get("id") as string;
  const category = formData.get("category") as string;
  const name = formData.get("name") as string;

  const { error } = await supabase
    .from("vehicle_types")
    .update({ category, name })
    .eq("id", id);
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
  const { data } = await supabase
    .from("settings")
    .select("*");
  const map: Record<string, string> = {};
  for (const s of data ?? []) {
    map[s.key] = s.value;
  }
  return map;
}

export async function updateSetting(key: string, value: string) {
  const supabase = await createClient();
  await requireAuth();
  if (!ALLOWED_SETTINGS_KEYS.includes(key)) throw new Error("مفتاح الإعداد غير مسموح به");
  if (!value?.trim() || value.trim().length > 500) throw new Error("القيمة غير صالحة");
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value: value.trim() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
