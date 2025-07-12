# 📚 DOCUMENTACIÓN COMPLETA DEL SISTEMA BLACKSHEEP CROSSFIT

## 🎯 **VISION GENERAL**

BlackSheep CrossFit es un sistema de gestión integral para gimnasios CrossFit que maneja usuarios, clases, membresías, instructores y administración en tiempo real. El sistema está diseñado para ser multitenant desde su arquitectura base.

---

## 🏗️ **ARQUITECTURA DEL SISTEMA**

### **Stack Tecnológico**

- **Frontend**: Next.js 14 (App Router + Pages Router)
- **UI**: ShadCN + Tailwind CSS
- **Estado**: Zustand
- **Validación**: Zod
- **Tiempo Real**: WebSocket nativo + Socket.IO
- **PWA**: Service Worker + Manifest
- **Cache**: Sistema de cache en memoria
- **Base de Datos**: Mock (preparado para PostgreSQL/MySQL)

### **Estructura de Directorios**

```
bs-portal/
├── app/                    # App Router (Next.js 14)
│   ├── admin/             # Panel de administración
│   ├── api/               # API Routes (App Router)
│   ├── app/               # Aplicación cliente
│   └── auth/              # Autenticación multi-step
├── components/            # Componentes reutilizables
│   ├── admincomponents/   # Componentes específicos de admin
│   └── ui/               # Componentes base (ShadCN)
├── lib/                  # Utilidades y servicios
├── pages/                # Pages Router (para WebSockets)
└── public/               # Assets estáticos
```

---

## 📊 **TIPOS DE DATOS PRINCIPALES**

### **1. Usuario (FitCenterUserProfile)**

```typescript
interface FitCenterUserProfile {
  id: string; // ID único del usuario
  firstName: string; // Nombre
  lastName: string; // Apellido
  email: string; // Email único
  phone: string; // Teléfono
  dateOfBirth?: string; // Fecha de nacimiento
  gender?: string; // Género
  address?: string; // Dirección
  emergencyContact?: string; // Contacto de emergencia
  notes?: string; // Notas adicionales
  formaDePago?: PaymentMethod; // Método de pago preferido
  role: UserRole; // Rol en el sistema
  membership: FitCenterMembership; // Información de membresía
  globalPreferences: Record<string, any>; // Preferencias globales
  globalStats: Record<string, any>; // Estadísticas globales
  gamification: Record<string, any>; // Datos de gamificación
  rejectionInfo?: RejectionInfo; // Info de rechazo (si aplica)
}
```

### **2. Membresía (FitCenterMembership)**

```typescript
interface FitCenterMembership {
  id: string; // ID de la membresía
  organizationId: string; // ID de la organización (multitenant)
  organizationName: string; // Nombre de la organización
  status: MembershipStatus; // Estado actual
  membershipType: string; // Tipo de membresía
  planId?: string; // ID del plan asociado
  monthlyPrice: number; // Precio mensual
  startDate: string; // Fecha de inicio
  currentPeriodStart: string; // Inicio del período actual
  currentPeriodEnd: string; // Fin del período actual
  planConfig: PlanConfiguration; // Configuración del plan
  centerConfig: CenterConfiguration; // Configuración del centro
  centerStats: CenterStats; // Estadísticas del centro
  pendingRenewal?: RenewalRequest; // Solicitud de renovación pendiente
}
```

### **3. Clase (FitCenterClassSession)**

```typescript
interface FitCenterClassSession {
  id: string; // ID único de la clase
  organizationId: string; // ID de la organización
  disciplineId: string; // ID de la disciplina
  name: string; // Nombre de la clase
  dateTime: string; // Fecha y hora
  durationMinutes: number; // Duración en minutos
  instructorId: string; // ID del instructor
  capacity: number; // Capacidad máxima
  registeredParticipantsIds: string[]; // IDs de participantes
  waitlistIds: string[]; // IDs en lista de espera
  status: ClassStatus; // Estado de la clase
  notes?: string; // Notas adicionales
  createdAt: string; // Fecha de creación
  updatedAt: string; // Fecha de última actualización
}
```

### **4. Disciplina (FitCenterDiscipline)**

