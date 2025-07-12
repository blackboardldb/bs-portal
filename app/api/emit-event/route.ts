import { NextRequest, NextResponse } from "next/server";

// =============================
// TIPOS Y INTERFACES
// =============================

interface EmitEventRequest {
  room: string;
  event: string;
  data: unknown;
}

// =============================
// HANDLER PRINCIPAL
// =============================

export async function POST(request: NextRequest) {
  try {
    const body: EmitEventRequest = await request.json();
    const { room, event, data } = body;

    // Validar campos requeridos
    if (!room || !event) {
      return NextResponse.json(
        {
          success: false,
          message: "Room and event are required",
        },
        { status: 400 }
      );
    }

    // Por ahora, simplemente loguear el evento
    // En una implementación real, aquí se emitiría el evento WebSocket
    console.log(`Event emitted: ${event} to room: ${room}`, data);

    return NextResponse.json({
      success: true,
      message: `Event ${event} emitted to room ${room}`,
    });
  } catch (error) {
    console.error("Error emitting event:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
