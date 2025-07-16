// Organization repository implementation
// Enhanced with proper typing and error handling

import { BaseRepository } from "./base-repository";
import { OrganizationRepository as IOrganizationRepository } from "../types";
import { Organization } from "../../types";
import { initialOrganization } from "../../mock-data";
import { ValidationError } from "../../errors/types";

// Mock implementation of OrganizationRepository
export class MockOrganizationRepository
  extends BaseRepository<Organization>
  implements IOrganizationRepository
{
  protected entityName = "Organization";
  protected data: Organization[];

  constructor() {
    super();
    // Initialize with mock data (single organization for now)
    this.data = [initialOrganization];
  }

  // Find organizations by type
  async findByType(type: string): Promise<Organization[]> {
    try {
      return this.data.filter((org) => org.type === type);
    } catch (error) {
      throw new Error(`Failed to find organizations by type: ${error}`);
    }
  }

  // Enhanced filtering for organization queries
  protected applyFilters(
    results: Organization[],
    where: Record<string, any>
  ): Organization[] {
    return results.filter((organization) => {
      // Type filter
      if (where.type && organization.type !== where.type) {
        return false;
      }

      // Name search
      if (where.name?.contains) {
        const searchTerm = where.name.contains.toLowerCase();
        if (!organization.name.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Apply base filtering for other criteria
      return this.matchesCriteria(organization, where);
    });
  }

  // Validate organization record
  protected validateRecord(record: Organization): void {
    super.validateRecord(record);

    if (!record.name?.trim()) {
      throw new ValidationError("Organization name is required", "name");
    }

    if (!record.description?.trim()) {
      throw new ValidationError(
        "Organization description is required",
        "description"
      );
    }

    if (!record.type?.trim()) {
      throw new ValidationError("Organization type is required", "type");
    }

    // Validate branding
    if (record.branding) {
      this.validateBranding(record.branding);
    }

    // Validate settings
    if (record.settings) {
      this.validateSettings(record.settings);
    }
  }

  // Validate branding data
  private validateBranding(branding: any): void {
    if (!branding.primaryColor) {
      throw new ValidationError(
        "Primary color is required",
        "branding.primaryColor"
      );
    }

    if (!branding.secondaryColor) {
      throw new ValidationError(
        "Secondary color is required",
        "branding.secondaryColor"
      );
    }

    // Validate color format (hex)
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(branding.primaryColor)) {
      throw new ValidationError(
        "Invalid primary color format. Must be hex color",
        "branding.primaryColor"
      );
    }

    if (!colorRegex.test(branding.secondaryColor)) {
      throw new ValidationError(
        "Invalid secondary color format. Must be hex color",
        "branding.secondaryColor"
      );
    }
  }

  // Validate settings data
  private validateSettings(settings: any): void {
    if (!settings.timezone) {
      throw new ValidationError("Timezone is required", "settings.timezone");
    }

    if (!settings.currency) {
      throw new ValidationError("Currency is required", "settings.currency");
    }

    if (!settings.language) {
      throw new ValidationError("Language is required", "settings.language");
    }

    // Validate numeric settings
    if (
      typeof settings.defaultCancellationHours !== "number" ||
      settings.defaultCancellationHours < 0
    ) {
      throw new ValidationError(
        "Default cancellation hours must be a non-negative number",
        "settings.defaultCancellationHours"
      );
    }

    if (
      typeof settings.maxBookingsPerDay !== "number" ||
      settings.maxBookingsPerDay < 1
    ) {
      throw new ValidationError(
        "Max bookings per day must be at least 1",
        "settings.maxBookingsPerDay"
      );
    }

    if (typeof settings.waitlistEnabled !== "boolean") {
      throw new ValidationError(
        "Waitlist enabled must be a boolean",
        "settings.waitlistEnabled"
      );
    }

    // Validate operating hours
    if (settings.operatingHours && Array.isArray(settings.operatingHours)) {
      this.validateOperatingHours(settings.operatingHours);
    }
  }

  // Validate operating hours
  private validateOperatingHours(operatingHours: any[]): void {
    const validDays = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
    const timeRegex = /^\d{2}:\d{2}$/;

    for (const hours of operatingHours) {
      if (!hours.day || !validDays.includes(hours.day)) {
        throw new ValidationError(
          `Invalid day. Must be one of: ${validDays.join(", ")}`,
          "settings.operatingHours.day"
        );
      }

      if (!timeRegex.test(hours.open)) {
        throw new ValidationError(
          "Invalid open time format. Must be HH:mm",
          "settings.operatingHours.open"
        );
      }

      if (!timeRegex.test(hours.close)) {
        throw new ValidationError(
          "Invalid close time format. Must be HH:mm",
          "settings.operatingHours.close"
        );
      }

      if (typeof hours.closed !== "boolean") {
        throw new ValidationError(
          "Closed must be a boolean",
          "settings.operatingHours.closed"
        );
      }

      // Validate time logic (open < close) if not closed
      if (!hours.closed) {
        const openTime = hours.open.split(":").map(Number);
        const closeTime = hours.close.split(":").map(Number);
        const openMinutes = openTime[0] * 60 + openTime[1];
        const closeMinutes = closeTime[0] * 60 + closeTime[1];

        if (openMinutes >= closeMinutes) {
          throw new ValidationError(
            "Open time must be before close time",
            "settings.operatingHours"
          );
        }
      }
    }

    // Check for duplicate days
    const days = operatingHours.map((h) => h.day);
    const uniqueDays = new Set(days);
    if (days.length !== uniqueDays.size) {
      throw new ValidationError(
        "Duplicate days found in operating hours",
        "settings.operatingHours"
      );
    }
  }

  // Organization-specific utility methods

  // Get current organization (for single-tenant setup)
  async getCurrentOrganization(): Promise<Organization | null> {
    try {
      return this.data[0] || null;
    } catch (error) {
      throw new Error(`Failed to get current organization: ${error}`);
    }
  }

  // Update organization settings
  async updateSettings(
    organizationId: string,
    settings: any
  ): Promise<Organization> {
    const organization = await this.findById(organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const updatedOrganization = await this.update(organizationId, {
      settings: {
        ...organization.settings,
        ...settings,
      },
    });

    return updatedOrganization;
  }

  // Update organization branding
  async updateBranding(
    organizationId: string,
    branding: any
  ): Promise<Organization> {
    const organization = await this.findById(organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const updatedOrganization = await this.update(organizationId, {
      branding: {
        ...organization.branding,
        ...branding,
      },
    });

    return updatedOrganization;
  }

  // Get organization operating hours for a specific day
  async getOperatingHoursForDay(
    organizationId: string,
    day: string
  ): Promise<{
    open: string;
    close: string;
    closed: boolean;
  } | null> {
    const organization = await this.findById(organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const dayHours = organization.settings.operatingHours.find(
      (h) => h.day === day
    );
    return dayHours || null;
  }

  // Check if organization is open at specific time
  async isOpenAt(
    organizationId: string,
    day: string,
    time: string
  ): Promise<boolean> {
    const hours = await this.getOperatingHoursForDay(organizationId, day);
    if (!hours || hours.closed) {
      return false;
    }

    const timeMinutes = time.split(":").map(Number);
    const currentMinutes = timeMinutes[0] * 60 + timeMinutes[1];

    const openMinutes = hours.open.split(":").map(Number);
    const openTotalMinutes = openMinutes[0] * 60 + openMinutes[1];

    const closeMinutes = hours.close.split(":").map(Number);
    const closeTotalMinutes = closeMinutes[0] * 60 + closeMinutes[1];

    return (
      currentMinutes >= openTotalMinutes && currentMinutes <= closeTotalMinutes
    );
  }

  // Get organization statistics
  async getOrganizationStats(): Promise<{
    totalOrganizations: number;
    organizationTypes: Record<string, number>;
    averageCancellationHours: number;
    averageMaxBookingsPerDay: number;
  }> {
    const total = this.data.length;
    const types: Record<string, number> = {};
    let totalCancellationHours = 0;
    let totalMaxBookings = 0;

    for (const org of this.data) {
      types[org.type] = (types[org.type] || 0) + 1;
      totalCancellationHours += org.settings.defaultCancellationHours;
      totalMaxBookings += org.settings.maxBookingsPerDay;
    }

    return {
      totalOrganizations: total,
      organizationTypes: types,
      averageCancellationHours: total > 0 ? totalCancellationHours / total : 0,
      averageMaxBookingsPerDay: total > 0 ? totalMaxBookings / total : 0,
    };
  }
}

// Prisma implementation skeleton (for future use)
export class PrismaOrganizationRepository implements IOrganizationRepository {
  async findMany(params?: any): Promise<any> {
    // TODO: Implement with Prisma
    throw new Error("PrismaOrganizationRepository not implemented yet");
  }

  async findUnique(params: any): Promise<Organization | null> {
    // TODO: Implement with Prisma
    throw new Error("PrismaOrganizationRepository not implemented yet");
  }

  async create(data: any): Promise<Organization> {
    // TODO: Implement with Prisma
    throw new Error("PrismaOrganizationRepository not implemented yet");
  }

  async update(id: string, data: any): Promise<Organization> {
    // TODO: Implement with Prisma
    throw new Error("PrismaOrganizationRepository not implemented yet");
  }

  async delete(id: string): Promise<Organization> {
    // TODO: Implement with Prisma
    throw new Error("PrismaOrganizationRepository not implemented yet");
  }

  async count(params?: any): Promise<number> {
    // TODO: Implement with Prisma
    throw new Error("PrismaOrganizationRepository not implemented yet");
  }

  async findByType(type: string): Promise<Organization[]> {
    // TODO: Implement with Prisma
    throw new Error("PrismaOrganizationRepository not implemented yet");
  }
}
