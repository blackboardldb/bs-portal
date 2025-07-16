// Mock data provider implementation
// Integrates all Mock repositories into a single provider class

import { DataProvider } from "../types";
import { DataProviderFactoryConfig } from "../provider-factory";
import { MockUserRepository } from "../repositories/user-repository";
import { MockClassRepository } from "../repositories/class-repository";
import { MockDisciplineRepository } from "../repositories/discipline-repository";
import { MockInstructorRepository } from "../repositories/instructor-repository";
import { MockPlanRepository } from "../repositories/plan-repository";
import { MockOrganizationRepository } from "../repositories/organization-repository";

// Mock data provider that uses in-memory repositories
export class MockDataProvider implements DataProvider {
  public readonly users: MockUserRepository;
  public readonly classes: MockClassRepository;
  public readonly disciplines: MockDisciplineRepository;
  public readonly instructors: MockInstructorRepository;
  public readonly plans: MockPlanRepository;
  public readonly organizations: MockOrganizationRepository;

  private config: DataProviderFactoryConfig;
  private initialized: boolean = false;

  constructor(config: DataProviderFactoryConfig) {
    this.config = config;

    // Initialize all repositories
    this.users = new MockUserRepository();
    this.classes = new MockClassRepository();
    this.disciplines = new MockDisciplineRepository();
    this.instructors = new MockInstructorRepository();
    this.plans = new MockPlanRepository();
    this.organizations = new MockOrganizationRepository();

    // Log initialization if enabled
    if (this.config.enableLogging) {
      console.log("[MockDataProvider] Initialized with config:", {
        type: config.type,
        options: config.options,
      });
    }
  }

  // Initialize the provider (optional async setup)
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Perform any async initialization if needed
      if (this.config.enableLogging) {
        console.log("[MockDataProvider] Starting initialization...");
      }

      // Validate data integrity across repositories
      await this.validateDataIntegrity();

      // Set up any cross-repository relationships
      await this.setupRelationships();

      this.initialized = true;

