// =============================
// CONSTANTES CENTRALIZADAS
// =============================

// Configuración de paginación
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  SMALL_PAGE_SIZE: 5,
  LARGE_PAGE_SIZE: 20,
} as const;

// Configuración de fechas
export const DATE_CONFIG = {
  REJECTION_RETENTION_DAYS: 90, // 3 meses
  EXPIRY_WARNING_DAYS: 7,
  DEFAULT_TIMEZONE: "America/Santiago",
} as const;

// Configuración de UI
export const UI_CONFIG = {
  MOBILE_BREAKPOINT: 768,
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
} as const;

// Configuración de API
export const API_CONFIG = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  BASE_URL: "/api",
} as const;

// Estados de membresía
export const MEMBERSHIP_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
  EXPIRED: "expired",
  FROZEN: "frozen",
  PENDING: "pending",
} as const;

// Estados de clases
export const CLASS_STATUS = {
  SCHEDULED: "scheduled",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  IN_PROGRESS: "in_progress",
} as const;

// Estados de participantes
export const PARTICIPANT_STATUS = {
  CONFIRMED: "confirmed",
  WAITLIST: "waitlist",
  NO_SHOW: "no_show",
  CANCELLED: "cancelled",
} as const;

// Roles de usuario
export const USER_ROLES = {
  ADMIN: "admin",
  COACH: "coach",
  USER: "user",
} as const;

// Métodos de pago
export const PAYMENT_METHODS = {
  CASH: "contado",
  TRANSFER: "transferencia",
  DEBIT: "debito",
  CREDIT: "credito",
} as const;

// Colores de estado
export const STATUS_COLORS = {
  [MEMBERSHIP_STATUS.ACTIVE]: "#22c55e", // verde
  [MEMBERSHIP_STATUS.INACTIVE]: "#6b7280", // gris
  [MEMBERSHIP_STATUS.SUSPENDED]: "#f59e0b", // amarillo
  [MEMBERSHIP_STATUS.EXPIRED]: "#ef4444", // rojo
  [MEMBERSHIP_STATUS.FROZEN]: "#0ea5e9", // azul
  [MEMBERSHIP_STATUS.PENDING]: "#f59e0b", // amarillo
} as const;

// Etiquetas de estado
export const STATUS_LABELS = {
  [MEMBERSHIP_STATUS.ACTIVE]: "Activo",
  [MEMBERSHIP_STATUS.INACTIVE]: "Inactivo",
  [MEMBERSHIP_STATUS.SUSPENDED]: "Suspendido",
  [MEMBERSHIP_STATUS.EXPIRED]: "Expirado",
  [MEMBERSHIP_STATUS.FROZEN]: "Congelado",
  [MEMBERSHIP_STATUS.PENDING]: "Pendiente",
} as const;

// Configuración de validación
export const VALIDATION_CONFIG = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 50,
  MAX_EMAIL_LENGTH: 254,
  MAX_PHONE_LENGTH: 20,
} as const;

// Configuración de caché
export const CACHE_CONFIG = {
  USER_DATA_TTL: 5 * 60 * 1000, // 5 minutos
  CLASS_DATA_TTL: 2 * 60 * 1000, // 2 minutos
  STATS_TTL: 10 * 60 * 1000, // 10 minutos
} as const;

// Configuración de notificaciones
export const NOTIFICATION_CONFIG = {
  SUCCESS_DURATION: 3000,
  ERROR_DURATION: 5000,
  WARNING_DURATION: 4000,
  INFO_DURATION: 3000,
} as const;

// Configuración de exportación
export const EXPORT_CONFIG = {
  CSV_DELIMITER: ",",
  DATE_FORMAT: "YYYY-MM-DD",
  TIME_FORMAT: "HH:mm:ss",
  DATETIME_FORMAT: "YYYY-MM-DD HH:mm:ss",
} as const;

// Tipos de exportación
export const EXPORT_TYPES = {
  CSV: "csv",
  EXCEL: "xlsx",
  PDF: "pdf",
} as const;

// Configuración de búsqueda
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_RESULTS: 50,
  SEARCH_DELAY: 300,
} as const;

// Configuración de filtros
export const FILTER_CONFIG = {
  DEFAULT_SORT_FIELD: "createdAt",
  DEFAULT_SORT_ORDER: "desc",
  MAX_FILTER_VALUES: 100,
} as const;

// Configuración de auditoría
export const AUDIT_CONFIG = {
  LOG_USER_ACTIONS: true,
  LOG_ADMIN_ACTIONS: true,
  LOG_SYSTEM_ACTIONS: true,
  RETENTION_DAYS: 365,
} as const;

// Configuración de seguridad
export const SECURITY_CONFIG = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutos
  PASSWORD_EXPIRY_DAYS: 90,
} as const;

// Configuración de backup
export const BACKUP_CONFIG = {
  AUTO_BACKUP_ENABLED: true,
  BACKUP_FREQUENCY: "daily",
  BACKUP_RETENTION_DAYS: 30,
  BACKUP_TIME: "02:00", // 2 AM
} as const;

// Configuración de monitoreo
export const MONITORING_CONFIG = {
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_ERROR_TRACKING: true,
  ENABLE_USAGE_ANALYTICS: true,
  SAMPLE_RATE: 0.1, // 10% de las sesiones
} as const;

// Configuración de integración
export const INTEGRATION_CONFIG = {
  ENABLE_EMAIL_INTEGRATION: true,
  ENABLE_SMS_INTEGRATION: false,
  ENABLE_PAYMENT_INTEGRATION: true,
  ENABLE_CALENDAR_INTEGRATION: true,
} as const;
