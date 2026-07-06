"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";

export async function getOdometerReadings(month: string) {
  const supabase = await createClient();
  await requireAuth();
  const { data, error } = await supabase
    .from("odometer_readings")
    .select("*")
    .eq("month", month);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertOdometerReading(formData: FormData) {
  const supabase = await createClient();
  await requireAuth();
  const vehicle_id = formData.get("vehicle_id") as string;
  const month = formData.get("month") as string;
  const start_reading = parseFloat(formData.get("start_reading") as string);
  const end_reading = parseFloat(formData.get("end_reading") as string);
  const distance = formData.get("distance")
    ? parseFloat(formData.get("distance") as string)
    : null;

  if (!vehicle_id || !month) throw new Error("بيانات غير صالحة");

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .limit(1)
    .single();

  const { error } = await supabase.from("odometer_readings").upsert(
    {
      organization_id: org!.id,
      vehicle_id,
      month,
      start_reading: start_reading || 0,
      end_reading: end_reading || 0,
      distance,
    },
    { onConflict: "vehicle_id, month" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/settlement");
}
