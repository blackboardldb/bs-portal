# Aplicaciones BlackSheep CrossFit - Documentación Completa

## 📋 Índice

1. [Introducción](#introducción)
2. [Aplicación Cliente (`/app`)](#aplicación-cliente-app)
3. [Aplicación Admin (`/admin`)](#aplicación-admin-admin)
4. [Arquitectura y Conexiones](#arquitectura-y-conexiones)
5. [Flujos de Usuario](#flujos-de-usuario)
6. [Estados y Permisos](#estados-y-permisos)

---

## 🎯 Introducción

BlackSheep CrossFit cuenta con dos aplicaciones principales que trabajan de manera integrada:

- **🏃‍♂️ Aplicación Cliente (`/app`)**: Para miembros del gimnasio
- **👨‍💼 Aplicación Admin (`/admin`)**: Para administradores y staff

Ambas aplicaciones comparten el mismo backend, base de datos y sistema de autenticación, pero ofrecen experiencias completamente diferentes según el rol del usuario.

---

## 🏃‍♂️ Aplicación Cliente (`/app`)

### Propósito

Permite a los miembros gestionar su membresía, reservar clases, ver su progreso y mantenerse conectados con el gimnasio.

### Estructura de Navegación

```
/app/
├── 🏠 Dashboard Principal (/)
├── 📅 Calendario de Clases (/calendario)
├── 👤 Perfil de Usuario (/perfil)
├── 💳 Gestión de Plan (/plan)
└── 📞 Soporte (/soporte)
```

### Secciones Detalladas

#### 🏠 Dashboard Principal (`/app`)

**Propósito**: Vista principal del miembro con resumen de su actividad

**Estados del Usuario**:

##### Estado Activo

- ✅ Saludo personalizado: "¡Hola, Juan! 👋"
- ✅ Estado del plan: "Plan Básico - Activo ✅"
- ✅ Progreso visual: Barra "7/10 clases utilizadas"
- ✅ Próximas clases reservadas
- ✅ Estadísticas del mes actual
- ✅ Acceso completo al calendario

##### Estado Pendiente

- ⏳ Banner: "Plan Pendiente de Validación"
- 📱 Botón para contactar por WhatsApp
- ❌ No puede reservar clases
- 📋 Mensaje explicativo del proceso

##### Estado Expirado

- 🚨 Banner: "Plan Expirado"
- 🔄 Botón "Renovar Plan"
- ❌ No puede reservar clases
- 📝 Mensaje para renovar membresía

#### 📅 Calendario de Clases (`/app/calendario`)

**Funcionalidades**:

- ✅ **Vista Calendario**: Clases organizadas por fecha
- ✅ **Filtros**: Por disciplina, instructor, horario
- ✅ **Reservas**: Botón para reservar clases futuras
- ✅ **Cancelaciones**: Cancelar reservas según reglas
- ✅ **Capacidad**: Ver cupos disponibles en tiempo real
- ✅ **Estado Visual**: Colores según disponibilidad

**Estados de Clases**:

- 🟢 **Disponible**: Puede reservar
- 🔵 **Reservada**: Ya inscrito, puede cancelar
- 🔴 **Llena**: Sin cupos disponibles
- ⚪ **Pasada**: Clase ya ocurrió

---

## 👨‍💼 Aplicación Admin (`/admin`)

### Propósito

Herramienta completa para administradores para gestionar usuarios, clases, finanzas y operaciones del gimnasio.

### Estructura de Navegación

```
/admin/
├── 📊 Dashboard Principal (/)
├── 👥 Gestión de Alumnos (/alumnos)
├── 📅 Calendario Admin (/calendario)
├── 🏃‍♂️ Gestión de Clases (/clases)
├── 🎯 Disciplinas (/disciplinas)
├── 👨‍🏫 Instructores (/instructores)
├── 💳 Planes de Membresía (/planes)
├── 💰 Finanzas (/finanzas)
└── ⚙️ Configuración (/configuracion)
```

### Secciones Detalladas

#### 📊 Dashboard Principal (`/admin`)

**Métricas Principales**:

- ✅ **Total Miembros**: 150 usuarios registrados
- ✅ **Ingresos Mensuales**: $450.000 (clickeable → /admin/finanzas)
- ✅ **Egresos Mensuales**: $125.000 (clickeable → /admin/finanzas)
- ✅ **Balance**: $325.000 ganancia del mes
- ✅ **Membresías por Estado**: Activas, pendientes, expiradas
- ✅ **Tasa de Retención**: 85% de miembros activos

#### 👥 Gestión de Alumnos (`/admin/alumnos`)

**Funcionalidades**:

- ✅ **Búsqueda**: Por nombre, email, teléfono
- ✅ **Filtros**: Por estado (activo/pendiente/expirado)
- ✅ **Filtros**: Por plan (básico/premium/ilimitado)
- ✅ **Paginación**: Lista organizada por páginas
- ✅ **Acciones**: Ver, editar, aprobar, rechazar, expirar

**Acciones por Usuario**:

- 👁️ **Ver Perfil**: Información completa
- ✏️ **Editar**: Modificar datos personales
- ✅ **Aprobar**: Activar usuarios pendientes
- ❌ **Rechazar**: Denegar solicitudes
- ⏰ **Expirar**: Marcar plan como vencido
- 🗑️ **Eliminar**: Remover usuario (con confirmación)

#### 📅 Calendario Admin (`/admin/calendario`)

**Capacidades Administrativas**:

- ✅ **Vista Completa**: Todas las clases del mes
- ✅ **Crear Clases**: Formulario para nuevas clases
- ✅ **Editar Clases**: Modificar horarios, instructores
- ✅ **Cancelar Clases**: Con notificación automática
- ✅ **Ver Inscritos**: Lista de participantes
- ✅ **Gestionar Espera**: Mover usuarios entre estados

#### 💰 Finanzas (`/admin/finanzas`)

**Funcionalidades Financieras**:

- ✅ **Selector de Mes**: Filtrar por período específico
- ✅ **Cards de Resumen**: Ingresos, egresos, balance
- ✅ **Ingresos Detallados**: Lista por miembro activo
- ✅ **Gestión de Egresos**: Crear, ver, eliminar gastos
- ✅ **Cálculos Automáticos**: Balance en tiempo real

---

## 🏗️ Arquitectura y Conexiones

### Flujo de Datos General

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Zustand Store  │    │   Backend APIs  │
│  (React/Next)   │ ←→ │  (Estado Global) │ ←→ │  (/api/*)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                ↕                        ↕
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Components │    │   Business Logic │    │   Database      │
│  (Shadcn/UI)    │    │   (Validations)  │    │   (PostgreSQL)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### APIs Backend Compartidas

```
/api/
├── auth/                 # Autenticación (ambas apps)
├── users/                # Gestión de usuarios
├── classes/              # Gestión de clases
├── registrations/        # Inscripciones a clases
├── plans/                # Planes de membresía
├── expenses/             # Finanzas (solo admin)
└── notifications/        # Notificaciones
```

### Componentes Compartidos

```
components/
├── ui/                   # Componentes base (Shadcn/UI)
├── shared/               # Componentes compartidos
├── clientcomponents/     # Específicos de cliente
└── admincomponents/      # Específicos de admin
```

---

## 🔄 Flujos de Usuario

### Flujo Cliente: Reservar Clase

1. Usuario entra a `/app/calendario`
2. Sistema verifica si plan está activo
3. Si activo: muestra calendario con clases disponibles
4. Usuario selecciona clase
5. Sistema verifica cupos y clases restantes
6. Si todo OK: confirma reserva
7. API actualiza inscripción
8. Usuario ve confirmación

### Flujo Admin: Aprobar Usuario

1. Admin entra a `/admin/alumnos`
2. Filtra por usuarios "Pendientes"
3. Selecciona usuario para revisar
4. Revisa datos y pago
5. Click en "Aprobar"
6. API cambia estado a "activo"
7. Usuario puede usar la aplicación

### Flujo Compartido: Cancelar Clase

1. Admin cancela clase en `/admin/calendario`
2. Sistema marca clase como cancelada
3. Obtiene lista de usuarios inscritos
4. Envía notificaciones automáticas
5. Actualiza calendario en tiempo real
6. Clientes ven clase cancelada automáticamente

---

## 🔐 Estados y Permisos

### Matriz de Permisos

| Acción             | Cliente Activo | Cliente Pendiente | Cliente Expirado | Admin |
| ------------------ | -------------- | ----------------- | ---------------- | ----- |
| Ver calendario     | ✅             | ❌                | ❌               | ✅    |
| Reservar clases    | ✅             | ❌                | ❌               | ✅    |
| Cancelar reservas  | ✅             | ❌                | ❌               | ✅    |
| Ver perfil propio  | ✅             | ✅                | ✅               | ✅    |
| Renovar plan       | ✅             | ❌                | ✅               | ✅    |
| Ver otros usuarios | ❌             | ❌                | ❌               | ✅    |
| Aprobar usuarios   | ❌             | ❌                | ❌               | ✅    |
| Crear clases       | ❌             | ❌                | ❌               | ✅    |
| Ver finanzas       | ❌             | ❌                | ❌               | ✅    |

### Validaciones de Estado

**Para Reservar Clases**:

1. Usuario debe tener plan activo
2. Plan no debe estar expirado
3. Debe tener clases disponibles
4. Clase debe tener cupos
5. No debe estar ya inscrito

**Para Acciones Admin**:

1. Usuario debe tener rol admin
2. Validaciones específicas por acción
3. Confirmaciones para acciones destructivas

---

## 📱 Características Técnicas

### Responsive Design

- ✅ **Mobile First**: Diseño optimizado para móviles
- ✅ **Breakpoints**: sm (640px), md (768px), lg (1024px)
- ✅ **Grids Adaptativos**: Columnas que se ajustan por pantalla
- ✅ **Navegación Móvil**: Menús colapsables

### Performance

- ✅ **Lazy Loading**: Componentes se cargan bajo demanda
- ✅ **Memoización**: React.memo para componentes pesados
- ✅ **Paginación**: Listas grandes divididas en páginas
- ✅ **Cache**: Zustand persiste datos importantes

### Accesibilidad

- ✅ **ARIA Labels**: Etiquetas para lectores de pantalla
- ✅ **Keyboard Navigation**: Navegación por teclado
- ✅ **Color Contrast**: Colores accesibles
- ✅ **Focus Management**: Manejo correcto del foco

---

## 🔧 Configuración

### Variables de Entorno

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/blacksheep"
NEXTAUTH_SECRET="your-secret-key"
RESEND_API_KEY="re_your_resend_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Scripts de Desarrollo

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run db:migrate   # Migrar base de datos
npm run db:studio    # Abrir Prisma Studio
```

---

## 📞 Soporte y Recursos

### Documentación Relacionada

- 🔐 **Autenticación**: `docs/auth-flow-documentation.md`
- 💳 **Planes**: `docs/sistema-planes-membresia.md`
- 💰 **Finanzas**: `docs/sistema-finanzas.md`

### Herramientas

- 🎨 **UI**: Shadcn/UI + Tailwind CSS
- 🧪 **Testing**: Jest + React Testing Library
- 📊 **Estado**: Zustand para manejo de estado
- 🗄️ **Base de Datos**: PostgreSQL + Prisma

### Contacto

- 📧 **Email**: dev@blacksheep.com
- 💬 **Chat**: Slack #dev-frontend
- 🐛 **Issues**: GitHub Issues

---

_Última actualización: Enero 2025_
_Sistema BlackSheep CrossFit - Aplicaciones Completas_
