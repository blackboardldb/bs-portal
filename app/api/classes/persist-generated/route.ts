import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/mock-database";
import { ClassSession } from "@/lib/types";

/**
 * Persiste una clase generada en la base de datos.
 * Se usa cuando el admin interactúa con una clase generada (cancela, modifica, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classData, action } = body;

    if (!classData || !action) {
      return NextResponse.json(
        { error: "classData and action are required" },
        { status: 400 }
      );
    }

    // Validar que es una clase generada
    if (!classData.id.startsWith("gen_")) {
      return NextResponse.json(
        { error: "Only generated classes can be persisted" },
        { status: 400 }
      );
    }

    // Crear un ID real para la clase persistida
    const realId = `cls_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Preparar los datos de la clase para persistir
    const classToPersist: Omit<ClassSession, "id"> & { id: string } = {
      id: realId,
      organizationId: classData.organizationId,
      disciplineId: classData.disciplineId,
      name: classData.name,
      dateTime: classData.dateTime,
      durationMinutes: classData.durationMinutes,
      instructorId: classData.instructorId,
      capacity: classData.capacity,
      registeredParticipantsIds: classData.registeredParticipantsIds || [],
      waitlistParticipantsIds: classData.waitlistParticipantsIds || [],
      status: action === "cancel" ? "cancelled" : classData.status,
      notes: classData.notes,
      // No incluir isGenerated ya que ahora es una clase real
    };

    // Persistir en la base de datos
    const persistedClass = await prisma.classSession.create({
      data: classToPersist,
    });

    console.log(
      `Generated class persisted: ${classData.id} -> ${realId} (${action})`
    );

    return NextResponse.json({
      success: true,
      originalId: classData.id,
      persistedClass,
      action,
    });
  } catch (error) {
    console.error("Error persisting generated class:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
