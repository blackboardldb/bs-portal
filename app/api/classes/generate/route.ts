import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/mock-database";

// Helper function to create local date string without timezone conversion
function createLocalDateTime(
  date: Date,
  hours: number,
  minutes: number
): string {
  // Crear la fecha usando los componentes individuales para evitar problemas de zona horaria
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Crear una nueva fecha con la hora específica
  const localDate = new Date(year, month, day, hours, minutes, 0, 0);

  // Format as YYYY-MM-DDTHH:mm:ss without timezone info
  const formattedYear = localDate.getFullYear();
  const formattedMonth = String(localDate.getMonth() + 1).padStart(2, "0");
  const formattedDay = String(localDate.getDate()).padStart(2, "0");
  const formattedHour = String(localDate.getHours()).padStart(2, "0");
  const formattedMinute = String(localDate.getMinutes()).padStart(2, "0");
  const formattedSecond = String(localDate.getSeconds()).padStart(2, "0");

  return `${formattedYear}-${formattedMonth}-${formattedDay}T${formattedHour}:${formattedMinute}:${formattedSecond}`;
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
      notes = "Clase generada",
    } = await request.json();

    console.log("=== API: Generando clases ===");
    console.log("Datos recibidos:", {
      startDate,
      endDate,
      disciplineId,
      instructorId,
      time,
      maxCapacity,
      notes,
    });

    // Validate required fields
    if (!startDate || !endDate || !disciplineId || !instructorId || !time) {
      console.error("❌ Campos requeridos faltantes");
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
      // Skip weekends only for regular classes, not for extra classes
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isExtraClass = notes.includes("Clase extra");

      if (isWeekend && !isExtraClass) {
        console.log(
          `⏭️ Saltando fin de semana: ${
            date.toISOString().split("T")[0]
          } (día ${dayOfWeek})`
        );
        continue;
      }

      console.log(
        `✅ Generando clase para: ${
          date.toISOString().split("T")[0]
        } (día ${dayOfWeek}) - Extra: ${isExtraClass}`
      );

      // Create class for this day with correct local time
      const classDateTime = createLocalDateTime(date, hours, minutes);
      console.log(
        `📅 Fecha creada: ${classDateTime} (original: ${
          date.toISOString().split("T")[0]
        })`
      );

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
          notes,
        },
      });

      generatedClasses.push(newClass);
    }

    console.log("✅ Clases generadas:", generatedClasses.length);
    console.log("Primera clase:", generatedClasses[0]);

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
