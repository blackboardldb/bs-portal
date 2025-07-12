"use client";

import { usePathname } from "next/navigation";
import { House, Calendar, CircleUser } from "lucide-react";
import React from "react";

type NavItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
  extraClass?: string;
};

export default function GlobalNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/app") return pathname === "/app";
    return pathname.startsWith(path);
  };

  const getLinkClass = (path: string, extraClass = "") =>
    [
      isActive(path) ? "text-lime-500" : "text-slate-100",
      "transition-colors",
      extraClass,
    ].join(" ");

  const navItems: NavItem[] = [
    {
      href: "/app",
      icon: <House className="w-6 h-6 mx-auto" />,
      label: "Inicio",
      extraClass: "w-14 h-12",
    },
    {
      href: "/app/calendar",
      icon: <Calendar className="w-6 h-6 mx-auto" />,
      label: "Clases",
      extraClass: "w-14 h-12",
    },
    {
      href: "/app/profile",
      icon: <CircleUser className="w-6 h-6 mx-auto" />,
      label: "Perfil",
      extraClass: "w-14 h-12",
    },
  ];

  return (
    <nav className="fixed p-2.5 border border-white/10 bottom-2 inset-x-0 mx-auto rounded-full flex flex-row justify-around w-[95dvw] sm:w-[60dvw] bg-zinc-900/80 backdrop-blur-xl text-center z-30">
      {navItems.map(({ href, icon, label, extraClass }) => (
        <a key={href} href={href} className={getLinkClass(href, extraClass)}>
          {icon}
          <span className="text-xs">{label}</span>
        </a>
      ))}
    </nav>
  );
}
