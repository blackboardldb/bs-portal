"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BannerManager } from "@/components/admincomponents/banner-manager";

export default function BannersPage() {
  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/admin/configuraciones">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Configuraciones
            </Button>
          </Link>
        </div>
      </div>

      {/* Banner Manager Component */}
      <BannerManager />
    </div>
  );
}
