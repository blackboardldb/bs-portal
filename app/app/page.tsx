"use client";

import { useEffect, useMemo } from "react";
import { HomePage } from "@/components/HomePage";
import Logo from "@/components/Logo";
import StaticCarousel from "@/components/StaticCarousel";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatTimeLocal, formatWeekday } from "@/lib/utils";
import { SkeletonHomePage } from "@/components/ui/skeleton";

export default function Page() {
  // --- 1. OBTENCIÓN DE DATOS ---
  // Se utiliza el store de Zustand para acceder a los datos y funciones de carga.
  const {
    users,
    classSessions,
    instructors,
    fetchUsers,
    fetchClassSessions,
    fetchInstructors,
  } = useBlackSheepStore();

  // Efecto para cargar los datos maestros una sola vez si el store está vacío.
  useEffect(() => {
    if (users.length === 0) fetchUsers();
    if (classSessions.length === 0) fetchClassSessions();
    if (instructors.length === 0) fetchInstructors();
  }, [
    users,
    classSessions,
    instructors,
    fetchUsers,
    fetchClassSessions,
    fetchInstructors,
  ]);

  // --- 2. SELECCIÓN DE USUARIO Y TRANSFORMACIÓN DE DATOS ---
  // Se utiliza el store de Zustand para acceder a los datos y funciones de carga.
  const currentUser = useMemo(() => {
    // Para la demo, se busca explícitamente a Antonia Ovejero por su ID correcto.
    return users.find((user) => user.id === "usr_antonia_abc123");
  }, [users]);

  // Mover este hook aquí para cumplir con las Reglas de los Hooks.
  // Se calcula aquí para que todos los hooks se llamen en cada render.
  const registeredClasses = useMemo(() => {
    // Si el usuario o las clases no se han cargado, devuelve un array vacío.
    if (!currentUser || classSessions.length === 0) {
      return [];
    }

    return classSessions
      .filter((session) => {
        const sessionDate = new Date(session.dateTime);
        const now = new Date();
        return (
          sessionDate >= now &&
          session.registeredParticipantsIds.includes(currentUser.id)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      )
      .slice(0, 3)
      .map((session) => {
        const instructor = instructors.find(
          (inst) => inst.id === session.instructorId
        );
        const instructorName = instructor
          ? `${instructor.firstName} ${instructor.lastName}`
          : "Instructor";

        return {
          id: session.id,
          dateTime: session.dateTime,
          name: session.name,
          instructor: instructorName,
          duration: "60 min",
          alumnRegistred: `${session.registeredParticipantsIds.length}/${
            session.capacity || 15
          }`,
          isRegistered: session.registeredParticipantsIds.includes(
            currentUser.id
          ),
          formattedDayLabel: formatWeekday(session.dateTime),
          formattedTime: formatTimeLocal(session.dateTime),
        };
      });
  }, [classSessions, instructors, currentUser]);

  // Si los datos esenciales no están listos, no renderizar nada.
  // Esto evita mostrar la UI incompleta o con errores y elimina el Skeleton.
  if (!currentUser) {
    return <SkeletonHomePage />;
  }

  // --- 3. TRANSFORMACIÓN DE DATOS PARA LA UI ---
  // Se calculan todos los valores necesarios para pasar al componente HomePage.
  const membershipType =
    currentUser.membership?.membershipType || "Plan Básico";
  const monthlyPrice = currentUser.membership?.monthlyPrice ?? 25000;

  // Usar las estadísticas REALES del perfil del usuario en lugar de datos fijos
  const currentMonthStats = currentUser.membership.centerStats.currentMonth;

  const planValid = currentUser.membership?.status === "active";
  const progressPercentage =
    currentMonthStats.classesContracted > 0
      ? (currentMonthStats.classesAttended /
          currentMonthStats.classesContracted) *
        100
      : 0;

  const formattedPeriodStart = currentUser.membership?.currentPeriodStart
    ? format(
        new Date(currentUser.membership.currentPeriodStart),
        "dd 'de' MMMM",
        { locale: es }
      )
    : "01 de enero";

  const formattedPeriodEnd = currentUser.membership?.currentPeriodEnd
    ? format(
        new Date(currentUser.membership.currentPeriodEnd),
        "dd 'de' MMMM",
        { locale: es }
      )
    : "31 de enero";

  // --- 4. RENDERIZADO DEL COMPONENTE ---
  // Se renderiza la estructura de la página y se pasa la data procesada a HomePage.
  return (
    <main className="min-h-screen bg-black">
      <div className="p-4 max-w-4xl mx-auto text-white">
        <Logo />
      </div>
      <HomePage
        userProfile={currentUser}
        membershipType={membershipType}
        monthlyPrice={monthlyPrice}
        currentMonthStats={currentMonthStats}
        planValid={planValid}
        progressPercentage={progressPercentage}
        formattedPeriodStart={formattedPeriodStart}
        formattedPeriodEnd={formattedPeriodEnd}
        registeredClasses={registeredClasses}
      />
      <aside className="p-4 max-w-4xl mx-auto pb-28 w-full">
        <div className="w-full bg-zinc-800 p-4 rounded-lg space-y-3">
          <StaticCarousel />
        </div>
      </aside>
    </main>
  );
}
