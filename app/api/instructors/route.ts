import { NextRequest, NextResponse } from "next/server";
import { getInstructors, getInstructorsCount } from "@/lib/mock-database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parámetros de paginación
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Parámetros de filtrado
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const isActive = searchParams.get("isActive");

    // Validar parámetros
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // Obtener instructores con filtros
    const instructors = getInstructors(page, limit, search, role, isActive);

    // Obtener total de instructores para paginación
    const total = getInstructorsCount(search, role, isActive);

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(total / limit);

    const pagination = {
      page,
      limit,
      total,
      totalPages,
    };

    return NextResponse.json({
      instructors,
      pagination,
    });
  } catch (error) {
    console.error("Error fetching instructors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
