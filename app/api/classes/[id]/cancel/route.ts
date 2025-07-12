import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/mock-database";
import { ValidationService } from "@/lib/validation-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await request.json();
    const { id: classId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get the class session
    const classSession = await prisma.classSession.findUnique({
      where: { id: classId },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Get the user with full profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the discipline for validation rules
    const discipline = await prisma.discipline.findUnique({
      where: { id: classSession.disciplineId },
    });

    if (!discipline) {
      return NextResponse.json(
        { error: "Discipline not found" },
        { status: 404 }
      );
    }

    // Validate if user can cancel using the validation service
    const validation = ValidationService.canUserCancelClassWithRules(
      user,
      classSession,
      discipline
    );

    if (!validation.canCancel) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update class session
      const updatedClassSession = await tx.classSession.update({
        where: { id: classId },
        data: {
          registeredParticipantsIds:
            classSession.registeredParticipantsIds.filter(
              (id) => id !== userId
            ),
          waitlistParticipantsIds: classSession.waitlistParticipantsIds.filter(
            (id) => id !== userId
          ),
        },
      });

      // Update user's remaining classes if applicable
      if (user.membership.planConfig.classLimit > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            membership: {
              ...user.membership,
              centerStats: {
                ...user.membership.centerStats,
                currentMonth: {
                  ...user.membership.centerStats.currentMonth,
                  remainingClasses:
                    user.membership.centerStats.currentMonth.remainingClasses +
                    1,
                },
              },
            },
          },
        });
      }

      return updatedClassSession;
    });

    return NextResponse.json({
      message: "Successfully cancelled registration",
      class: result,
    });
  } catch (error) {
    console.error("Error cancelling registration:", error);
    return NextResponse.json(
      { error: "Failed to cancel registration" },
      { status: 500 }
    );
  }
}
