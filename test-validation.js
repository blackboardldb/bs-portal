// Script para probar la validación de registro
// Ejecutar en la consola del navegador en http://localhost:3000

async function testValidation() {
  console.log("🧪 Iniciando pruebas de validación...");

  // 1. Probar límite de clases
  console.log("\n1️⃣ Probando límite de clases...");
  try {
    const response = await fetch("/api/classes/class_001/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "usr_antonia_abc123" }),
    });
    const result = await response.json();
    console.log("Resultado:", result);
  } catch (error) {
    console.error("Error:", error);
  }

  // 2. Probar disciplina no permitida
  console.log("\n2️⃣ Probando disciplina no permitida...");
  try {
    const response = await fetch("/api/classes/class_crossfit_001/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "usr_limited_plan" }),
    });
    const result = await response.json();
    console.log("Resultado:", result);
  } catch (error) {
    console.error("Error:", error);
  }

  // 3. Probar reglas de cancelación
  console.log("\n3️⃣ Probando reglas de cancelación...");
  try {
    const response = await fetch("/api/classes/class_001/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "usr_antonia_abc123" }),
    });
    const result = await response.json();
    console.log("Resultado:", result);
  } catch (error) {
    console.error("Error:", error);
  }

  console.log("\n✅ Pruebas completadas!");
}

// Ejecutar las pruebas
testValidation();
