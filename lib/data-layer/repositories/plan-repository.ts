// Plan repository implementation
// Extracted from mock-database.ts and enhanced with proper typing and error handling

import { BaseRepository } from "./base-repository";
import { PlanRepository as IPlanRepository } from "../types";
import { MembershipPlan } from "../../types";
import { initialMembershipPlans } from "../../mock-data";
import { ValidationError } from "../../errors/types";

// Mock implementation of PlanRepository
export class MockPlanRepository
  extends BaseRepository<MembershipPlan>
  implements IPlanRepository
{
  protected entityName = "MembershipPlan";
  protected data: MembershipPlan[];

  constructor() {
    super();
    // Initialize with mock data
    this.data = [...initialMembershipPlans];
  }

  // Find active plans
  async findActive(): Promise<MembershipPlan[]> {
    try {
      return this.data.filter((plan) => plan.isActive);
    } catch (error) {
      throw new Error(`Failed to find active plans: ${error}`);
    }
  }

  // Find plans by organization
  async findByOrganization(organizationId: string): Promise<MembershipPlan[]> {
    try {
      return this.data.filter((plan) => plan.organizationId === organizationId);
    } catch (error) {
      throw new Error(`Failed to find plans by organization: ${error}`);
    }
  }

  // Enhanced filtering for plan queries
  protected applyFilters(
    results: MembershipPlan[],
    where: Record<string, any>
  ): MembershipPlan[] {
    return results.filter((plan) => {
      // Active status filter
      if (where.isActive !== undefined && plan.isActive !== where.isActive) {
        return false;
      }

      // Organization filter
      if (
        where.organizationId &&
        plan.organizationId !== where.organizationId
      ) {
        return false;
      }

      // Search filter (OR conditions)
      if (where.OR && Array.isArray(where.OR)) {
        const matchesSearch = where.OR.some((condition: any) => {
          const searchTerm =
            condition.name?.contains?.toLowerCase() ||
            condition.description?.contains?.toLowerCase() ||
            "";

          return (
            plan.name.toLowerCase().includes(searchTerm) ||
            plan.description.toLowerCase().includes(searchTerm)
          );
        });

        if (!matchesSearch) {
          return false;
        }
      }

      // Price range filters
      if (where.price) {
        if (where.price.gte && plan.price < where.price.gte) return false;
        if (where.price.lte && plan.price > where.price.lte) return false;
        if (where.price.gt && plan.price <= where.price.gt) return false;
        if (where.price.lt && plan.price >= where.price.lt) return false;
      }

      // Class limit filters
      if (where.classLimit) {
        if (where.classLimit.gte && plan.classLimit < where.classLimit.gte)
          return false;
        if (where.classLimit.lte && plan.classLimit > where.classLimit.lte)
          return false;
      }

      // Duration filters
      if (where.durationInMonths) {
        if (
          where.durationInMonths.gte &&
          plan.durationInMonths < where.durationInMonths.gte
        )
          return false;
        if (
          where.durationInMonths.lte &&
          plan.durationInMonths > where.durationInMonths.lte
        )
          return false;
      }

      // Apply base filtering for other criteria
      return this.matchesCriteria(plan, where);
    });
  }

  // Validate plan record
  protected validateRecord(record: MembershipPlan): void {
    super.validateRecord(record);

    if (!record.name?.trim()) {
      throw new ValidationError("Plan name is required", "name");
    }

    if (!record.description?.trim()) {
      throw new ValidationError("Plan description is required", "description");
    }

    if (!record.organizationId) {
      throw new ValidationError(
        "Organization ID is required",
        "organizationId"
      );
    }

    // Check for duplicate name within organization (excluding current record for updates)
    const existingPlan = this.data.find(
      (p) =>
        p.name.toLowerCase() === record.name.toLowerCase() &&
        p.organizationId === record.organizationId &&
        p.id !== record.id
    );
    if (existingPlan) {
      throw new ValidationError(
        "Plan name already exists in this organization",
        "name",
        {
          existingPlanId: existingPlan.id,
        }
      );
    }

    // Validate price
    if (typeof record.price !== "number" || record.price < 0) {
      throw new ValidationError("Price must be a non-negative number", "price");
    }

    // Validate duration
    if (
      typeof record.durationInMonths !== "number" ||
      record.durationInMonths <= 0
    ) {
      throw new ValidationError(
        "Duration must be a positive number",
        "durationInMonths"
      );
    }

    // Validate class limit
    if (typeof record.classLimit !== "number" || record.classLimit < 0) {
      throw new ValidationError(
        "Class limit must be a non-negative number (0 for unlimited)",
        "classLimit"
      );
    }

    // Validate discipline access
    if (!["all", "limited"].includes(record.disciplineAccess)) {
      throw new ValidationError(
        'Discipline access must be "all" or "limited"',
        "disciplineAccess"
      );
    }

    // Validate allowed disciplines for limited access
    if (record.disciplineAccess === "limited") {
      if (
        !Array.isArray(record.allowedDisciplines) ||
        record.allowedDisciplines.length === 0
      ) {
        throw new ValidationError(
          "Allowed disciplines must be specified for limited access",
          "allowedDisciplines"
        );
      }
    }

    // Validate freeze settings
    if (record.canFreeze) {
      if (
        typeof record.freezeDurationDays !== "number" ||
        record.freezeDurationDays < 0
      ) {
        throw new ValidationError(
          "Freeze duration must be a non-negative number",
          "freezeDurationDays"
        );
      }
    }

    // Validate boolean fields
    if (typeof record.canFreeze !== "boolean") {
      throw new ValidationError("Can freeze must be a boolean", "canFreeze");
    }

    if (typeof record.autoRenews !== "boolean") {
      throw new ValidationError("Auto renews must be a boolean", "autoRenews");
    }

    if (typeof record.isActive !== "boolean") {
      throw new ValidationError("Is active must be a boolean", "isActive");
    }
  }

  // Plan-specific utility methods

  // Find plan by name within organization
  async findByNameInOrganization(
    name: string,
    organizationId: string
  ): Promise<MembershipPlan | null> {
    try {
      const plan = this.data.find(
        (p) =>
          p.name.toLowerCase() === name.toLowerCase() &&
          p.organizationId === organizationId
      );
      return plan || null;
    } catch (error) {
      throw new Error(`Failed to find plan by name: ${error}`);
    }
  }

  // Find unlimited plans
  async findUnlimitedPlans(): Promise<MembershipPlan[]> {
    try {
      return this.data.filter((plan) => plan.classLimit === 0 && plan.isActive);
    } catch (error) {
      throw new Error(`Failed to find unlimited plans: ${error}`);
    }
  }

  // Find plans by price range
  async findByPriceRange(
    minPrice: number,
    maxPrice: number
  ): Promise<MembershipPlan[]> {
    try {
      return this.data.filter(
        (plan) =>
          plan.price >= minPrice && plan.price <= maxPrice && plan.isActive
      );
    } catch (error) {
      throw new Error(`Failed to find plans by price range: ${error}`);
    }
  }

  // Find plans by duration
  async findByDuration(durationInMonths: number): Promise<MembershipPlan[]> {
    try {
      return this.data.filter(
        (plan) => plan.durationInMonths === durationInMonths && plan.isActive
      );
    } catch (error) {
      throw new Error(`Failed to find plans by duration: ${error}`);
    }
  }

  // Find plans that allow freezing
  async findFreezablePlans(): Promise<MembershipPlan[]> {
    try {
      return this.data.filter((plan) => plan.canFreeze && plan.isActive);
    } catch (error) {
      throw new Error(`Failed to find freezable plans: ${error}`);
    }
  }

  // Find auto-renewing plans
  async findAutoRenewingPlans(): Promise<MembershipPlan[]> {
    try {
      return this.data.filter((plan) => plan.autoRenews && plan.isActive);
    } catch (error) {
      throw new Error(`Failed to find auto-renewing plans: ${error}`);
    }
  }

  // Toggle plan active status
  async toggleActiveStatus(planId: string): Promise<MembershipPlan> {
    const plan = await this.findById(planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    const updatedPlan = await this.update(planId, {
      isActive: !plan.isActive,
    });

    return updatedPlan;
  }

  // Get plan statistics
  async getPlanStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    unlimited: number;
    freezable: number;
    autoRenewing: number;
    averagePrice: number;
  }> {
    const total = this.data.length;
    const active = this.data.filter((p) => p.isActive).length;
    const inactive = this.data.filter((p) => !p.isActive).length;
    const unlimited = this.data.filter((p) => p.classLimit === 0).length;
    const freezable = this.data.filter((p) => p.canFreeze).length;
    const autoRenewing = this.data.filter((p) => p.autoRenews).length;
    const averagePrice = this.data.reduce((sum, p) => sum + p.price, 0) / total;

    return {
      total,
      active,
      inactive,
      unlimited,
      freezable,
      autoRenewing,
      averagePrice: Math.round(averagePrice),
    };
  }

  // Get plans grouped by price range
  async getPlansByPriceRange(): Promise<{
    budget: MembershipPlan[]; // < 30000
    standard: MembershipPlan[]; // 30000-50000
    premium: MembershipPlan[]; // > 50000
  }> {
    const activePlans = this.data.filter((p) => p.isActive);

    return {
      budget: activePlans.filter((p) => p.price < 30000),
      standard: activePlans.filter((p) => p.price >= 30000 && p.price <= 50000),
      premium: activePlans.filter((p) => p.price > 50000),
    };
  }

  // Get most popular plan (this would be based on usage in real implementation)
  async getMostPopularPlan(): Promise<MembershipPlan | null> {
    // For mock, return the first active plan with moderate pricing
    const popularPlan = this.data.find(
      (p) =>
        p.isActive && p.price >= 30000 && p.price <= 50000 && p.classLimit > 0
    );

    return popularPlan || null;
  }
}

