# Guía de Validación y Testing del Sistema de Renovación de Planes

## Resumen del Sistema

El sistema de renovación de planes maneja tres estados principales para los usuarios:

- **Active**: Plan activo, puede inscribirse en clases
- **Expired**: Plan expirado, debe renovar para continuar
- **Pending**: Plan en validación, esperando aprobación del admin

## Estados del Plan y Comportamiento

### 1. Estado ACTIVE

- ✅ Usuario puede ver y registrarse en clases
- ✅ Botones de inscripción habilitados
- ✅ Muestra progreso de clases completadas
- ✅ Acceso completo al calendario

### 2. Estado EXPIRED

- ❌ Usuario NO puede registrarse en clases
- 🔴 Botones de inscripción deshabilitados con opacity reducida
- 📱 Mensaje: "Renueva tu plan para inscribirte"
- 🔄 Botón "Renovar" visible en HomePage y calendario

### 3. Estado PENDING

- ❌ Usuario NO puede registrarse en clases
- 🟡 Botones de inscripción deshabilitados con opacity reducida
- 📱 Mensaje: "Plan pendiente de validación"
- ⏳ Banner informativo: "Pronto podrás reservar clases"

## Flujo de Renovación

### Paso 1: Detección de Expiración

El sistema detecta automáticamente cuando un plan expira por:

- **Fecha**: `currentPeriodEnd < fecha actual`
- **Clases**: `remainingClasses <= 0`

### Paso 2: Proceso de Renovación

1. Usuario hace clic en "Renovar" → `/app/renovar-plan`
2. Selecciona nuevo plan y método de pago
3. Hace clic en "Solicitar Renovación"
4. Sistema crea `pendingRenewal` en el usuario
5. Estado cambia a "pending"
6. Redirección a `/app` con mensaje de confirmación

### Paso 3: Validación Admin

- Admin revisa solicitud en panel administrativo
- Aprueba o rechaza la renovación
- Si aprueba: estado → "active"
- Si rechaza: estado → "expired"

## Componentes y Responsabilidades

### HomePage (`components/HomePage.tsx`)

- Muestra estado del plan con badges apropiados
- Renderiza mensajes contextuales según estado
- Botones de acción (Renovar, Gestionar clases)

### Calendar (`app/app/calendar/page.tsx`)

- Banner informativo para estados no-activos
- Validación antes de permitir registro
- Mensajes de error específicos por estado

### ClassCard (`components/ClassCard.tsx`)

- Botones deshabilitados para estados no-activos
- Mensajes informativos en la parte inferior
- Opacity reducida para indicar no disponibilidad

### RenewalPage (`app/app/renovar-plan/page.tsx`)

- Formulario de selección de plan y pago
- Validación completa antes de envío
- Manejo de errores y estados de carga

## Testing Manual

### Caso 1: Plan Activo

```javascript
// Simular usuario con plan activo
const activeUser = {
  membership: {
    status: "active",
    currentPeriodEnd: "2025-02-28", // Fecha futura
    centerStats: {
      currentMonth: {
        remainingClasses: 5, // Clases disponibles
      },
    },
  },
};
```

**Resultado esperado:**

- ✅ Puede inscribirse en clases
- ✅ Botones habilitados
- ✅ Sin mensajes de restricción

### Caso 2: Plan Expirado por Fecha

```javascript
// Simular usuario con plan expirado
const expiredUser = {
  membership: {
    status: "active",
    currentPeriodEnd: "2025-01-15", // Fecha pasada
    centerStats: {
      currentMonth: {
        remainingClasses: 3,
      },
    },
  },
};
```

**Resultado esperado:**

- ❌ NO puede inscribirse en clases
- 🔴 Botones deshabilitados
- 📱 Mensaje: "Expiró el [fecha]"

### Caso 3: Plan Expirado por Clases

