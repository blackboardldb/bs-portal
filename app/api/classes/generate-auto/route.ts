import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/mock-database";
import { initialDisciplines, initialInstructors } from "@/lib/mock-data";

// Helper function to create local date string without timezone conversion
function createLocalDateTime(
  date: Date,
  hours: number,
  minutes: number
): string {
  const localDate = new Date(date);
  localDate.setHours(hours, minutes, 0, 0);

  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  const hour = String(localDate.getHours()).padStart(2, "0");
  const minute = String(localDate.getMinutes()).padStart(2, "0");
  const second = String(localDate.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

// Map day abbreviations to day numbers
const dayMap: { [key: string]: number } = {
  lun: 1,
  mar: 2,
  mie: 3,
  jue: 4,
  vie: 5,
  sab: 6,
  dom: 0,
};

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields: startDate, endDate" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const generatedClasses = [];

    // Generate classes for each discipline based on their schedules
    for (const discipline of initialDisciplines) {
      if (!discipline.isActive || !discipline.schedule) continue;

      // Find instructor for this discipline
      const instructor = initialInstructors.find(
        (inst) => inst.specialties.includes(discipline.id) && inst.isActive
      );

      if (!instructor) {
        console.warn(`No instructor found for discipline: ${discipline.name}`);
        continue;
      }

      // Generate classes for each day in the schedule
      for (const scheduleDay of discipline.schedule) {
        const dayNumber = dayMap[scheduleDay.day];
        if (dayNumber === undefined) continue;

        // Generate classes for each time slot
        for (const time of scheduleDay.times) {
          const [hours, minutes] = time.split(":").map(Number);

          // Generate classes for each day in the range
          for (
            let date = new Date(start);
            date <= end;
            date.setDate(date.getDate() + 1)
          ) {
            // Check if this day matches the schedule day
            if (date.getDay() === dayNumber) {
              // Create class for this day with correct local time
              const classDateTime = createLocalDateTime(date, hours, minutes);

              // Format date for ID (YYYY-MM-DD)
              const dateStr = date.toISOString().split("T")[0];
              const timeStr = time.replace(":", "");

              const classId = `cls_${dateStr}_${timeStr}_${discipline.id}`;

              // Check if class already exists
              const existingClass = await prisma.classSession.findUnique({
                where: { id: classId },
              });

              if (!existingClass) {
                const newClass = await prisma.classSession.create({
                  data: {
                    id: classId,
                    organizationId: "org_blacksheep_001",
                    disciplineId: discipline.id,
                    name: discipline.name,
                    dateTime: classDateTime,
                    durationMinutes: 60,
                    instructorId: instructor.id,
                    capacity: 15,
                    registeredParticipantsIds: [],
                    waitlistParticipantsIds: [],
                    status: "scheduled",
                    participants: {
                      confirmed: [],
                      waitlist: [],
                      noShows: [],
                    },
                    historicalData: {
                      averageAttendance: Math.floor(Math.random() * 10) + 5,
                      noShowRate: Math.random() * 0.3,
                      waitlistFrequency: Math.random() * 0.2,
                      popularityTrend: ["up", "down", "stable"][
                        Math.floor(Math.random() * 3)
                      ] as "up" | "down" | "stable",
                    },
                    cancellationHours:
                      discipline.cancellationRules?.defaultHours || 2,
                    occupancyRate: 0.5,
                  },
                });

                generatedClasses.push(newClass);
              }
            }
          }
        }
      }
    }

    return NextResponse.json(
      {
        message: `Successfully generated ${generatedClasses.length} classes automatically from discipline schedules`,
        classes: generatedClasses,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating classes automatically:", error);
    return NextResponse.json(
      { error: "Failed to generate classes automatically" },
      { status: 500 }
    );
  }
}
