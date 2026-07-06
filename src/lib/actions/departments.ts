"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";

export async function getDepartments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function createDepartment(formData: FormData) {
  const supabase = await createClient();
  await requireAuth();
  const name = formData.get("name") as string;
  if (!name?.trim() || name.trim().length > 200) throw new Error("اسم القسم مطلوب");

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .limit(1)
    .single();
  if (!org) throw new Error("لا توجد منظمة مرتبطة");

  const { error } = await supabase.from("departments").insert({
    organization_id: org.id,
    name: name.trim(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/departments");
}

export async function updateDepartment(formData: FormData) {
  const supabase = await createClient();
  await requireAuth();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  if (!id || !name?.trim() || name.trim().length > 200) throw new Error("بيانات غير صالحة");

  const { error } = await supabase
    .from("departments")
    .update({ name: name.trim() })
    .eq("id", id);
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
