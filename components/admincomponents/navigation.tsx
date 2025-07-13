"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  Settings,
  Bell,
  ClipboardList,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Alumnos", href: "/admin/alumnos", icon: Users },
  { name: "Instructores", href: "/admin/instructores", icon: GraduationCap },
  { name: "Clases", href: "/admin/clases", icon: ClipboardList },
  { name: "Calendario", href: "/admin/calendario", icon: Calendar },
  { name: "Notificaciones", href: "/admin/alertas", icon: Bell },
  { name: "Horarios", href: "/admin/horarios", icon: Calendar },
  { name: "Planes", href: "/admin/planes", icon: CreditCard },
  { name: "Configuración", href: "/admin/configuraciones", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <>
      <nav className="space-y-1 p-4 hidden sm:block">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.name}
          </Link>
        ))}
      </nav>
      <nav className="fixed p-2.5 border border-white/10 bottom-2 inset-x-0 mx-auto rounded-full flex flex-row justify-around w-[95dvw] sm:w-[60dvw] bg-white backdrop-blur-xl text-center z-30 sm:hidden">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-colors",
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.name}
          </Link>
        ))}
      </nav>
    </>
  );
}
