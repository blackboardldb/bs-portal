"use client";
import type React from "react";
import { Navigation } from "../../components/admincomponents/navigation";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <Logo />
        <Button
          variant="outline"
          size={"sm"}
          onClick={() => (window.location.href = "/")}
        >
          Cerrar sesión
        </Button>
      </header>
      <div className="flex h-screen bg-gray-50">
        <Navigation />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
