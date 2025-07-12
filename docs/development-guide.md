# 🛠️ GUÍA DE DESARROLLO - BLACKSHEEP CROSSFIT

## 🚀 **CONFIGURACIÓN INICIAL**

### **Requisitos Previos**

- Node.js 18+
- npm o pnpm
- Git
- VS Code (recomendado)

### **Instalación**

```bash
# Clonar repositorio
git clone <repository-url>
cd bs-portal

# Instalar dependencias
npm install
# o
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
```

### **Variables de Entorno**

```env
# .env.local
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="postgresql://user:password@localhost:5432/blacksheep"
```

### **Scripts Disponibles**

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run start        # Inicia servidor de producción
npm run lint         # Ejecuta ESLint
npm run type-check   # Verifica tipos TypeScript
npm run test         # Ejecuta tests
npm run test:watch   # Tests en modo watch
```

---

## 📁 **ESTRUCTURA DE ARCHIVOS**

### **Convenciones de Nombrado**

```
components/
├── ui/                    # Componentes base (ShadCN)
│   ├── button.tsx
│   └── input.tsx
├── admincomponents/       # Componentes específicos de admin
│   ├── user-approval.tsx
│   └── admin-dashboard.tsx
└── shared/               # Componentes compartidos
    ├── loading-spinner.tsx
    └── error-boundary.tsx

lib/
├── services/             # Lógica de negocio
│   ├── user-service.ts
│   └── class-service.ts
├── hooks/                # Hooks personalizados
│   ├── use-pagination.ts
│   └── use-cache.ts
├── utils/                # Utilidades
│   ├── date-helpers.ts
│   └── validation.ts
└── types/                # Definiciones de tipos
    ├── user.ts
    └── class.ts

app/
├── api/                  # API Routes (App Router)
│   ├── users/
│   └── classes/
├── admin/                # Páginas de administración
├── app/                  # Páginas de usuario
└── auth/                 # Páginas de autenticación
```

---

## 🎨 **ESTÁNDARES DE CÓDIGO**

### **TypeScript**

```typescript
// ✅ BUENO
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const createUser = async (userData: CreateUserInput): Promise<UserProfile> => {
  // implementación
};

