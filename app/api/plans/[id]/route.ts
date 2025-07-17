import { NextRequest, NextResponse } from "next/server";
import { PlanService } from "@/lib/services/plan-service";
import { ErrorHandler } from "@/lib/errors/handler";

// Initialize services
const planService = new PlanService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Use PlanService to get plan by ID
    const response = await planService.getPlanById(id);

    // Return standardized response
    return NextResponse.json(response, {
      status: response.success
        ? 200
        : response.error?.code === "NOT_FOUND"
        ? 404
        : 400,
    });
  } catch (error) {
    // Use ErrorHandler to create standardized error response
    return ErrorHandler.createResponse(error, {
      operation: "getPlanById",
      resource: "plans",
      metadata: { id: params.id },
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Use PlanService to update plan with validation
    const response = await planService.updatePlan(id, body);

    // Return standardized response
    return NextResponse.json(response, {
      status: response.success
        ? 200
        : response.error?.code === "NOT_FOUND"
        ? 404
        : 400,
    });
  } catch (error) {
    // Use ErrorHandler to create standardized error response
    return ErrorHandler.createResponse(error, {
      operation: "updatePlan",
      resource: "plans",
      metadata: { id: params.id },
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Use PlanService to delete plan with validation
    const response = await planService.deletePlan(id);

    // Return standardized response
    return NextResponse.json(response, {
      status: response.success
        ? 200
        : response.error?.code === "NOT_FOUND"
        ? 404
        : 400,
    });
  } catch (error) {
    // Use ErrorHandler to create standardized error response
    return ErrorHandler.createResponse(error, {
      operation: "deletePlan",
      resource: "plans",
      metadata: { id: params.id },
    });
  }
}
