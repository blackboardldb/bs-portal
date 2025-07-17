# Guía de Validación y Pruebas de Planes

Esta guía explica cómo validar que el sistema de planes funciona correctamente, incluyendo límites de clases, disciplinas permitidas y reglas de cancelación.

## 🎯 Resumen de Funcionalidades

### 1. **Lógica de Clases por Duración**

- **Mensual**: `classLimit` clases por mes (ej: 8 clases/mes)
- **Trimestral**: `classLimit × 3` clases totales (ej: 8 × 3 = 24 clases totales)
- **Semestral**: `classLimit × 6` clases totales (ej: 8 × 6 = 48 clases totales)
- **Anual**: `classLimit × 12` clases totales (ej: 8 × 12 = 96 clases totales)

### 2. **Filtrado de Disciplinas**

- **Plan completo** (`disciplineAccess: "all"`): Ve todas las disciplinas
- **Plan limitado** (`disciplineAccess: "limited"`): Solo ve disciplinas incluidas en `allowedDisciplines`

### 3. **Validación de Registro**

- Verifica clases restantes (`remainingClasses`)
- Respeta límites del plan
- Aplica reglas de cancelación específicas por disciplina y horario

## 🧪 Validación del Sistema

### **Punto 1: Verificar clases restantes (`remainingClasses`)**

**¿Dónde se valida?**

- **Archivo**: `lib/validation-service.ts` líneas 112-120
- **API**: `app/api/classes/[id]/register/route.ts` líneas 42-50

**¿Cómo probarlo?**

1. **Crear un usuario con pocas clases restantes**:

   ```javascript
   // En mock-data.ts, buscar un usuario y cambiar:
   remainingClasses: 0; // Sin clases disponibles
   ```

2. **Intentar registrarse en una clase**:

   - Debería mostrar: "No tienes clases disponibles en tu plan"

3. **Verificar que se descuenta correctamente**:
   - Registrarse en una clase con `remainingClasses: 5`
   - Después del registro debería quedar `remainingClases: 4`

### **Punto 2: Respeta límites del plan**

**¿Dónde se valida?**

- **Archivo**: `lib/validation-service.ts` líneas 121-129
- **Lógica**: Verifica `disciplineAccess` y `allowedDisciplines`

**¿Cómo probarlo?**

1. **Crear un plan limitado**:

   ```javascript
   disciplineAccess: "limited",
   allowedDisciplines: ["yoga", "pilates"]  // Solo estas disciplinas
   ```

2. **Intentar registrarse en disciplina no permitida**:

   - Intentar registrarse en "CrossFit"
   - Debería mostrar: "Tu plan no incluye esta disciplina"

3. **Verificar en el calendario**:
   - Solo debería ver clases de Yoga y Pilates
   - No debería ver clases de otras disciplinas

### **Punto 3: Aplica reglas de cancelación específicas**

**¿Dónde se valida?**

- **Archivo**: `lib/validation-service.ts` líneas 190-250
- **API**: `app/api/classes/[id]/cancel/route.ts` líneas 51-57

**¿Cómo probarlo?**

1. **Crear reglas de cancelación específicas**:

   ```javascript
   // En una disciplina, agregar:
   cancellationRules: [
     { id: "rule1", time: "08:00", hoursBefore: 6 }, // 6h antes para clase de 8am
     { id: "rule2", time: "18:00", hoursBefore: 2 }, // 2h antes para clase de 6pm
   ];
   ```

2. **Probar cancelación dentro del plazo**:
   - Registrarse en clase de 8:00am
   - Intentar cancelar 4 horas antes → Debería fallar
   - Intentar cancelar 8 horas antes → Debería funcionar

## 🧪 Script de Prueba Automatizado

Copia y pega este script en la consola del navegador (F12 → Console) en `http://localhost:3000`:

```javascript
// Script para probar la validación de registro
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
```

## 🎯 Pasos para Validación Manual

### **Paso 1: Verificar en la UI**

1. **Ir a** `http://localhost:3000/app/calendar`
2. **Verificar** que solo aparezcan disciplinas del plan del usuario
3. **Intentar registrarse** en una clase
4. **Verificar mensajes** de error/éxito

### **Paso 2: Verificar en la consola del navegador**

1. **Abrir DevTools** (F12)
2. **Ir a Console**
3. **Copiar y pegar** el script de prueba
4. **Ejecutar** y ver los resultados

### **Paso 3: Verificar en los datos**

1. **Revisar** `lib/mock-data.ts` para ver usuarios de prueba
2. **Buscar** usuarios con diferentes planes:
   - `usr_antonia_abc123` - Plan con clases limitadas
   - Usuarios con `disciplineAccess: "limited"`
3. **Verificar** que `remainingClasses` se actualice correctamente

## 🔍 Resultados Esperados

### **✅ Funcionando correctamente:**

- Usuarios con clases restantes pueden registrarse
- Usuarios sin clases restantes reciben error: "No tienes clases disponibles en tu plan"
- Solo se muestran disciplinas del plan en el calendario
- Disciplinas no permitidas muestran error: "Tu plan no incluye esta disciplina"
- Reglas de cancelación se aplican correctamente con mensajes específicos
- `remainingClasses` se descuenta automáticamente al registrarse

### **❌ Si algo falla:**

- Mensajes de error claros en la UI
- Logs en la consola del navegador
- Respuestas de API con códigos de error apropiados (400, 404, 500)

## 📋 Checklist de Validación

- [ ] **Límite de clases**: Usuario sin clases restantes no puede registrarse
- [ ] **Descuento de clases**: `remainingClasses` se reduce al registrarse
- [ ] **Disciplinas limitadas**: Solo aparecen disciplinas del plan en calendario
- [ ] **Disciplinas no permitidas**: Error al intentar registrarse en disciplina no incluida
- [ ] **Reglas de cancelación**: Se aplican correctamente según horario y disciplina
- [ ] **Planes de larga duración**: Clases totales calculadas correctamente (trimestral, semestral, anual)
- [ ] **Mensajes de error**: Claros y específicos para cada caso
- [ ] **Transacciones**: Datos se actualizan correctamente en base de datos

## 🛠️ Archivos Clave

### **Validación**

- `lib/validation-service.ts` - Lógica de validación principal
- `lib/utils.ts` - Función `calcularClasesSegunDuracion()`

### **APIs**

- `app/api/classes/[id]/register/route.ts` - Registro en clases
- `app/api/classes/[id]/cancel/route.ts` - Cancelación de clases
- `app/api/plans/route.ts` - Gestión de planes

### **Frontend**

- `app/app/calendar/page.tsx` - Calendario con filtrado de disciplinas
- `components/admincomponents/plans-manager.tsx` - Gestión de planes

### **Datos**

- `lib/mock-data.ts` - Usuarios y planes de prueba
- `lib/types.ts` - Definiciones de tipos

## 🚀 Próximos Pasos

1. **Ejecutar las pruebas** siguiendo esta guía
2. **Verificar** que todos los puntos del checklist funcionen
3. **Reportar** cualquier problema encontrado
4. **Documentar** casos de uso adicionales si es necesario

---

**Nota**: Esta guía asume que el servidor de desarrollo está ejecutándose en `http://localhost:3000`. Ajusta las URLs según tu configuración.
