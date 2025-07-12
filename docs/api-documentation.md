# 📡 DOCUMENTACIÓN DE API - BLACKSHEEP CROSSFIT

## 🎯 **INFORMACIÓN GENERAL**

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **Autenticación**: JWT Bearer Token (futuro)
- **Rate Limiting**: 100 requests por 15 minutos

---

## 🔐 **AUTENTICACIÓN**

### **Headers Requeridos**

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### **Códigos de Respuesta**

- `200` - Éxito
- `201` - Creado
- `400` - Bad Request (datos inválidos)
- `401` - No autorizado
- `403` - Prohibido
- `404` - No encontrado
- `429` - Rate limit excedido
- `500` - Error interno del servidor

---

## 👥 **USUARIOS**

### **GET /api/users**

Obtiene lista de usuarios con paginación y filtros.

#### **Query Parameters**

```typescript
{
  page?: number;        // Página (default: 1)
  limit?: number;       // Límite por página (default: 10, max: 100)
  role?: UserRole;      // Filtrar por rol
  status?: string;      // Filtrar por estado de membresía
  search?: string;      // Búsqueda por nombre o email
  organizationId: string; // ID de la organización (requerido)
}
```

#### **Response**

```typescript
{
  users: FitCenterUserProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### **Ejemplo**

```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10&role=user&organizationId=org_blacksheep_001"
```

### **POST /api/users**

Crea un nuevo usuario.

#### **Request Body**

```typescript
{
  firstName: string;           // Requerido, 2-50 caracteres
  lastName: string;            // Requerido, 2-50 caracteres
  email: string;               // Requerido, email válido
  phone: string;               // Requerido, 8-15 dígitos
  dateOfBirth?: string;        // Opcional, formato YYYY-MM-DD
  gender?: string;             // Opcional
  address?: string;            // Opcional
  emergencyContact?: string;   // Opcional
  notes?: string;              // Opcional
  formaDePago?: PaymentMethod; // Opcional
  role?: UserRole;             // Opcional, default: "user"
  membership?: {
    planId: string;            // Requerido si se especifica membership
    paymentMethod: PaymentMethod;
  };
}
```

#### **Response**

```typescript
{
  user: FitCenterUserProfile;
  message: string;
}
```

#### **Ejemplo**

```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "phone": "1234567890",
    "role": "user"
  }'
