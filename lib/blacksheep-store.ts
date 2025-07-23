"use client";

import React from "react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { initialUsers } from "./mock-data";
import { initialClasses as initialClassSessions } from "./mock-data";
import { initialDisciplines } from "./mock-data";
import { initialInstructors } from "./mock-data";
import { initialMembershipPlans as initialPlans } from "./mock-data";
import { initialOrganization } from "./mock-data";
import { initialBanners } from "./mock-data";
import type {
  FitCenterUserProfile as User,
  ClassSession,
  Discipline,
  Instructor,
  MembershipPlan as Plan,
  Organization,
  Banner,
} from "./types";
import { UserService } from "./services/user-service";
import { ApiResponse, PaginatedApiResponse } from "./api/types";

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

// Modelo de egreso
export type Egreso = {
  id: string;
  motivo: string;
  fecha: string; // ISO date
  monto: number;
};

interface BlackSheepStore {
  // State
  users: User[];
  pagination: PaginationState | null;
  classSessions: ClassSession[];
  disciplines: Discipline[];
  instructors: Instructor[];
  instructorsPagination: PaginationState | null;
  plans: Plan[];
  membershipPlans: Plan[];
  initialOrganization: Organization | null;
  classRegistrations: any[];
  membershipRenewals: any[];
  selectedUser: User | null;
  searchResults: User[];
  userStats: any;
  isLoading: boolean;
  error: string | null;
  banners: Banner[];
  egresos: Egreso[];

  // Provider management
  currentProviderType: "mock" | "prisma";

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
  fetchUserById: (id: string) => Promise<User | null>;
  createUser: (userData: Partial<User>) => Promise<User | null>;
  updateUserById: (id: string, userData: Partial<User>) => Promise<User | null>;
  deleteUserById: (id: string) => Promise<boolean>;
  searchUsers: (query: string) => Promise<User[]>;
  getUserStats: () => Promise<any>;
  getUsersByMembershipStatus: (status: string) => Promise<User[]>;

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
  createDiscipline: (
    disciplineData: Partial<Discipline>
  ) => Promise<Discipline | null>;
  updateDisciplineById: (
    id: string,
    disciplineData: Partial<Discipline>
  ) => Promise<Discipline | null>;
  fetchDisciplines: (
    page?: number,
    limit?: number,
    isActive?: string
  ) => Promise<void>;

  // Instructor actions
  addInstructor: (instructor: Instructor) => void;
  updateInstructor: (instructor: Instructor) => void;
  deleteInstructor: (instructorId: string) => void;
  createInstructor: (
    instructorData: Partial<Instructor>
  ) => Promise<Instructor | null>;
  updateInstructorById: (
    id: string,
    instructorData: Partial<Instructor>
  ) => Promise<Instructor | null>;
  deleteInstructorById: (id: string) => Promise<boolean>;
  toggleInstructorStatus: (id: string) => Promise<boolean>;
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
  createPlan: (planData: Partial<Plan>) => Promise<Plan | null>;
  updatePlanById: (id: string, planData: Partial<Plan>) => Promise<Plan | null>;
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
  requestPlanRenewal: (
    userId: string,
    planId: string,
    paymentMethod: string
  ) => Promise<void>;

  // Banner actions
  addBanner: (banner: Omit<Banner, "id" | "createdAt">) => void;
  updateBanner: (id: string, updates: Partial<Banner>) => void;
  deleteBanner: (bannerId: string) => void;
  toggleBanner: (bannerId: string) => void;
  reorderBanners: (banners: Banner[]) => void;
  getActiveBanners: () => Banner[];

  // Egreso actions
  fetchEgresos: () => Promise<void>;
  addEgreso: (egreso: Omit<Egreso, "id">) => Promise<void>;
  deleteEgreso: (id: string) => Promise<void>;

  // Provider management actions
  switchProvider: (providerType: "mock" | "prisma") => Promise<boolean>;
  getProviderHealth: () => Promise<any>;
}

