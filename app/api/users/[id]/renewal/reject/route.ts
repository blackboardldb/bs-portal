import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/mock-database";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Obtener usuario
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.membership?.pendingRenewal) {
      return NextResponse.json(
        { error: "No pending renewal found" },
        { status: 400 }
      );
    }

    // Rechazar renovación
    const updatedMembership = {
      ...user.membership,
      pendingRenewal: {
        ...user.membership.pendingRenewal,
        status: "rejected",
        rejectedAt: new Date().toISOString(),
      },
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { membership: updatedMembership },
    });

    return NextResponse.json({
      user: updatedUser,
      message: "Plan renewal rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting plan renewal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
