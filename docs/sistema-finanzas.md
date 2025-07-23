# Sistema de Finanzas - Documentación Completa

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Funcionalidades Principales](#funcionalidades-principales)
4. [Estructura de Datos](#estructura-de-datos)
5. [APIs y Endpoints](#apis-y-endpoints)
6. [Interfaz de Usuario](#interfaz-de-usuario)
7. [Base de Datos](#base-de-datos)
8. [Migración y Despliegue](#migración-y-despliegue)
9. [Casos de Uso](#casos-de-uso)
10. [Mantenimiento](#mantenimiento)

---

## 🎯 Introducción

El Sistema de Finanzas de BlackSheep CrossFit permite gestionar ingresos y egresos del negocio de manera integral. Proporciona visibilidad completa de la salud financiera con reportes mensuales, filtros por período y gestión de gastos operacionales.

### Características Principales

- ✅ **Dashboard Financiero**: Resumen ejecutivo con métricas clave
- ✅ **Gestión de Egresos**: Registro y seguimiento de gastos
- ✅ **Cálculo Automático de Ingresos**: Basado en membresías activas
- ✅ **Filtros Temporales**: Análisis por mes/año específico
- ✅ **Preparado para BD**: Arquitectura híbrida memoria/base de datos
- ✅ **Interfaz Intuitiva**: UX optimizada para administradores

---

## 🏗️ Arquitectura del Sistema

### Flujo de Datos Actual

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend UI   │ ←→ │  Zustand Store   │ ←→ │  Memoria RAM    │
│  (Finanzas)     │    │ (blacksheep-store)│    │ (se pierde al   │
└─────────────────┘    └──────────────────┘    │  recargar)      │
                                               └─────────────────┘
```

### Arquitectura Futura (Base de Datos)

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │ ←→ │  Zustand Store   │ ←→ │   API Routes    │ ←→ │  Base de Datos  │
│  (Finanzas)     │    │ (blacksheep-store)│    │ (/api/expenses) │    │   (Persistente) │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └─────────────────┘
```

### Componentes del Sistema

```
Sistema de Finanzas/
├── 📊 Dashboard Admin (Resumen)
│   ├── Tarjeta Ingresos Mensuales
│   ├── Tarjeta Egresos Mensuales
│   └── Tarjeta Balance
├── 💰 Página Finanzas Completa
│   ├── Selector de Mes/Año
│   ├── Cards de Resumen
│   ├── Lista Detallada de Ingresos
│   └── Gestión de Egresos
└── 🔧 APIs Backend
    ├── /api/expenses (GET, POST)
    └── /api/expenses/[id] (DELETE, PUT)
```

---

## ⚙️ Funcionalidades Principales

### 1. 📊 Dashboard Ejecutivo (`/admin`)

**Ubicación**: Tarjetas en el dashboard principal de administración

**Funcionalidades**:

- ✅ **Ingresos Mensuales**: Suma automática de membresías activas del mes actual
- ✅ **Egresos Mensuales**: Suma de gastos registrados del mes actual
- ✅ **Links Directos**: Click en las tarjetas lleva a `/admin/finanzas`
- ✅ **Indicadores Visuales**: Colores y iconos para fácil identificación

**Datos Mostrados**:

```typescript
// Ingresos Mensuales
{
  titulo: "Ingresos Mensuales",
  valor: "$450.000", // Suma de membresías activas
  subtitulo: "15 miembros activos",
  icono: DollarSign,
  color: "verde",
  link: "/admin/finanzas"
}

// Egresos Mensuales
{
  titulo: "Egresos Mensuales",
  valor: "$125.000", // Suma de gastos del mes
  subtitulo: "8 gastos este mes",
  icono: MinusCircle,
  color: "rojo",
  link: "/admin/finanzas"
}
```

### 2. 💰 Página de Finanzas Completa (`/admin/finanzas`)

**Funcionalidades Principales**:

#### A. Selector de Período

- ✅ **Dropdown de Meses**: Últimos 12 meses disponibles
- ✅ **Formato Localizado**: "enero 2025", "diciembre 2024"
- ✅ **Filtrado Automático**: Todos los datos se actualizan al cambiar mes

#### B. Cards de Resumen

```typescript
// Tres cards principales
{
  "Ingresos de enero 2025": {
    valor: "$450.000",
    detalle: "15 membresías activas",
    icono: TrendingUp,
    color: "verde"
  },
  "Egresos de enero 2025": {
    valor: "$125.000",
    detalle: "8 gastos registrados",
    icono: TrendingDown,
    color: "rojo"
  },
  "Balance": {
    valor: "$325.000",
    detalle: "Ganancia del mes",
    icono: DollarSign,
    color: "verde" // o rojo si es negativo
  }
}
```

#### C. Lista Detallada de Ingresos

- ✅ **Título Dinámico**: "Ingresos de enero 2025"
- ✅ **Datos por Miembro**: Nombre, plan, fecha de inicio, precio
- ✅ **Filtrado Automático**: Solo membresías del mes seleccionado
- ✅ **Mensaje Vacío**: "No hay ingresos registrados en enero 2025"

#### D. Gestión de Egresos

- ✅ **Título Dinámico**: "Egresos de enero 2025"
- ✅ **Modal de Creación**: Formulario para agregar gastos
- ✅ **Lista de Gastos**: Motivo, fecha, monto, botón eliminar
- ✅ **Filtrado por Mes**: Solo gastos del período seleccionado
- ✅ **Persistencia**: Datos se mantienen al cambiar de mes

### 3. 🔧 Modal de Agregar Gasto

**Campos del Formulario**:

```typescript
{
  motivo: string,     // "Alquiler del local"
  fecha: Date,        // Selector de fecha
  monto: number       // Input numérico
}
```

**Validaciones**:

- ✅ **Motivo**: Requerido, mínimo 3 caracteres
- ✅ **Fecha**: Requerida, formato válido
- ✅ **Monto**: Requerido, número positivo

**Comportamiento**:

- ✅ **Guardado Inmediato**: Se ve reflejado al instante
- ✅ **Actualización Automática**: Cards de resumen se recalculan
- ✅ **Feedback Visual**: Toast de confirmación

---

## 📊 Estructura de Datos

### Tipo Egreso/Expense

```typescript
export type Egreso = {
  id: string; // "expense_1234567890_abc123"
  motivo: string; // "Alquiler del local"
  fecha: string; // "2025-01-15T00:00:00.000Z" (ISO date)
  monto: number; // 150000
  createdAt?: string; // "2025-01-15T10:30:00.000Z"
  updatedAt?: string; // "2025-01-15T10:30:00.000Z"
};
```

### Datos de Ingresos (Calculados)

```typescript
// Calculado desde membresías de usuarios
type IngresoCalculado = {
  nombre: string; // "Juan Pérez"
  plan: string; // "Plan Básico"
  fecha: string; // "2025-01-01T00:00:00.000Z"
  precio: number; // 35000
};
```

### Estado del Store (Zustand)

```typescript
interface FinancialState {
  // Datos
  egresos: Egreso[];
  users: User[]; // Para calcular ingresos

  // Acciones
  fetchEgresos: () => Promise<void>;
  addEgreso: (egreso: Omit<Egreso, "id">) => Promise<void>;
  deleteEgreso: (id: string) => Promise<void>;
}
```

### Datos de Prueba Incluidos

```typescript
// Egresos de ejemplo para testing
const egresosPrueba = [
  {
    id: "egreso_1",
    motivo: "Alquiler del local",
    fecha: "2025-01-15T00:00:00.000Z",
    monto: 150000,
  },
  {
    id: "egreso_2",
    motivo: "Equipamiento nuevo",
    fecha: "2025-01-20T00:00:00.000Z",
    monto: 75000,
  },
  {
    id: "egreso_3",
    motivo: "Servicios básicos",
    fecha: "2024-12-10T00:00:00.000Z",
    monto: 45000,
  },
];
```

---

## 🔌 APIs y Endpoints

### 1. GET `/api/expenses`

**Propósito**: Obtener lista de egresos con filtros opcionales

**Parámetros Query**:

```typescript
{
  year?: string;    // "2025"
  month?: string;   // "0" (enero, 0-indexed)
}
```

**Respuesta Exitosa**:

```json
{
  "success": true,
  "data": [
    {
      "id": "expense_123",
      "motivo": "Alquiler del local",
      "fecha": "2025-01-15T00:00:00.000Z",
      "monto": 150000,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "total": 1,
  "source": "database" // o "memory"
}
```

**Ejemplo de Uso**:

```typescript
// Obtener egresos de enero 2025
const response = await fetch("/api/expenses?year=2025&month=0");
const data = await response.json();
```

### 2. POST `/api/expenses`

**Propósito**: Crear nuevo egreso

**Body de Petición**:

```json
{
  "motivo": "Alquiler del local",
  "fecha": "2025-01-15T00:00:00.000Z",
  "monto": 150000
}
```

**Validaciones**:

- ✅ `motivo`: Requerido, string no vacío
- ✅ `fecha`: Requerida, fecha válida
- ✅ `monto`: Requerido, número positivo

**Respuesta Exitosa**:

```json
{
  "success": true,
  "data": {
    "id": "expense_1234567890_abc123",
    "motivo": "Alquiler del local",
    "fecha": "2025-01-15T00:00:00.000Z",
    "monto": 150000,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  },
  "message": "Egreso creado exitosamente",
  "source": "database"
}
```

### 3. DELETE `/api/expenses/[id]`

**Propósito**: Eliminar egreso específico

**Parámetros**:

- `id`: ID del egreso a eliminar

**Respuesta Exitosa**:

```json
{
  "success": true,
  "data": {
    "id": "expense_123",
    "motivo": "Alquiler del local"
    // ... resto de datos eliminados
  },
  "message": "Egreso eliminado exitosamente"
}
```

### 4. PUT `/api/expenses/[id]`

**Propósito**: Actualizar egreso existente (preparado para futuro)

**Body de Petición**:

```json
{
  "motivo": "Alquiler del local - Actualizado",
  "monto": 160000
}
```

---

## 🎨 Interfaz de Usuario

### Página Dashboard Admin (`/admin`)

#### Tarjetas Financieras

```tsx
// Tarjeta de Ingresos
<MetricCard
  title="Ingresos Mensuales"
  value="$450.000"
  subtitle="15 miembros activos"
  icon={DollarSign}
  linkTo="/admin/finanzas"
  className="hover:shadow-md cursor-pointer"
/>

// Tarjeta de Egresos
<MetricCard
  title="Egresos Mensuales"
  value="$125.000"
  subtitle="8 gastos este mes"
  icon={MinusCircle}
  linkTo="/admin/finanzas"
  className="hover:shadow-md cursor-pointer"
/>
```

**Características Visuales**:

- ✅ **Hover Effect**: Sombra al pasar el mouse
- ✅ **Cursor Pointer**: Indica que es clickeable
- ✅ **Texto de Acción**: "Ver detalles →"
- ✅ **Colores Semánticos**: Verde para ingresos, rojo para egresos

### Página Finanzas Completa (`/admin/finanzas`)

#### Layout Principal

```tsx
<div className="p-4 md:p-8">
  {/* Header con selector */}
  <div className="flex justify-between items-center mb-6">
    <h1>Finanzas</h1>
    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
      {/* Opciones de meses */}
    </Select>
  </div>

  {/* Cards de resumen */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    {/* Tres cards principales */}
  </div>

  {/* Detalle de ingresos y egresos */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {/* Lista de ingresos | Gestión de egresos */}
  </div>
</div>
```

#### Selector de Mes

```tsx
<Select value="2025-01" onValueChange={setSelectedMonth}>
  <SelectTrigger className="w-48">
    <SelectValue placeholder="Seleccionar mes" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="2025-01">enero 2025</SelectItem>
    <SelectItem value="2024-12">diciembre 2024</SelectItem>
    <SelectItem value="2024-11">noviembre 2024</SelectItem>
    {/* ... más opciones */}
  </SelectContent>
</Select>
```

#### Lista de Ingresos

```tsx
<Card>
  <CardHeader>
    <CardTitle>Ingresos de enero 2025</CardTitle>
  </CardHeader>
  <CardContent>
    {ingresosMes.length === 0 ? (
      <div className="text-muted-foreground">
        No hay ingresos registrados en enero 2025.
      </div>
    ) : (
      <ul className="divide-y divide-gray-200">
        {ingresosMes.map((ingreso) => (
          <li className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">{ingreso.nombre}</div>
              <div className="text-xs text-muted-foreground">
                {ingreso.plan} | {new Date(ingreso.fecha).toLocaleDateString()}
              </div>
            </div>
            <span className="font-semibold">
              ${ingreso.precio?.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    )}
  </CardContent>
</Card>
```

#### Gestión de Egresos

```tsx
<Card>
  <CardHeader>
    <CardTitle>Egresos de enero 2025</CardTitle>
    <AddExpenseModal onSuccess={fetchEgresos} />
  </CardHeader>
  <CardContent>
    {egresosMes.length === 0 ? (
      <div className="text-muted-foreground">
        No hay egresos registrados en enero 2025.
      </div>
    ) : (
      <ul className="divide-y divide-gray-200">
        {egresosMes.map((egreso) => (
          <li className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">{egreso.motivo}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(egreso.fecha).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold">
                ${egreso.monto.toLocaleString()}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteEgreso(egreso.id)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    )}
  </CardContent>
</Card>
```

### Modal de Agregar Gasto

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button size="sm">Agregar Gasto</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Agregar Nuevo Gasto</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="motivo">Motivo del gasto</Label>
          <Input
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Alquiler del local"
            required
          />
        </div>
        <div>
          <Label htmlFor="fecha">Fecha</Label>
          <Input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="monto">Monto</Label>
          <Input
            id="monto"
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="150000"
            min="1"
            required
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar Gasto"}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

---

## 🗄️ Base de Datos

### Esquema Prisma

```prisma
// Modelo para egresos/gastos
model Expense {
  id        String   @id @default(cuid())
  motivo    String   // Reason for the expense
  fecha     DateTime // Date of the expense
  monto     Float    // Amount spent
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("expenses")
  @@index([fecha])
  @@index([createdAt])
}
```

### Tabla SQL Generada

```sql
CREATE TABLE expenses (
  id         VARCHAR PRIMARY KEY,
  motivo     VARCHAR NOT NULL,
  fecha      TIMESTAMP NOT NULL,
  monto      DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX idx_expenses_fecha ON expenses(fecha);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);
```

### Consultas Comunes

```sql
-- Obtener egresos del mes actual
SELECT * FROM expenses
WHERE fecha >= '2025-01-01' AND fecha < '2025-02-01'
ORDER BY fecha DESC;

-- Total gastado por mes
SELECT
  DATE_TRUNC('month', fecha) as mes,
  SUM(monto) as total_gastado,
  COUNT(*) as cantidad_gastos
FROM expenses
GROUP BY DATE_TRUNC('month', fecha)
ORDER BY mes DESC;

-- Egresos por categoría (si se agrega campo categoria)
SELECT motivo, SUM(monto) as total
FROM expenses
WHERE fecha >= '2025-01-01' AND fecha < '2025-02-01'
GROUP BY motivo
ORDER BY total DESC;
```

### Ubicación de los Datos

**Con PostgreSQL (configuración actual)**:

```
📁 Tu Servidor de Base de Datos
├── 🗃️ Database: blacksheep_crossfit
│   ├── 📊 Tabla: expenses
│   │   ├── 🔑 id (cuid único)
│   │   ├── 📝 motivo (texto)
│   │   ├── 📅 fecha (timestamp)
│   │   ├── 💰 monto (decimal)
│   │   ├── ⏰ created_at
│   │   └── ⏰ updated_at
│   └── 📊 Otras tablas (users, class_sessions, etc.)
```

**Herramientas de Acceso**:

- ✅ **Prisma Studio**: `npx prisma studio` (interfaz web)
- ✅ **pgAdmin**: Para PostgreSQL
- ✅ **TablePlus, DBeaver**: Clientes universales
- ✅ **API Endpoints**: `/api/expenses` desde tu aplicación

---

## 🚀 Migración y Despliegue

### Estado Actual vs Futuro

#### Implementación Actual (Mock)

```typescript
// Store con datos en memoria
egresos: [
  {
    id: "egreso_1",
    motivo: "Alquiler del local",
    fecha: "2025-01-15T00:00:00.000Z",
    monto: 150000,
  }
],

// Funciones que solo modifican memoria
addEgreso: async (egreso) => {
  set((state) => ({
    egresos: [...state.egresos, { ...egreso, id: `egreso_${Date.now()}` }],
  }));
},
```

#### Implementación Futura (Base de Datos)

```typescript
// Funciones híbridas con fallback
addEgreso: async (egreso) => {
  try {
    // Intentar usar Prisma primero
    const newExpense = await prisma.expense.create({
      data: {
        motivo: egreso.motivo.trim(),
        fecha: new Date(egreso.fecha),
        monto: Number(egreso.monto),
      },
    });

    // Actualizar store con datos de BD
    set((state) => ({
      egresos: [...state.egresos, formatExpense(newExpense)],
    }));
  } catch (dbError) {
    // Fallback a memoria si BD no disponible
    console.log("Database not available, using memory");
    set((state) => ({
      egresos: [...state.egresos, { ...egreso, id: `egreso_${Date.now()}` }],
    }));
  }
},
```

### Pasos para Migrar a Base de Datos

#### 1. Generar Cliente Prisma

```bash
npx prisma generate
```

#### 2. Crear Migración

```bash
npx prisma migrate dev --name add-expenses-table
```

#### 3. Verificar Migración

```bash
# Ver datos en Prisma Studio
npx prisma studio

# O consultar directamente
npx prisma db seed # si tienes datos de prueba
```

#### 4. Probar APIs

```bash
# Crear gasto de prueba
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "motivo": "Prueba de API",
    "fecha": "2025-01-15T00:00:00.000Z",
    "monto": 50000
  }'

# Obtener gastos
curl http://localhost:3000/api/expenses?year=2025&month=0
```

#### 5. Verificar en UI

1. Ir a `/admin/finanzas`
2. Agregar un gasto nuevo
3. Cambiar de mes y volver
4. Verificar que el gasto persiste

### Variables de Entorno Necesarias

```env
# .env.local
DATABASE_URL="postgresql://usuario:password@localhost:5432/blacksheep_crossfit"
```

### Rollback Plan

Si algo falla, el sistema automáticamente usa el fallback en memoria:

```typescript
// Las APIs detectan si la BD no está disponible
catch (dbError) {
  console.log("Database not available, using mock data:", dbError);
  // Continúa funcionando con datos en memoria
}
```

---

## 📋 Casos de Uso

### Caso 1: Administrador Revisa Finanzas del Mes

**Flujo**:

1. Admin entra a `/admin`
2. Ve tarjetas de "Ingresos: $450.000" y "Egresos: $125.000"
3. Hace click en tarjeta de Egresos
4. Llega a `/admin/finanzas` con enero 2025 seleccionado
5. Ve balance positivo de $325.000
6. Revisa lista detallada de gastos del mes

**Resultado**: Admin tiene visibilidad completa de la situación financiera

### Caso 2: Registrar Gasto Operacional

**Flujo**:

1. Admin va a `/admin/finanzas`
2. Hace click en "Agregar Gasto"
3. Completa formulario:
   - Motivo: "Mantenimiento equipos"
   - Fecha: 15/01/2025
   - Monto: 75.000
4. Hace click en "Guardar Gasto"
5. Ve toast de confirmación
6. El gasto aparece inmediatamente en la lista
7. Cards de resumen se actualizan automáticamente

**Resultado**: Gasto registrado y reflejado en todas las métricas

### Caso 3: Análisis Histórico por Meses

**Flujo**:

1. Admin va a `/admin/finanzas`
2. Cambia selector de "enero 2025" a "diciembre 2024"
3. Ve datos actualizados:
   - Ingresos de diciembre 2024: $380.000
   - Egresos de diciembre 2024: $95.000
   - Balance: $285.000
4. Compara con enero para ver tendencias
5. Cambia a noviembre 2024 para análisis trimestral

**Resultado**: Admin puede analizar tendencias y tomar decisiones

### Caso 4: Corrección de Error en Gasto

**Flujo**:

1. Admin identifica gasto incorrecto en la lista
2. Hace click en botón de eliminar (ícono de basura)
3. Confirma eliminación
4. Gasto desaparece de la lista
5. Cards de resumen se recalculan automáticamente
6. Balance se actualiza correctamente

**Resultado**: Error corregido, métricas actualizadas

### Caso 5: Migración a Base de Datos

**Flujo**:

1. Desarrollador ejecuta `npx prisma migrate dev`
2. Sistema detecta BD disponible
3. Próximos gastos se guardan en BD
4. Gastos anteriores (en memoria) siguen visibles
5. Gradualmente todos los datos migran a BD
6. Sistema funciona híbrido sin interrupciones

**Resultado**: Migración transparente sin pérdida de datos

---

## 🔧 Mantenimiento

### Monitoreo del Sistema

#### Métricas Clave a Seguir

```typescript
// Métricas de uso
const metrics = {
  gastos_creados_mes: number,
  gastos_eliminados_mes: number,
  usuarios_activos_finanzas: number,
  tiempo_promedio_sesion: number,
  errores_api_expenses: number,
};

// Métricas de negocio
const businessMetrics = {
  ingresos_mensuales: number,
  egresos_mensuales: number,
  balance_mensual: number,
  tendencia_gastos: "up" | "down" | "stable",
  categorias_gasto_mas_comunes: string[],
};
```

#### Logs Importantes

```typescript
// Logs de éxito
console.log("Expense created:", { id, motivo, monto, source: "database" });
console.log("Monthly balance calculated:", { ingresos, egresos, balance });

// Logs de error
console.error("Database connection failed, using memory fallback");
console.error("Invalid expense data:", validationErrors);

// Logs de rendimiento
console.time("Calculate monthly balance");
console.timeEnd("Calculate monthly balance");
```

### Tareas de Mantenimiento Regulares

#### Diarias

- ✅ Verificar que las APIs respondan correctamente
- ✅ Revisar logs de errores en `/api/expenses`
- ✅ Confirmar que los cálculos de balance sean correctos

#### Semanales

- ✅ Revisar métricas de uso del sistema de finanzas
- ✅ Verificar integridad de datos entre memoria y BD
- ✅ Analizar tendencias de gastos por categoría

#### Mensuales

- ✅ Backup de datos de expenses
- ✅ Análisis de rendimiento de consultas
- ✅ Revisión de capacidad de almacenamiento
- ✅ Actualización de documentación si hay cambios

### Resolución de Problemas Comunes

#### Problema: "Los gastos no se guardan"

**Diagnóstico**:

```bash
# Verificar conexión a BD
npx prisma db pull

# Verificar logs de API
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"motivo":"Test","fecha":"2025-01-15","monto":1000}'
```

**Solución**:

1. Verificar `DATABASE_URL` en `.env.local`
2. Ejecutar `npx prisma migrate deploy`
3. Reiniciar servidor de desarrollo

#### Problema: "Los cálculos de balance están incorrectos"

**Diagnóstico**:

```typescript
// Verificar datos de entrada
console.log("Ingresos calculados:", ingresosMes);
console.log("Egresos filtrados:", egresosMes);
console.log("Balance resultante:", balance);
```

**Solución**:

1. Verificar filtros de fecha en ambos cálculos
2. Confirmar que `selectedMonth` sea 0-indexed
3. Revisar formato de fechas en datos de usuarios

#### Problema: "El selector de mes no funciona"

**Diagnóstico**:

```typescript
// Verificar estado del selector
console.log("Selected month:", selectedMonth);
console.log("Parsed year/month:", selectedYear, selectedMonthIndex);
```

**Solución**:

1. Verificar formato del valor del selector (`YYYY-MM`)
2. Confirmar que `setSelectedMonth` se ejecute
3. Revisar que los filtros usen `selectedMonthIndex` correctamente

### Optimizaciones Futuras

#### Rendimiento

- ✅ **Paginación**: Para listas largas de gastos
- ✅ **Cache**: Redis para cálculos frecuentes
- ✅ **Índices**: Optimizar consultas por fecha
- ✅ **Lazy Loading**: Cargar datos bajo demanda

#### Funcionalidades

- ✅ **Categorías de Gastos**: Clasificar gastos por tipo
- ✅ **Reportes PDF**: Exportar reportes mensuales
- ✅ **Gráficos**: Visualización de tendencias
- ✅ **Presupuestos**: Límites mensuales por categoría
- ✅ **Notificaciones**: Alertas de gastos altos

#### Integración

- ✅ **Contabilidad**: Exportar a sistemas contables
- ✅ **Bancos**: Importar movimientos bancarios
- ✅ **Facturación**: Conectar con sistema de facturación
- ✅ **Reportes**: Dashboard ejecutivo avanzado

---

## 📞 Soporte y Recursos

### Documentación Relacionada

- 📚 **Sistema de Planes**: `docs/sistema-planes-membresia.md`
- 🔐 **Autenticación**: `docs/auth-flow-documentation.md`
- 🏗️ **Migración**: `docs/migration-guide.md`

### APIs Relacionadas

- 👥 **Usuarios**: `/api/users` (para calcular ingresos)
- 📊 **Planes**: `/api/plans` (para datos de membresías)
- 💰 **Egresos**: `/api/expenses` (gestión de gastos)

### Herramientas de Desarrollo

- 🔧 **Prisma Studio**: `npx prisma studio`
- 📊 **Base de Datos**: Configurada en `DATABASE_URL`
- 🧪 **Testing**: Tests incluidos en el sistema
- 📝 **Logs**: Console y archivos de log

### Contacto para Soporte

- 📧 **Email**: dev@blacksheep.com
- 💬 **Chat**: Slack #dev-finanzas
- 🐛 **Issues**: GitHub Issues
- 📖 **Wiki**: Documentación interna

---

_Última actualización: Enero 2025_
_Sistema BlackSheep CrossFit - Gestión Financiera_