```

### **GET /api/users/[id]**

Obtiene un usuario específico por ID.

#### **Response**

```typescript
{
  user: FitCenterUserProfile;
}
```

### **PUT /api/users/[id]**

Actualiza un usuario existente.

#### **Request Body**

```typescript
{
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  notes?: string;
  formaDePago?: PaymentMethod;
}
```

### **DELETE /api/users/[id]**

Elimina un usuario (solo admin).

---

## 🏋️ **CLASES**

### **GET /api/classes**

Obtiene lista de clases con filtros.

#### **Query Parameters**

```typescript
{
  page?: number;           // Página (default: 1)
  limit?: number;          // Límite por página (default: 10)
  startDate?: string;      // Fecha de inicio (YYYY-MM-DD)
  endDate?: string;        // Fecha de fin (YYYY-MM-DD)
  instructorId?: string;   // Filtrar por instructor
  disciplineId?: string;   // Filtrar por disciplina
  status?: ClassStatus;    // Filtrar por estado
  organizationId: string;  // ID de la organización (requerido)
}
```

#### **Response**

```typescript
{
  classes: FitCenterClassSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### **POST /api/classes**

Crea una nueva clase.

#### **Request Body**

```typescript
{
  disciplineId: string;      // Requerido
  name: string;              // Requerido, 1-255 caracteres
  dateTime: string;          // Requerido, formato ISO
  durationMinutes: number;   // Requerido, 15-180 minutos
  instructorId: string;      // Requerido
  capacity: number;          // Requerido, 1-100
  notes?: string;            // Opcional
  organizationId: string;    // Requerido
}
```

### **GET /api/classes/[id]**

Obtiene una clase específica.

### **PUT /api/classes/[id]**

Actualiza una clase existente.

### **DELETE /api/classes/[id]**

Elimina una clase (solo admin).

---

## 📅 **REGISTRO EN CLASES**

### **POST /api/classes/[id]/register**

Registra un usuario en una clase.

#### **Request Body**

```typescript
{
  userId: string; // Requerido
}
```

#### **Response**

```typescript
{
  success: boolean;
  message: string;
  class: FitCenterClassSession;
}
```

### **POST /api/classes/[id]/cancel**

Cancela el registro de un usuario en una clase.

#### **Request Body**

```typescript
{
  userId: string;  // Requerido
  reason?: string; // Opcional
}
```

### **GET /api/classes/[id]/participants**

Obtiene lista de participantes de una clase.

#### **Response**

```typescript
{
  participants: FitCenterUserProfile[];
  waitlist: FitCenterUserProfile[];
  capacity: number;
  registered: number;
  available: number;
}
```

---

## 👨‍🏫 **INSTRUCTORES**

### **GET /api/instructors**

Obtiene lista de instructores.

#### **Query Parameters**

```typescript
{
  page?: number;           // Página (default: 1)
  limit?: number;          // Límite por página (default: 10)
  isActive?: boolean;      // Filtrar por estado activo
  organizationId: string;  // ID de la organización (requerido)
}
```

### **POST /api/instructors**

Crea un nuevo instructor.

#### **Request Body**

```typescript
{
  firstName: string;       // Requerido, 2-100 caracteres
  lastName: string;        // Requerido, 2-100 caracteres
  email: string;           // Requerido, email válido
  phone?: string;          // Opcional
  specialties: string[];   // Requerido, al menos una
  organizationId: string;  // Requerido
}
```

### **GET /api/instructors/[id]**

Obtiene un instructor específico.

### **PUT /api/instructors/[id]**

Actualiza un instructor existente.

### **DELETE /api/instructors/[id]**

Elimina un instructor (solo admin).

---

## 🎯 **DISCIPLINAS**

### **GET /api/disciplines**

Obtiene lista de disciplinas.

#### **Query Parameters**

```typescript
{
  isActive?: boolean;      // Filtrar por estado activo
  organizationId: string;  // ID de la organización (requerido)
}
```

### **POST /api/disciplines**

Crea una nueva disciplina.

#### **Request Body**

```typescript
{
  name: string;            // Requerido, 2-255 caracteres
  description?: string;    // Opcional
  color?: string;          // Opcional, formato hex (#RRGGBB)
  isActive?: boolean;      // Opcional, default: true
  schedule?: ScheduleConfig[]; // Opcional
  organizationId: string;  // Requerido
}
```

### **GET /api/disciplines/[id]**

Obtiene una disciplina específica.

### **PUT /api/disciplines/[id]**

Actualiza una disciplina existente.

### **DELETE /api/disciplines/[id]**

Elimina una disciplina (solo admin).

---

## 💳 **MEMBRESÍAS**

### **GET /api/memberships**

Obtiene lista de membresías.

#### **Query Parameters**

```typescript
{
  page?: number;           // Página (default: 1)
  limit?: number;          // Límite por página (default: 10)
  status?: MembershipStatus; // Filtrar por estado
  organizationId: string;  // ID de la organización (requerido)
}
```

### **POST /api/memberships**

Crea una nueva membresía.

#### **Request Body**

```typescript
{
  userId: string;          // Requerido
  status: MembershipStatus; // Requerido
  membershipType: string;  // Requerido
  planId?: string;         // Opcional
  monthlyPrice: number;    // Requerido, > 0
  startDate: string;       // Requerido, formato YYYY-MM-DD
  organizationId: string;  // Requerido
}
```

### **PUT /api/memberships/[id]/status**

Actualiza el estado de una membresía.

#### **Request Body**

```typescript
{
  status: MembershipStatus; // Requerido
  reason?: string;          // Opcional, para rechazos
}
```

### **POST /api/memberships/[id]/renewal**

Solicita renovación de membresía.

#### **Request Body**

```typescript
{
  planId: string; // Requerido
  paymentMethod: PaymentMethod; // Requerido
}
```

---

## 📊 **ESTADÍSTICAS**

### **GET /api/stats/users**

Obtiene estadísticas de usuarios.

#### **Query Parameters**

```typescript
{
  organizationId: string;  // ID de la organización (requerido)
  period?: string;         // Opcional: "day", "week", "month", "year"
}
```

#### **Response**

```typescript
{
  total: number;
  active: number;
  inactive: number;
  pending: number;
  expired: number;
  frozen: number;
  newThisPeriod: number;
  growthRate: number;
}
```

### **GET /api/stats/classes**

Obtiene estadísticas de clases.

#### **Response**

```typescript
{
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  averageAttendance: number;
  totalRegistrations: number;
  popularDisciplines: Array<{
    disciplineId: string;
    name: string;
    count: number;
  }>;
}
```

### **GET /api/stats/revenue**

Obtiene estadísticas de ingresos.

#### **Response**

```typescript
{
  totalRevenue: number;
  monthlyRevenue: number;
  averageMembershipPrice: number;
  renewalRate: number;
  revenueByPlan: Array<{
    planId: string;
    name: string;
    revenue: number;
    members: number;
  }>;
}
```

---

## 🔍 **BÚSQUEDA**

### **GET /api/search**

Búsqueda global en el sistema.

#### **Query Parameters**

```typescript
{
  query: string;           // Requerido, término de búsqueda
  type?: "users" | "classes" | "disciplines" | "instructors"; // Opcional
  organizationId: string;  // ID de la organización (requerido)
  limit?: number;          // Opcional, default: 10
}
```

#### **Response**

```typescript
{
  users?: FitCenterUserProfile[];
  classes?: FitCenterClassSession[];
  disciplines?: FitCenterDiscipline[];
  instructors?: FitCenterInstructor[];
  total: number;
}
```

---

## 🔔 **NOTIFICACIONES**

### **POST /api/notifications/send**

Envía una notificación a usuarios.

#### **Request Body**

```typescript
{
  type: "email" | "push" | "sms";
  recipients: string[];    // IDs de usuarios
  title: string;           // Título de la notificación
  message: string;         // Mensaje
  data?: Record<string, any>; // Datos adicionales
  organizationId: string;  // ID de la organización
}
```

### **GET /api/notifications**

Obtiene notificaciones del usuario actual.

#### **Query Parameters**

```typescript
{
  page?: number;           // Página (default: 1)
  limit?: number;          // Límite por página (default: 10)
  read?: boolean;          // Filtrar por leídas/no leídas
}
```

---

## 🔄 **TIEMPO REAL**

### **POST /api/emit-event**

Emite un evento WebSocket.

#### **Request Body**

```typescript
{
  event: string;           // Nombre del evento
  data: any;               // Datos del evento
  organizationId?: string; // ID de la organización (opcional)
}
```

#### **Eventos Disponibles**

- `class-cancelled`: Clase cancelada
- `user-registered`: Usuario registrado en clase
- `user-cancelled`: Usuario canceló registro
- `class-updated`: Clase actualizada
- `membership-status-changed`: Estado de membresía cambiado
- `new-notification`: Nueva notificación

---

## 🛠️ **ADMINISTRACIÓN**

### **POST /api/admin/users/[id]/approve**

Aprueba un usuario pendiente.

#### **Response**

```typescript
{
  success: boolean;
  message: string;
  user: FitCenterUserProfile;
}
```

### **POST /api/admin/users/[id]/reject**

Rechaza un usuario pendiente.

#### **Request Body**

```typescript
{
  reason: string; // Requerido, motivo del rechazo
}
```

### **POST /api/admin/users/[id]/reactivate**

Reactiva un usuario rechazado.

### **POST /api/admin/classes/[id]/cancel-bulk**

Cancela múltiples clases.

#### **Request Body**

```typescript
{
  classIds: string[];      // IDs de las clases a cancelar
  reason?: string;         // Motivo de la cancelación
}
```

### **POST /api/admin/cleanup**

Ejecuta limpieza automática del sistema.

#### **Query Parameters**

```typescript
{
  type: "rejected-users" | "expired-memberships" | "old-classes";
  daysOld?: number;        // Días de antigüedad (default: 90)
}
```

---

## 📝 **LOGS Y AUDITORÍA**

### **GET /api/logs**

Obtiene logs del sistema.

#### **Query Parameters**

```typescript
{
  page?: number;           // Página (default: 1)
  limit?: number;          // Límite por página (default: 50)
  level?: "info" | "warn" | "error"; // Nivel de log
  action?: string;         // Tipo de acción
  userId?: string;         // ID del usuario
  startDate?: string;      // Fecha de inicio
  endDate?: string;        // Fecha de fin
  organizationId: string;  // ID de la organización
}
```

#### **Response**

```typescript
{
  logs: Array<{
    id: string;
    timestamp: string;
    level: string;
    action: string;
    userId?: string;
    userEmail?: string;
    details: any;
    ipAddress?: string;
    userAgent?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

---

## 🚨 **MANEJO DE ERRORES**

### **Formato de Error**

```typescript
{
  error: {
    code: string;          // Código de error
    message: string;       // Mensaje descriptivo
    details?: any;         // Detalles adicionales
    timestamp: string;     // Timestamp del error
    requestId: string;     // ID único de la request
  };
}
```

### **Códigos de Error Comunes**

- `VALIDATION_ERROR`: Datos de entrada inválidos
- `NOT_FOUND`: Recurso no encontrado
- `UNAUTHORIZED`: No autorizado
- `FORBIDDEN`: Acceso prohibido
- `CONFLICT`: Conflicto de datos
- `RATE_LIMIT_EXCEEDED`: Límite de requests excedido
- `INTERNAL_ERROR`: Error interno del servidor

### **Ejemplo de Error**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos proporcionados son inválidos",
    "details": {
      "email": ["El email debe ser válido"],
      "phone": ["El teléfono debe tener al menos 8 dígitos"]
    },
    "timestamp": "2024-12-20T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

---

## 📋 **EJEMPLOS DE USO**

### **Flujo Completo de Registro de Usuario**

```bash
# 1. Crear usuario
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "María",
    "lastName": "González",
    "email": "maria@example.com",
    "phone": "9876543210",
    "role": "user"
  }'

