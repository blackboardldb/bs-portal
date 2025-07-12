import {
  initialClassSessionsExtended,
  initialUsers,
  initialDisciplines,
  initialInstructors,
} from "./mock-data";
import type {
  ClassSessionExtended,
  FitCenterUserProfile,
  Discipline,
} from "./types";

// Definir un tipo simple para notificaciones
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

// Helper para crear fecha local sin zona horaria
function createLocalDateTime(
  date: Date,
  hours: number,
  minutes: number
): string {
  const localDate = new Date(date);
  localDate.setHours(hours, minutes, 0, 0);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  const hour = String(localDate.getHours()).padStart(2, "0");
  const minute = String(localDate.getMinutes()).padStart(2, "0");
  const second = String(localDate.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

const dayMap: { [key: string]: number } = {
  lun: 1,
  mar: 2,
  mie: 3,
  jue: 4,
  vie: 5,
  sab: 6,
  dom: 0,
};

function generateClassesFromDisciplines(
  disciplines: Discipline[],
  instructors: any[],
  start: Date,
  end: Date
) {
  const generated: ClassSessionExtended[] = [];
  for (const discipline of disciplines) {
    if (!discipline.isActive || !discipline.schedule) continue;
    const instructor = instructors.find(
      (inst: any) => inst.specialties?.includes(discipline.id) && inst.isActive
    );
    if (!instructor) continue;
    for (const scheduleDay of discipline.schedule) {
      const dayNumber = dayMap[scheduleDay.day];
      if (dayNumber === undefined) continue;
      for (const time of scheduleDay.times) {
        const [hours, minutes] = time.split(":").map(Number);
        for (
          let date = new Date(start);
          date <= end;
          date.setDate(date.getDate() + 1)
        ) {
          if (date.getDay() === dayNumber) {
            const classDateTime = createLocalDateTime(date, hours, minutes);
            const dateStr = date.toISOString().split("T")[0];
            const timeStr = time.replace(":", "");
            const classId = `cls_${dateStr}_${timeStr}_${discipline.id}`;
            generated.push({
              id: classId,
              organizationId: "org_blacksheep_001",
              disciplineId: discipline.id,
              name: discipline.name,
              dateTime: classDateTime,
              durationMinutes: 60,
              instructorId: instructor.id,
              capacity: 15,
              registeredParticipantsIds: [],
              waitlistParticipantsIds: [],
              status: "scheduled",
              participants: {
                confirmed: [],
                waitlist: [],
                noShows: [],
              },
              historicalData: {
                averageAttendance: Math.floor(Math.random() * 10) + 5,
                noShowRate: Math.random() * 0.3,
                waitlistFrequency: Math.random() * 0.2,
                popularityTrend: ["up", "down", "stable"][
                  Math.floor(Math.random() * 3)
                ] as "up" | "down" | "stable",
              },
              cancellationHours:
                discipline.cancellationRules?.defaultHours || 2,
              occupancyRate: 0.5,
            });
          }
        }
      }
    }
  }
  return generated;
}

class MockPrismaClient {
  private data: {
    classSession: ClassSessionExtended[];
    user: FitCenterUserProfile[];
    discipline: Discipline[];
    notification: Notification[];
  } = {
    classSession: [],
    user: [...initialUsers],
    discipline: [...initialDisciplines],
    notification: [],
  };

  constructor() {
    // Generar clases automáticamente para el mes actual y el siguiente
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const generated = generateClassesFromDisciplines(
      initialDisciplines,
      initialInstructors,
      start,
      end
    );
    this.data.classSession = generated;
  }

  async $transaction<T>(fn: (tx: MockPrismaClient) => Promise<T>): Promise<T> {
    return await fn(this);
  }

  classSession = {
    findMany: async (params?: any) => {
      let results = [...this.data.classSession];

      if (params?.where) {
        if (params.where.dateTime) {
          const { gte, lte, contains } = params.where.dateTime;
          if (contains) {
            results = results.filter((cs) => cs.dateTime.includes(contains));
          } else {
            results = results.filter((cs) => {
              const classDate = new Date(cs.dateTime);
              const gteDate = gte ? new Date(gte) : null;
              const lteDate = lte ? new Date(lte) : null;
              return (
                (!gteDate || classDate >= gteDate) &&
                (!lteDate || classDate <= lteDate)
              );
            });
          }
        }
        if (params.where.status) {
          if (params.where.status.in) {
            results = results.filter((cs) =>
              params.where.status.in.includes(cs.status)
            );
          } else if (params.where.status.not) {
            results = results.filter(
              (cs) => cs.status !== params.where.status.not
            );
          } else {
            results = results.filter((cs) => cs.status === params.where.status);
          }
        }
        if (params.where.disciplineId) {
          results = results.filter(
            (cs) => cs.disciplineId === params.where.disciplineId
          );
        }
      }
      if (params?.orderBy) {
        const [field, direction] = Object.entries(params.orderBy)[0];
        results.sort((a, b) => {
          const aVal = (a as any)[field];
          const bVal = (b as any)[field];
          return direction === "asc"
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
        });
      }
      return results;
    },
    findUnique: async (params: any) => {
      return this.data.classSession.find((cs) => cs.id === params.where.id);
    },
    update: async (params: any) => {
      const index = this.data.classSession.findIndex(
        (cs) => cs.id === params.where.id
      );
      if (index === -1) throw new Error("Class session not found");
      this.data.classSession[index] = {
        ...this.data.classSession[index],
        ...(params.data as Partial<ClassSessionExtended>),
      };
      return this.data.classSession[index];
    },
    create: async (params: any) => {
      const newClass = {
        ...params.data,
        id: params.data.id || `cls_${Date.now()}`,
        participants: params.data.participants || {
          confirmed: [],
          waitlist: [],
          noShows: [],
        },
        historicalData: params.data.historicalData || {
          averageAttendance: Math.floor(Math.random() * 10) + 5,
          noShowRate: Math.random() * 0.3,
          waitlistFrequency: Math.random() * 0.2,
          popularityTrend: ["up", "down", "stable"][
            Math.floor(Math.random() * 3)
          ] as "up" | "down" | "stable",
        },
        cancellationHours: params.data.cancellationHours || 2,
        occupancyRate: params.data.occupancyRate || 0.5,
      };
      this.data.classSession.push(newClass);
      return newClass;
    },
    createMany: async (params: any) => {
      for (const item of params.data) {
        const newClass = {
          ...item,
          id: item.id || `cls_${Date.now()}_${Math.random()}`,
        };
        this.data.classSession.push(newClass);
      }
      return { count: params.data.length };
    },
  };

  user = {
    findMany: async (_params?: any) => {
      return [...this.data.user];
    },
    findUnique: async (params: any) => {
      if (params.where.email) {
        return this.data.user.find((u) => u.email === params.where.email);
      }
      return this.data.user.find((u) => u.id === params.where.id);
    },
    update: async (params: any) => {
      const index = this.data.user.findIndex((u) => u.id === params.where.id);
      if (index === -1) throw new Error("User not found");
      this.data.user[index] = {
        ...this.data.user[index],
        ...(params.data as Partial<FitCenterUserProfile>),
      };
      return this.data.user[index];
    },
    create: async (params: any) => {
      const newUser = {
        ...params.data,
        id: params.data.id || `usr_${Date.now()}`,
      };
      this.data.user.push(newUser);
      return newUser;
    },
  };

  discipline = {
    findMany: async (params?: any) => {
      let results = [...this.data.discipline];
      if (params?.where?.isActive !== undefined) {
        results = results.filter((d) => d.isActive === params.where.isActive);
      }
      if (params?.where?.name) {
        results = results.filter((d) => d.name === params.where.name);
      }
      if (params?.skip) {
        results = results.slice(params.skip);
      }
      if (params?.take) {
        results = results.slice(0, params.take);
      }
      return results;
    },
    findUnique: async (params: any) => {
      return this.data.discipline.find((d) => d.id === params.where.id);
    },
    create: async (params: any) => {
      const newDiscipline = {
        ...params.data,
        id: params.data.id || `disc_${Date.now()}`,
      };
      this.data.discipline.push(newDiscipline);
      return newDiscipline;
    },
    update: async (params: any) => {
      const index = this.data.discipline.findIndex(
        (d) => d.id === params.where.id
      );
      if (index === -1) throw new Error("Discipline not found");
      this.data.discipline[index] = {
        ...this.data.discipline[index],
        ...(params.data as Partial<Discipline>),
      };
      return this.data.discipline[index];
    },
  };

  notification = {
    create: async (params: any) => {
      const newNotification: Notification = {
        ...params.data,
        id: params.data.id || `notif_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      this.data.notification.push(newNotification);
      return newNotification;
    },
    findMany: async (params?: any) => {
      let results = [...this.data.notification];
      if (params?.where?.userId) {
        results = results.filter((n) => n.userId === params.where.userId);
      }
      if (params?.where?.read !== undefined) {
        results = results.filter((n) => n.read === params.where.read);
      }
      return results;
    },
  };
}

export const prisma = new MockPrismaClient();
