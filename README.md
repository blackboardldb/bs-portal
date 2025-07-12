# 🏋️ BLACKSHEEP CROSSFIT - SISTEMA DE GESTIÓN

Sistema de gestión integral para gimnasios CrossFit que maneja usuarios, clases, membresías, instructores y administración en tiempo real. Diseñado para ser multitenant desde su arquitectura base.

## ✨ **CARACTERÍSTICAS PRINCIPALES**

- 🎯 **Gestión Completa de Usuarios** - Registro, aprobación, membresías
- 📅 **Sistema de Clases** - Reservas, cancelaciones, horarios
- 👨‍🏫 **Gestión de Instructores** - Especialidades, disponibilidad
- 💳 **Membresías Flexibles** - Múltiples estados y planes
- 🔔 **Notificaciones en Tiempo Real** - WebSocket integrado
- 📱 **PWA Completa** - Instalable como app nativa
- 🛡️ **Validación Robusta** - Zod schemas en toda la app
- ⚡ **Performance Optimizada** - Cache, lazy loading, error boundaries
- 🎨 **UI Moderna** - ShadCN + Tailwind CSS
- 🔒 **Seguridad** - Validación, sanitización, rate limiting

## 🚀 **TECNOLOGÍAS**

- **Frontend**: Next.js 14 (App Router + Pages Router)
- **UI**: ShadCN + Tailwind CSS
- **Estado**: Zustand
- **Validación**: Zod
- **Tiempo Real**: WebSocket nativo + Socket.IO
- **PWA**: Service Worker + Manifest
- **Cache**: Sistema de cache en memoria
- **Base de Datos**: Mock (preparado para PostgreSQL/MySQL)

## 📦 **INSTALACIÓN RÁPIDA**

```bash
# Clonar repositorio
git clone <repository-url>
cd bs-portal

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Iniciar desarrollo
npm run dev
```

## 📚 **DOCUMENTACIÓN**

- [📖 Documentación del Sistema](./docs/system-documentation.md)
- [📡 Documentación de API](./docs/api-documentation.md)
- [🛠️ Guía de Desarrollo](./docs/development-guide.md)
- [🔄 Actualizaciones en Tiempo Real](./docs/realtime-updates.md)

## 🏗️ **ARQUITECTURA**

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

## 🎯 **FUNCIONALIDADES PRINCIPALES**

### **👥 Gestión de Usuarios**

- Registro multi-step con validación
- Aprobación/rechazo por administradores
- Estados de membresía (active, pending, expired, etc.)
- Perfiles completos con estadísticas

### **📅 Sistema de Clases**

- Reserva y cancelación de clases
- Gestión de capacidad y lista de espera
- Horarios por disciplina
- Notificaciones en tiempo real

### **💳 Membresías**

- Múltiples estados (active, frozen, expired, etc.)
- Planes configurables
- Renovación automática
- Estadísticas de uso

### **🔔 Tiempo Real**

- WebSocket para actualizaciones instantáneas
- Notificaciones push
- Sincronización automática entre clientes

### **📱 PWA**

- Instalable como app nativa
- Funcionalidad offline
- Service Worker para cache
- Notificaciones push

## 🚀 **SCRIPTS DISPONIBLES**

```bash
npm run dev          # Desarrollo
npm run build        # Construcción
npm run start        # Producción
npm run lint         # Linting
npm run type-check   # Verificación de tipos
npm run test         # Tests
```

## 🔧 **CONFIGURACIÓN**

### **Variables de Entorno**

```env
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="postgresql://user:password@localhost:5432/blacksheep"
```

## 📊 **ESTADOS DEL SISTEMA**

### **Roles de Usuario**

- `admin` - Acceso completo
- `coach` - Gestión de clases y usuarios
- `user` - Reserva de clases y perfil

### **Estados de Membresía**

- `active` - Membresía activa
- `pending` - Pendiente de aprobación
- `expired` - Expirada
- `frozen` - Congelada
- `suspended` - Suspendida
- `inactive` - Inactiva

## 🔒 **SEGURIDAD**

- ✅ Validación con Zod en todas las APIs
- ✅ Sanitización de inputs
- ✅ Rate limiting
- ✅ Error boundaries
- ✅ Logs de auditoría

## 📈 **PERFORMANCE**

- ✅ Lazy loading de componentes
- ✅ Cache en memoria
- ✅ Optimización de imágenes
- ✅ Bundle splitting
- ✅ Service Worker para cache offline

## 🤝 **CONTRIBUCIÓN**

1. Fork el repositorio
2. Crear rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 **LICENCIA**

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 **SOPORTE**

- 📧 Email: support@blacksheep.com
- 📱 WhatsApp: +1234567890
- 🌐 Website: https://blacksheep.com

---

**Desarrollado con ❤️ para la comunidad CrossFit**