```typescript
interface FitCenterDiscipline {
  id: string; // ID único
  organizationId: string; // ID de la organización
  name: string; // Nombre de la disciplina
  description?: string; // Descripción
  color?: string; // Color para UI
  isActive: boolean; // Si está activa
  schedule?: ScheduleConfig[]; // Horarios configurados
  createdAt: string; // Fecha de creación
  updatedAt: string; // Fecha de actualización
}
```

### **5. Instructor (FitCenterInstructor)**

```typescript
interface FitCenterInstructor {
  id: string; // ID único
  organizationId: string; // ID de la organización
  firstName: string; // Nombre
  lastName: string; // Apellido
  email: string; // Email
  phone?: string; // Teléfono
  specialties: string[]; // Especialidades
  isActive: boolean; // Si está activo
  createdAt: string; // Fecha de creación
  updatedAt: string; // Fecha de actualización
}
```

---

## 👥 **ROLES Y PERMISOS**

### **1. UserRole (Enum)**

```typescript
type UserRole = "admin" | "coach" | "user";
```

| Rol     | Descripción               | Permisos                                                |
| ------- | ------------------------- | ------------------------------------------------------- |
| `admin` | Administrador del sistema | Acceso completo a todas las funciones                   |
| `coach` | Instructor/Entrenador     | Gestión de clases, ver usuarios, estadísticas limitadas |
| `user`  | Usuario regular           | Reservar clases, ver su perfil, estadísticas personales |

### **2. Permisos por Rol**

#### **Admin**

- ✅ Gestión completa de usuarios
- ✅ Aprobación/rechazo de solicitudes
- ✅ Gestión de clases y horarios
- ✅ Gestión de instructores
- ✅ Gestión de planes de membresía
- ✅ Estadísticas completas
- ✅ Configuración del sistema

#### **Coach**

- ✅ Ver lista de usuarios
- ✅ Gestión de clases asignadas
- ✅ Ver estadísticas de sus clases
- ✅ Comunicación con usuarios
- ❌ Gestión de membresías
- ❌ Configuración del sistema

#### **User**

- ✅ Reservar/cancelar clases
- ✅ Ver su perfil y estadísticas
- ✅ Ver horarios disponibles
- ✅ Comunicarse con instructores
- ❌ Acceso a panel de administración

---

## 📈 **ESTADOS DE MEMBRESÍA**

### **MembershipStatus (Enum)**

```typescript
type MembershipStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "expired"
  | "frozen"
  | "pending";
```

| Estado      | Descripción             | Comportamiento                           |
| ----------- | ----------------------- | ---------------------------------------- |
| `active`    | Membresía activa        | Puede reservar clases, acceso completo   |
| `inactive`  | Membresía inactiva      | No puede reservar, requiere reactivación |
| `suspended` | Membresía suspendida    | Temporalmente bloqueada por admin        |
| `expired`   | Membresía expirada      | Período vencido, requiere renovación     |
| `frozen`    | Membresía congelada     | Pausada temporalmente por usuario        |
| `pending`   | Pendiente de aprobación | Esperando aprobación del admin           |

### **Flujo de Estados**

```mermaid
graph TD
    A[Usuario se registra] --> B[pending]
    B --> C{Admin aprueba?}
    C -->|Sí| D[active]
    C -->|No| E[inactive]
    D --> F{Expira?}
    F -->|Sí| G[expired]
    F -->|No| H{Usuario congela?}
    H -->|Sí| I[frozen]
    H -->|No| J{Admin suspende?}
    J -->|Sí| K[suspended]
    J -->|No| D
    G --> L{Usuario renueva?}
    L -->|Sí| D
    L -->|No| G
    I --> M{Usuario descongela?}
    M -->|Sí| D
    K --> N{Admin reactiva?}
    N -->|Sí| D
```

---

## 🔄 **FLUJO DE DATOS Y CONECTIVIDAD**

### **1. Arquitectura de Comunicación**

```mermaid
graph TB
    A[Cliente Web] --> B[Next.js App Router]
    A --> C[Next.js Pages Router]
    B --> D[API Routes]
    C --> E[WebSocket Server]
    D --> F[Mock Database]
    E --> A
    D --> G[Emit Event API]
    G --> E
```

### **2. Flujo de Actualizaciones en Tiempo Real**

#### **Cancelación de Clase**

