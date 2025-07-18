"use client";

import React from "react";
import { useActiveBanners } from "@/lib/blacksheep-store";
import BannerItem from "./banner-item";
import { BannerErrorBoundary } from "./banner-error-boundary";

const BannerCarousel: React.FC = () => {
  const activeBanners = useActiveBanners();

  // If no active banners, don't render anything
  if (activeBanners.length === 0) {
    return null;
  }

  return (
    <BannerErrorBoundary>
      <div
        className="relative flex w-full snap-x snap-mandatory gap-4 overflow-x-auto focus:outline-none"
        style={{ WebkitOverflowScrolling: "touch" }} // Smooth scrolling on iOS
        role="region"
        aria-label="Banners promocionales"
        tabIndex={0}
        onKeyDown={(e) => {
          // Add keyboard navigation support
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            const container = e.currentTarget;
            const scrollAmount = 280; // Approximate banner width + gap
            if (e.key === "ArrowLeft") {
              container.scrollLeft -= scrollAmount;
            } else {
              container.scrollLeft += scrollAmount;
            }
            e.preventDefault();
          }
        }}
      >
        {activeBanners.map((banner, index) => (
          <BannerItem
            key={banner.id}
            banner={banner}
            className="snap-center shrink-0 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
            size="md"
          />
        ))}
      </div>
    </BannerErrorBoundary>
  );
};

export default BannerCarousel;
