import {
  LayoutDashboard,
  Building2,
  Car,
  Ticket,
  Fuel,
  FileText,
  BookOpen,
  Scissors,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "لوحة القيادة", href: "/dashboard", icon: LayoutDashboard },
  { label: "الإدارات", href: "/departments", icon: Building2 },
  { label: "المركبات", href: "/vehicles", icon: Car },
  { label: "صرف البونات", href: "/coupons", icon: Ticket },
  { label: "أسعار الوقود", href: "/prices", icon: Fuel },
  { label: "التقارير", href: "/reports", icon: FileText },
  { label: "التسوية", href: "/settlement", icon: BookOpen },
  { label: "الاستقطاعات", href: "/deductions", icon: Scissors },
  { label: "الإعدادات", href: "/settings", icon: Settings },
];
