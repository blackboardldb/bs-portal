import { initialMembershipPlans } from "@/lib/mock-data";
import {
  groupPlansByCategory,
  getCategoryInfo,
  filterPlansByCategory,
  categorizePlan,
} from "@/lib/utils";

describe("Plan Categorization Integration Tests", () => {
  describe("Real Data Integration", () => {
    it("should categorize all existing plans from mock data correctly", () => {
      const activePlans = initialMembershipPlans.filter(
        (plan) => plan.isActive
      );
      const groupedPlans = groupPlansByCategory(activePlans);

      // Verify that all plans are categorized
      const totalCategorized =
        groupedPlans.monthly.length + groupedPlans.extended.length;
      expect(totalCategorized).toBe(activePlans.length);

      // Log the categorization for debugging
      console.log(
        "Monthly plans:",
        groupedPlans.monthly.map((p) => ({
          name: p.name,
          duration: p.durationInMonths,
        }))
      );
      console.log(
        "Extended plans:",
        groupedPlans.extended.map((p) => ({
          name: p.name,
          duration: p.durationInMonths,
        }))
      );

      // Verify monthly plans have correct durations
      groupedPlans.monthly.forEach((plan) => {
        expect([0.5, 1]).toContain(plan.durationInMonths);
      });

      // Verify extended plans have correct durations or are defaults
      groupedPlans.extended.forEach((plan) => {
        const isKnownExtended = [3, 6, 12].includes(plan.durationInMonths);
        const isUnknownDuration = ![0.5, 1, 3, 6, 12].includes(
          plan.durationInMonths
        );
        expect(isKnownExtended || isUnknownDuration).toBe(true);
      });
    });

    it("should provide correct category information for UI display", () => {
      const monthlyInfo = getCategoryInfo("monthly");
      const extendedInfo = getCategoryInfo("extended");

      expect(monthlyInfo).not.toBeNull();
      expect(monthlyInfo?.label).toBe("Planes Mensuales");
      expect(monthlyInfo?.description).toBe(
        "Planes de corto plazo y flexibles"
      );
      expect(monthlyInfo?.durations).toEqual([0.5, 1]);

      expect(extendedInfo).not.toBeNull();
      expect(extendedInfo?.label).toBe("Planes Extendidos");
      expect(extendedInfo?.description).toBe(
        "Planes de largo plazo con mejor valor"
      );
      expect(extendedInfo?.durations).toEqual([3, 6, 12]);
    });

    it("should filter plans correctly for admin panel", () => {
      const activePlans = initialMembershipPlans.filter(
        (plan) => plan.isActive
      );

      const monthlyPlans = filterPlansByCategory(activePlans, "monthly");
      const extendedPlans = filterPlansByCategory(activePlans, "extended");

      // Verify filtering works correctly
      monthlyPlans.forEach((plan) => {
        expect(categorizePlan(plan.durationInMonths)).toBe("monthly");
      });

      extendedPlans.forEach((plan) => {
        expect(categorizePlan(plan.durationInMonths)).toBe("extended");
      });

      // Verify total count matches
      expect(monthlyPlans.length + extendedPlans.length).toBe(
        activePlans.length
      );
    });

    it("should handle specific plan durations from mock data", () => {
      // Test specific plans that we know exist in mock data
      const quincenal = initialMembershipPlans.find(
        (p) => p.durationInMonths === 0.5
      );
      const mensual = initialMembershipPlans.find(
        (p) => p.durationInMonths === 1
      );
      const trimestral = initialMembershipPlans.find(
        (p) => p.durationInMonths === 3
      );
      const semestral = initialMembershipPlans.find(
        (p) => p.durationInMonths === 6
      );
      const anual = initialMembershipPlans.find(
        (p) => p.durationInMonths === 12
      );

      if (quincenal) {
        expect(categorizePlan(quincenal.durationInMonths)).toBe("monthly");
      }

      if (mensual) {
        expect(categorizePlan(mensual.durationInMonths)).toBe("monthly");
      }

      if (trimestral) {
        expect(categorizePlan(trimestral.durationInMonths)).toBe("extended");
      }

      if (semestral) {
        expect(categorizePlan(semestral.durationInMonths)).toBe("extended");
      }

      if (anual) {
        expect(categorizePlan(anual.durationInMonths)).toBe("extended");
      }
    });
  });

  describe("Auth Flow Integration", () => {
    it("should prepare data correctly for auth component", () => {
      const activePlans = initialMembershipPlans.filter(
        (plan) => plan.isActive
      );
      const groupedPlans = groupPlansByCategory(activePlans);

      // Verify both categories exist if we have plans
      if (activePlans.length > 0) {
        expect(typeof groupedPlans).toBe("object");
        expect(Array.isArray(groupedPlans.monthly)).toBe(true);
        expect(Array.isArray(groupedPlans.extended)).toBe(true);
      }

      // Verify category info is available for headers
      const monthlyInfo = getCategoryInfo("monthly");
      const extendedInfo = getCategoryInfo("extended");

      expect(monthlyInfo?.label).toBeTruthy();
      expect(monthlyInfo?.description).toBeTruthy();
      expect(extendedInfo?.label).toBeTruthy();
      expect(extendedInfo?.description).toBeTruthy();
    });
  });

  describe("Renewal Flow Integration", () => {
    it("should prepare data correctly for renewal component", () => {
      const activePlans = initialMembershipPlans.filter(
        (plan) => plan.isActive
      );
      const groupedPlans = groupPlansByCategory(activePlans);

      // Same structure as auth flow
      expect(typeof groupedPlans).toBe("object");
      expect(Array.isArray(groupedPlans.monthly)).toBe(true);
      expect(Array.isArray(groupedPlans.extended)).toBe(true);

      // Verify plans maintain all required properties
      [...groupedPlans.monthly, ...groupedPlans.extended].forEach((plan) => {
        expect(plan).toHaveProperty("id");
        expect(plan).toHaveProperty("name");
        expect(plan).toHaveProperty("description");
        expect(plan).toHaveProperty("price");
        expect(plan).toHaveProperty("durationInMonths");
        expect(plan).toHaveProperty("isActive");
        expect(plan.isActive).toBe(true);
      });
    });
  });

  describe("Admin Panel Integration", () => {
    it("should support admin filtering functionality", () => {
      const allPlans = initialMembershipPlans; // Include inactive plans for admin

      // Test monthly filter
      const monthlyFiltered = filterPlansByCategory(allPlans, "monthly");
      monthlyFiltered.forEach((plan) => {
        expect([0.5, 1]).toContain(plan.durationInMonths);
      });

      // Test extended filter
      const extendedFiltered = filterPlansByCategory(allPlans, "extended");
      extendedFiltered.forEach((plan) => {
        const isKnownExtended = [3, 6, 12].includes(plan.durationInMonths);
        const isUnknownDuration = ![0.5, 1, 3, 6, 12].includes(
          plan.durationInMonths
        );
        expect(isKnownExtended || isUnknownDuration).toBe(true);
      });

      // Verify total count
      expect(monthlyFiltered.length + extendedFiltered.length).toBe(
        allPlans.length
      );
    });

    it("should work with existing admin filters", () => {
      const allPlans = initialMembershipPlans;

      // Simulate combining with active filter
      const activePlans = allPlans.filter((plan) => plan.isActive);
      const inactivePlans = allPlans.filter((plan) => !plan.isActive);

      // Test filtering active monthly plans
      const activeMonthly = filterPlansByCategory(activePlans, "monthly");
      const inactiveMonthly = filterPlansByCategory(inactivePlans, "monthly");

      // Both should work independently
      expect(Array.isArray(activeMonthly)).toBe(true);
      expect(Array.isArray(inactiveMonthly)).toBe(true);

      // Combined should equal total monthly
      const totalMonthly = filterPlansByCategory(allPlans, "monthly");
      expect(activeMonthly.length + inactiveMonthly.length).toBe(
        totalMonthly.length
      );
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle empty plan arrays gracefully", () => {
      const emptyGrouped = groupPlansByCategory([]);
      expect(emptyGrouped.monthly).toHaveLength(0);
      expect(emptyGrouped.extended).toHaveLength(0);

      const emptyFiltered = filterPlansByCategory([], "monthly");
      expect(emptyFiltered).toHaveLength(0);
    });

    it("should handle plans with missing properties", () => {
      const invalidPlans = [
        { id: "1", name: "Test", durationInMonths: 1 }, // Missing other props
        { id: "2", name: "Test 2", durationInMonths: 3 },
      ] as any[];

      // Should not throw errors
      expect(() => groupPlansByCategory(invalidPlans)).not.toThrow();
      expect(() =>
        filterPlansByCategory(invalidPlans, "monthly")
      ).not.toThrow();
    });

    it("should handle invalid category gracefully", () => {
      const plans = initialMembershipPlans.slice(0, 2);

      // Should not throw for invalid category
      expect(() =>
        filterPlansByCategory(plans, "invalid" as any)
      ).not.toThrow();

      // Should return empty array for invalid category
      const result = filterPlansByCategory(plans, "invalid" as any);
      expect(result).toHaveLength(0);
    });
  });
});
