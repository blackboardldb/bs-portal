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
          // Crear fecha local usando createLocalDate para evitar problemas de zona horaria
          const classDate = createLocalDate(
            day.getFullYear(),
            day.getMonth() + 1, // createLocalDate espera mes 1-12
            day.getDate(),
            parseInt(hour, 10),
            parseInt(minute, 10)
          );

          // Formatear fecha para el ID y para comparación local
          const dateString = format(day, "yyyy-MM-dd"); // Usar el día original, no classDate
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

    // 3. Generar todas las clases para el rango completo
    const allGeneratedClasses = generateClassesForDateRange(
      targetStartDate,
      targetEndDate,
      disciplines
    );

    // 4. Combinar clases, dando prioridad a las reales sobre las generadas.
    // Usamos un Map para evitar duplicados en el mismo slot de tiempo/disciplina.
    const classMap = new Map<string, ClassSession>();

    // Primero, agregar todas las clases generadas al mapa.
    allGeneratedClasses.forEach((cls) => {
      const classDate = new Date(cls.dateTime);
      const key = `${cls.disciplineId}:${format(
        classDate,
        "yyyy-MM-dd:HH-mm"
      )}`;
      classMap.set(key, cls);
    });

    // Luego, sobrescribir con las clases reales. Si una clase real ocupa el mismo
    // slot que una generada, la real tendrá precedencia.
    realClasses.forEach((cls) => {
      const classDate = new Date(cls.dateTime);
      const key = `${cls.disciplineId}:${format(
        classDate,
        "yyyy-MM-dd:HH-mm"
      )}`;
      classMap.set(key, cls);
    });

    // 5. Convertir el mapa de vuelta a array y ordenar por fecha
    const allClasses = Array.from(classMap.values()).sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );

    return NextResponse.json({
      classes: allClasses,
      source: realClasses.length > 0 ? "mixed" : "generated",
      count: allClasses.length,
      realClassesCount: realClasses.length, // Esto sigue siendo el recuento de la BD
      generatedClassesCount: allClasses.length - realClasses.length,
    });
  } catch (error) {
    console.error("Error fetching classes by date range:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
