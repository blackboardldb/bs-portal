import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/mock-database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    // Get all classes for the specified date
    const classes = await prisma.classSession.findMany({
      where: {
        dateTime: {
          gte: new Date(date + "T00:00:00"),
          lt: new Date(date + "T23:59:59"),
        },
        status: { not: "cancelled" },
      },
    });

    if (classes.length === 0) {
      return NextResponse.json(
        { error: "No classes found for this date" },
        { status: 404 }
      );
    }

    // Cancel all classes for the date
    const cancelledClasses: string[] = [];
    const affectedUsers: string[] = [];

    for (const classSession of classes) {
      // Update class status to cancelled
      await prisma.classSession.update({
        where: { id: classSession.id },
        data: { status: "cancelled" },
      });

      cancelledClasses.push(classSession.id);

      // Refund classes to registered participants
      for (const userId of classSession.registeredParticipantsIds) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (user && user.membership.planConfig.classLimit > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              membership: {
                ...user.membership,
                centerStats: {
                  ...user.membership.centerStats,
                  currentMonth: {
                    ...user.membership.centerStats.currentMonth,
                    remainingClasses:
                      user.membership.centerStats.currentMonth
                        .remainingClasses + 1,
                  },
                },
              },
            },
          });
          affectedUsers.push(userId);
        }
      }
    }

    return NextResponse.json({
      message: `Successfully cancelled ${cancelledClasses.length} classes for ${date}`,
      cancelledClasses,
      affectedUsers: [...new Set(affectedUsers)], // Remove duplicates
    });
  } catch (error) {
    console.error("Error cancelling classes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
