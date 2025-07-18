"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import { Banner } from "@/lib/types";
import * as LucideIcons from "lucide-react";

interface BannerCardProps {
  banner: Banner;
  onToggle: (id: string) => void;
  onEdit: (banner: Banner) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

export function BannerCard({
  banner,
  onToggle,
  onEdit,
  onDelete,
  isDragging = false,
  dragHandleProps,
}: BannerCardProps) {
  // Get icon component if specified
  const IconComponent = banner.icon ? (LucideIcons as any)[banner.icon] : null;

  return (
    <div
      className={`relative transition-all duration-200 ${
        isDragging ? "opacity-50 scale-105" : ""
      }`}
    >
      {/* Banner Preview */}
      <div
        className={`p-4 rounded-lg mb-3 min-h-[120px] flex flex-col justify-center relative overflow-hidden ${
          banner.backgroundColor ===
          "bg-gradient-to-r from-blue-500 to-blue-700"
            ? "bg-gradient-to-r from-blue-500 to-blue-700"
            : banner.backgroundColor ===
              "bg-gradient-to-r from-green-500 to-green-700"
            ? "bg-gradient-to-r from-green-500 to-green-700"
            : banner.backgroundColor ===
              "bg-gradient-to-r from-purple-500 to-purple-700"
            ? "bg-gradient-to-r from-purple-500 to-purple-700"
            : banner.backgroundColor ===
              "bg-gradient-to-r from-orange-500 to-orange-700"
            ? "bg-gradient-to-r from-orange-500 to-orange-700"
            : banner.backgroundColor ===
              "bg-gradient-to-r from-red-500 to-red-700"
            ? "bg-gradient-to-r from-red-500 to-red-700"
            : banner.backgroundColor ===
              "bg-gradient-to-r from-violet-200 to-pink-200"
            ? "bg-gradient-to-r from-violet-200 to-pink-200"
            : banner.backgroundColor ===
              "bg-gradient-to-r from-emerald-400 to-cyan-400"
            ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
            : banner.backgroundColor ===
              "bg-gradient-to-r from-emerald-500 to-emerald-900"
            ? "bg-gradient-to-r from-emerald-500 to-emerald-900"
            : banner.backgroundColor === "bg-gray-900"
            ? "bg-gray-900"
            : banner.backgroundColor.includes("bg-gradient")
            ? banner.backgroundColor
            : "bg-gradient-to-r from-blue-500 to-blue-700"
        }`}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            {IconComponent && (
              <IconComponent className={`w-5 h-5 ${banner.textColor}`} />
            )}
            <h3 className={`${banner.textColor} text-lg font-bold`}>
              {banner.title}
            </h3>
            {banner.badge && banner.badgeText && (
              <Badge className="bg-yellow-500 text-yellow-900 text-xs">
                {banner.badgeText}
              </Badge>
            )}
          </div>
          {banner.subtitle && (
            <p
              className={`${
                banner.subtitleColor || banner.textColor
              } text-sm opacity-90 mb-2`}
            >
              {banner.subtitle}
            </p>
          )}
          {banner.buttonTitle && (
            <Button
              size="sm"
              className={`${banner.buttonColor} ${banner.textButtonColor} text-xs pointer-events-none`}
            >
              {banner.buttonTitle}
            </Button>
          )}
        </div>

        {/* Status Indicator */}
        <div className="absolute top-2 right-2">
          <Badge
            variant={banner.isActive ? "default" : "secondary"}
            className={banner.isActive ? "bg-green-500" : "bg-gray-500"}
          >
            {banner.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        {/* Drag Handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="absolute top-2 left-2 cursor-grab active:cursor-grabbing p-1 rounded bg-black/20 hover:bg-black/30 transition-colors"
          >
            <GripVertical className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Banner Info and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Orden: {banner.order + 1}
          </Badge>
          {banner.buttonUrl && (
            <Badge
              variant="outline"
              className="text-xs bg-blue-50 text-blue-700"
            >
              Con enlace
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(banner.id)}
            className="h-8 w-8 p-0"
            title={banner.isActive ? "Desactivar banner" : "Activar banner"}
          >
            {banner.isActive ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(banner)}
            className="h-8 w-8 p-0"
            title="Editar banner"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(banner.id)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            title="Eliminar banner"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Creado: {new Date(banner.createdAt).toLocaleDateString()}</span>
          {banner.icon && (
            <span className="flex items-center gap-1">
              {IconComponent && <IconComponent className="w-3 h-3" />}
              {banner.icon}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
