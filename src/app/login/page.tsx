"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel } from "lucide-react";
import { login } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full text-lg" disabled={pending}>
      {pending ? "جاري التسجيل..." : "تسجيل الدخول"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, { error: "" });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl">
              <Fuel size={40} className="text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black">نظام إدارة الوقود</CardTitle>
          <p className="text-muted-foreground font-bold text-sm mt-1">سجل دخولك للمتابعة</p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">البريد الإلكتروني</label>
              <Input
                type="email"
                name="email"
                placeholder="admin@example.com"
                required
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">كلمة المرور</label>
              <Input
                type="password"
                name="password"
                placeholder="••••••••"
                required
                dir="ltr"
              />
            </div>

            {state?.error && (
              <div className="bg-destructive/10 text-destructive text-sm font-bold p-3 rounded-xl border border-destructive/20">
                {state.error}
              </div>
            )}

            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
