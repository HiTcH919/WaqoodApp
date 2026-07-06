"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { DepartmentSchema, UpdateDepartmentSchema } from "@/lib/schemas";
import type { z } from "zod";

export async function getDepartments() {
  const supabase = await createClient();
  await requireAuth();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function createDepartment(input: z.infer<typeof DepartmentSchema>) {
  const validated = DepartmentSchema.parse(input);
  const supabase = await createClient();
  await requireAuth();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .limit(1)
    .single();
  if (!org) throw new Error("لا توجد منظمة مرتبطة");

  const { error } = await supabase.from("departments").insert({
    organization_id: org.id,
    name: validated.name.trim(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/departments");
}

export async function updateDepartment(input: z.infer<typeof UpdateDepartmentSchema>) {
  const validated = UpdateDepartmentSchema.parse(input);
  const supabase = await createClient();
  await requireAuth();

  const { error } = await supabase
    .from("departments")
    .update({ name: validated.name.trim() })
    .eq("id", validated.id);
  if (error) throw new Error(error.message);
  revalidatePath("/departments");
}

export async function deleteDepartment(id: string) {
  const supabase = await createClient();
  await requireAuth();

  const { count } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true })
    .eq("department_id", id);
  if (count && count > 0) throw new Error("لا يمكن حذف القسم لأنه مرتبط بمركبات");

  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/departments");
}
