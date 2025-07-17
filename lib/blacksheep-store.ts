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

interface BlackSheepStore {
  // State
  users: User[];
  pagination: PaginationState | null;
  classSessions: ClassSession[];
  disciplines: Discipline[];
  instructors: Instructor[];
  instructorsPagination: PaginationState | null;
  plans: Plan[];
  initialOrganization: Organization | null;
  classRegistrations: any[];
  membershipRenewals: any[];
  selectedUser: User | null;
  searchResults: User[];
  userStats: any;
  isLoading: boolean;
  error: string | null;

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

  // Provider management actions
  switchProvider: (providerType: "mock" | "prisma") => Promise<boolean>;
  getProviderHealth: () => Promise<any>;
}

export const useBlackSheepStore = create<BlackSheepStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      users: [],
      pagination: null,
      classSessions: initialClassSessions,
      disciplines: [],
      instructors: [],
      instructorsPagination: null,
      plans: [],
      initialOrganization: initialOrganization,
      classRegistrations: initialClassRegistrations,
      membershipRenewals: initialMembershipRenewals,
      selectedUser: null,
      searchResults: [],
      userStats: null,
      isLoading: false,
      error: null,
      currentProviderType: "mock",

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
          set({ plans: data.data });
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
          set((state) => ({
            plans: [...state.plans, data.plan],
          }));
          return data.plan;
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
          set((state) => ({
            plans: state.plans.map((plan) =>
              plan.id === id ? { ...plan, ...data.plan } : plan
            ),
          }));
          return data.plan;
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

      // Provider management actions
      switchProvider: async (providerType: "mock" | "prisma") => {
        try {
          set({ isLoading: true, error: null });

          // Call API to switch provider
          const response = await fetch("/api/system/provider", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ provider: providerType }),
          });

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error?.message || "Failed to switch provider");
          }

          // Update store state
          set({ currentProviderType: providerType });

          // Refresh data with new provider
          const { fetchUsers, fetchClassSessions, fetchDisciplines } = get();
          await Promise.all([
            fetchUsers(),
            fetchClassSessions(),
            fetchDisciplines(),
          ]);

          return true;
        } catch (error) {
          console.error(`Error switching to ${providerType} provider:`, error);
          set({
            error: error instanceof Error ? error.message : String(error),
          });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      getProviderHealth: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch("/api/system/provider");
          const data = await response.json();

          if (data.success) {
            return data.data.health;
          } else {
            throw new Error(
              data.error?.message || "Failed to get provider health"
            );
          }
        } catch (error) {
          console.error("Error checking provider health:", error);
          return {
            type: get().currentProviderType,
            status: "unhealthy" as const,
            details: {
              error: error instanceof Error ? error.message : String(error),
            },
          };
        } finally {
          set({ isLoading: false });
        }
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
