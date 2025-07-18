"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import {
  Banner,
  BannerFormData,
  BACKGROUND_STYLES,
  TEXT_COLORS,
  BUTTON_COLORS,
  BUTTON_TEXT_COLORS,
} from "@/lib/types";
import { createBannerSchema } from "@/lib/schemas";
import { z } from "zod";
import * as LucideIcons from "lucide-react";

interface BannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: Banner | null;
  mode: "create" | "edit";
}

// Popular Lucide icons for banners
const POPULAR_ICONS = [
  "Zap",
  "Dumbbell",
  "Scale",
  "Users",
  "Trophy",
  "Target",
  "Heart",
  "Star",
  "Gift",
  "Megaphone",
  "Calendar",
  "Clock",
  "MapPin",
  "Phone",
  "Mail",
  "CheckCircle",
  "AlertCircle",
  "Info",
  "Sparkles",
  "Flame",
];

export function BannerModal({
  open,
  onOpenChange,
  banner,
  mode,
}: BannerModalProps) {
  const { addBanner, updateBanner } = useBlackSheepStore();

  const [formData, setFormData] = useState<BannerFormData>({
    title: "",
    subtitle: "",
    icon: "",
    buttonTitle: "",
    buttonUrl: "",
    badge: false,
    badgeText: "",
    backgroundStyle: "gradient_blue",
    textColor: "white",
    subtitleColor: "gray_light",
    buttonColor: "white",
    textButtonColor: "black",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when banner changes
  useEffect(() => {
    if (banner && mode === "edit") {
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || "",
        icon: banner.icon || "",
        buttonTitle: banner.buttonTitle || "",
        buttonUrl: banner.buttonUrl || "",
        badge: banner.badge || false,
        badgeText: banner.badgeText || "",
        backgroundStyle: getBackgroundStyleKey(banner.backgroundColor),
        textColor: getTextColorKey(banner.textColor),
        subtitleColor: getTextColorKey(
          banner.subtitleColor || banner.textColor
        ),
        buttonColor: getButtonColorKey(banner.buttonColor || "white"),
        textButtonColor: getButtonTextColorKey(
          banner.textButtonColor || "black"
        ),
      });
    } else if (mode === "create") {
      setFormData({
        title: "",
        subtitle: "",
        icon: "",
        buttonTitle: "",
        buttonUrl: "",
        badge: false,
        badgeText: "",
        backgroundStyle: "gradient_blue",
        textColor: "white",
        subtitleColor: "gray_light",
        buttonColor: "white",
        textButtonColor: "black",
      });
    }
    setErrors({});
  }, [banner, mode, open]);

  // Helper functions to get keys from values
  function getBackgroundStyleKey(
    value: string
  ): keyof typeof BACKGROUND_STYLES {
    const key = Object.entries(BACKGROUND_STYLES).find(
      ([_, v]) => v === value
    )?.[0];
    return (key as keyof typeof BACKGROUND_STYLES) || "gradient_blue";
  }

  function getTextColorKey(value: string): keyof typeof TEXT_COLORS {
    const key = Object.entries(TEXT_COLORS).find(([_, v]) => v === value)?.[0];
    return (key as keyof typeof TEXT_COLORS) || "white";
  }

  function getButtonColorKey(value: string): keyof typeof BUTTON_COLORS {
    const key = Object.entries(BUTTON_COLORS).find(
      ([_, v]) => v === value
    )?.[0];
    return (key as keyof typeof BUTTON_COLORS) || "white";
  }

  function getButtonTextColorKey(
    value: string
  ): keyof typeof BUTTON_TEXT_COLORS {
    const key = Object.entries(BUTTON_TEXT_COLORS).find(
      ([_, v]) => v === value
    )?.[0];
    return (key as keyof typeof BUTTON_TEXT_COLORS) || "black";
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Debug: Log form data before validation
      console.log("Form data before validation:", formData);

      // Prepare data for validation - convert form fields to schema fields
      const dataForValidation = {
        title: formData.title,
        subtitle: formData.subtitle,
        icon: formData.icon,
        buttonTitle: formData.buttonTitle,
        buttonUrl: formData.buttonUrl,
        badge: formData.badge,
        badgeText: formData.badgeText,
        backgroundColor: BACKGROUND_STYLES[formData.backgroundStyle], // Convert to actual CSS class
        textColor: TEXT_COLORS[formData.textColor], // Convert to actual CSS class
        subtitleColor: formData.subtitleColor,
        buttonColor: formData.buttonColor,
        textButtonColor: formData.textButtonColor,
      };

      console.log("Data for validation:", dataForValidation);

      // Validate the converted data
      createBannerSchema.parse(dataForValidation);
      setErrors({});

      console.log("Validation passed!");

      const bannerData = {
        title: formData.title,
        subtitle: formData.subtitle?.trim() || undefined,
        icon:
          formData.icon === "none" || !formData.icon?.trim()
            ? undefined
            : formData.icon,
        buttonTitle: formData.buttonTitle?.trim() || undefined,
        buttonUrl: formData.buttonUrl?.trim() || undefined,
        badge: formData.badge,
        badgeText: formData.badge
          ? formData.badgeText?.trim() || undefined
          : undefined,
        backgroundColor: BACKGROUND_STYLES[formData.backgroundStyle],
        textColor: TEXT_COLORS[formData.textColor],
        subtitleColor: TEXT_COLORS[formData.subtitleColor],
        buttonColor: BUTTON_COLORS[formData.buttonColor],
        textButtonColor: BUTTON_TEXT_COLORS[formData.textButtonColor],
        isActive: true,
        order: 0, // Will be auto-assigned by the store
      };

      console.log("Banner data to save:", bannerData);

      if (mode === "edit" && banner) {
        console.log("Updating banner:", banner.id);
        updateBanner(banner.id, bannerData);
      } else {
        console.log("Adding new banner");
        addBanner(bannerData);
      }

      console.log("Banner operation completed, closing modal");
      onOpenChange(false);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      if (error instanceof z.ZodError) {
        console.log("Validation errors:", error.errors);
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        console.error("Unexpected error:", error);
        setErrors({ general: "Error inesperado al guardar el banner" });
      }
    }
  };

  // Get icon component
  const IconComponent = formData.icon
    ? (LucideIcons as any)[formData.icon]
    : null;

  // Helper function to get background class - using explicit classes for Tailwind
  const getBannerBackgroundClass = (
    styleKey: keyof typeof BACKGROUND_STYLES
  ) => {
    switch (styleKey) {
      case "gradient_blue":
        return "bg-gradient-to-r from-blue-500 to-blue-700";
      case "gradient_green":
        return "bg-gradient-to-r from-green-500 to-green-700";
      case "gradient_purple":
        return "bg-gradient-to-r from-purple-500 to-purple-700";
      case "gradient_orange":
        return "bg-gradient-to-r from-orange-500 to-orange-700";
      case "gradient_red":
        return "bg-gradient-to-r from-red-500 to-red-700";
      case "solid_dark":
        return "bg-gray-900";
      case "solid_primary":
        return "bg-primary";
      case "pattern_dots":
        return "bg-gray-900";
      default:
        return "bg-gradient-to-r from-blue-500 to-blue-700";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {mode === "edit" ? "Editar Banner" : "Crear Banner"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Modifica la información del banner."
              : "Completa la información para crear un nuevo banner."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-6 min-h-0">
          {/* Form Section */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Información Básica</h3>

                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Título del banner"
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="subtitle">Subtítulo</Label>
                  <Textarea
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subtitle: e.target.value,
                      }))
                    }
                    placeholder="Descripción o subtítulo (opcional)"
                    rows={2}
                    className={errors.subtitle ? "border-red-500" : ""}
                  />
                  {errors.subtitle && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.subtitle}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="icon">Icono</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, icon: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un icono (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin icono</SelectItem>
                      {POPULAR_ICONS.map((iconName) => {
                        const Icon = (LucideIcons as any)[iconName];
                        return (
                          <SelectItem key={iconName} value={iconName}>
                            <div className="flex items-center gap-2">
                              {Icon && <Icon className="w-4 h-4" />}
                              {iconName}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Button Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuración del Botón</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buttonTitle">Texto del Botón</Label>
                    <Input
                      id="buttonTitle"
                      value={formData.buttonTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          buttonTitle: e.target.value,
                        }))
                      }
                      placeholder="Ej: Ver Más"
                      className={errors.buttonTitle ? "border-red-500" : ""}
                    />
                    {errors.buttonTitle && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.buttonTitle}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="buttonUrl">URL del Botón</Label>
                    <Input
                      id="buttonUrl"
                      value={formData.buttonUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          buttonUrl: e.target.value,
                        }))
                      }
                      placeholder="/app/calendar o https://ejemplo.com"
                      className={errors.buttonUrl ? "border-red-500" : ""}
                    />
                    {errors.buttonUrl && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.buttonUrl}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Badge Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Badge</h3>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="badge"
                    checked={formData.badge}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, badge: checked }))
                    }
                  />
                  <Label htmlFor="badge">Mostrar badge</Label>
                </div>

                {formData.badge && (
                  <div>
                    <Label htmlFor="badgeText">Texto del Badge</Label>
                    <Input
                      id="badgeText"
                      value={formData.badgeText}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          badgeText: e.target.value,
                        }))
                      }
                      placeholder="NUEVO, OFERTA, etc."
                      className={errors.badgeText ? "border-red-500" : ""}
                    />
                    {errors.badgeText && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.badgeText}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Style Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Estilo y Colores</h3>

                <div>
                  <Label htmlFor="backgroundStyle">Estilo de Fondo</Label>
                  <Select
                    value={formData.backgroundStyle}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        backgroundStyle:
                          value as keyof typeof BACKGROUND_STYLES,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BACKGROUND_STYLES).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${value}`} />
                            {key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="textColor">Color del Texto</Label>
                    <Select
                      value={formData.textColor}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          textColor: value as keyof typeof TEXT_COLORS,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TEXT_COLORS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            <span className={value}>
                              {key
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subtitleColor">Color del Subtítulo</Label>
                    <Select
                      value={formData.subtitleColor}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          subtitleColor: value as keyof typeof TEXT_COLORS,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TEXT_COLORS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            <span className={value}>
                              {key
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buttonColor">Color del Botón</Label>
                    <Select
                      value={formData.buttonColor}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          buttonColor: value as keyof typeof BUTTON_COLORS,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BUTTON_COLORS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="textButtonColor">
                      Color del Texto del Botón
                    </Label>
                    <Select
                      value={formData.textButtonColor}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          textButtonColor:
                            value as keyof typeof BUTTON_TEXT_COLORS,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BUTTON_TEXT_COLORS).map(
                          ([key, value]) => (
                            <SelectItem key={key} value={key}>
                              <span className={value}>
                                {key
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </span>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {mode === "edit" ? "Guardar Cambios" : "Crear Banner"}
                </Button>
              </div>
            </form>
          </div>

          {/* Preview Section */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-0">
              <h3 className="text-lg font-medium mb-4">Vista Previa</h3>
              <div
                className={`p-6 rounded-lg min-h-[160px] flex flex-col justify-center relative overflow-hidden ${
                  formData.backgroundStyle === "gradient_blue"
                    ? "bg-gradient-to-r from-blue-500 to-blue-700"
                    : formData.backgroundStyle === "gradient_green"
                    ? "bg-gradient-to-r from-green-500 to-green-700"
                    : formData.backgroundStyle === "gradient_purple"
                    ? "bg-gradient-to-r from-purple-500 to-purple-700"
                    : formData.backgroundStyle === "gradient_orange"
                    ? "bg-gradient-to-r from-orange-500 to-orange-700"
                    : formData.backgroundStyle === "gradient_red"
                    ? "bg-gradient-to-r from-red-500 to-red-700"
                    : formData.backgroundStyle === "solid_dark"
                    ? "bg-gray-900"
                    : formData.backgroundStyle === "solid_primary"
                    ? "bg-primary"
                    : formData.backgroundStyle === "pattern_dots"
                    ? "bg-gray-900 bg-[radial-gradient(white_1px,transparent_1px)] bg-[size:20px_20px]"
                    : "bg-gradient-to-r from-blue-500 to-blue-700"
                }`}
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    {IconComponent && (
                      <IconComponent
                        className={`w-6 h-6 ${TEXT_COLORS[formData.textColor]}`}
                      />
                    )}
                    <h3
                      className={`${
                        TEXT_COLORS[formData.textColor]
                      } text-xl font-bold`}
                    >
                      {formData.title || "Título del Banner"}
                    </h3>
                    {formData.badge && formData.badgeText && (
                      <Badge className="bg-yellow-500 text-yellow-900 text-xs">
                        {formData.badgeText}
                      </Badge>
                    )}
                  </div>
                  {formData.subtitle && (
                    <p
                      className={`${
                        TEXT_COLORS[formData.subtitleColor]
                      } text-sm opacity-90 mb-3`}
                    >
                      {formData.subtitle}
                    </p>
                  )}
                  {formData.buttonTitle && (
                    <Button
                      size="sm"
                      className={`${BUTTON_COLORS[formData.buttonColor]} ${
                        BUTTON_TEXT_COLORS[formData.textButtonColor]
                      } text-sm`}
                    >
                      {formData.buttonTitle}
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  Esta es una vista previa de cómo se verá tu banner en la
                  aplicación.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
