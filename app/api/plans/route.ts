import { NextRequest, NextResponse } from "next/server";
import {
  getPlans,
  getPlansCount,
  addPlan,
  updatePlan,
  deletePlan,
} from "@/lib/mock-database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parámetros de paginación
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Parámetros de filtrado
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");

    // Validar parámetros
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // Obtener planes con filtros
    const plans = getPlans(page, limit, search, isActive);

    // Obtener total de planes para paginación
    const total = getPlansCount(search, isActive);

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(total / limit);

    const pagination = {
      page,
      limit,
      total,
      totalPages,
    };

    return NextResponse.json({
      plans,
      pagination,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const planData = await request.json();

    // Validate required fields
    if (!planData.name || !planData.price) {
      return NextResponse.json(
        { error: "name and price are required" },
        { status: 400 }
      );
    }

    // Create plan
    const newPlan = addPlan(planData);

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const planData = await request.json();

    // Validate required fields
    if (!planData.id || !planData.name || !planData.price) {
      return NextResponse.json(
        { error: "id, name and price are required" },
        { status: 400 }
      );
    }

    // Update plan
    const updatedPlan = updatePlan(planData);

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Delete plan
    const success = deletePlan(id);

    if (!success) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500 }
    );
  }
}
