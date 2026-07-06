"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import { Fuel, LogOut, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { logout } from "@/lib/actions/auth";

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border-l border-border h-screen sticky top-0 shrink-0">
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-xl">
            <Fuel size={28} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-black text-xl text-foreground">Waqood</h1>
            <p className="text-xs text-muted-foreground font-bold">نظام إدارة الوقود</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition w-full"
        >
          {mounted && theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          <span>{mounted && theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}</span>
        </button>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition w-full"
          >
            <LogOut size={20} />
            <span>تسجيل خروج</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
