"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { OdometerReadingSchema } from "@/lib/schemas";
import type { z } from "zod";

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

export async function upsertOdometerReading(input: z.infer<typeof OdometerReadingSchema>) {
  const validated = OdometerReadingSchema.parse(input);
  const supabase = await createClient();
  await requireAuth();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .limit(1)
    .single();

  if (!org) throw new Error("لا توجد منظمة مرتبطة");

  const { error } = await supabase.from("odometer_readings").upsert(
    {
      organization_id: org.id,
      vehicle_id: validated.vehicle_id,
      month: validated.month,
      start_reading: validated.start_reading,
      end_reading: validated.end_reading,
      distance: validated.distance ?? null,
    },
    { onConflict: "vehicle_id, month" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/settlement");
}
