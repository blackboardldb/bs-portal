import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Tipo para el egreso
export type Expense = {
  id: string;
  motivo: string;
  fecha: string; // ISO date
  monto: number;
  createdAt?: string;
  updatedAt?: string;
};

// Inicializar Prisma Client
const prisma = new PrismaClient();

// Mock storage (fallback en memoria)
let expenses: Expense[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    try {
      // Intentar usar Prisma primero
      let dbExpenses;

      if (year && month) {
        const targetYear = parseInt(year);
        const targetMonth = parseInt(month); // 0-indexed

        // Crear fechas de inicio y fin del mes
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

        dbExpenses = await prisma.expense.findMany({
          where: {
            fecha: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            fecha: "desc",
          },
        });
      } else {
        dbExpenses = await prisma.expense.findMany({
          orderBy: {
            fecha: "desc",
          },
        });
      }

      // Convertir fechas a string para compatibilidad
      const formattedExpenses = dbExpenses.map((expense) => ({
        ...expense,
        fecha: expense.fecha.toISOString(),
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
      }));

      return NextResponse.json({
        success: true,
        data: formattedExpenses,
        total: formattedExpenses.length,
        source: "database",
      });
    } catch (dbError) {
      console.log("Database not available, using mock data:", dbError);

      // Fallback a mock data
      let filteredExpenses = expenses;

      if (year && month) {
        const targetYear = parseInt(year);
        const targetMonth = parseInt(month); // 0-indexed

        filteredExpenses = expenses.filter((expense) => {
          const date = new Date(expense.fecha);
          return (
            date.getFullYear() === targetYear && date.getMonth() === targetMonth
          );
        });
      }

      return NextResponse.json({
        success: true,
        data: filteredExpenses,
        total: filteredExpenses.length,
        source: "memory",
      });
    }
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Error fetching expenses",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { motivo, fecha, monto } = body;

    // Validación básica
    if (!motivo || !fecha || !monto) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Faltan campos requeridos",
            details: "motivo, fecha y monto son requeridos",
          },
        },
        { status: 400 }
      );
    }

    if (typeof monto !== "number" || monto <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Monto inválido",
            details: "El monto debe ser un número positivo",
          },
        },
        { status: 400 }
      );
    }

    try {
      // Intentar usar Prisma primero
      const newExpense = await prisma.expense.create({
        data: {
          motivo: motivo.trim(),
          fecha: new Date(fecha),
          monto: Number(monto),
        },
      });

      // Convertir fechas a string para compatibilidad
      const formattedExpense = {
        ...newExpense,
        fecha: newExpense.fecha.toISOString(),
        createdAt: newExpense.createdAt.toISOString(),
        updatedAt: newExpense.updatedAt.toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: formattedExpense,
        message: "Egreso creado exitosamente",
        source: "database",
      });
    } catch (dbError) {
      console.log("Database not available, using mock storage:", dbError);

      // Fallback a mock storage
      const newExpense: Expense = {
        id: `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        motivo: motivo.trim(),
        fecha,
        monto: Number(monto),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expenses.push(newExpense);

      return NextResponse.json({
        success: true,
        data: newExpense,
        message: "Egreso creado exitosamente",
        source: "memory",
      });
    }
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Error creating expense",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}
