import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/services/user-service";
import { ErrorHandler } from "@/lib/errors/handler";

// Initialize services
const userService = new UserService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Use UserService to get user by ID
    const response = await userService.getUserById(id);

    // Return standardized response
    return NextResponse.json(response, {
      status: response.success && response.data ? 200 : 404,
    });
  } catch (error) {
    // Use ErrorHandler to create standardized error response
    return ErrorHandler.createResponse(error, {
      operation: "getUserById",
      resource: "users",
      metadata: { id: params.id },
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Use UserService to update user with validation
    const response = await userService.updateUser(id, body);

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
      operation: "updateUser",
      resource: "users",
      metadata: { id: params.id },
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Use UserService to delete user
    const response = await userService.deleteUser(id);

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
      operation: "deleteUser",
      resource: "users",
      metadata: { id: params.id },
    });
  }
}
