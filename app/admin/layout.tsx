"use client";
import type React from "react";
import { Navigation } from "../../components/admincomponents/navigation";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, Menu, Settings, LogOut } from "lucide-react";
import { useNotificationCount } from "@/lib/hooks/useNotificationCount";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const notificationCount = useNotificationCount();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <Logo />

        <div className="flex items-center gap-4">
          {/* Icono de notificaciones con badge */}
          <Link href="/admin/alertas">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {notificationCount > 9 ? "9+" : notificationCount}
                </Badge>
              )}
            </Button>
          </Link>

          {/* Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4 mr-2" />
                Menú
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link
                  href="/admin/configuraciones"
                  className="flex items-center"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => (window.location.href = "/")}
                className="flex items-center text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex h-screen bg-gray-50">
        <Navigation />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