1. **Usuario cancela clase** → `POST /api/classes/[id]/cancel`
2. **API actualiza BD** → Marca clase como cancelada
3. **API emite evento** → `POST /api/emit-event`
4. **WebSocket Server** → Recibe evento y lo distribuye
5. **Clientes conectados** → Reciben actualización automática
6. **Store se actualiza** → UI se re-renderiza

#### **Registro en Clase**

1. **Usuario se registra** → `POST /api/classes/[id]/register`
2. **API valida capacidad** → Verifica cupos disponibles
3. **API actualiza BD** → Agrega usuario a la clase
4. **API emite evento** → `POST /api/emit-event`
5. **Otros usuarios** → Ven actualización en tiempo real

### **3. WebSocket Events**

| Evento            | Emisor    | Receptor           | Datos                                               |
| ----------------- | --------- | ------------------ | --------------------------------------------------- |
| `class-cancelled` | Admin API | Todos los clientes | `{classId, organizationId, cancelledBy, timestamp}` |
| `user-registered` | User API  | Todos los clientes | `{classId, userId, organizationId, timestamp}`      |
| `user-cancelled`  | User API  | Todos los clientes | `{classId, userId, organizationId, timestamp}`      |
| `class-updated`   | Admin API | Todos los clientes | `{classId, updates, organizationId, timestamp}`     |

---

## 🗄️ **INTEGRACIÓN CON BASE DE DATOS REAL**

### **1. Migración de Mock a Base Real**

#### **Estructura de Tablas Recomendada**

```sql
-- Tabla de organizaciones (multitenant)
CREATE TABLE organizations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    organization_id VARCHAR(50) REFERENCES organizations(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    emergency_contact VARCHAR(255),
    notes TEXT,
    forma_de_pago VARCHAR(50),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de membresías
CREATE TABLE memberships (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id),
    organization_id VARCHAR(50) REFERENCES organizations(id),
    status VARCHAR(20) NOT NULL,
    membership_type VARCHAR(100) NOT NULL,
    plan_id VARCHAR(50),
    monthly_price DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    plan_config JSONB DEFAULT '{}',
    center_config JSONB DEFAULT '{}',
    center_stats JSONB DEFAULT '{}',
    pending_renewal JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de disciplinas
CREATE TABLE disciplines (
    id VARCHAR(50) PRIMARY KEY,
    organization_id VARCHAR(50) REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    schedule JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de instructores
CREATE TABLE instructors (
    id VARCHAR(50) PRIMARY KEY,
    organization_id VARCHAR(50) REFERENCES organizations(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    specialties TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clases
CREATE TABLE class_sessions (
    id VARCHAR(50) PRIMARY KEY,
    organization_id VARCHAR(50) REFERENCES organizations(id),
    discipline_id VARCHAR(50) REFERENCES disciplines(id),
    instructor_id VARCHAR(50) REFERENCES instructors(id),
    name VARCHAR(255) NOT NULL,
    date_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de registros de clase
CREATE TABLE class_registrations (
    id VARCHAR(50) PRIMARY KEY,
    class_id VARCHAR(50) REFERENCES class_sessions(id),
    user_id VARCHAR(50) REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'registered',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    UNIQUE(class_id, user_id)
);
```

### **2. Índices Recomendados**

```sql
-- Índices para performance
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_organization ON memberships(organization_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_class_sessions_organization ON class_sessions(organization_id);
CREATE INDEX idx_class_sessions_date_time ON class_sessions(date_time);
CREATE INDEX idx_class_sessions_instructor ON class_sessions(instructor_id);
CREATE INDEX idx_class_registrations_class ON class_registrations(class_id);
CREATE INDEX idx_class_registrations_user ON class_registrations(user_id);
```

### **3. Migración de Datos**

#### **Script de Migración**

