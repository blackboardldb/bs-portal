"use client";

import { HomePage } from "@/components/HomePage";
import Logo from "@/components/Logo";
import StaticCarousel from "@/components/StaticCarousel";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Page() {
  const { users, classSessions, instructors } = useBlackSheepStore();

  // Get current user (Antonia for demo)
  const currentUser =
    users.find((user) => user.id === "usr_antonia_abc123") || users[0];

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  // Calculate data for HomePage
  const membershipType =
    currentUser.membership?.membershipType || "Plan Básico";
  const monthlyPrice = currentUser.membership?.monthlyPrice ?? 25000;

  const currentMonthStats = {
    classesAttended: 5,
    classesContracted: 8,
    remainingClasses: 3,
    noShows: 0,
    lastMinuteCancellations: 0,
  };

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

  // Get registered classes
  const registeredClasses = classSessions
    .filter((session) => {
      const sessionDate = new Date(session.dateTime);
      const now = new Date();
      return sessionDate >= now;
    })
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
          session.maxParticipants || 15
        }`,
        isRegistered: session.registeredParticipantsIds.includes(
          currentUser.id
        ),
        formattedDayLabel: format(new Date(session.dateTime), "EEEE", {
          locale: es,
        }),
        formattedTime: format(new Date(session.dateTime), "HH:mm", {
          locale: es,
        }),
      };
    });

  return (
    <main className="min-h-screen bg-black">
      <Logo />
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
