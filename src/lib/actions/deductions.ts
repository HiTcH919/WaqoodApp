"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";

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

export async function createDeduction(formData: FormData) {
  const supabase = await createClient();
  await requireAuth();
  const vehicle_id = formData.get("vehicle_id") as string;
  const department_id = formData.get("department_id") as string;
  const amount = formData.get("amount") as string;
  const reason = formData.get("reason") as string;
  const month = formData.get("month") as string;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) throw new Error("المبلغ غير صالح");
  if (!reason?.trim() || reason.trim().length > 500) throw new Error("السبب مطلوب");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) throw new Error("الشهر غير صالح");

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .limit(1)
    .single();
  if (!org) throw new Error("لا توجد منظمة مرتبطة");

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("المستخدم غير مسجل");

  const { error } = await supabase.from("deductions").insert({
    organization_id: org.id,
    vehicle_id: vehicle_id || null,
    department_id: department_id || null,
    amount: Number(amount),
    reason: reason.trim(),
    month,
    created_by: user.user.id,
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
