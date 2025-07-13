import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/mock-database";
import {
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  getDay,
  format,
  parseISO,
} from "date-fns";
import { ClassSession, DayOfWeek } from "@/lib/types";
import { createLocalDate, localToUTC } from "@/lib/utils";

/**
 * Genera clases para un día específico basado en los horarios de las disciplinas.
 * Esta función NO guarda en la base de datos, solo genera los objetos.
 */
function generateClassesForDay(day: Date, disciplines: any[]): ClassSession[] {
  const dayMapping: DayOfWeek[] = [
    "dom",
    "lun",
    "mar",
    "mie",
    "jue",
    "vie",
    "sab",
  ];
  const dayOfWeek = dayMapping[getDay(day)];
  const generatedClasses: any[] = [];

  disciplines.forEach((discipline) => {
    discipline.schedule?.forEach((s: any) => {
      if (s.day === dayOfWeek) {
        s.times.forEach((time: string) => {
          const [hour, minute] = time.split(":");
          // Crear fecha local pura (sin UTC)
          const classDate = new Date(
            day.getFullYear(),
            day.getMonth(),
            day.getDate(),
            parseInt(hour, 10),
            parseInt(minute, 10),
            0,
            0
          );
          // Formatear fecha para el ID y para comparación local
          const dateString = format(classDate, "yyyy-MM-dd");
          const timeString = format(classDate, "HH-mm");

          generatedClasses.push({
            id: `gen_${discipline.id}_${dateString}_${timeString}`,
            organizationId: "org_blacksheep_001",
            disciplineId: discipline.id,
            name: discipline.name,
            dateTime: classDate.toISOString(), // ISO para compatibilidad
            dateLocal: dateString, // NUEVO: fecha local YYYY-MM-DD
            durationMinutes: 60,
            instructorId: "inst_default",
            capacity: 15,
            registeredParticipantsIds: [],
            waitlistParticipantsIds: [],
            status: "scheduled",
            notes: "Clase generada dinámicamente",
            isGenerated: true,
          });
        });
      }
    });
  });
  return generatedClasses;
}

/**
 * Genera clases para un rango de fechas basado en los horarios de las disciplinas.
 */
function generateClassesForDateRange(
  startDate: Date,
  endDate: Date,
  disciplines: any[]
): ClassSession[] {
  const allClasses: ClassSession[] = [];
  const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });

  daysInRange.forEach((day) => {
    const dayClasses = generateClassesForDay(day, disciplines);
    allClasses.push(...dayClasses);
  });

  return allClasses;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // Para compatibilidad con un solo día
  const startDate = searchParams.get("startDate"); // Para rango de fechas
  const endDate = searchParams.get("endDate"); // Para rango de fechas

  if (!date && (!startDate || !endDate)) {
    return NextResponse.json(
      { error: "Date parameter or startDate/endDate parameters are required" },
      { status: 400 }
    );
  }

  try {
    let targetStartDate: Date;
    let targetEndDate: Date;

    if (date) {
      // Modo de compatibilidad: un solo día
      targetStartDate = new Date(`${date}T00:00:00Z`);
      targetEndDate = new Date(`${date}T23:59:59Z`);
    } else {
      // Modo de rango: mes completo
      targetStartDate = new Date(`${startDate}T00:00:00Z`);
      targetEndDate = new Date(`${endDate}T23:59:59Z`);
    }

    // 1. Buscar clases REALES que ya existan para ese rango de fechas en la BD
    const realClasses = await prisma.classSession.findMany({
      where: {
        dateTime: {
          gte: targetStartDate.toISOString(),
          lte: targetEndDate.toISOString(),
        },
      },
      orderBy: {
        dateTime: "asc",
      },
    });

    // 2. Obtener disciplinas activas
    const disciplines = await prisma.discipline.findMany({
      where: { isActive: true },
    });

    // 3. Generar clases para cada día del rango que no tenga clases reales
    const generatedClasses: ClassSession[] = [];
    const daysInRange = eachDayOfInterval({
      start: targetStartDate,
      end: targetEndDate,
    });

    daysInRange.forEach((day) => {
      const dayString = format(day, "yyyy-MM-dd");
      const dayStart = new Date(`${dayString}T00:00:00Z`);
      const dayEnd = new Date(`${dayString}T23:59:59Z`);

      // Verificar si hay clases reales para este día
      const realClassesForDay = realClasses.filter((cls) => {
        const classDate = new Date(cls.dateTime);
        return classDate >= dayStart && classDate <= dayEnd;
      });

      // Si no hay clases reales para este día, generar las clases
      if (realClassesForDay.length === 0) {
        const dayClasses = generateClassesForDay(day, disciplines);
        generatedClasses.push(...dayClasses);
      }
    });

    // 4. Combinar clases reales y generadas
    const allClasses = [...realClasses, ...generatedClasses].sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );

    return NextResponse.json({
      classes: allClasses,
      source: realClasses.length > 0 ? "mixed" : "generated",
      count: allClasses.length,
      realClassesCount: realClasses.length,
      generatedClassesCount: generatedClasses.length,
    });
  } catch (error) {
    console.error("Error fetching classes by date range:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
