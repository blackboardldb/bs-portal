import { NextRequest, NextResponse } from "next/server";
import { InstructorService } from "@/lib/services/instructor-service";
import { ErrorHandler } from "@/lib/errors/handler";

// Initialize services
const instructorService = new InstructorService();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Use InstructorService to toggle instructor status
    const response = await instructorService.toggleInstructorStatus(id);

    if (!response.success) {
      return NextResponse.json(response, {
        status: response.error?.message?.includes("not found") ? 404 : 400,
      });
    }

    // Return standardized response with updated instructor data
    return NextResponse.json({
      success: true,
      data: {
        id: response.data.id,
        isActive: response.data.isActive,
        updatedAt: new Date().toISOString(),
      },
      message: `Instructor ${
        response.data.isActive ? "activated" : "deactivated"
      } successfully`,
    });
  } catch (error) {
    // Use ErrorHandler to create standardized error response
    return ErrorHandler.createResponse(error, {
      operation: "toggleInstructorStatus",
      resource: "instructors",
      resourceId: params.id,
    });
  }
}