// ❌ MALO
const createUser = async (userData: any) => {
  // implementación sin tipos
};
```

### **React Components**

```typescript
// ✅ BUENO - Componente funcional con tipos
interface UserCardProps {
  user: UserProfile;
  onEdit?: (userId: string) => void;
  onDelete?: (userId: string) => void;
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const handleEdit = useCallback(() => {
    onEdit?.(user.id);
  }, [user.id, onEdit]);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold">
        {user.firstName} {user.lastName}
      </h3>
      <p className="text-gray-600">{user.email}</p>
      <div className="flex gap-2 mt-2">
        <Button onClick={handleEdit} size="sm">
          Editar
        </Button>
        <Button
          onClick={() => onDelete?.(user.id)}
          variant="destructive"
          size="sm"
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

// ❌ MALO - Componente sin tipos
export function UserCard(props) {
  return (
    <div>
      <h3>{props.user.name}</h3>
    </div>
  );
}
```

### **Hooks Personalizados**

```typescript
// ✅ BUENO - Hook con tipos y manejo de errores
export function useUsers(organizationId: string) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/users?organizationId=${organizationId}`
        );
        if (!response.ok) {
          throw new Error("Error al cargar usuarios");
        }
        const data = await response.json();
        setUsers(data.users);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Error desconocido"));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [organizationId]);

  return { users, loading, error };
}
```

### **API Routes**

```typescript
// ✅ BUENO - API Route con validación y manejo de errores
import { NextRequest, NextResponse } from "next/server";
import { validateInput } from "@/lib/schemas";
import { createUserSchema } from "@/lib/schemas";
import { userService } from "@/lib/services/user-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos de entrada
    const validatedData = validateInput(createUserSchema, body);

    // Procesar con servicio
    const user = await userService.createUser(validatedData);

    return NextResponse.json(
      {
        success: true,
        user,
        message: "Usuario creado exitosamente",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);

    if (error instanceof Error && error.message.includes("Validación")) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
```

---

## 🧪 **TESTING**

### **Configuración de Tests**

```typescript
// jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "components/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
};
```

### **Unit Tests**

```typescript
// __tests__/services/user-service.test.ts
import { UserService } from "@/lib/services/user-service";
import { createUserSchema } from "@/lib/schemas";

describe("UserService", () => {
  let service: UserService;

  beforeEach(() => {
    service = UserService.getInstance();
  });

  describe("createUser", () => {
    it("should create user with valid data", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "1234567890",
      };

      const user = await service.createUser(userData);

      expect(user.firstName).toBe("John");
      expect(user.lastName).toBe("Doe");
      expect(user.email).toBe("john@example.com");
      expect(user.membership.status).toBe("pending");
    });

    it("should throw error with invalid data", async () => {
      const invalidData = {
        firstName: "J", // Muy corto
        email: "invalid-email", // Email inválido
      };

      await expect(service.createUser(invalidData as any)).rejects.toThrow(
        "Validación fallida"
      );
    });
  });
});
```

### **Component Tests**

```typescript
// __tests__/components/UserCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { UserCard } from "@/components/UserCard";

const mockUser = {
  id: "user_1",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
};

describe("UserCard", () => {
  it("should render user information", () => {
    render(<UserCard user={mockUser} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("should call onEdit when edit button is clicked", () => {
    const mockOnEdit = jest.fn();
    render(<UserCard user={mockUser} onEdit={mockOnEdit} />);

    fireEvent.click(screen.getByText("Editar"));

    expect(mockOnEdit).toHaveBeenCalledWith("user_1");
  });
});
```

### **API Tests**

```typescript
// __tests__/api/users.test.ts
import { createMocks } from "node-mocks-http";
import handler from "@/pages/api/users";

describe("/api/users", () => {
  it("should return users list", async () => {
    const { req, res } = createMocks({
      method: "GET",
      query: { organizationId: "org_blacksheep_001" },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toHaveProperty("users");
  });

  it("should create user with valid data", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "1234567890",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData())).toHaveProperty("user");
  });
});
```

---

## 🔧 **DESARROLLO LOCAL**

### **Flujo de Trabajo**

1. **Crear rama** para nueva funcionalidad

```bash
git checkout -b feature/user-management
```

2. **Desarrollar** con hot reload

```bash
npm run dev
```

3. **Verificar tipos** y linting

```bash
npm run type-check
npm run lint
```

4. **Ejecutar tests**

```bash
npm run test
```

5. **Commit** con mensaje descriptivo

```bash
git add .
git commit -m "feat: add user approval workflow

- Add approve/reject functionality
- Implement user status management
- Add email notifications
- Update UI components"
```

### **Debugging**

```typescript
// Debugging en desarrollo
if (process.env.NODE_ENV === "development") {
  console.log("Debug info:", { user, action, timestamp });
}

// Error boundaries
import { ErrorBoundary } from "@/components/error-boundary";

<ErrorBoundary fallback={<ErrorFallback />}>
  <UserComponent />
</ErrorBoundary>;
```

### **Performance Monitoring**

```typescript
// Medición de performance
import { performance } from "perf_hooks";

const start = performance.now();
// ... código a medir
const end = performance.now();
console.log(`Execution time: ${end - start}ms`);
```

---

## 🚀 **DEPLOYMENT**

### **Vercel (Recomendado)**

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@database-url",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "NEXTAUTH_URL": "@nextauth-url"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### **Docker**

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Builder
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### **Environment Variables**

```env
# .env.production
DATABASE_URL="postgresql://user:password@host:5432/blacksheep"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
SENTRY_DSN="your-sentry-dsn"
```

---

## 📊 **MONITOREO Y LOGS**

### **Structured Logging**

```typescript
// lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

// Uso
logger.info("User created", { userId: "user_123", email: "user@example.com" });
logger.error("Database connection failed", { error: error.message });
```

### **Error Tracking**

```typescript
// lib/error-tracking.ts
import * as Sentry from "@sentry/nextjs";

export function captureError(error: Error, context?: any) {
  Sentry.captureException(error, {
    extra: context,
  });

  if (process.env.NODE_ENV === "development") {
    console.error("Error captured:", error, context);
  }
}
```

### **Performance Monitoring**

```typescript
// lib/performance.ts
export function trackMetric(
  name: string,
  value: number,
  tags?: Record<string, string>
) {
  // Enviar a sistema de métricas (DataDog, New Relic, etc.)
  console.log(`Metric: ${name} = ${value}`, tags);
}

// Uso en componentes
useEffect(() => {
  const start = performance.now();

  return () => {
    const duration = performance.now() - start;
    trackMetric("component_mount_time", duration, { component: "UserList" });
  };
}, []);
```

---

## 🔒 **SEGURIDAD**

### **Validación de Inputs**

```typescript
// Siempre validar en el servidor
import { validateInput } from "@/lib/schemas";
import { createUserSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = validateInput(createUserSchema, body);
    // Procesar datos validados
  } catch (error) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
}
```

### **Sanitización**

```typescript
// lib/sanitize.ts
import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}
```

### **Rate Limiting**

```typescript
// lib/rate-limit.ts
import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests
  message: "Demasiadas requests desde esta IP",
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

## 📚 **RECURSOS Y REFERENCIAS**

### **Documentación Oficial**

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [ShadCN UI](https://ui.shadcn.com)

### **Herramientas Recomendadas**

- **VS Code Extensions**:

  - TypeScript Importer
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier
  - GitLens

- **DevTools**:
  - React Developer Tools
  - Redux DevTools (si usas Redux)
  - Network tab para debugging API

### **Comandos Útiles**

```bash
# Verificar tipos
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Tests
npm run test
npm run test:watch
npm run test:coverage

# Build
npm run build
npm run start

# Database
npm run db:migrate
npm run db:seed
```

---

## 🤝 **CONTRIBUCIÓN**

### **Pull Request Process**

1. **Fork** el repositorio
2. **Crear rama** para tu feature
3. **Desarrollar** siguiendo estándares
4. **Tests** deben pasar
5. **Linting** debe pasar
6. **Crear PR** con descripción clara
7. **Code review** requerido
8. **Merge** después de aprobación

### **Commit Convention**

```
feat: add user approval workflow
fix: resolve pagination issue
docs: update API documentation
style: format code with prettier
refactor: extract user service logic
test: add unit tests for user service
chore: update dependencies
```

### **Code Review Checklist**

- [ ] Código sigue estándares
- [ ] Tests incluidos y pasando
- [ ] Documentación actualizada
- [ ] Performance considerada
- [ ] Seguridad verificada
- [ ] Accesibilidad verificada

---

_Esta guía se actualiza regularmente. Última actualización: Diciembre 2024_
