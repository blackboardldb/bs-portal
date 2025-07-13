// Test script para debuggear problemas de fechas en el calendario
const { startOfMonth, endOfMonth, eachDayOfInterval } = require("date-fns");

// Simular las funciones del calendario
function toDateString(date) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toISOString().split("T")[0];
}

function getDateString(date) {
  return toDateString(date);
}

function getDaysInMonth(date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const daysInMonth = eachDayOfInterval({ start, end });

  return daysInMonth.map((day) => ({
    date: day,
    dateString: getDateString(day),
    isCurrentMonth: day.getMonth() === date.getMonth(),
  }));
}

// Probar con julio 2025
console.log("=== TEST FECHAS CALENDARIO ===");
const currentDate = new Date(2025, 6, 1); // Julio 2025
console.log("Fecha actual:", currentDate.toISOString());
console.log("Mes actual:", currentDate.getMonth() + 1); // Julio = 6 (0-indexed)

const days = getDaysInMonth(currentDate);

console.log("\n=== PRIMEROS 10 DÍAS ===");
days.slice(0, 10).forEach((day, index) => {
  console.log(
    `${index + 1}: ${day.dateString} - Día ${day.date.getDate()} - Mes: ${
      day.date.getMonth() + 1
    }`
  );
});

console.log("\n=== ÚLTIMOS 10 DÍAS ===");
days.slice(-10).forEach((day, index) => {
  console.log(
    `${days.length - 9 + index}: ${
      day.dateString
    } - Día ${day.date.getDate()} - Mes: ${day.date.getMonth() + 1}`
  );
});

console.log(`\nTotal días: ${days.length}`);

// Verificar si hay inconsistencias
console.log("\n=== VERIFICACIÓN DE INCONSISTENCIAS ===");
const uniqueDates = new Set(days.map((d) => d.dateString));
console.log("Fechas únicas:", uniqueDates.size);
console.log("Días generados:", days.length);

if (uniqueDates.size !== days.length) {
  console.log("❌ PROBLEMA: Hay fechas duplicadas!");
} else {
  console.log("✅ Las fechas son únicas");
}

// Verificar que las fechas correspondan a los días
let hasMismatch = false;
days.forEach((day, index) => {
  const expectedDay = index + 1;
  const actualDay = day.date.getDate();
  if (expectedDay !== actualDay) {
    console.log(`❌ PROBLEMA: Día ${index + 1} muestra fecha ${actualDay}`);
    hasMismatch = true;
  }
});

if (!hasMismatch) {
  console.log("✅ Los días coinciden con las fechas");
}
