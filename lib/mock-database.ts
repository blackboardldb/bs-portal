import {
  initialClassSessionsExtended,
  initialUsers,
  initialDisciplines,
  initialInstructors,
  initialMembershipPlans,
} from "./mock-data";
import type {
  ClassSessionExtended,
  FitCenterUserProfile,
  Discipline,
  Instructor,
  MembershipPlan,
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
              cancellationHours: 2,
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
    instructor: Instructor[];
    membershipPlan: MembershipPlan[];
    notification: Notification[];
  } = {
    classSession: [],
    user: [...initialUsers],
    discipline: [...initialDisciplines],
    instructor: [...initialInstructors],
    membershipPlan: [...initialMembershipPlans],
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
    findMany: async (params?: {
      where?: {
        role?: string;
        membership?: {
          status?: string;
        };
        OR?: Array<{
          firstName?: { contains?: string; mode?: string };
          lastName?: { contains?: string; mode?: string };
          email?: { contains?: string; mode?: string };
        }>;
      };
      take?: number;
      skip?: number;
      orderBy?: { [key: string]: "asc" | "desc" };
    }) => {
      let results = [...this.data.user];

      // Simular el filtrado (where)
      if (params?.where) {
        // Filtro por rol
        if (params.where.role) {
          results = results.filter((u) => u.role === params.where!.role);
        }

        // Filtro por estado de membresía
        if (params.where.membership?.status) {
          results = results.filter(
            (u) => u.membership?.status === params.where!.membership!.status
          );
        }

        // Filtro de búsqueda (OR)
        if (params.where.OR) {
          const searchConditions = params.where.OR;
          results = results.filter((u) =>
            searchConditions.some((condition) => {
              if (condition.firstName?.contains) {
                return u.firstName
                  .toLowerCase()
                  .includes(condition.firstName.contains.toLowerCase());
              }
              if (condition.lastName?.contains) {
                return u.lastName
                  .toLowerCase()
                  .includes(condition.lastName.contains.toLowerCase());
              }
              if (condition.email?.contains) {
                return u.email
                  .toLowerCase()
                  .includes(condition.email.contains.toLowerCase());
              }
              return false;
            })
          );
        }
      }

      // Simular ordenamiento
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

      // Simular la paginación (skip/take)
      const skip = params?.skip || 0;
      const take = params?.take || results.length;

      return results.slice(skip, skip + take);
    },

    // Simular el conteo para la paginación
    count: async (params?: {
      where?: {
        role?: string;
        membership?: {
          status?: string;
        };
        OR?: Array<{
          firstName?: { contains?: string; mode?: string };
          lastName?: { contains?: string; mode?: string };
          email?: { contains?: string; mode?: string };
        }>;
      };
    }) => {
      // Reutilizar la lógica de findMany sin la paginación para obtener el total filtrado
      const allFiltered = await this.user.findMany({ where: params?.where });
      return allFiltered.length;
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

  instructor = {
    findMany: async (params?: {
      where?: {
        isActive?: boolean;
        role?: string;
        OR?: Array<{
          firstName?: { contains?: string; mode?: string };
          lastName?: { contains?: string; mode?: string };
          email?: { contains?: string; mode?: string };
        }>;
      };
      take?: number;
      skip?: number;
      orderBy?: { [key: string]: "asc" | "desc" };
    }) => {
      let results = [...this.data.instructor];

      if (params?.where) {
        if (params.where.isActive !== undefined) {
          results = results.filter(
            (i) => i.isActive === params.where!.isActive
          );
        }
        if (params.where.role) {
          results = results.filter((i) => i.role === params.where!.role);
        }
        if (params.where.OR) {
          const searchConditions = params.where.OR;
          results = results.filter((i) =>
            searchConditions.some((condition) => {
              const searchTerm =
                condition.firstName?.contains?.toLowerCase() ||
                condition.lastName?.contains?.toLowerCase() ||
                condition.email?.contains?.toLowerCase() ||
                "";
              return (
                i.firstName.toLowerCase().includes(searchTerm) ||
                i.lastName.toLowerCase().includes(searchTerm) ||
                i.email.toLowerCase().includes(searchTerm)
              );
            })
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

      const skip = params?.skip || 0;
      const take = params?.take || results.length;
      return results.slice(skip, skip + take);
    },

    count: async (params?: { where?: any }) => {
      // Reutilizar la lógica de findMany sin la paginación para obtener el total filtrado
      const allFiltered = await this.instructor.findMany({
        where: params?.where,
      });
      return allFiltered.length;
    },

    create: async (params: any) => {
      const newInstructor: Instructor = {
        ...params.data,
        id:
          params.data.id ||
          `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      this.data.instructor.push(newInstructor);
      return newInstructor;
    },

    update: async (params: any) => {
      const index = this.data.instructor.findIndex(
        (i) => i.id === params.where.id
      );
      if (index === -1) throw new Error("Instructor not found");
      this.data.instructor[index] = {
        ...this.data.instructor[index],
        ...(params.data as Partial<Instructor>),
      };
      return this.data.instructor[index];
    },

    delete: async (params: any) => {
      const index = this.data.instructor.findIndex(
        (i) => i.id === params.where.id
      );
      if (index === -1) throw new Error("Instructor not found");
      const deleted = this.data.instructor.splice(index, 1)[0];
      return deleted;
    },
  };

  membershipPlan = {
    findMany: async (params?: {
      where?: {
        isActive?: boolean;
        OR?: Array<{
          name?: { contains?: string; mode?: string };
          description?: { contains?: string; mode?: string };
        }>;
      };
      take?: number;
      skip?: number;
      orderBy?: { [key: string]: "asc" | "desc" };
    }) => {
      let results = [...this.data.membershipPlan];

      if (params?.where) {
        if (params.where.isActive !== undefined) {
          results = results.filter(
            (p) => p.isActive === params.where!.isActive
          );
        }
        if (params.where.OR) {
          const searchConditions = params.where.OR;
          results = results.filter((p) =>
            searchConditions.some((condition) => {
              const searchTerm =
                condition.name?.contains?.toLowerCase() ||
                condition.description?.contains?.toLowerCase() ||
                "";
              return (
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm)
              );
            })
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

      const skip = params?.skip || 0;
      const take = params?.take || results.length;
      return results.slice(skip, skip + take);
    },

    count: async (params?: { where?: any }) => {
      // Reutilizar la lógica de findMany sin la paginación para obtener el total filtrado
      const allFiltered = await this.membershipPlan.findMany({
        where: params?.where,
      });
      return allFiltered.length;
    },

    create: async (params: any) => {
      const newPlan: MembershipPlan = {
        ...params.data,
        id:
          params.data.id ||
          `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      this.data.membershipPlan.push(newPlan);
      return newPlan;
    },

    update: async (params: any) => {
      const index = this.data.membershipPlan.findIndex(
        (p) => p.id === params.where.id
      );
      if (index === -1) throw new Error("Plan not found");
      this.data.membershipPlan[index] = {
        ...this.data.membershipPlan[index],
        ...(params.data as Partial<MembershipPlan>),
      };
      return this.data.membershipPlan[index];
    },

    delete: async (params: any) => {
      const index = this.data.membershipPlan.findIndex(
        (p) => p.id === params.where.id
      );
      if (index === -1) throw new Error("Plan not found");
      const deleted = this.data.membershipPlan.splice(index, 1)[0];
      return deleted;
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
