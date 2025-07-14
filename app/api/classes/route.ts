import { NextRequest, NextResponse } from "next/server";
import { initialClasses } from "@/lib/mock-data";
import type { ClassSession } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parámetros de filtrado y paginación
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // NOTA: initialClasses ahora está vacío. Las clases se generan dinámicamente
    // en el frontend basándose en los horarios de las disciplinas.
    // Esta API se usa principalmente para clases históricas con actividad real.
    let filteredClasses = initialClasses;

    if (startDate || endDate) {
      filteredClasses = initialClasses.filter((session: ClassSession) => {
        const sessionDate = new Date(session.dateTime);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && end) {
          return sessionDate >= start && sessionDate <= end;
        } else if (start) {
          return sessionDate >= start;
        } else if (end) {
          return sessionDate <= end;
        }

        return true;
      });
    }

    // Aplicar paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedClasses = filteredClasses.slice(startIndex, endIndex);

    // Calcular metadatos de paginación
    const totalClasses = filteredClasses.length;
    const totalPages = Math.ceil(totalClasses / limit);

    return NextResponse.json({
      classes: paginatedClasses,
      pagination: {
        page,
        limit,
        totalClasses,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prisma } = await import("@/lib/mock-database");

    // Crear la clase en el mock database con todos los campos requeridos
    const newClass = await prisma.classSession.create({
      data: {
        id: body.id || `cls_${Date.now()}`,
        organizationId: body.organizationId,
        disciplineId: body.disciplineId,
        name: body.name,
        dateTime: body.dateTime,
        durationMinutes: body.durationMinutes || 60,
        instructorId: body.instructorId,
        capacity: body.capacity || 15,
        registeredParticipantsIds: body.registeredParticipantsIds || [],
        waitlistParticipantsIds: body.waitlistParticipantsIds || [],
        status: body.status || "scheduled",
        notes: body.notes,
        isGenerated: false,
        // Campos adicionales requeridos por ClassSessionExtended
        participants: {
          confirmed: [],
          waitlist: [],
          noShows: [],
        },
        historicalData: {
          averageAttendance: Math.floor(Math.random() * 10) + 5,
          noShowRate: Math.random() * 0.3,
          waitlistFrequency: Math.random() * 0.2,
          popularityTrend: "stable" as const,
        },
        cancellationHours: 2,
        occupancyRate: 0.5,
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
