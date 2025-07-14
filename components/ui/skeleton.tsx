import { cn } from "@/lib/utils";
import Logo from "../Logo";
import { Calendar } from "lucide-react";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };

// Skeleton que imita la estructura de la HomePage principal
export function SkeletonHomePage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Logo (igual que en la UI real) */}
      <div className="p-4 max-w-4xl mx-auto text-white">
        {/* El componente real Logo debe ser renderizado en el archivo de página, no aquí */}
        <Logo />
        {/* Cabecera de usuario */}
        <div className="text-left my-6">
          <span className="uppercase text-lime-400 text-xs">Hola</span>
          <p className="text-white text-3xl sm:text-4xl font font-semibold text-wrap max-w-80 md:max-w-sm mb-6 sm:mb-12">
            ¿Cómo estamos para entrenar hoy 💪?
          </p>
        </div>
      </div>

      {/* Estadísticas y progreso */}
      <section className="p-4 max-w-4xl mx-auto">
        <div className="grid  gap-4 bg-zinc-800 rounded-lg p-4">
          <Skeleton className="h-8 max-w-28 bg-zinc-700 rounded-lg" />
          <Skeleton className="h-4 max-w-32 bg-zinc-700 rounded-lg" />
          <Skeleton className="h-3 w-full bg-zinc-700 rounded-lg" />
          <Skeleton className="h-16 bg-zinc-700 rounded-lg" />
        </div>
      </section>

      {/* Tarjetas de clases (3 skeletons) */}
      <section className="p-4 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <p className=" uppercase text-white/80 text-xs">Clases inscritas</p>
        </div>
        <div className=" bg-zinc-900 rounded-lg flex justify-center items-center p-4 h-48">
          <div className="flex flex-col gap-2 items-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <Skeleton className="h-4 max-w-1/2 w-full bg-zinc-800" />
          </div>
        </div>
      </section>

      {/* Carousel y cajas estáticas: se renderizan normalmente en la página real */}
      <aside className="p-4 max-w-4xl mx-auto pb-28 w-full">
        <div className="w-full bg-zinc-800 p-4 rounded-lg space-y-3">
          {/* Aquí se renderiza StaticCarousel en la página real */}
        </div>
      </aside>
    </main>
  );
}

// Skeleton que imita la estructura del perfil de usuario
export function SkeletonUserProfile() {
  return (
    <div className="py-6 space-y-6 mx-auto">
      {/* Avatar y nombre */}
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="w-24 h-24 rounded-full bg-zinc-800" />
        <Skeleton className="h-6 w-32 bg-zinc-800" />
        <Skeleton className="h-4 w-24 bg-zinc-700" />
      </div>
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-4 w-full mt-6">
        <Skeleton className="h-12 bg-zinc-800 rounded-lg" />
        <Skeleton className="h-12 bg-zinc-800 rounded-lg" />
        <Skeleton className="h-12 bg-zinc-800 rounded-lg" />
      </div>
      {/* Drawer de estadísticas */}
      <Skeleton className="h-16 w-full bg-zinc-800 rounded-lg" />
      {/* Sección de plan */}
      <Skeleton className="h-32 w-full bg-zinc-800 rounded-lg" />
      {/* Datos personales */}
      <Skeleton className="h-24 w-full bg-zinc-800 rounded-lg" />
    </div>
  );
}
