import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

export function formatTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 8;
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map(deepClone) as T;
  if (typeof obj === "object") {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

export function groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as { [key: string]: T[] });
}

export function sortBy<T>(
  array: T[],
  key: keyof T,
  direction: "asc" | "desc" = "asc"
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

export function validateScheduleRules(rules: any[]): string[] {
  const errors: string[] = [];

  if (!Array.isArray(rules) || rules.length === 0) {
    errors.push("Debe haber al menos una regla de horario");
    return errors;
  }

  const seenTimes = new Set();
  const duplicateTimes = new Set();

  rules.forEach((rule) => {
    if (!rule.time) {
      errors.push("Todas las reglas deben tener una hora especificada");
      return;
    }

    if (seenTimes.has(rule.time)) {
      duplicateTimes.add(rule.time);
    }
    seenTimes.add(rule.time);
  });

  if (duplicateTimes.size > 0) {
    errors.push(`Horas duplicadas: ${[...duplicateTimes].join(", ")}`);
  }

  rules.forEach((rule, index) => {
    if (!rule.day) {
      errors.push(`Regla ${index + 1}: Día requerido`);
    }

    if (!rule.time) {
      errors.push(`Regla ${index + 1}: Hora requerida`);
    }

    if (rule.capacity && (rule.capacity < 1 || rule.capacity > 50)) {
      errors.push(`Regla ${index + 1}: Capacidad debe estar entre 1 y 50`);
    }
  });

  return errors;
}

export function validateMembershipData(data: any): string[] {
  const errors: string[] = [];

  if (!data.membershipType) {
    errors.push("Tipo de membresía es requerido");
  }

  if (!data.startDate) {
    errors.push("Fecha de inicio es requerida");
  }

  if (!data.endDate) {
    errors.push("Fecha de fin es requerida");
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (start >= end) {
      errors.push("La fecha de fin debe ser posterior a la fecha de inicio");
    }
  }

  if (data.price && data.price < 0) {
    errors.push("El precio no puede ser negativo");
  }

  return errors;
}

export function validateClassData(data: any): string[] {
  const errors: string[] = [];

  if (!data.disciplineId) {
    errors.push("Disciplina es requerida");
  }

  if (!data.dateTime) {
    errors.push("Fecha y hora son requeridas");
  }

  if (data.dateTime) {
    const classDate = new Date(data.dateTime);
    const now = new Date();

    if (classDate <= now) {
      errors.push("La clase debe programarse para una fecha futura");
    }
  }

  if (data.capacity && (data.capacity < 1 || data.capacity > 100)) {
    errors.push("La capacidad debe estar entre 1 y 100");
  }

  if (
    data.durationMinutes &&
    (data.durationMinutes < 15 || data.durationMinutes > 180)
  ) {
    errors.push("La duración debe estar entre 15 y 180 minutos");
  }

  return errors;
}

export function calculateAge(birthDate: Date | string): number {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

export function isExpired(date: Date | string): boolean {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  return targetDate < new Date();
}

export function daysUntil(date: Date | string): number {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "scheduled":
    case "completed":
      return "text-green-600 bg-green-100";
    case "pending":
    case "waiting":
      return "text-yellow-600 bg-yellow-100";
    case "cancelled":
    case "expired":
    case "inactive":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

export function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    active: "Activo",
    inactive: "Inactivo",
    pending: "Pendiente",
    expired: "Expirado",
    cancelled: "Cancelado",
    frozen: "Congelado",
    suspended: "Suspendido",
  };
  return statusMap[status] || status;
}

export function calcularFechaTerminoMembresia(
  startDate: string,
  durationInMonths: number
): string {
  const start = new Date(startDate);
  const end = new Date(start);

  // Manejar duraciones decimales (como 0.5 para quincenal)
  if (durationInMonths === 0.5) {
    // Para quincenal: agregar 15 días
    end.setDate(end.getDate() + 15);
  } else {
    // Para duraciones enteras: usar meses
    end.setMonth(end.getMonth() + durationInMonths);

    // Ajustar al último día del mes si es necesario
    if (
      start.getDate() ===
      new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    ) {
      end.setDate(new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate());
    }
  }

  return end.toISOString().split("T")[0];
}

export function calcularClasesSegunDuracion(
  classLimit: number,
  durationInMonths: number
): number {
  // Si classLimit es 0, es ilimitado
  if (classLimit === 0) return 0;

  // Calcular clases totales según duración
  if (durationInMonths === 0.5) {
    // Quincenal: la mitad de las clases mensuales
    return Math.ceil(classLimit / 2);
  } else {
    // Para duraciones enteras: multiplicar por meses
    return classLimit * durationInMonths;
  }
}

export function convertClassSessionToClassItem(
  session: any,
  disciplines: any[],
  instructors: any[],
  currentUserId?: string
) {
  const discipline = disciplines.find((d) => d.id === session.disciplineId);
  const instructor = instructors.find((i) => i.id === session.instructorId);

  return {
    id: session.id,
    dateTime: session.dateTime,
    discipline: discipline?.name || "Desconocida",
    disciplineId: session.disciplineId,
    instructor: instructor
      ? `${instructor.firstName} ${instructor.lastName}`
      : "Sin instructor",
    instructorId: session.instructorId,
    maxCapacity: session.maxCapacity || 20,
    currentCapacity: session.registeredUsers?.length || 0,
    isRegistered:
      session.registeredUsers?.some((user: any) => user.id === currentUserId) ||
      false,
    isWaitlisted:
      session.waitlistUsers?.some((user: any) => user.id === currentUserId) ||
      false,
    status: session.status || "scheduled",
    color: discipline?.color || "#6b7280",
  };
}
