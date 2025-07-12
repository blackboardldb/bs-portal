import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/mock-database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");

    // Get disciplines from mock database
    const disciplines = await prisma.discipline.findMany({});

    // Apply filters
    let filteredDisciplines = disciplines;
    if (isActive !== null) {
      const activeFilter = isActive === "true";
      filteredDisciplines = filteredDisciplines.filter(
        (discipline) => discipline.isActive === activeFilter
      );
    }

    // Apply pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDisciplines = filteredDisciplines.slice(
      startIndex,
      endIndex
    );

    return NextResponse.json({
      disciplines: paginatedDisciplines,
      pagination: {
        page,
        limit,
        total: filteredDisciplines.length,
        totalPages: Math.ceil(filteredDisciplines.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching disciplines:", error);
    return NextResponse.json(
      { error: "Failed to fetch disciplines" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const disciplineData = await request.json();

    // Validate required fields
    if (!disciplineData.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Create discipline with mock database
    const newDiscipline = await prisma.discipline.create({
      data: {
        id: `disc_${disciplineData.name
          .toLowerCase()
          .replace(/\s/g, "_")}_${Date.now()}`,
        organizationId: "org_blacksheep_001",
        name: disciplineData.name,
        description: disciplineData.description || "",
        color: disciplineData.color || "#3b82f6",
        isActive: disciplineData.isActive !== false,
        schedule: disciplineData.schedule || [],
        cancellationRules: {
          defaultHours: 2,
          rules: [],
        },
      },
    });

    return NextResponse.json(newDiscipline, { status: 201 });
  } catch (error) {
    console.error("Error creating discipline:", error);
    return NextResponse.json(
      { error: "Failed to create discipline" },
      { status: 500 }
    );
  }
}
