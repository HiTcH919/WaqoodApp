"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function MobileNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-xs font-bold transition",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon size={20} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-xs font-bold text-muted-foreground transition"
        >
          {mounted && theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          <span className="text-[10px]">{mounted && theme === "dark" ? "نهار" : "ليل"}</span>
        </button>
      </div>
    </nav>
  );
}
