"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { initialUsers } from "./mock-data";
import { initialClasses as initialClassSessions } from "./mock-data";
import { initialDisciplines } from "./mock-data";
import { initialInstructors } from "./mock-data";
import { initialMembershipPlans as initialPlans } from "./mock-data";
import { initialOrganization } from "./mock-data";
import type {
  FitCenterUserProfile as User,
  ClassSession,
  Discipline,
  Instructor,
  MembershipPlan as Plan,
  Organization,
} from "./types";

// Create missing mock data
const initialClassRegistrations: any[] = [];
const initialMembershipRenewals: any[] = [];

// NUEVO: Tipo para el estado de paginación
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BlackSheepStore {
  // State
  users: User[];
  pagination: PaginationState | null; // NUEVO: Estado para la paginación
  classSessions: ClassSession[];
  disciplines: Discipline[];
  instructors: Instructor[];
  instructorsPagination: PaginationState | null; // NUEVO: Estado para la paginación de instructores
  plans: Plan[];
  initialOrganization: Organization | null;
  classRegistrations: any[];
  membershipRenewals: any[];

  // User actions
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  fetchUsers: (
    page?: number,
    limit?: number,
    search?: string,
    role?: string,
    status?: string
  ) => Promise<void>;

  // Class session actions
  addClassSession: (classSession: ClassSession) => void;
  updateClassSession: (classSession: ClassSession) => void;
  deleteClassSession: (classSessionId: string) => void;
  fetchClassSessions: (
    startDate?: string,
    endDate?: string,
    page?: number,
    limit?: number
  ) => Promise<any>;

  // Discipline actions
  addDiscipline: (discipline: Discipline) => void;
  updateDiscipline: (discipline: Discipline) => void;
  deleteDiscipline: (disciplineId: string) => void;
  fetchDisciplines: (
    page?: number,
    limit?: number,
    isActive?: string
  ) => Promise<void>;

  // Instructor actions
  addInstructor: (instructor: Instructor) => void;
  updateInstructor: (instructor: Instructor) => void;
  deleteInstructor: (instructorId: string) => void;
  fetchInstructors: (
    page?: number,
    limit?: number,
    search?: string,
    role?: string,
    isActive?: string
  ) => Promise<void>;

  // Plan actions
  addPlan: (plan: Plan) => void;
  updatePlan: (plan: Plan) => void;
  deletePlan: (planId: string) => void;
  fetchPlans: (
    page?: number,
    limit?: number,
    search?: string,
    isActive?: string
  ) => Promise<void>;

  // Organization actions
  updateOrganization: (organization: Organization) => void;
  fetchOrganization: () => void;

  // Registration actions
  addClassRegistration: (registration: any) => void;
  updateClassRegistration: (registration: any) => void;
  deleteClassRegistration: (registrationId: string) => void;
  fetchClassRegistrations: () => void;

  // Renewal actions
  addMembershipRenewal: (renewal: any) => void;
  updateMembershipRenewal: (renewal: any) => void;
  deleteMembershipRenewal: (renewalId: string) => void;
  fetchMembershipRenewals: () => void;
}