// Prisma implementation skeleton (for future use)
export class PrismaPlanRepository implements IPlanRepository {
  async findMany(params?: any): Promise<any> {
    // TODO: Implement with Prisma
    throw new Error("PrismaPlanRepository not implemented yet");
  }

  async findUnique(params: any): Promise<MembershipPlan | null> {
    // TODO: Implement with Prisma
    throw new Error("PrismaPlanRepository not implemented yet");
  }

  async create(data: any): Promise<MembershipPlan> {
    // TODO: Implement with Prisma
    throw new Error("PrismaPlanRepository not implemented yet");
  }

  async update(id: string, data: any): Promise<MembershipPlan> {
    // TODO: Implement with Prisma
    throw new Error("PrismaPlanRepository not implemented yet");
  }

  async delete(id: string): Promise<MembershipPlan> {
    // TODO: Implement with Prisma
    throw new Error("PrismaPlanRepository not implemented yet");
  }

  async count(params?: any): Promise<number> {
    // TODO: Implement with Prisma
    throw new Error("PrismaPlanRepository not implemented yet");
  }

  async findActive(): Promise<MembershipPlan[]> {
    // TODO: Implement with Prisma
    throw new Error("PrismaPlanRepository not implemented yet");
  }

  async findByOrganization(organizationId: string): Promise<MembershipPlan[]> {
    // TODO: Implement with Prisma
    throw new Error("PrismaPlanRepository not implemented yet");
  }
}
