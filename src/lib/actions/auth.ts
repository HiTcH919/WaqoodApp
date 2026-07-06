"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function login(_prev: unknown, formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip") ?? "unknown";

  if (!checkRateLimit(`login:${ip}`)) {
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };

  redirect("/dashboard");
}
