"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";
import { LoginSchema } from "@/lib/schemas";
import type { z } from "zod";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function login(_prev: unknown, formData: FormData) {
  const ip = await getClientIP();

  if (!(await checkRateLimit(`login:${ip}`))) {
    return { error: "محاولات كثيرة جداً. حاول لاحقاً." };
  }

  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = LoginSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };

  redirect("/dashboard");
}
