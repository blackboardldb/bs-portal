import { NextRequest, NextResponse } from "next/server";
import { ClassService } from "@/lib/services/class-service";
import { ErrorHandler } from "@/lib/errors/handler";

// Initialize services
const classService = new ClassService();

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const disciplineId = searchParams.get("disciplineId");
    const instructorId = searchParams.get("instructorId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Use ClassService to get classes with filters
    const response = await classService.getClasses({
      page,
      limit,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      disciplineId: disciplineId || undefined,
      instructorId: instructorId || undefined,
      status: status || undefined,
    });

    // Return standardized response
    return NextResponse.json(response);
  } catch (error) {
    // Use ErrorHandler to create standardized error response
    return ErrorHandler.createResponse(error, {
      operation: "getClasses",
      resource: "classes",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Use ClassService to create class with validation
    const response = await classService.createClass(body);

    // Return standardized response
    return NextResponse.json(response, {
      status: response.success ? 201 : 400,
    });
  } catch (error) {
    // Use ErrorHandler to create standardized error response
    return ErrorHandler.createResponse(error, {
      operation: "createClass",
      resource: "classes",
    });
  }
}
