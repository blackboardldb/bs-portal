// src/components/HomePage.tsx
"use client";

import type React from "react";
import { ClassesHomeCard } from "@/components/ClassesHomeCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Ticket, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import type { FitCenterUserProfile } from "@/lib/types";
import { getPlanStatus } from "@/lib/utils";

interface FormattedClassItem {
  id: string;
  dateTime: string;
  name: string;
  instructor: string;
  duration: string;
  alumnRegistred: string;
  isRegistered: boolean;
  formattedDayLabel: string;
  formattedTime: string;
}

interface HomePageProps {
  userProfile: FitCenterUserProfile;
  membershipType: string;
  monthlyPrice?: number | null;
  currentMonthStats: {
    classesAttended: number;
    classesContracted: number;
    remainingClasses?: number;
    noShows?: number;
    lastMinuteCancellations?: number;
  };
  progressPercentage: number;
  formattedPeriodStart: string;
  formattedPeriodEnd: string;
  registeredClasses: FormattedClassItem[];
}

const HomePage: React.FC<HomePageProps> = ({
  userProfile,
  membershipType,
  monthlyPrice,
  currentMonthStats,
  progressPercentage,
  formattedPeriodStart,
  formattedPeriodEnd,
  registeredClasses,
}) => {
  // Determinar el estado real del plan
  const planStatus = getPlanStatus(userProfile);

  return (
    <main className="p-4 max-w-4xl mx-auto pb-6">
      <div className="text-left mb-6">
        <span className="uppercase text-lime-400 text-xs">
          Hola, {userProfile.firstName}
        </span>
        <p className="text-white text-3xl sm:text-4xl font font-semibold text-wrap max-w-80 md:max-w-sm mb-6 sm:mb-12">
          ¿Cómo estamos para entrenar hoy 💪?
        </p>
      </div>
      <p className=" uppercase text-white/80 text-xs mb-2">Tu plan</p>
      <div className="w-full bg-zinc-800 p-4 rounded-lg mb-10 space-y-3">
        <div className="mb-6">
          <h2 className="text-white font-bold text-2xl">{membershipType}</h2>
          <p className="text-white/70">
            {currentMonthStats.classesContracted} clases • $
            {monthlyPrice ? monthlyPrice.toLocaleString("es-CL") : "N/A"}
          </p>
        </div>

        {planStatus === "active" && (
          <div>
            <Progress value={progressPercentage} className="h-3 " />
            <div className="flex justify-between items-center mt-2">
              <span className="text-base font-medium text-white ">
                Clases completadas
              </span>
              <p className="text-base text-white">
                <span className="text-lime-500 font-semibold">
                  {currentMonthStats.classesAttended}
                </span>{" "}
                {"/"} {currentMonthStats.classesContracted}
              </p>
            </div>
          </div>
        )}

        {planStatus === "active" ? (
          <div className="flex justify-between items-center border-t border-zinc-700 pt-3">
            <div className="text-zinc-200 inline-flex gap-2 text-sm items-center">
              <Ticket size={16} />
              <p className="sm:text-sm">
                Tu plan inició el {formattedPeriodStart} hasta el{" "}
                {formattedPeriodEnd}
              </p>
            </div>
          </div>
        ) : planStatus === "pending" ? (
          <div className="border-t border-zinc-700 pt-3 space-y-3">
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-100 text-xl">
                <Clock size={16} />
                <p className="font-medium">Pendiente validación</p>
              </div>
              <p className="text-yellow-100  mb-2">
                Debemos validar tu solicitud de renovación. Escríbenos para
                validar tu plan o avisa a tu coach de forma presencial.
              </p>
              <Link
                href="https://wa.me/56912345678"
                target="_blank"
                className="inline-block mt-2"
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="text-black bg-yellow-300 hover:bg-yellow-400 border-yellow-600"
                >
                  Contactar por WhatsApp
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center border-t border-zinc-700 pt-3">
            <div className="text-orange-300 inline-flex gap-2 text-sm items-center">
              <AlertCircle size={16} />
              <p className="text-sm sm:text-base">
                {(currentMonthStats.remainingClasses || 0) <= 0
                  ? "Sin clases disponibles"
                  : `Expiró el ${formattedPeriodEnd}`}
              </p>
            </div>
            <Link href="/app/renovar-plan">
              <Button
                variant={"secondary"}
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                Renovar
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-2">
        <p className=" uppercase text-white/80 text-xs">Clases inscritas</p>
        {planStatus === "active" ? (
          <Link href="app/calendar">
            <Button
              variant="link"
              className="text-lime-400 text-sm font-semibold px-0"
            >
              Gestionar clases
            </Button>
          </Link>
        ) : planStatus === "pending" ? (
          <span className="text-yellow-400 text-sm font-semibold">
            por validar
          </span>
        ) : (
          <Link href="/app/renovar-plan">
            <Button
              variant="link"
              className="text-orange-400 text-sm font-semibold px-0"
            >
              Renovar plan
            </Button>
          </Link>
        )}
      </div>

      <div className="w-full bg-zinc-800 p-4 pt-2 rounded-lg divide-y divide-zinc-700">
        {registeredClasses.length > 0 && planStatus === "active" ? (
          <ClassesHomeCard classes={registeredClasses} />
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            {planStatus === "active" ? (
              <p className="text-gray-500 text-base">
                Aún no te has inscrito en una clase.
              </p>
            ) : planStatus === "pending" ? (
              <div className="space-y-2">
                <p className="text-zinc-400 text-base font-medium">
                  Pronto podrás reservar tus clases
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-orange-400 text-base font-medium">
                  Pronto podrás reservar clases
                </p>
                <p className="text-gray-400 text-sm">
                  Renueva tu plan para continuar entrenando
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export { HomePage };