```javascript
// Simular usuario sin clases restantes
const noClassesUser = {
  membership: {
    status: "active",
    currentPeriodEnd: "2025-02-28", // Fecha futura
    centerStats: {
      currentMonth: {
        remainingClasses: 0, // Sin clases
      },
    },
  },
};
```

**Resultado esperado:**

- ❌ NO puede inscribirse en clases
- 🔴 Botones deshabilitados
- 📱 Mensaje: "Sin clases disponibles"

### Caso 4: Plan Pendiente

```javascript
// Simular usuario con renovación pendiente
const pendingUser = {
  membership: {
    status: "active",
    pendingRenewal: {
      status: "pending",
      requestDate: "2025-01-16T10:00:00Z",
    },
  },
};
```

**Resultado esperado:**

- ❌ NO puede inscribirse en clases
- 🟡 Banner amarillo: "Plan pendiente de validación"
- 📱 Mensaje: "Pronto podrás reservar clases"

## Debugging y Troubleshooting

### Problema: Renovación no funciona

**Síntomas:** Al hacer clic en "Solicitar Renovación" no pasa nada

**Verificar:**

1. Console del navegador para errores
2. Estado del store: `useBlackSheepStore.getState()`
3. Función `requestPlanRenewal` en el store
4. Datos del usuario actual

**Solución común:**

```javascript
// Verificar en console del navegador
console.log("Current user:", currentUser);
console.log("Selected plan:", selectedPlanId);
console.log("Payment method:", selectedPayment);
```

### Problema: Botones no se deshabilitan

**Síntomas:** Usuario con plan expirado puede hacer clic en "Inscribirse"

**Verificar:**

1. Función `getPlanStatus()` retorna estado correcto
2. Props `canRegister` y `planStatus` se pasan correctamente
3. Lógica en `ClassCard` para deshabilitar botones

**Solución:**

```javascript
// En ClassCard, verificar estas variables
console.log("Can register:", canRegister);
console.log("Plan status:", planStatus);
console.log("Can register for class:", canRegisterForClass);
```

### Problema: Estados inconsistentes

**Síntomas:** UI muestra un estado pero comportamiento es otro

**Verificar:**

1. Sincronización entre componentes
2. Estado del store actualizado correctamente
3. Re-renders después de cambios de estado

**Solución:**

```javascript
// Forzar re-fetch de datos
await fetchUsers();
```

## Consideraciones de Rendimiento

### Estados Dependientes en Tarjetas

Como mencionaste, hay múltiples estados dependientes en las tarjetas de clases. La implementación actual es robusta pero compleja:

**Pros:**

- ✅ Feedback inmediato al usuario
- ✅ Estados claros y específicos
- ✅ Buena experiencia de usuario

**Contras:**

- ⚠️ Complejidad en el manejo de estados
- ⚠️ Múltiples puntos de fallo
- ⚠️ Debugging más difícil

**Alternativa Simplificada:**
Si la complejidad causa problemas, se podría simplificar a:

- Mostrar clases solo si `planStatus === "active"`
- Ocultar completamente las clases para estados no-activos
- Mostrar solo mensaje informativo

```javascript
// Implementación simplificada
if (planStatus !== "active") {
  return <div>Plan no activo - Renueva para ver clases</div>;
}
```

## Logs y Monitoreo

### Logs Importantes

```javascript
// En getPlanStatus()
console.log("Plan status calculated:", status, "for user:", user.id);

// En requestPlanRenewal()
console.log("Renewal requested:", { userId, planId, paymentMethod });

// En ClassCard
console.log("Button state:", { canRegister, planStatus, isRegistered });
```

### Métricas a Monitorear

- Tasa de renovaciones exitosas vs fallidas
- Tiempo promedio en estado "pending"
- Errores más comunes en el flujo de renovación
- Usuarios que abandonan el proceso de renovación

## Conclusión

El sistema actual es robusto y maneja bien los diferentes estados. La complejidad está justificada por la mejor experiencia de usuario. Si surgen problemas, la documentación de debugging debería ayudar a identificar y resolver issues rápidamente.
