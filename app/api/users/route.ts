import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/mock-database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    // Get users from mock database
    const users = await prisma.user.findMany({});

    // Apply filters
    let filteredUsers = users;
    if (role) {
      filteredUsers = filteredUsers.filter((user) => user.role === role);
    }
    if (status) {
      filteredUsers = filteredUsers.filter(
        (user) => user.membership.status === status
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit),
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
