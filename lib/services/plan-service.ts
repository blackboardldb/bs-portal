// Enhanced PlanService using new data layer architecture
// Maintains existing API while using new provider-based architecture

import { BaseService } from "./base-service";
import { MembershipPlan } from "../types";
import { PlanRepository } from "../data-layer/types";
import { ApiResponse, PaginatedApiResponse } from "../api/types";
import { generatedSchemas, validateWithSchema } from "../types/generator";
import { ValidationError } from "../errors/types";

export class PlanService extends BaseService<MembershipPlan> {
  protected repositoryName = "plans" as const;

  // Get the typed plan repository
  private get planRepository(): PlanRepository {
    return this.repository as PlanRepository;
  }

  // Enhanced methods using new architecture

  // Get plans with pagination and filtering
  async getPlans(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<PaginatedApiResponse<MembershipPlan>> {
    const findParams: any = {
      page: params?.page || 1,
      limit: params?.limit || 10,
    };

    // Build where clause
    const where: any = {};

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (Object.keys(where).length > 0) {
      findParams.where = where;
    }

    return this.findMany(findParams);
  }

  // Get plan by ID
  async getPlanById(id: string): Promise<ApiResponse<MembershipPlan | null>> {
    return this.findById(id);
  }

  // Get active plans
  async getActivePlans(): Promise<ApiResponse<MembershipPlan[]>> {
    return this.withCache(
      "active_plans",
      async () => {
        const plans = await this.planRepository.findByStatus(true);
        return this.createSuccessResponse(plans);
      },
      10 * 60 * 1000 // Cache for 10 minutes
    );
  }

  // Create plan
  async createPlan(planData: any): Promise<ApiResponse<MembershipPlan>> {
    return this.create(planData);
  }

  // Update plan
  async updatePlan(
    id: string,
    planData: any
  ): Promise<ApiResponse<MembershipPlan>> {
    return this.update(id, planData);
  }

  // Delete plan
  async deletePlan(id: string): Promise<ApiResponse<MembershipPlan>> {
    return this.delete(id);
  }

  // Get plan statistics
  async getPlanStats(): Promise<
    ApiResponse<{
      total: number;
      active: number;
      inactive: number;
      averagePrice: number;
      mostPopular: string | null;
    }>
  > {
    return this.withCache(
      "plan_stats",
      async () => {
        const stats = await this.planRepository.getPlanStats();
        return this.createSuccessResponse(stats);
      },
      5 * 60 * 1000 // Cache for 5 minutes
    );
  }

  // Validation hooks

  protected async validateCreateData(data: any): Promise<void> {
    // Validate using generated schema
    validateWithSchema(generatedSchemas.membershipPlan, data);

    // Additional business validation
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError("Plan name is required", "name");
    }

    if (!data.price || data.price <= 0) {
      throw new ValidationError("Plan price must be greater than 0", "price");
    }

    // Check for duplicate names
    const existingPlans = await this.planRepository.findMany();
    const duplicateName = existingPlans.items.find(
      (p) => p.name.toLowerCase() === data.name.toLowerCase()
    );

    if (duplicateName) {
      throw new ValidationError("A plan with this name already exists", "name");
    }
  }

  protected async validateUpdateData(
    id: string,
    data: any,
    existingRecord: MembershipPlan
  ): Promise<void> {
    // Validate using generated schema (partial)
    const updateSchema = generatedSchemas.membershipPlan.partial();
    validateWithSchema(updateSchema, data);

    // Check for duplicate names if name is being changed
    if (data.name && data.name !== existingRecord.name) {
      const existingPlans = await this.planRepository.findMany();
      const duplicateName = existingPlans.items.find(
        (p) => p.id !== id && p.name.toLowerCase() === data.name.toLowerCase()
      );

      if (duplicateName) {
        throw new ValidationError(
          "A plan with this name already exists",
          "name"
        );
      }
    }

    // Validate price if being changed
    if (data.price !== undefined && data.price <= 0) {
      throw new ValidationError("Plan price must be greater than 0", "price");
    }
  }

  protected async validateDelete(
    id: string,
    existingRecord: MembershipPlan
  ): Promise<void> {
    // Check if plan is being used by users
    const usersWithPlan = await this.dataProvider.users.findMany({
      where: {
        membership: {
          membershipType: existingRecord.name,
        },
      },
    });

    if (usersWithPlan.items.length > 0) {
      throw new ValidationError(
        "Cannot delete plan that is being used by users. Deactivate it instead."
      );
    }
  }

  // Lifecycle hooks

  protected async afterCreate(record: MembershipPlan): Promise<void> {
    // Clear cache
    this.clearCache();

    console.log(
      `[PlanService] Plan created: ${record.id} (${record.name} - $${record.price})`
    );
  }

  protected async afterUpdate(
    updatedRecord: MembershipPlan,
    previousRecord: MembershipPlan
  ): Promise<void> {
    // Clear cache
    this.clearCache();

    // Log significant changes
    if (previousRecord.isActive !== updatedRecord.isActive) {
      console.log(
        `[PlanService] Plan status changed: ${updatedRecord.id} (${
          previousRecord.isActive ? "active" : "inactive"
        } -> ${updatedRecord.isActive ? "active" : "inactive"})`
      );
    }

    if (previousRecord.price !== updatedRecord.price) {
      console.log(
        `[PlanService] Plan price changed: ${updatedRecord.id} ($${previousRecord.price} -> $${updatedRecord.price})`
      );
    }
  }

  protected async afterDelete(deletedRecord: MembershipPlan): Promise<void> {
    // Clear cache
    this.clearCache();

    console.log(
      `[PlanService] Plan deleted: ${deletedRecord.id} (${deletedRecord.name})`
    );
  }

  // Helper methods

  private createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      data,
      success: true,
      meta: {
        timestamp: new Date().toISOString(),
        processingTime: this.getProcessingTime(),
      },
    };
  }
}
