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

    // Filtrar clases por fecha si se proporcionan parámetros
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

    // In a real app, you would validate and save to database
    const newClass = {
      id: `cls_${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
