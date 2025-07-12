# Actualizaciones en Tiempo Real con WebSockets

## 🎯 **Objetivo**

Implementar actualizaciones automáticas entre diferentes navegadores/usuarios cuando se realizan cambios en las clases (cancelar, inscribir, etc.).

## 🔧 **Implementación con Socket.IO**

### 1. **Instalación de dependencias**

```bash
npm install socket.io socket.io-client
```

### 2. **Configuración del servidor WebSocket**

#### `pages/api/socket.ts` (Next.js API Route)

```typescript
import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (!res.socket.server.io) {
    const httpServer: NetServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    // Manejar conexiones de clientes
    io.on("connection", (socket) => {
      console.log("Cliente conectado:", socket.id);

      // Unirse a la sala de la organización
      socket.on("join-organization", (orgId: string) => {
        socket.join(`org_${orgId}`);
        console.log(`Cliente ${socket.id} se unió a org_${orgId}`);
      });

      socket.on("disconnect", () => {
        console.log("Cliente desconectado:", socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default ioHandler;
```

### 3. **Hook personalizado para WebSocket**

#### `lib/use-socket.ts`

```typescript
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketOptions {
  organizationId: string;
  onClassUpdate?: (data: any) => void;
  onClassCancelled?: (classId: string) => void;
  onUserRegistered?: (data: { classId: string; userId: string }) => void;
}

export function useSocket(options: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Conectar al WebSocket
    const socket = io({
      path: "/api/socket",
    });

    socketRef.current = socket;

    // Unirse a la organización
    socket.emit("join-organization", options.organizationId);

    // Escuchar eventos de actualización de clases
    socket.on("class-updated", (data) => {
      console.log("Clase actualizada:", data);
      options.onClassUpdate?.(data);
    });

    socket.on("class-cancelled", (classId: string) => {
      console.log("Clase cancelada:", classId);
      options.onClassCancelled?.(classId);
    });

    socket.on("user-registered", (data) => {
      console.log("Usuario registrado:", data);
      options.onUserRegistered?.(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [options.organizationId]);

  return socketRef.current;
}
```

### 4. **Integración en el Store**

#### `lib/blacksheep-store.ts` (modificaciones)

```typescript
import { useSocket } from "./use-socket";

export const useBlackSheepStore = create<StoreState & StoreActions>(
  (set, get) => ({
    // ... estado existente ...

    // Inicializar WebSocket
    initializeSocket: () => {
      const socket = useSocket({
        organizationId: "org_blacksheep_001",
        onClassUpdate: (data) => {
          // Actualizar clase específica en el store
          set((state) => ({
            classSessions: state.classSessions.map((cs) =>
              cs.id === data.id ? { ...cs, ...data } : cs
            ),
          }));
        },
        onClassCancelled: (classId) => {
          // Marcar clase como cancelada
          set((state) => ({
            classSessions: state.classSessions.map((cs) =>
              cs.id === classId ? { ...cs, status: "cancelled" } : cs
            ),
          }));
        },
        onUserRegistered: (data) => {
          // Agregar usuario a la clase
          set((state) => ({
            classSessions: state.classSessions.map((cs) =>
              cs.id === data.classId
                ? {
                    ...cs,
                    registeredParticipantsIds: [
                      ...cs.registeredParticipantsIds,
                      data.userId,
                    ],
                  }
                : cs
            ),
          }));
        },
      });
    },
  })
);
```

### 5. **Emitir eventos desde la API (IMPLEMENTACIÓN CORRECTA)**

#### `app/api/classes/[id]/admin/cancel/route.ts` (implementación real)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/mock-database";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ... lógica existente de cancelación ...

    // Emitir evento WebSocket usando la API route dedicada
    await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/emit-event`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "class-cancelled",
          data: {
            classId: params.id,
            organizationId: classSession.organizationId,
            cancelledBy: "admin",
            timestamp: new Date().toISOString(),
          },
        }),
      }
    );

    return NextResponse.json({
      message: "Clase cancelada exitosamente",
      class: updatedClass,
    });
  } catch (error) {
    // ... manejo de errores ...
  }
}
```

#### `pages/api/emit-event.ts` (API Route para emitir eventos)

```typescript
import { NextApiRequest, NextApiResponse } from "next";
import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { event, data } = req.body;

  if (!res.socket.server.io) {
    const httpServer: NetServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    });
    res.socket.server.io = io;
  }

  const io = res.socket.server.io as SocketIOServer;

  // Emitir evento a la organización específica
  io.to(`org_${data.organizationId}`).emit(event, data);

  res.status(200).json({ success: true });
}
```

### 6. **Uso en componentes**

#### `app/admin/clases/page.tsx` (modificaciones)

```typescript
export default function AdminClasesPage() {
  const {
    classSessions,
    disciplines,
    instructors,
    fetchClasses,
    initializeSocket,
  } = useBlackSheepStore();

  // Inicializar WebSocket al montar
  useEffect(() => {
    initializeSocket();
    fetchClasses();
  }, [initializeSocket, fetchClasses]);

  // ... resto del componente ...
}
```

## 🚀 **Flujo de actualización en tiempo real**

1. **Usuario A cancela una clase** en `/admin/clases`
2. **API procesa la cancelación** y actualiza la base de datos
3. **API emite evento WebSocket** `class-cancelled` a todos los clientes de la organización
4. **Usuario B (en otro navegador)** recibe el evento automáticamente
5. **Store de Usuario B se actualiza** automáticamente
6. **UI de Usuario B se re-renderiza** mostrando la clase como cancelada

## 🔧 **Configuración para producción**

### **Con servicios externos (recomendado)**

```typescript
// Usar servicios como Pusher, Ably, o Firebase
import Pusher from "pusher-js";

const pusher = new Pusher("YOUR_APP_KEY", {
  cluster: "YOUR_CLUSTER",
});

const channel = pusher.subscribe("organization-org_blacksheep_001");
channel.bind("class-cancelled", (data) => {
  // Actualizar store
});
```

### **Con servidor propio**

```typescript
// Configurar Redis para escalabilidad
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

## 📊 **Ventajas de esta implementación**

- ✅ **Actualizaciones instantáneas** entre usuarios
- ✅ **Escalabilidad** con Redis y servicios externos
- ✅ **Bajo consumo de recursos** (solo eventos, no polling)
- ✅ **Experiencia de usuario fluida** sin recargas
- ✅ **Compatibilidad** con diferentes navegadores y dispositivos

## 🎯 **Casos de uso**

- **Admin cancela clase** → Todos los alumnos ven la cancelación inmediatamente
- **Alumno se inscribe** → Admin ve el cambio en tiempo real
- **Clase se llena** → Todos los usuarios ven la actualización de capacidad
- **Cambios de horario** → Notificación automática a todos los inscritos

---

_Esta implementación transforma la app de "estática" a "reactiva", proporcionando una experiencia similar a apps como Google Calendar, Trello, o Slack._
