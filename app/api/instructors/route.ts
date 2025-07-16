import { NextRequest, NextResponse } from "next/server";
import { InstructorService } from "@/lib/services/instructor-service";
import { ErrorHandler } from "@/lib/errors/handler";

// Initialize services
const instructorService = new InstructorService();

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const isActive = searchParams.get("isActive");

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // Use InstructorService to get instructors with filters
    const response = await instructorService.getInstructors({
      page,
      limit,
      search: search || undefined,
      role: role && role !== "todos" ? role : undefined,
      isActive:
        isActive && isActive !== "todos" ? isActive === "true" : undefined,
    });

    // Return standardized response
    return NextResponse.json(response);
  } catch (error) {
    // Use ErrorHandler to create standardized error response
    return ErrorHandler.createResponse(error, {
      operation: "getInstructors",
      resource: "instructors",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Use InstructorService to create instructor with validation
    const response = await instructorService.createInstructor(body);

    // Return standardized response
    return NextResponse.json(response, {
      status: response.success ? 201 : 400,
    });
  } catch (error) {
    // Use ErrorHandler to create standardized error response
    return ErrorHandler.createResponse(error, {
      operation: "createInstructor",
      resource: "instructors",
    });
  }
}
