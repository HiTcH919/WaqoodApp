"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { DeductionSchema } from "@/lib/schemas";
import type { z } from "zod";

export interface DeductionWithRelations {
  id: string;
  organization_id: string;
  vehicle_id: string | null;
  department_id: string | null;
  amount: number;
  reason: string;
  month: string;
  created_by: string | null;
  created_at: string;
  vehicles: { plate: string } | null;
  departments: { name: string } | null;
}

export async function getDeductions(month?: string) {
  const supabase = await createClient();
  await requireAuth();
  let query = supabase
    .from("deductions")
    .select("*, vehicles(plate), departments(name)")
    .order("created_at", { ascending: false });

  if (month) {
    query = query.eq("month", month);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as unknown as DeductionWithRelations[];
}

export async function createDeduction(input: z.infer<typeof DeductionSchema>) {
  const validated = DeductionSchema.parse(input);
  const supabase = await createClient();
  const user = await requireAuth();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .limit(1)
    .single();
  if (!org) throw new Error("لا توجد منظمة مرتبطة");

  const { error } = await supabase.from("deductions").insert({
    organization_id: org.id,
    vehicle_id: validated.vehicle_id || null,
    department_id: validated.department_id || null,
    amount: validated.amount,
    reason: validated.reason.trim(),
    month: validated.month,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/deductions");
}

export async function deleteDeduction(id: string) {
  const supabase = await createClient();
  await requireAuth();
  const { error } = await supabase.from("deductions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/deductions");
}
