import { NextRequest, NextResponse } from "next/server";
import { initialUsers } from "@/lib/mock-data";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = params;
    const body = await request.json();
    const { renewalId } = body;

    // Buscar usuario en mock-data
    const userIndex = initialUsers.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    const user = initialUsers[userIndex];
    if (!user.membership || user.membership.status !== "pending") {
      return NextResponse.json(
        { error: "El usuario no está pendiente de aprobación" },
        { status: 400 }
      );
    }

    // Actualizar el estado de la membresía a 'active' y la fecha de inicio
    user.membership.status = "active";
    user.membership.startDate = new Date().toISOString().split("T")[0];
    user.membership.currentPeriodStart = user.membership.startDate;
    // (Opcional) Actualizar currentPeriodEnd según lógica de tu app

    // Simular guardado en mock-data (en memoria)
    initialUsers[userIndex] = user;

    // Emitir evento de WebSocket (simulado)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    await fetch(`${baseUrl}/api/emit-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: `org_${user.membership.organizationId}`,
        event: "membership-status-changed",
        data: {
          userId: user.id,
          newStatus: "active",
          user,
        },
      }),
    });

    return NextResponse.json({
      message: "Usuario aprobado exitosamente",
      user,
    });
  } catch (error) {
    console.error("Error al aprobar usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
