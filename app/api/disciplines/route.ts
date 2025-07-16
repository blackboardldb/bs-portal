import { NextRequest, NextResponse } from "next/server";
import { DisciplineService } from "@/lib/services/discipline-service";
import { ErrorHandler } from "@/lib/errors/handler";

// Initialize services
const disciplineService = new DisciplineService();

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Use DisciplineService to get disciplines with filters
    const response = await disciplineService.getDisciplines({
      page,
      limit,
      isActive: isActive ? isActive === "true" : undefined,
      search: search || undefined,
    });

    // Return standardized response
    return NextResponse.json(response);
  } catch (error) {
    // Use ErrorHandler to create standardized error response
    return ErrorHandler.createResponse(error, {
      operation: "getDisciplines",
      resource: "disciplines",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Use DisciplineService to create discipline with validation
    const response = await disciplineService.createDiscipline(body);

    // Return standardized response
    return NextResponse.json(response, {
      status: response.success ? 201 : 400,
    });
  } catch (error) {
    // Use ErrorHandler to create standardized error response
    return ErrorHandler.createResponse(error, {
      operation: "createDiscipline",
      resource: "disciplines",
    });
  }
}
