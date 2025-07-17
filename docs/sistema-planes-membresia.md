# Sistema de Planes de Membresía - Documentación Completa

## 📋 Índice

1. [Introducción](#introducción)
2. [Tipos de Planes](#tipos-de-planes)
3. [Estados de Membresía](#estados-de-membresía)
4. [Ciclo de Vida de un Plan](#ciclo-de-vida-de-un-plan)
5. [Condiciones de Expiración](#condiciones-de-expiración)
6. [Casos de Uso Comunes](#casos-de-uso-comunes)
7. [Flujos de Usuario](#flujos-de-usuario)
8. [Gestión Administrativa](#gestión-administrativa)

---

## 🎯 Introducción

El sistema de planes de membresía de BlackSheep CrossFit permite a los usuarios acceder a clases según diferentes modalidades de pago y duración. Cada plan tiene características específicas que determinan cuándo y cómo puede el usuario reservar clases.

### Características Principales

- **Flexibilidad**: Planes desde quincenales hasta anuales
- **Control Automático**: Expiración automática por fecha o clases consumidas
- **Gestión Manual**: Los administradores pueden gestionar estados manualmente
- **Categorización**: Planes organizados en categorías para mejor experiencia

---

## 📦 Tipos de Planes

### 🗓️ Planes Mensuales (Corto Plazo)

Ideales para usuarios que buscan flexibilidad y compromiso a corto plazo.

#### Plan Quincenal (0.5 meses)

- **Duración**: 15 días
- **Clases**: Según el límite mensual dividido entre 2
- **Ideal para**: Usuarios nuevos o que quieren probar el servicio

#### Plan Mensual (1 mes)

- **Duración**: 1 mes
- **Clases**: Límite completo mensual
- **Ideal para**: Usuarios regulares con flexibilidad mensual

**Ejemplos de Planes Mensuales:**

- Plan Básico: 10 clases/mes - $35,000
- Plan Intermedio: 15 clases/mes - $42,500
- Plan Full: 24 clases/mes - $50,000
- Plan Full AM: 24 clases/mes (mañanas) - $40,000

### 📅 Planes Extendidos (Largo Plazo)

Ofrecen mejor valor y están diseñados para usuarios comprometidos a largo plazo.

#### Plan Trimestral (3 meses)

- **Duración**: 3 meses
- **Clases**: Límite mensual × 3
- **Beneficio**: Mejor precio por mes

#### Plan Semestral (6 meses)

- **Duración**: 6 meses
- **Clases**: Límite mensual × 6
- **Beneficio**: Descuento significativo

#### Plan Anual (12 meses)

- **Duración**: 12 meses
- **Clases**: Límite mensual × 12 o ilimitadas
- **Beneficio**: Máximo ahorro y flexibilidad

**Ejemplos de Planes Extendidos:**

- Plan Trimestral: 30 clases/3 meses - $90,000
- Plan Semestral: 60 clases/6 meses - $150,000
- Plan Anual: 120 clases/12 meses - $250,000
- Plan Anual Ilimitado: Clases ilimitadas/12 meses - $480,000

---

## 🔄 Estados de Membresía

### 1. ✅ **ACTIVO** (`active`)

**Descripción**: El usuario puede reservar y asistir a clases normalmente.

**Condiciones para estar activo:**

- Fecha de fin del período no ha pasado
- Tiene clases disponibles (si no es ilimitado)
- No está marcado como expirado por el admin
- No tiene renovación pendiente

**Lo que puede hacer el usuario:**

- ✅ Reservar clases
- ✅ Cancelar reservas (según reglas)
- ✅ Ver progreso del plan
- ✅ Acceder al calendario completo

### 2. ⏳ **PENDIENTE** (`pending`)

**Descripción**: El plan está esperando validación administrativa.

**Cuándo ocurre:**

- Usuario nuevo registrado, esperando aprobación
- Renovación solicitada, esperando procesamiento
- Cambio de plan solicitado

**Lo que ve el usuario:**

- ⚠️ Banner: "Plan pendiente de validación"
- 📱 Botón para contactar por WhatsApp
- ❌ No puede reservar clases
- 📋 Mensaje explicativo del proceso

### 3. ❌ **EXPIRADO** (`expired`)

**Descripción**: El usuario no puede acceder a clases y debe renovar.

**Cuándo ocurre:**

- Fecha del plan ha vencido
- Se agotaron todas las clases disponibles
- Administrador marcó como expirado manualmente

**Lo que ve el usuario:**

- 🚨 Banner: "Plan expirado"
- 🔄 Botón "Renovar Plan"
- ❌ No puede reservar clases
- 📝 Mensaje para renovar membresía

---

## 🔄 Ciclo de Vida de un Plan

### Fase 1: Registro/Renovación

```
Usuario solicita plan → Estado: PENDIENTE
```

- Usuario selecciona plan y método de pago
- Sistema crea solicitud de renovación
- Admin recibe notificación para aprobar

### Fase 2: Activación

```
Admin aprueba → Estado: ACTIVO
```

- Admin valida pago y datos
- Sistema activa el plan
- Usuario recibe confirmación

### Fase 3: Uso Normal

```
Usuario usa clases → Estado: ACTIVO (con seguimiento)
```

- Sistema cuenta clases utilizadas
- Muestra progreso en tiempo real
- Envía alertas cuando quedan pocas clases

### Fase 4: Expiración

```
Condición de expiración → Estado: EXPIRADO
```

- Por fecha, clases agotadas, o admin
- Sistema bloquea nuevas reservas
- Usuario debe renovar para continuar

---

## ⚠️ Condiciones de Expiración

### 🗓️ **Expiración por Fecha**

**Cuándo**: La fecha `currentPeriodEnd` ha pasado.

**Ejemplo**:

```javascript
Plan Mensual iniciado: 1 de enero 2025
Fecha de expiración: 31 de enero 2025
Estado el 1 de febrero: EXPIRADO
```

**Mensaje al usuario**: "Expiró el 31 de enero 2025"

### 🎫 **Expiración por Clases Consumidas**

**Cuándo**: `remainingClasses` llega a 0.

**Ejemplo**:

```javascript
Plan Básico: 10 clases/mes
Clases utilizadas: 10
Clases restantes: 0
Estado: EXPIRADO (aunque la fecha no haya pasado)
```

**Mensaje al usuario**: "Sin clases disponibles"

### 👨‍💼 **Expiración Manual por Admin**

**Cuándo**: Administrador marca `status: "expired"`.

**Razones comunes**:

- Problemas de pago
- Suspensión por incumplimiento
- Casos especiales de negocio
- Testing de funcionalidades

**Mensaje al usuario**: "Plan expirado" (con opción de contactar)

### 🛡️ **Prioridad de Expiración**

El sistema sigue esta jerarquía:

1. **Automática** (fecha/clases) - SIEMPRE tiene prioridad
2. **Manual** (admin) - Solo si no hay expiración automática
3. **Normal** - Estado por defecto

---

## 📱 Casos de Uso Comunes

### Caso 1: Usuario Nuevo

**Flujo**:

1. Usuario se registra y selecciona plan
2. Estado: PENDIENTE
3. Admin valida y aprueba
4. Estado: ACTIVO
5. Usuario puede reservar clases

### Caso 2: Usuario Regular - Uso Normal

**Flujo**:

1. Usuario tiene plan ACTIVO
2. Reserva y asiste a clases
3. Sistema descuenta clases automáticamente
4. Usuario ve progreso en tiempo real
5. Al agotar clases: Estado EXPIRADO

### Caso 3: Usuario Regular - Renovación

**Flujo**:

1. Plan cerca de expirar o expirado
2. Usuario va a "Renovar Plan"
3. Selecciona nuevo plan y método de pago
4. Estado: PENDIENTE (renovación)
5. Admin aprueba: Estado ACTIVO

### Caso 4: Usuario con Problema de Pago

**Flujo**:

1. Usuario tiene plan ACTIVO
2. Problema con pago detectado
3. Admin marca como EXPIRADO manualmente
4. Usuario ve mensaje de expiración
5. Debe contactar para resolver

### Caso 5: Testing de Funcionalidades

**Flujo**:

1. Tester necesita probar flujo de expiración
2. Admin marca usuario como EXPIRADO
3. Tester verifica comportamiento del sistema
4. Admin restaura estado según necesidad

---

## 👤 Flujos de Usuario

### 🏠 **En la Página Principal**

#### Plan Activo

```
✅ Saludo personalizado
📊 Barra de progreso de clases
📈 Estadísticas del mes actual
🔗 Botón "Gestionar clases"
📅 Lista de clases inscritas
```

#### Plan Pendiente

```
⏳ Banner amarillo: "Pendiente validación"
📱 Botón WhatsApp para contactar
❌ No se muestran clases inscritas
💬 Mensaje explicativo del proceso
```

#### Plan Expirado

```
🚨 Banner naranja: "Plan expirado"
🔄 Botón "Renovar Plan"
❌ No se muestran clases inscritas
📝 Mensaje para renovar membresía
```

### 📅 **En el Calendario**

#### Plan Activo

```
✅ Puede ver todas las clases disponibles
✅ Puede reservar clases futuras
✅ Puede cancelar reservas (según reglas)
📊 Ve capacidad de cada clase
```

#### Plan Pendiente/Expirado

```
🚨 Banner informativo en la parte superior
❌ Botones de reserva deshabilitados
📝 Mensaje explicativo
🔗 Enlace para renovar (si expirado)
```

---

## 🛠️ Gestión Administrativa

### 👨‍💼 **Panel de Administración**

#### Gestión de Planes

```
📋 Lista de todos los planes disponibles
🔍 Filtros por categoría (Mensual/Extendido)
🔍 Filtros por estado (Activo/Inactivo)
➕ Crear nuevos planes
✏️ Editar planes existentes
🗑️ Eliminar planes (con validaciones)
```

#### Gestión de Usuarios

```
👥 Lista de usuarios con estado de plan
🔍 Filtros por estado de membresía
✏️ Editar estado de membresía manualmente
📊 Ver estadísticas de uso
💳 Gestionar renovaciones pendientes
```

### ⚙️ **Acciones Administrativas**

#### Aprobar Usuario Nuevo

1. Usuario aparece en lista con estado PENDIENTE
2. Admin revisa datos y pago
3. Admin cambia estado a ACTIVO
4. Usuario recibe notificación

#### Aprobar Renovación

1. Renovación aparece en lista PENDIENTE
2. Admin valida pago y selección
3. Admin aprueba renovación
4. Sistema actualiza plan del usuario

#### Expirar Plan Manualmente

1. Admin identifica problema (pago, comportamiento, etc.)
2. Admin marca plan como EXPIRADO
3. Usuario pierde acceso inmediatamente
4. Usuario debe contactar para resolver

#### Reactivar Plan

1. Admin resuelve problema con usuario
2. Admin cambia estado a ACTIVO
3. Usuario recupera acceso
4. Sistema respeta condiciones automáticas

---

## 🔧 Configuración Técnica

### Estructura de Datos del Plan

```javascript
{
  id: "plan_basico_001",
  name: "Plan Básico",
  description: "10 clases al mes",
  price: 35000,
  durationInMonths: 1,
  classLimit: 10,
  disciplineAccess: "all", // o "limited"
  allowedDisciplines: [], // si es limitado
  isActive: true // visible para usuarios
}
```

### Estructura de Membresía del Usuario

```javascript
{
  status: "active", // active, pending, expired
  planId: "plan_basico_001",
  currentPeriodStart: "2025-01-01",
  currentPeriodEnd: "2025-01-31",
  centerStats: {
    currentMonth: {
      classesAttended: 5,
      classesContracted: 10,
      remainingClasses: 5
    }
  },
  pendingRenewal: null // o objeto con datos de renovación
}
```

### Lógica de Validación

```javascript
function getPlanStatus(user) {
  // 1. Sin membresía → expired
  // 2. Renovación pendiente → pending
  // 3. Status pending → pending
  // 4. Fecha pasada O sin clases → expired
  // 5. Status expired manual → expired
  // 6. Por defecto → active
}
```

---

## 📞 Soporte y Contacto

### Para Usuarios

- **WhatsApp**: +56 9 1234 5678
- **Email**: soporte@blacksheep.com
- **Horarios**: Lunes a Viernes 9:00-18:00

### Para Administradores

- **Panel Admin**: `/admin/planes`
- **Gestión Usuarios**: `/admin/alumnos`
- **Documentación Técnica**: `/docs/`

---

## 🔄 Actualizaciones y Mantenimiento

### Versión Actual: 2.0

- ✅ Categorización de planes implementada
- ✅ Estados mejorados con prioridades
- ✅ Tests comprehensivos (28 tests)
- ✅ Documentación completa

### Próximas Mejoras

- 📧 Notificaciones automáticas por email
- 📊 Dashboard de métricas avanzadas
- 🎯 Recomendaciones personalizadas de planes
- 💳 Integración con pasarelas de pago

---

_Documentación actualizada: Enero 2025_
_Sistema BlackSheep CrossFit - Gestión de Membresías_
