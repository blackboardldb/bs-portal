import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/mock-database";

// Helper function to create local date string without timezone conversion
function createLocalDateTime(
  date: Date,
  hours: number,
  minutes: number
): string {
  const localDate = new Date(date);
  localDate.setHours(hours, minutes, 0, 0);

  // Format as YYYY-MM-DDTHH:mm:ss without timezone info
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  const hour = String(localDate.getHours()).padStart(2, "0");
  const minute = String(localDate.getMinutes()).padStart(2, "0");
  const second = String(localDate.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

export async function POST(request: NextRequest) {
  try {
    const {
      startDate,
      endDate,
      disciplineId,
      instructorId,
      time,
      maxCapacity = 20,
    } = await request.json();

    // Validate required fields
    if (!startDate || !endDate || !disciplineId || !instructorId || !time) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: startDate, endDate, disciplineId, instructorId, time",
        },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const generatedClasses = [];

    // Parse time components
    const [hours, minutes] = time.split(":").map(Number);

    // Generate classes for each day in the range
    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      // Create class for this day with correct local time
      const classDateTime = createLocalDateTime(date, hours, minutes);

      // Format date for ID (YYYY-MM-DD)
      const dateStr = date.toISOString().split("T")[0];
      const timeStr = time.replace(":", "");

      const newClass = await prisma.classSession.create({
        data: {
          id: `cls_${dateStr}_${timeStr}_${disciplineId}`,
          organizationId: "org_blacksheep_001",
          disciplineId,
          name: `Class ${time}`,
          dateTime: classDateTime, // Use local time string
          durationMinutes: 60,
          instructorId,
          capacity: maxCapacity,
          registeredParticipantsIds: [],
          waitlistParticipantsIds: [],
          status: "scheduled",
        },
      });

      generatedClasses.push(newClass);
    }

    return NextResponse.json(
      {
        message: `Successfully generated ${generatedClasses.length} classes`,
        classes: generatedClasses,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating classes:", error);
    return NextResponse.json(
      { error: "Failed to generate classes" },
      { status: 500 }
    );
  }
}
