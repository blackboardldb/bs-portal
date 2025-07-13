import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/mock-database";

/**
 * API unificada para cancelar clases.
 * Maneja tanto clases reales como generadas.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, classData } = body;

    if (!classId) {
      return NextResponse.json(
        { error: "classId is required" },
        { status: 400 }
      );
    }

    // Determinar si es una clase generada o real
    const isGeneratedClass = classId.startsWith("gen_");

    if (isGeneratedClass) {
      // =============================
      // CANCELAR CLASE GENERADA
      // =============================

      if (!classData) {
        return NextResponse.json(
          { error: "classData is required for generated classes" },
          { status: 400 }
        );
      }

      // Persistir la clase generada como cancelada
      const persistResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/api/classes/persist-generated`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classData,
            action: "cancel",
          }),
        }
      );

      if (!persistResponse.ok) {
        throw new Error("Failed to persist generated class");
      }

      const persistResult = await persistResponse.json();

      // =============================
      // EMITIR EVENTO DE WEBSOCKET
      // =============================
      try {
        await fetch(
          `${
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
          }/api/emit-event`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              room: `org_${classData.organizationId}`,
              event: "class-cancelled",
              data: {
                classId: classId,
                originalId: classId,
                persistedClass: persistResult.persistedClass,
                affectedUsers: [], // Clases generadas no tienen participantes
                cancelledAt: new Date().toISOString(),
                wasGenerated: true,
              },
            }),
          }
        );

        console.log(
          `WebSocket event emitted: class-cancelled for generated class ${classId}`
        );
      } catch (wsError) {
        console.error("Error emitting WebSocket event:", wsError);
      }

      return NextResponse.json({
        message: "Clase generada cancelada y persistida",
        originalId: classId,
        persistedClass: persistResult.persistedClass,
        wasGenerated: true,
      });
    } else {
      // =============================
      // CANCELAR CLASE REAL
      // =============================

      // Get the class session
      const classSession = await prisma.classSession.findUnique({
        where: { id: classId },
      });

      if (!classSession) {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }

      // Check if class is already cancelled
      if (classSession.status === "cancelled") {
        return NextResponse.json(
          { error: "La clase ya está cancelada" },
          { status: 400 }
        );
      }

      // Use transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx) => {
        // 1. Cancel the class
        const updatedClassSession = await tx.classSession.update({
          where: { id: classId },
          data: { status: "cancelled" },
        });

        // 2. Refund classes to all registered participants
        const affectedUsers: string[] = [];

        for (const userId of classSession.registeredParticipantsIds) {
          const user = await tx.user.findUnique({
            where: { id: userId },
          });

          if (user && user.membership.planConfig.classLimit > 0) {
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

        return { updatedClassSession, affectedUsers };
      });

      // =============================
      // EMITIR EVENTO DE WEBSOCKET
      // =============================
      try {
        await fetch(
          `${
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
          }/api/emit-event`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              room: `org_${classSession.organizationId}`,
              event: "class-cancelled",
              data: {
                classId: classId,
                classSession: result.updatedClassSession,
                affectedUsers: result.affectedUsers,
                cancelledAt: new Date().toISOString(),
                wasGenerated: false,
              },
            }),
          }
        );

        console.log(
          `WebSocket event emitted: class-cancelled for real class ${classId}`
        );
      } catch (wsError) {
        console.error("Error emitting WebSocket event:", wsError);
      }

      return NextResponse.json({
        message: `Clase cancelada. Se devolvieron clases a ${result.affectedUsers.length} usuarios.`,
        class: result.updatedClassSession,
        affectedUsers: result.affectedUsers,
        wasGenerated: false,
      });
    }
  } catch (error) {
    console.error("Error cancelling class:", error);
    return NextResponse.json(
      { error: "Error al cancelar la clase" },
      { status: 500 }
    );
  }
}
