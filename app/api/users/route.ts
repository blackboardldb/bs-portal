import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/mock-database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Construir la consulta como se haría con Prisma real
    const whereClause: {
      role?: string;
      membership?: { status: string };
      OR?: Array<{
        firstName?: { contains: string; mode: string };
        lastName?: { contains: string; mode: string };
        email?: { contains: string; mode: string };
      }>;
    } = {};
    if (role) whereClause.role = role;
    if (status) whereClause.membership = { status };

    // Agregar búsqueda si se proporciona
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // 1. Pedir solo la página de usuarios que necesitamos
    const paginatedUsers = await prisma.user.findMany({
      where: whereClause,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { firstName: "asc" },
    });

    // 2. Pedir el conteo total para la paginación
    const totalUsers = await prisma.user.count({ where: whereClause });

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();

    // Validate required fields
    if (!userData.firstName || !userData.lastName || !userData.email) {
      return NextResponse.json(
        { error: "firstName, lastName, and email are required" },
        { status: 400 }
      );
    }

    // Create user with mock database
    const newUser = await prisma.user.create({
      data: {
        id: `usr_${Date.now()}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone || "",
        role: userData.role || "user",
        membership: userData.membership || {
          id: `mem_${Date.now()}`,
          organizationId: "org_blacksheep_001",
          organizationName: "BlackSheep CrossFit",
          status: "active",
          membershipType: "Básico",
          monthlyPrice: 35000,
          startDate: new Date().toISOString().split("T")[0],
          currentPeriodStart: new Date().toISOString().split("T")[0],
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          planConfig: {
            classLimit: 8,
            disciplineAccess: "limited",
            allowedDisciplines: ["disc_crossfit_001"],
            canFreeze: false,
            freezeDurationDays: 0,
            autoRenews: true,
          },
          centerStats: {
            currentMonth: {
              classesAttended: 0,
              classesContracted: 8,
              remainingClasses: 8,
              noShows: 0,
              lastMinuteCancellations: 0,
            },
            totalMonthsActive: 1,
            memberSince: new Date().toISOString().split("T")[0],
            lifetimeStats: {
              totalClasses: 0,
              totalNoShows: 0,
              averageMonthlyAttendance: 0,
              bestMonth: {
                month: new Date().toLocaleDateString("en-US", {
                  month: "long",
                }),
                year: new Date().getFullYear(),
                count: 0,
              },
            },
          },
          centerConfig: {
            allowCancellation: true,
            cancellationHours: 2,
            maxBookingsPerDay: 2,
            autoWaitlist: true,
          },
        },
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
