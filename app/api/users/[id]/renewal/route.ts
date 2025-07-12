import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { planId, paymentMethod } = body;

    if (!planId || !paymentMethod) {
      return NextResponse.json(
        { error: "planId and paymentMethod are required" },
        { status: 400 }
      );
    }

    // In a real app, you would:
    // 1. Validate the user exists
    // 2. Validate the plan exists and is active
    // 3. Create a renewal request
    // 4. Process payment if needed

    const renewalRequest = {
      id: `renewal_${Date.now()}`,
      userId: id,
      planId,
      requestedPaymentMethod: paymentMethod,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      message: "Renewal request created successfully",
      renewal: renewalRequest,
    });
  } catch (error) {
    console.error("Error creating renewal request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
