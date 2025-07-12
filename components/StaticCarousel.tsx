// components/StaticCarousel.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { staticCarouselSlides } from "@/lib/mock-data";

const StaticCarousel: React.FC = () => {
  return (
    // Contenedor del carrusel: relativo, flex, con snap y overflow horizontal
    // Las clases de padding (p-4, pb-28) y bg-zinc-800 vienen del wrapper en app/page.tsx
    <div
      className="relative flex w-full snap-x snap-mandatory gap-4 overflow-x-auto"
      style={{ WebkitOverflowScrolling: "touch" }} // Desplazamiento más suave en iOS
    >
      {staticCarouselSlides.map((slide) => (
        // Cada tarjeta del carrusel: mantiene h-40, w-64, shrink-0 y snap-center
        <div
          key={slide.id}
          className={`snap-center shrink-0 h-40 w-64 relative rounded-lg overflow-hidden shadow-lg ${slide.ClassStyleADD}`}
        >
          {/* Fondo degradado puro, sin imagen */}
          {/* Contenido de la tarjeta: centrado vertical y horizontalmente */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-2 text-center text-white">
            <h3 className="text-xl font-bold mb-1 drop-shadow-md">
              {slide.title}
            </h3>
            <p className="text-xs mb-2 drop-shadow-md line-clamp-2">
              {slide.description}
            </p>
            {slide.buttonText && slide.buttonLink && (
              <Link href={slide.buttonLink}>
                <Button className="bg-lime-500 hover:bg-lime-600 text-white font-bold py-1 px-3 rounded-md text-xs">
                  {slide.buttonText}
                </Button>
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StaticCarousel;

// <aside className="p-4 max-w-4xl mx-auto pb-28">
//   <div className="w-full bg-zinc-800 p-4 rounded-lg space-y-3">
//     <div className="relative flex w-full snap-x snap-mandatory gap-4 overflow-x-auto ">
//       <div className="snap-center bg-gradient-to-r from-red-500 to-orange-500 shrink-0  h-40 w-64 flex items-center justify-center rounded-lg">
//         HELLO
//       </div>
//       <div className="snap-center bg-gradient-to-r from-violet-200 to-pink-200 shrink-0  h-40 w-64 flex items-center justify-center rounded-lg">
//         HI
//       </div>
//       <div className="snap-center bg-gradient-to-r from-emerald-400 to-cyan-400 shrink-0  h-40 w-64 flex items-center justify-center rounded-lg">
//         OLI
//       </div>
//       <div className="snap-center bg-gradient-to-r from-emerald-500 to-emerald-900 shrink-0  h-40 w-64 flex items-center justify-center rounded-lg">
//         HOLANDA
//       </div>
//     </div>
//   </div>
// </aside>