export const useBlackSheepStore = create<BlackSheepStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      users: initialUsers,
      pagination: null,
      classSessions: initialClassSessions,
      disciplines: [],
      instructors: [],
      instructorsPagination: null,
      plans: [],
      membershipPlans: initialPlans,
      initialOrganization: initialOrganization,
      classRegistrations: initialClassRegistrations,
      membershipRenewals: initialMembershipRenewals,
      selectedUser: null,
      searchResults: [],
      userStats: null,
      isLoading: false,
      error: null,
      currentProviderType: "mock",
      banners: initialBanners, // Inicializar con banners migrados desde staticCarouselSlides
      egresos: [
        // Datos de prueba para diferentes meses
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
        {
          id: "egreso_4",
          motivo: "Mantenimiento",
          fecha: "2024-11-25T00:00:00.000Z",
          monto: 30000,
        },
      ],

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
          set({ isLoading: true, error: null });
          const userService = new UserService();

          const response = await userService.getUsers({
            page,
            limit,
            search: search || undefined,
            role: role || undefined,
            status: status || undefined,
          });

          if (response.success) {
            set({
              users: response.data,
              pagination: response.pagination,
            });
          } else {
            throw new Error(response.error?.message || "Error fetching users");
          }
        } catch (error) {
          console.error("Error fetching users:", error);
          set({
            users: [],
            pagination: null,
            error: error instanceof Error ? error.message : String(error),
          });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchUserById: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          const userService = new UserService();

          const response = await userService.getUserById(id);

          if (response.success && response.data) {
            set({ selectedUser: response.data });
            return response.data;
          } else {
            throw new Error(response.error?.message || "Error fetching user");
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          set({
            selectedUser: null,
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      createUser: async (userData: Partial<User>) => {
        try {
          set({ isLoading: true, error: null });
          const userService = new UserService();

          const response = await userService.createUser(userData);

          if (response.success) {
            set((state) => ({
              users: [...state.users, response.data],
            }));
            return response.data;
          } else {
            throw new Error(response.error?.message || "Error creating user");
          }
        } catch (error) {
          console.error("Error creating user:", error);
          set({
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      updateUserById: async (id: string, userData: Partial<User>) => {
        try {
          set({ isLoading: true, error: null });
          const userService = new UserService();

          const response = await userService.updateUser(id, userData);

          if (response.success) {
            set((state) => ({
              users: state.users.map((user) =>
                user.id === id ? { ...user, ...response.data } : user
              ),
              selectedUser:
                state.selectedUser?.id === id
                  ? { ...state.selectedUser, ...response.data }
                  : state.selectedUser,
            }));
            return response.data;
          } else {
            throw new Error(response.error?.message || "Error updating user");
          }
        } catch (error) {
          console.error("Error updating user:", error);
          set({
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteUserById: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          const userService = new UserService();

          const response = await userService.deleteUser(id);

          if (response.success) {
            set((state) => ({
              users: state.users.filter((user) => user.id !== id),
              selectedUser:
                state.selectedUser?.id === id ? null : state.selectedUser,
            }));
            return true;
          } else {
            throw new Error(response.error?.message || "Error deleting user");
          }
        } catch (error) {
          console.error("Error deleting user:", error);
          set({
            error: error instanceof Error ? error.message : String(error),
          });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      searchUsers: async (query: string) => {
        try {
          set({ isLoading: true, error: null });
          const userService = new UserService();

          const response = await userService.searchUsers(query);

          if (response.success) {
            set({ searchResults: response.data });
            return response.data;
          } else {
            throw new Error(response.error?.message || "Error searching users");
          }
        } catch (error) {
          console.error("Error searching users:", error);
          set({
            searchResults: [],
            error: error instanceof Error ? error.message : String(error),
          });
          return [];
        } finally {
          set({ isLoading: false });
        }
      },

      getUserStats: async () => {
        try {
          set({ isLoading: true, error: null });
          const userService = new UserService();

          const response = await userService.getUserStats();

          if (response.success) {
            set({ userStats: response.data });
            return response.data;
          } else {
            throw new Error(
              response.error?.message || "Error fetching user stats"
            );
          }
        } catch (error) {
          console.error("Error fetching user stats:", error);
          set({
            userStats: null,
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      getUsersByMembershipStatus: async (status: string) => {
        try {
          set({ isLoading: true, error: null });
          const userService = new UserService();

          const response = await userService.getUsersByMembershipStatus(status);

          if (response.success) {
            return response.data;
          } else {
            throw new Error(
              response.error?.message || "Error fetching users by status"
            );
          }
        } catch (error) {
          console.error("Error fetching users by status:", error);
          set({
            error: error instanceof Error ? error.message : String(error),
          });
          return [];
        } finally {
          set({ isLoading: false });
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
          // Cargar clases desde el mock database
          const { prisma } = await import("@/lib/mock-database");

          // Obtener todas las clases del mock database
          const allClasses = await prisma.classSession.findMany();

          // Filtrar por fecha si se especifica
          let filteredClasses = allClasses;
          if (startDate || endDate) {
            filteredClasses = allClasses.filter((session: any) => {
              const sessionDate = new Date(session.dateTime);
              const start = startDate ? new Date(startDate) : null;
              const end = endDate ? new Date(endDate) : null;

              if (start && end) {
                return sessionDate >= start && sessionDate <= end;
              } else if (start) {
                return sessionDate >= start;
              } else if (end) {
                return sessionDate <= end;
              }

              return true;
            });
          }

          // Aplicar paginación
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedClasses = filteredClasses.slice(startIndex, endIndex);

          // Calcular metadatos de paginación
          const totalClasses = filteredClasses.length;
          const totalPages = Math.ceil(totalClasses / limit);

          const result = {
            classes: paginatedClasses,
            pagination: {
              page,
              limit,
              totalClasses,
              totalPages,
              hasNextPage: page < totalPages,
              hasPrevPage: page > 1,
            },
          };

          set({ classSessions: result.classes });
          return result;
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
          set({ disciplines: data.data });
        } catch (error) {
          console.error("Error fetching disciplines:", error);
          set({ disciplines: [] });
        }
      },

      createDiscipline: async (disciplineData: Partial<Discipline>) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch("/api/disciplines", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(disciplineData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error creating discipline");
          }

          const data = await response.json();
          set((state) => ({
            disciplines: [...state.disciplines, data.discipline],
          }));
          return data.discipline;
        } catch (error) {
          console.error("Error creating discipline:", error);
          set({
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      updateDisciplineById: async (
        id: string,
        disciplineData: Partial<Discipline>
      ) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(`/api/disciplines/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(disciplineData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error updating discipline");
          }

          const data = await response.json();
          set((state) => ({
            disciplines: state.disciplines.map((discipline) =>
              discipline.id === id
                ? { ...discipline, ...data.discipline }
                : discipline
            ),
          }));
          return data.discipline;
        } catch (error) {
          console.error("Error updating discipline:", error);
          set({
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        } finally {
          set({ isLoading: false });
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
            instructors: data.data,
            instructorsPagination: data.pagination,
          });
        } catch (error) {
          console.error("Error fetching instructors:", error);
          set({ instructors: [], instructorsPagination: null });
        }
      },

      createInstructor: async (instructorData: Partial<Instructor>) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch("/api/instructors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(instructorData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            const errorMessage =
              errorData.error?.message ||
              errorData.message ||
              JSON.stringify(errorData.error) ||
              "Error creating instructor";
            throw new Error(errorMessage);
          }

          const data = await response.json();

          set((state) => ({
            instructors: [
              ...state.instructors,
              data.data || data.instructor || data,
            ],
          }));
          return data.data || data.instructor || data;
        } catch (error) {
          console.error("Error creating instructor:", error);
          set({
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      updateInstructorById: async (
        id: string,
        instructorData: Partial<Instructor>
      ) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(`/api/instructors/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(instructorData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error?.message ||
                errorData.message ||
                "Error updating instructor"
            );
          }

          const data = await response.json();
          set((state) => ({
            instructors: state.instructors.map((instructor) =>
              instructor.id === id
                ? { ...instructor, ...data.data }
                : instructor
            ),
          }));
          return data.data;
        } catch (error) {
          console.error("Error updating instructor:", error);
          set({
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteInstructorById: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(`/api/instructors/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error?.message ||
                errorData.message ||
                "Error deleting instructor"
            );
          }

          set((state) => ({
            instructors: state.instructors.filter(
              (instructor) => instructor.id !== id
            ),
          }));
          return true;
        } catch (error) {
          console.error("Error deleting instructor:", error);
          set({
            error: error instanceof Error ? error.message : String(error),
          });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      toggleInstructorStatus: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(`/api/instructors/${id}/status`, {
            method: "PATCH",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error?.message ||
                errorData.message ||
                "Error toggling instructor status"
            );
          }

          const data = await response.json();
          set((state) => ({
            instructors: state.instructors.map((instructor) =>
              instructor.id === id
                ? { ...instructor, isActive: data.data.isActive }
                : instructor
            ),
          }));
          return true;
        } catch (error) {
          console.error("Error toggling instructor status:", error);
          set({
            error: error instanceof Error ? error.message : String(error),
          });
          return false;
        } finally {
          set({ isLoading: false });
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
          console.log("API response for fetchPlans:", data);

          // Handle different response structures
          const plans = data.data || data.plans || data || [];

          // Ensure all plans have required properties
          const validPlans = plans.filter(
            (plan: any) => plan && plan.id && plan.name
          );

          set({ plans: validPlans });
        } catch (error) {
          console.error("Error fetching plans:", error);
          set({ plans: [] });
        }
      },

      createPlan: async (planData: Partial<Plan>) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch("/api/plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(planData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error creating plan");
          }

          const data = await response.json();
          console.log("API response for createPlan:", data);

          // Handle different response structures
          const newPlan = data.data || data.plan || data;

          if (!newPlan || !newPlan.id) {
            throw new Error("Invalid plan data received from API");
          }

          set((state) => ({
            plans: [...(state.plans || []), newPlan],
          }));
          return newPlan;
        } catch (error) {
          console.error("Error creating plan:", error);
          set({
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      updatePlanById: async (id: string, planData: Partial<Plan>) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(`/api/plans/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(planData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error updating plan");
          }

          const data = await response.json();
          console.log("API response for updatePlan:", data);

          // Handle different response structures
          const updatedPlan = data.data || data.plan || data;

          if (!updatedPlan || !updatedPlan.id) {
            throw new Error("Invalid plan data received from API");
          }

          set((state) => ({
            plans: state.plans.map((plan) =>
              plan.id === id ? { ...plan, ...updatedPlan } : plan
            ),
          }));
          return updatedPlan;
        } catch (error) {
          console.error("Error updating plan:", error);
          set({
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        } finally {
          set({ isLoading: false });
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

      requestPlanRenewal: async (
        userId: string,
        planId: string,
        paymentMethod: string
      ) => {
        try {
          set({ isLoading: true, error: null });

          // Create renewal request
          const renewalRequest = {
            id: `renewal_${Date.now()}`,
            requestedPlanId: planId,
            requestedPaymentMethod: paymentMethod as
              | "contado"
              | "transferencia"
              | "debito"
              | "credito",
            requestDate: new Date().toISOString(),
            status: "pending" as const,
            requestedBy: userId,
          };

          // Update user with pending renewal
          const { users } = get();
          const updatedUsers = users.map((user) => {
            if (user.id === userId) {
              return {
                ...user,
                membership: {
                  ...user.membership,
                  pendingRenewal: renewalRequest,
                },
              };
            }
            return user;
          });

          // Add to membership renewals list
          set((state) => ({
            users: updatedUsers,
            membershipRenewals: [...state.membershipRenewals, renewalRequest],
          }));
        } catch (error) {
          console.error("Error requesting plan renewal:", error);
          set({
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Banner actions
      addBanner: (bannerData) => {
        const newBanner: Banner = {
          ...bannerData,
          id: `banner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          order: get().banners.length, // Auto-assign order
        };

        // Enforce maximum of 7 banners
        const currentBanners = get().banners;
        if (currentBanners.length >= 7) {
          set({ error: "Máximo 7 banners permitidos" });
          return;
        }

        set((state) => ({
          banners: [...state.banners, newBanner],
          error: null,
        }));
      },

      updateBanner: (id, updates) =>
        set((state) => ({
          banners: state.banners.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
          error: null,
        })),

      deleteBanner: (bannerId) =>
        set((state) => {
          const filteredBanners = state.banners.filter(
            (b) => b.id !== bannerId
          );
          // Reorder remaining banners
          const reorderedBanners = filteredBanners.map((banner, index) => ({
            ...banner,
            order: index,
          }));
          return {
            banners: reorderedBanners,
            error: null,
          };
        }),

      toggleBanner: (bannerId) =>
        set((state) => ({
          banners: state.banners.map((b) =>
            b.id === bannerId ? { ...b, isActive: !b.isActive } : b
          ),
          error: null,
        })),

      reorderBanners: (banners) => {
        // Update order property based on array position
        const reorderedBanners = banners.map((banner, index) => ({
          ...banner,
          order: index,
        }));
        set({ banners: reorderedBanners, error: null });
      },

      getActiveBanners: () => {
        const { banners } = get();
        return banners
          .filter((banner) => banner.isActive)
          .sort((a, b) => a.order - b.order)
          .slice(0, 7); // Ensure max 7 banners
      },

      // Egreso actions
      fetchEgresos: async () => {
        try {
          // Intentar usar la API primero
          const response = await fetch("/api/expenses");
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              set({ egresos: data.data });
              return;
            }
          }
        } catch (error) {
          console.log("API no disponible, usando datos en memoria");
        }
        // Fallback: mantener datos en memoria (no hacer nada)
      },
      addEgreso: async (egreso) => {
        try {
          // Intentar usar la API primero
          const response = await fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(egreso),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // Actualizar el estado con el egreso creado por la API
              set((state) => ({
                egresos: [...state.egresos, data.data],
              }));
              return;
            }
          }
        } catch (error) {
          console.log("API no disponible, usando almacenamiento en memoria");
        }

        // Fallback: agregar en memoria como antes
        set((state) => ({
          egresos: [
            ...state.egresos,
            { ...egreso, id: `egreso_${Date.now()}` },
          ],
        }));
      },
      deleteEgreso: async (id) => {
        try {
          // Intentar usar la API primero
          const response = await fetch(`/api/expenses/${id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // Actualizar el estado eliminando el egreso
              set((state) => ({
                egresos: state.egresos.filter((e) => e.id !== id),
              }));
              return;
            }
          }
        } catch (error) {
          console.log("API no disponible, usando almacenamiento en memoria");
        }

        // Fallback: eliminar de memoria como antes
        set((state) => ({
          egresos: state.egresos.filter((e) => e.id !== id),
        }));
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
    const totalUsers = users?.length || 0;
    const activeUsers =
      users?.filter((user) => user.membership?.status === "active").length || 0;
    const pendingUsers =
      users?.filter((user) => user.membership?.status === "pending").length ||
      0;
    const expiredUsers =
      users?.filter((user) => user.membership?.status === "expired").length ||
      0;

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

export const useActiveBanners = () => {
  const banners = useBlackSheepStore((state) => state.banners);

  return React.useMemo(() => {
    return banners
      .filter((banner) => banner.isActive)
      .sort((a, b) => a.order - b.order)
      .slice(0, 7);
  }, [banners]);
};

export const useBanners = () => useBlackSheepStore((state) => state.banners);

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