# 2. Aprobar usuario (admin)
curl -X POST "http://localhost:3000/api/admin/users/USER_ID/approve"

# 3. Registrar en clase
curl -X POST "http://localhost:3000/api/classes/CLASS_ID/register" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID"}'
```

### **Gestión de Clases**

```bash
# 1. Crear clase
curl -X POST "http://localhost:3000/api/classes" \
  -H "Content-Type: application/json" \
  -d '{
    "disciplineId": "disc_001",
    "name": "CrossFit Básico",
    "dateTime": "2024-12-21T10:00:00Z",
    "durationMinutes": 60,
    "instructorId": "inst_001",
    "capacity": 15,
    "organizationId": "org_blacksheep_001"
  }'

# 2. Obtener participantes
curl -X GET "http://localhost:3000/api/classes/CLASS_ID/participants"

# 3. Cancelar clase
curl -X POST "http://localhost:3000/api/classes/CLASS_ID/cancel" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "reason": "Emergencia familiar"}'
```

---

## 🔧 **CONFIGURACIÓN Y DEPLOYMENT**

### **Variables de Entorno**

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/blacksheep"

# Autenticación
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# WebSocket
NEXT_PUBLIC_WS_URL="ws://localhost:3000"

# Cache
REDIS_URL="redis://localhost:6379"

# Monitoreo
SENTRY_DSN="your-sentry-dsn"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### **Rate Limiting**

```typescript
// Configuración por endpoint
const rateLimitConfig = {
  "/api/users": { windowMs: 15 * 60 * 1000, max: 100 },
  "/api/classes": { windowMs: 15 * 60 * 1000, max: 200 },
  "/api/auth": { windowMs: 15 * 60 * 1000, max: 10 },
  "/api/admin": { windowMs: 15 * 60 * 1000, max: 50 },
};
```

---

_Esta documentación se actualiza regularmente. Última actualización: Diciembre 2024_