export const useBlackSheepStore = create<BlackSheepStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      users: [], // Ahora vacío
      pagination: null, // NUEVO
      classSessions: initialClassSessions,
      disciplines: [], // Ahora vacío para paginación
      instructors: [], // Ahora vacío para paginación
      instructorsPagination: null, // NUEVO
      plans: [], // Ahora vacío para paginación
      initialOrganization: initialOrganization,
      classRegistrations: initialClassRegistrations,
      membershipRenewals: initialMembershipRenewals,

      // User actions
      addUser: (user) => set((state) => ({ users: [...state.users, user] })),
      updateUser: (user) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === user.id ? user : u)),
        })),
      deleteUser: (userId) =>
        set((state) => ({
          users: state.users.filter((u) => u.id !== userId),
        })),
      fetchUsers: async (
        page = 1,
        limit = 10,
        search = "",
        role = "",
        status = ""
      ) => {
        try {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });
          if (search) params.append("search", search);
          if (role) params.append("role", role);
          if (status) params.append("status", status);

          const response = await fetch(`/api/users?${params.toString()}`);
          if (!response.ok) throw new Error("Failed to fetch users");

          const data = await response.json();
          set({ users: data.users, pagination: data.pagination });
        } catch (error) {
          console.error("Error fetching users:", error);
          set({ users: [], pagination: null });
        }
      },

      // Class session actions
      addClassSession: (classSession) =>
        set((state) => ({
          classSessions: [...state.classSessions, classSession],
        })),
      updateClassSession: (classSession) =>
        set((state) => ({
          classSessions: state.classSessions.map((cs) =>
            cs.id === classSession.id ? classSession : cs
          ),
        })),
      deleteClassSession: (classSessionId) =>
        set((state) => ({
          classSessions: state.classSessions.filter(
            (cs) => cs.id !== classSessionId
          ),
        })),
      fetchClassSessions: async (
        startDate?: string,
        endDate?: string,
        page: number = 1,
        limit: number = 10
      ) => {
        try {
          // NOTA: Esta función ahora se usa principalmente para cargar clases históricas
          // con actividad real (inscripciones, cancelaciones, etc.).
          // Las clases del calendario admin se generan dinámicamente en el frontend.

          // Construir URL con parámetros de filtrado y paginación
          const params = new URLSearchParams();
          if (startDate) params.append("startDate", startDate);
          if (endDate) params.append("endDate", endDate);
          params.append("page", page.toString());
          params.append("limit", limit.toString());

          const response = await fetch(`/api/classes?${params.toString()}`);
          if (!response.ok) {
            throw new Error("Failed to fetch class sessions");
          }

          const data = await response.json();
          set({ classSessions: data.classes });

          return data;
        } catch (error) {
          console.error("Error fetching class sessions:", error);
          // Fallback a datos locales en caso de error
          set({ classSessions: initialClassSessions });
        }
      },

      // Discipline actions
      addDiscipline: (discipline: Discipline) =>
        set((state) => ({ disciplines: [...state.disciplines, discipline] })),
      updateDiscipline: (discipline: Discipline) =>
        set((state) => ({
          disciplines: state.disciplines.map((d) =>
            d.id === discipline.id ? discipline : d
          ),
        })),
      deleteDiscipline: (disciplineId: string) =>
        set((state) => ({
          disciplines: state.disciplines.filter((d) => d.id !== disciplineId),
        })),
      fetchDisciplines: async (page = 1, limit = 50, isActive = "") => {
        try {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });
          if (isActive) params.append("isActive", isActive);

          const response = await fetch(`/api/disciplines?${params.toString()}`);
          if (!response.ok) throw new Error("Failed to fetch disciplines");

          const data = await response.json();
          set({ disciplines: data.disciplines });
        } catch (error) {
          console.error("Error fetching disciplines:", error);
          set({ disciplines: [] });
        }
      },

      // Instructor actions
      addInstructor: (instructor) =>
        set((state) => ({ instructors: [...state.instructors, instructor] })),
      updateInstructor: (instructor) =>
        set((state) => ({
          instructors: state.instructors.map((i) =>
            i.id === instructor.id ? instructor : i
          ),
        })),
      deleteInstructor: (instructorId) =>
        set((state) => ({
          instructors: state.instructors.filter((i) => i.id !== instructorId),
        })),
      fetchInstructors: async (
        page = 1,
        limit = 10,
        search = "",
        role = "",
        isActive = ""
      ) => {
        try {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });
          if (search) params.append("search", search);
          if (role) params.append("role", role);
          if (isActive) params.append("isActive", isActive);

          const response = await fetch(`/api/instructors?${params.toString()}`);
          if (!response.ok) throw new Error("Failed to fetch instructors");

          const data = await response.json();
          set({
            instructors: data.instructors,
            instructorsPagination: data.pagination,
          });
        } catch (error) {
          console.error("Error fetching instructors:", error);
          set({ instructors: [], instructorsPagination: null });
        }
      },

      // Plan actions
      addPlan: (plan) => set((state) => ({ plans: [...state.plans, plan] })),
      updatePlan: (plan) =>
        set((state) => ({
          plans: state.plans.map((p) => (p.id === plan.id ? plan : p)),
        })),
      deletePlan: (planId) =>
        set((state) => ({
          plans: state.plans.filter((p) => p.id !== planId),
        })),
      fetchPlans: async (page = 1, limit = 10, search = "", isActive = "") => {
        try {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });
          if (search) params.append("search", search);
          if (isActive) params.append("isActive", isActive);

          const response = await fetch(`/api/plans?${params.toString()}`);
          if (!response.ok) throw new Error("Failed to fetch plans");

          const data = await response.json();
          set({ plans: data.plans });
        } catch (error) {
          console.error("Error fetching plans:", error);
          set({ plans: [] });
        }
      },

      // Organization actions
      updateOrganization: (organization) =>
        set({ initialOrganization: organization }),
      fetchOrganization: () => {
        // In a real app, this would fetch from API
        set({ initialOrganization: initialOrganization });
      },

      // Registration actions
      addClassRegistration: (registration) =>
        set((state) => ({
          classRegistrations: [...state.classRegistrations, registration],
        })),
      updateClassRegistration: (registration) =>
        set((state) => ({
          classRegistrations: state.classRegistrations.map((cr) =>
            cr.userId === registration.userId &&
            cr.classSessionId === registration.classSessionId
              ? registration
              : cr
          ),
        })),
      deleteClassRegistration: (registrationId) =>
        set((state) => ({
          classRegistrations: state.classRegistrations.filter(
            (cr) => cr.userId !== registrationId
          ),
        })),
      fetchClassRegistrations: () => {
        // In a real app, this would fetch from API
        set({ classRegistrations: initialClassRegistrations });
      },

      // Renewal actions
      addMembershipRenewal: (renewal) =>
        set((state) => ({
          membershipRenewals: [...state.membershipRenewals, renewal],
        })),
      updateMembershipRenewal: (renewal) =>
        set((state) => ({
          membershipRenewals: state.membershipRenewals.map((mr) =>
            mr.id === renewal.id ? renewal : mr
          ),
        })),
      deleteMembershipRenewal: (renewalId) =>
        set((state) => ({
          membershipRenewals: state.membershipRenewals.filter(
            (mr) => mr.id !== renewalId
          ),
        })),
      fetchMembershipRenewals: () => {
        // In a real app, this would fetch from API
        set({ membershipRenewals: initialMembershipRenewals });
      },
    }),
    {
      name: "blacksheep-store",
    }
  )
);

