"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/lib/types";
import * as LucideIcons from "lucide-react";

interface BannerItemProps {
  banner: Banner;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const BannerItem: React.FC<BannerItemProps> = ({
  banner,
  className = "",
  size = "md",
}) => {
  // Validate banner data
  if (!banner || !banner.id || !banner.title) {
    return (
      <div className="h-40 w-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-6 h-6 mx-auto mb-2">⚠️</div>
          <p className="text-sm">Banner inválido</p>
        </div>
      </div>
    );
  }

  // Get icon component if specified, with error handling
  let IconComponent = null;
  if (banner.icon) {
    try {
      IconComponent = (LucideIcons as any)[banner.icon];
      if (!IconComponent) {
        console.warn(`Icon "${banner.icon}" not found in Lucide icons`);
      }
    } catch (error) {
      console.error(`Error loading icon "${banner.icon}":`, error);
    }
  }

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "h-32 w-48",
      title: "text-lg",
      subtitle: "text-xs",
      icon: "w-4 h-4",
      button: "text-xs py-1 px-2",
      padding: "p-3",
    },
    md: {
      container: "h-40 w-64",
      title: "text-xl",
      subtitle: "text-xs",
      icon: "w-6 h-6",
      button: "text-xs py-1 px-3",
      padding: "p-4",
    },
    lg: {
      container: "h-48 w-80",
      title: "text-2xl",
      subtitle: "text-sm",
      icon: "w-8 h-8",
      button: "text-sm py-2 px-4",
      padding: "p-6",
    },
  };

  const config = sizeConfig[size];

  const bannerContent = (
    <div
      className={`${
        config.container
      } relative rounded-lg overflow-hidden shadow-lg ${className} ${
        banner.backgroundColor === "bg-gradient-to-r from-blue-500 to-blue-700"
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
      role="banner"
      aria-label={`Banner: ${banner.title}`}
    >
      {/* Banner content: centered vertically and horizontally */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center h-full ${config.padding} text-center`}
      >
        <div className="flex items-center gap-2 mb-2">
          {IconComponent && (
            <IconComponent
              className={`${config.icon} ${banner.textColor}`}
              aria-hidden="true"
            />
          )}
          <h3
            className={`${config.title} font-bold mb-1 drop-shadow-md ${banner.textColor}`}
          >
            {banner.title}
          </h3>
          {banner.badge && banner.badgeText && (
            <Badge className="bg-yellow-500 text-yellow-900 text-xs ml-2">
              {banner.badgeText}
            </Badge>
          )}
        </div>

        {banner.subtitle && (
          <p
            className={`${config.subtitle} mb-3 drop-shadow-md line-clamp-2 ${
              banner.subtitleColor || banner.textColor
            } opacity-90`}
          >
            {banner.subtitle}
          </p>
        )}

        {banner.buttonTitle && banner.buttonUrl && (
          <Button
            className={`${banner.buttonColor} ${banner.textButtonColor} font-bold rounded-md ${config.button}`}
          >
            {banner.buttonTitle}
          </Button>
        )}
      </div>
    </div>
  );

  // If there's a button URL, wrap the entire banner in a link
  // Otherwise, just return the banner content
  if (banner.buttonUrl && !banner.buttonTitle) {
    return (
      <Link href={banner.buttonUrl} className="block">
        {bannerContent}
      </Link>
    );
  }

  return bannerContent;
};

export default BannerItem;
