import { NextRequest, NextResponse } from "next/server";
import { InstructorService } from "@/lib/services/instructor-service";
import { ErrorHandler } from "@/lib/errors/handler";

// Initialize services
const instructorService = new InstructorService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Use InstructorService to get instructor by ID
    const response = await instructorService.getInstructorById(id);

    if (!response.success || !response.data) {
      return NextResponse.json(
        { success: false, error: "Instructor not found" },
        { status: 404 }
      );
    }

    // Return standardized response
    return NextResponse.json(response);
  } catch (error) {
    // Use ErrorHandler to create standardized error response
    return ErrorHandler.createResponse(error, {
      operation: "getInstructorById",
      resource: "instructors",
      resourceId: params.id,
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

    // Use InstructorService to update instructor with validation
    const response = await instructorService.updateInstructor(id, body);

    if (!response.success) {
      return NextResponse.json(response, {
        status: 400,
      });
    }

    // Return standardized response
    return NextResponse.json(response);
  } catch (error) {
    // Use ErrorHandler to create standardized error response
    return ErrorHandler.createResponse(error, {
      operation: "updateInstructor",
      resource: "instructors",
      resourceId: params.id,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Use InstructorService to delete instructor with validation
    const response = await instructorService.deleteInstructor(id);

    if (!response.success) {
      return NextResponse.json(response, {
        status: response.error?.message?.includes("not found") ? 404 : 400,
      });
    }

    // Return standardized response
    return NextResponse.json({
      success: true,
      message: "Instructor deleted successfully",
    });
  } catch (error) {
    // Use ErrorHandler to create standardized error response
    return ErrorHandler.createResponse(error, {
      operation: "deleteInstructor",
      resource: "instructors",
      resourceId: params.id,
    });
  }
}