// ========================================================================================
// Selector hooks for common data access patterns
// ========================================================================================

export const useActiveUsers = () =>
  useBlackSheepStore((state) =>
    state.users.filter((user) => user.membership?.status === "active")
  );

export const usePendingUsers = () =>
  useBlackSheepStore((state) =>
    state.users.filter((user) => user.membership?.status === "pending")
  );

export const useExpiredUsers = () =>
  useBlackSheepStore((state) =>
    state.users.filter((user) => user.membership?.status === "expired")
  );

export const useUserStats = () =>
  useBlackSheepStore((state) => {
    const users = state.users;
    const totalUsers = users.length;
    const activeUsers = users.filter(
      (user) => user.membership?.status === "active"
    ).length;
    const pendingUsers = users.filter(
      (user) => user.membership?.status === "pending"
    ).length;
    const expiredUsers = users.filter(
      (user) => user.membership?.status === "expired"
    ).length;

    return {
      total: totalUsers,
      active: activeUsers,
      pending: pendingUsers,
      expired: expiredUsers,
    };
  });

export const useClassesForDate = (date: Date) =>
  useBlackSheepStore((state) =>
    state.classSessions.filter((session) => {
      const sessionDate = new Date(session.dateTime);
      return (
        sessionDate.getDate() === date.getDate() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getFullYear() === date.getFullYear()
      );
    })
  );

export const useCurrentUser = (userId?: string) =>
  useBlackSheepStore((state) =>
    userId ? state.users.find((user) => user.id === userId) : null
  );

export const useActiveDisciplines = () =>
  useBlackSheepStore((state) =>
    state.disciplines.filter((discipline) => discipline.isActive)
  );

// ========================================================================================
// Constants for UI components
// ========================================================================================

export const STUDENT_STATES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  EXPIRED: "expired",
} as const;

export const STATE_COLORS = {
  active: "#10b981",
  inactive: "#6b7280",
  pending: "#f59e0b",
  expired: "#ef4444",
} as const;

export const MEMBERSHIP_TYPES = [
  {
    id: "basic",
    name: "Básico",
    description: "Acceso a clases básicas",
    price: 25000,
    durationMonths: 1,
    maxClassesPerMonth: 8,
  },
  {
    id: "premium",
    name: "Premium",
    description: "Acceso completo a todas las clases",
    price: 35000,
    durationMonths: 1,
    maxClassesPerMonth: 20,
  },
  {
    id: "unlimited",
    name: "Ilimitado",
    description: "Acceso ilimitado a todas las clases",
    price: 45000,
    durationMonths: 1,
    maxClassesPerMonth: -1,
  },
];