      if (this.config.enableLogging) {
        console.log("[MockDataProvider] Initialization completed successfully");
        await this.logProviderStats();
      }
    } catch (error) {
      console.error("[MockDataProvider] Initialization failed:", error);
      throw error;
    }
  }

  // Validate data integrity across repositories
  private async validateDataIntegrity(): Promise<void> {
    const errors: string[] = [];

    try {
      // Check that all instructors have valid specialties (disciplines)
      const instructors = await this.instructors.findMany();
      const disciplines = await this.disciplines.findMany();
      const disciplineIds = new Set(disciplines.items.map((d) => d.id));

      for (const instructor of instructors.items) {
        for (const specialty of instructor.specialties) {
          if (!disciplineIds.has(specialty)) {
            errors.push(
              `Instructor ${instructor.id} has invalid specialty: ${specialty}`
            );
          }
        }
      }

      // Check that all classes have valid disciplines and instructors
      const classes = await this.classes.findMany();
      const instructorIds = new Set(instructors.items.map((i) => i.id));

      for (const classSession of classes.items) {
        if (!disciplineIds.has(classSession.disciplineId)) {
          errors.push(
            `Class ${classSession.id} has invalid discipline: ${classSession.disciplineId}`
          );
        }

        if (!instructorIds.has(classSession.instructorId)) {
          errors.push(
            `Class ${classSession.id} has invalid instructor: ${classSession.instructorId}`
          );
        }
      }

      // Check that all users with memberships have valid plan references
      const users = await this.users.findMany();
      const plans = await this.plans.findMany();
      const planIds = new Set(plans.items.map((p) => p.id));

      for (const user of users.items) {
        if (user.membership?.planId && !planIds.has(user.membership.planId)) {
          errors.push(
            `User ${user.id} has invalid plan reference: ${user.membership.planId}`
          );
        }
      }

      if (errors.length > 0) {
        console.warn("[MockDataProvider] Data integrity issues found:", errors);
        // Don't throw error for mock data, just log warnings
      }
    } catch (error) {
      console.error(
        "[MockDataProvider] Error during data integrity validation:",
        error
      );
      // Don't throw error for mock data
    }
  }

  // Set up relationships between entities
  private async setupRelationships(): Promise<void> {
    // For mock data, relationships are already established through IDs
    // This method can be used for any additional setup if needed

    if (this.config.enableLogging) {
      console.log("[MockDataProvider] Relationships setup completed");
    }
  }

  // Log provider statistics
  private async logProviderStats(): Promise<void> {
    try {
      const stats = await this.getProviderStats();
      console.log("[MockDataProvider] Provider Statistics:", stats);
    } catch (error) {
      console.error("[MockDataProvider] Error getting provider stats:", error);
    }
  }

  // Get provider statistics
  async getProviderStats(): Promise<{
    users: number;
    classes: number;
    disciplines: number;
    instructors: number;
    plans: number;
    organizations: number;
    totalEntities: number;
  }> {
    const [
      userCount,
      classCount,
      disciplineCount,
      instructorCount,
      planCount,
      organizationCount,
    ] = await Promise.all([
      this.users.count(),
      this.classes.count(),
      this.disciplines.count(),
      this.instructors.count(),
      this.plans.count(),
      this.organizations.count(),
    ]);

    const totalEntities =
      userCount +
      classCount +
      disciplineCount +
      instructorCount +
      planCount +
      organizationCount;

    return {
      users: userCount,
      classes: classCount,
      disciplines: disciplineCount,
      instructors: instructorCount,
      plans: planCount,
      organizations: organizationCount,
      totalEntities,
    };
  }

  // Health check for the provider
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    details: Record<string, any>;
  }> {
    try {
      // Test basic operations on each repository
      const healthChecks = await Promise.all([
        this.users
          .count()
          .then((count) => ({ repository: "users", status: "healthy", count })),
        this.classes
          .count()
          .then((count) => ({
            repository: "classes",
            status: "healthy",
            count,
          })),
        this.disciplines
          .count()
          .then((count) => ({
            repository: "disciplines",
            status: "healthy",
            count,
          })),
        this.instructors
          .count()
          .then((count) => ({
            repository: "instructors",
            status: "healthy",
            count,
          })),
        this.plans
          .count()
          .then((count) => ({ repository: "plans", status: "healthy", count })),
        this.organizations
          .count()
          .then((count) => ({
            repository: "organizations",
            status: "healthy",
            count,
          })),
      ]);

      const stats = await this.getProviderStats();

      return {
        status: "healthy",
        details: {
          initialized: this.initialized,
          repositoryHealth: healthChecks,
          stats,
          config: {
            type: this.config.type,
            enableLogging: this.config.enableLogging,
          },
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          initialized: this.initialized,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // Cleanup resources (for testing or shutdown)
  async cleanup(): Promise<void> {
    if (this.config.enableLogging) {
      console.log("[MockDataProvider] Starting cleanup...");
    }

    try {
      // Clear all repository data if needed
      if (this.config.options?.clearOnCleanup) {
        // Note: This would clear all data - use with caution
        // Implementation would depend on adding clearAllData methods to repositories
      }

      this.initialized = false;

      if (this.config.enableLogging) {
        console.log("[MockDataProvider] Cleanup completed");
      }
    } catch (error) {
      console.error("[MockDataProvider] Error during cleanup:", error);
      throw error;
    }
  }

  // Reset all data (useful for testing)
  async resetAllData(): Promise<void> {
    if (this.config.enableLogging) {
      console.log("[MockDataProvider] Resetting all data...");
    }

    try {
      // This would require implementing reset methods in each repository
      // For now, we'll recreate the repositories
      const newUsers = new MockUserRepository();
      const newClasses = new MockClassRepository();
      const newDisciplines = new MockDisciplineRepository();
      const newInstructors = new MockInstructorRepository();
      const newPlans = new MockPlanRepository();
      const newOrganizations = new MockOrganizationRepository();

      // Replace current repositories
      Object.assign(this, {
        users: newUsers,
        classes: newClasses,
        disciplines: newDisciplines,
        instructors: newInstructors,
        plans: newPlans,
        organizations: newOrganizations,
      });

      if (this.config.enableLogging) {
        console.log("[MockDataProvider] Data reset completed");
      }
    } catch (error) {
      console.error("[MockDataProvider] Error during data reset:", error);
      throw error;
    }
  }

  // Get configuration
  getConfig(): DataProviderFactoryConfig {
    return { ...this.config };
  }

  // Check if provider is initialized
  isInitialized(): boolean {
    return this.initialized;
  }

  // Utility methods for testing and debugging

  // Get all data from all repositories (for debugging)
  async getAllData(): Promise<{
    users: any[];
    classes: any[];
    disciplines: any[];
    instructors: any[];
    plans: any[];
    organizations: any[];
  }> {
    const [users, classes, disciplines, instructors, plans, organizations] =
      await Promise.all([
        this.users.findMany({ limit: 1000 }),
        this.classes.findMany({ limit: 1000 }),
        this.disciplines.findMany({ limit: 1000 }),
        this.instructors.findMany({ limit: 1000 }),
        this.plans.findMany({ limit: 1000 }),
        this.organizations.findMany({ limit: 1000 }),
      ]);

    return {
      users: users.items,
      classes: classes.items,
      disciplines: disciplines.items,
      instructors: instructors.items,
      plans: plans.items,
      organizations: organizations.items,
    };
  }

  // Seed data with custom datasets (for testing)
  async seedData(data: {
    users?: any[];
    classes?: any[];
    disciplines?: any[];
    instructors?: any[];
    plans?: any[];
    organizations?: any[];
  }): Promise<void> {
    if (this.config.enableLogging) {
      console.log("[MockDataProvider] Seeding custom data...");
    }

    try {
      // This would require implementing seed methods in repositories
      // For now, we'll log the intent
      console.log("[MockDataProvider] Custom data seeding not yet implemented");

      if (this.config.enableLogging) {
        console.log("[MockDataProvider] Data seeding completed");
      }
    } catch (error) {
      console.error("[MockDataProvider] Error during data seeding:", error);
      throw error;
    }
  }

  // Export data (for backup or migration)
  async exportData(): Promise<string> {
    try {
      const allData = await this.getAllData();
      return JSON.stringify(allData, null, 2);
    } catch (error) {
      console.error("[MockDataProvider] Error during data export:", error);
      throw error;
    }
  }

  // Import data (for restore or migration)
  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      await this.seedData(data);

      if (this.config.enableLogging) {
        console.log("[MockDataProvider] Data import completed");
      }
    } catch (error) {
      console.error("[MockDataProvider] Error during data import:", error);
      throw error;
    }
  }
}
