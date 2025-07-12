import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classIds } = body;

    if (!classIds || !Array.isArray(classIds)) {
      return NextResponse.json(
        { error: "classIds must be an array" },
        { status: 400 }
      );
    }

    // Simulate bulk cancellation
    const cancelledClasses: string[] = [];

    for (const classId of classIds) {
      // In a real app, you would update the database
      // For now, we'll just simulate success
      cancelledClasses.push(classId);
    }

    return NextResponse.json({
      message: `Successfully cancelled ${cancelledClasses.length} classes`,
      cancelledClasses,
    });
  } catch (error) {
    console.error("Error cancelling classes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
