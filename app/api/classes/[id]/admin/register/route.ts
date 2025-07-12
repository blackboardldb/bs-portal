import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/mock-database";

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

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Admin validation - only check basic constraints
    if (classSession.status === "cancelled") {
      return NextResponse.json(
        { error: "La clase ha sido cancelada" },
        { status: 400 }
      );
    }

    if (classSession.registeredParticipantsIds.includes(userId)) {
      return NextResponse.json(
        { error: "El usuario ya está inscrito" },
        { status: 400 }
      );
    }

    if (
      classSession.registeredParticipantsIds.length >= classSession.capacity
    ) {
      return NextResponse.json(
        { error: "No hay cupos disponibles" },
        { status: 400 }
      );
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update class session
      const updatedClassSession = await tx.classSession.update({
        where: { id: classId },
        data: {
          registeredParticipantsIds: [
            ...classSession.registeredParticipantsIds,
            userId,
          ],
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
                    user.membership.centerStats.currentMonth.remainingClasses -
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
      message: "Usuario agregado exitosamente",
      class: result,
    });
  } catch (error) {
    console.error("Error adding user to class:", error);
    return NextResponse.json(
      { error: "Error al agregar usuario" },
      { status: 500 }
    );
  }
}
