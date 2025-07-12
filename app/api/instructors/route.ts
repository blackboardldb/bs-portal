import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/mock-database";

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

    // Construir where clause
    const whereClause: any = {};
    if (role && role !== "todos") whereClause.role = role;
    if (isActive && isActive !== "todos") {
      whereClause.isActive = isActive === "true";
    }
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Obtener instructores con filtros y paginación
    const instructors = await prisma.instructor.findMany({
      where: whereClause,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { firstName: "asc" },
    });

    // Obtener total de instructores para paginación
    const total = await prisma.instructor.count({ where: whereClause });

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
