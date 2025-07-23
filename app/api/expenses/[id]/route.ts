import { NextRequest, NextResponse } from "next/server";

// Importar el mock storage del archivo principal
// En una implementación real, esto vendría de la base de datos
let expenses: any[] = [];

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "ID requerido",
            details: "Se debe proporcionar un ID válido",
          },
        },
        { status: 400 }
      );
    }

    // Buscar el índice del egreso
    const expenseIndex = expenses.findIndex((expense) => expense.id === id);

    if (expenseIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Egreso no encontrado",
            details: `No se encontró un egreso con ID: ${id}`,
          },
        },
        { status: 404 }
      );
    }

    // Eliminar el egreso
    const deletedExpense = expenses.splice(expenseIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedExpense,
      message: "Egreso eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Error deleting expense",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { motivo, fecha, monto } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "ID requerido",
            details: "Se debe proporcionar un ID válido",
          },
        },
        { status: 400 }
      );
    }

    // Buscar el egreso
    const expenseIndex = expenses.findIndex((expense) => expense.id === id);

    if (expenseIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Egreso no encontrado",
            details: `No se encontró un egreso con ID: ${id}`,
          },
        },
        { status: 404 }
      );
    }

    // Actualizar el egreso
    const updatedExpense = {
      ...expenses[expenseIndex],
      ...(motivo && { motivo: motivo.trim() }),
      ...(fecha && { fecha }),
      ...(monto && { monto: Number(monto) }),
      updatedAt: new Date().toISOString(),
    };

    expenses[expenseIndex] = updatedExpense;

    return NextResponse.json({
      success: true,
      data: updatedExpense,
      message: "Egreso actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Error updating expense",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}