```typescript
// lib/migration-script.ts
import { PrismaClient } from "@prisma/client";
import { mockData } from "./mock-data";

const prisma = new PrismaClient();

async function migrateData() {
  try {
    // 1. Crear organización
    const organization = await prisma.organization.create({
      data: {
        id: "org_blacksheep_001",
        name: "BlackSheep CrossFit",
        slug: "blacksheep-crossfit",
      },
    });

    // 2. Migrar usuarios
    for (const user of mockData.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          organizationId: organization.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          // ... otros campos
        },
      });

      // 3. Crear membresía para cada usuario
      await prisma.membership.create({
        data: {
          id: user.membership.id,
          userId: user.id,
          organizationId: organization.id,
          status: user.membership.status,
          membershipType: user.membership.membershipType,
          monthlyPrice: user.membership.monthlyPrice,
          startDate: user.membership.startDate,
          currentPeriodStart: user.membership.currentPeriodStart,
          currentPeriodEnd: user.membership.currentPeriodEnd,
          planConfig: user.membership.planConfig,
          centerConfig: user.membership.centerConfig,
          centerStats: user.membership.centerStats,
        },
      });
    }

    // 4. Migrar disciplinas
    for (const discipline of mockData.disciplines) {
      await prisma.discipline.create({
        data: {
          id: discipline.id,
          organizationId: organization.id,
          name: discipline.name,
          description: discipline.description,
          color: discipline.color,
          isActive: discipline.isActive,
          schedule: discipline.schedule,
        },
      });
    }

    // 5. Migrar instructores
    for (const instructor of mockData.instructors) {
      await prisma.instructor.create({
        data: {
          id: instructor.id,
          organizationId: organization.id,
          firstName: instructor.firstName,
          lastName: instructor.lastName,
          email: instructor.email,
          phone: instructor.phone,
          specialties: instructor.specialties,
          isActive: instructor.isActive,
        },
      });
    }

    // 6. Migrar clases
    for (const classSession of mockData.classSessions) {
      await prisma.classSession.create({
        data: {
          id: classSession.id,
          organizationId: organization.id,
          disciplineId: classSession.disciplineId,
          instructorId: classSession.instructorId,
          name: classSession.name,
          dateTime: new Date(classSession.dateTime),
          durationMinutes: classSession.durationMinutes,
          capacity: classSession.capacity,
          status: classSession.status,
          notes: classSession.notes,
        },
      });

      // 7. Migrar registros de clase
      for (const userId of classSession.registeredParticipantsIds) {
        await prisma.classRegistration.create({
          data: {
            classId: classSession.id,
            userId: userId,
            status: "registered",
          },
        });
      }
    }

    console.log("Migración completada exitosamente");
  } catch (error) {
    console.error("Error durante la migración:", error);
  } finally {
    await prisma.$disconnect();
  }
}
```

---

## 🚀 **RECOMENDACIONES DE IMPLEMENTACIÓN**

### **1. Base de Datos**

#### **Opciones Recomendadas**

- **PostgreSQL**: Mejor para datos complejos y relaciones
- **MySQL**: Buena opción si ya tienes experiencia
- **Supabase**: PostgreSQL + autenticación + tiempo real
- **PlanetScale**: MySQL serverless

#### **Configuración Recomendada**

```env
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/blacksheep"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### **2. Autenticación**

#### **NextAuth.js (Recomendado)**

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Implementar lógica de autenticación
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email },
          include: { membership: true },
        });

        if (user && verifyPassword(credentials?.password, user.password)) {
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            organizationId: user.organizationId,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.organizationId = token.organizationId;
      return session;
    },
  },
};
```

### **3. Middleware de Autenticación**

```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Proteger rutas de admin
    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/auth", req.url));
    }

    // Proteger rutas de coach
    if (
      pathname.startsWith("/coach") &&
      !["admin", "coach"].includes(token?.role || "")
    ) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/coach/:path*", "/app/:path*"],
};
```

### **4. Optimizaciones de Performance**

#### **Prisma Optimizations**

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

#### **Cache Strategy**

```typescript
// lib/cache-strategy.ts
export const cacheConfig = {
  users: { ttl: 10 * 60 * 1000 }, // 10 minutos
  classes: { ttl: 2 * 60 * 1000 }, // 2 minutos
  stats: { ttl: 5 * 60 * 1000 }, // 5 minutos
  search: { ttl: 60 * 1000 }, // 1 minuto
};
```

### **5. Monitoreo y Logging**

#### **Sentry Integration**

```typescript
// lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### **Performance Monitoring**

```typescript
// lib/performance.ts
export function trackEvent(event: string, data?: any) {
  if (typeof window !== "undefined") {
    // Google Analytics, Mixpanel, etc.
    console.log("Event:", event, data);
  }
}
```

---

## 🔒 **SEGURIDAD Y COMPLIANCE**

### **1. Validación de Datos**

- ✅ Zod schemas en todas las APIs
- ✅ Sanitización de inputs
- ✅ Validación de tipos en runtime

### **2. Autenticación y Autorización**

- ✅ JWT tokens seguros
- ✅ Middleware de protección de rutas
- ✅ Verificación de roles y permisos

### **3. Protección de Datos**

- ✅ Encriptación de datos sensibles
- ✅ Logs de auditoría
- ✅ GDPR compliance ready

### **4. Rate Limiting**

```typescript
// lib/rate-limit.ts
import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: "Demasiadas requests desde esta IP",
});
```

---

## 📱 **PWA Y OFFLINE**

### **1. Service Worker Features**

- ✅ Cache de assets estáticos
- ✅ Funcionalidad offline básica
- ✅ Background sync
- ✅ Push notifications

### **2. Manifest Features**

- ✅ Instalación como app nativa
- ✅ Shortcuts personalizados
- ✅ Splash screen personalizado
- ✅ Orientación preferida

---

## 🧪 **TESTING STRATEGY**

### **1. Unit Tests**

```typescript
// __tests__/services/user-service.test.ts
import { UserService } from "@/lib/services/user-service";

describe("UserService", () => {
  test("should create user with valid data", async () => {
    const service = UserService.getInstance();
    const userData = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "1234567890",
    };

    const user = await service.createUser(userData);
    expect(user.firstName).toBe("John");
    expect(user.membership.status).toBe("pending");
  });
});
```

### **2. Integration Tests**

```typescript
// __tests__/api/classes.test.ts
import { createMocks } from "node-mocks-http";
import handler from "@/pages/api/classes";

describe("/api/classes", () => {
  test("should return classes for organization", async () => {
    const { req, res } = createMocks({
      method: "GET",
      query: { organizationId: "org_blacksheep_001" },
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
  });
});
```

### **3. E2E Tests**

```typescript
// e2e/admin-flow.spec.ts
import { test, expect } from "@playwright/test";

test("admin can approve user", async ({ page }) => {
  await page.goto("/admin");
  await page.click('[data-testid="approve-user-btn"]');
  await expect(page.locator(".toast-success")).toBeVisible();
});
```

---

## 🚀 **DEPLOYMENT Y CI/CD**

### **1. Vercel (Recomendado)**

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@database-url",
    "NEXTAUTH_SECRET": "@nextauth-secret"
  }
}
```

### **2. Docker**

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### **3. Environment Variables**

```env
# .env.production
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://your-domain.com"
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
SENTRY_DSN="..."
```

---

## 📈 **MÉTRICAS Y MONITOREO**

### **1. Performance Metrics**

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTFB (Time to First Byte)**: < 600ms

### **2. Business Metrics**

- **User Engagement**: Tiempo en app, clases reservadas
- **Retention**: Usuarios que regresan después de 7/30 días
- **Conversion**: Registros completados vs iniciados
- **Revenue**: Membresías activas, renovaciones

### **3. Technical Metrics**

- **Error Rate**: < 1%
- **API Response Time**: < 200ms
- **Cache Hit Rate**: > 80%
- **Uptime**: > 99.9%

---

## 🔮 **ROADMAP FUTURO**

### **Fase 1 (Inmediato)**

- [ ] Migración a base de datos real
- [ ] Implementación de autenticación completa
- [ ] Tests unitarios y de integración

### **Fase 2 (Corto plazo)**

- [ ] Sistema de notificaciones push
- [ ] Analytics avanzado
- [ ] Integración con pasarelas de pago

### **Fase 3 (Mediano plazo)**

- [ ] App móvil nativa
- [ ] Integración con wearables
- [ ] IA para recomendaciones

### **Fase 4 (Largo plazo)**

- [ ] Marketplace de instructores
- [ ] Sistema de franquicias
- [ ] Integración con redes sociales

---

## 📞 **SOPORTE Y MANTENIMIENTO**

### **1. Documentación de API**

- Swagger/OpenAPI specs
- Postman collections
- Ejemplos de uso

### **2. Logs y Debugging**

- Structured logging
- Error tracking
- Performance monitoring

### **3. Backup Strategy**

- Daily database backups
- Point-in-time recovery
- Disaster recovery plan

---

_Esta documentación se actualiza regularmente. Última actualización: Diciembre 2024_
