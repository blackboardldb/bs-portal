import {
  categorizePlan,
  groupPlansByCategory,
  getPlanCategories,
  getCategoryInfo,
  getCategoryLabel,
  isDurationInCategory,
  filterPlansByCategory,
  getPlanCategoryStats,
  PLAN_CATEGORIES,
  type PlanCategory,
} from "@/lib/utils";

// Mock plan data for testing
const mockPlans = [
  { id: "1", name: "Plan Quincenal", durationInMonths: 0.5, price: 25000 },
  { id: "2", name: "Plan Mensual", durationInMonths: 1, price: 35000 },
  { id: "3", name: "Plan Trimestral", durationInMonths: 3, price: 90000 },
  { id: "4", name: "Plan Semestral", durationInMonths: 6, price: 150000 },
  { id: "5", name: "Plan Anual", durationInMonths: 12, price: 250000 },
  { id: "6", name: "Plan Personalizado", durationInMonths: 2, price: 60000 }, // Edge case
];

describe("Plan Categorization Utils", () => {
  describe("categorizePlan", () => {
    it("should categorize quincenal plan as monthly", () => {
      expect(categorizePlan(0.5)).toBe("monthly");
    });

    it("should categorize mensual plan as monthly", () => {
      expect(categorizePlan(1)).toBe("monthly");
    });

    it("should categorize trimestral plan as extended", () => {
      expect(categorizePlan(3)).toBe("extended");
    });

    it("should categorize semestral plan as extended", () => {
      expect(categorizePlan(6)).toBe("extended");
    });

    it("should categorize anual plan as extended", () => {
      expect(categorizePlan(12)).toBe("extended");
    });

    it("should default unknown durations to extended", () => {
      expect(categorizePlan(2)).toBe("extended");
      expect(categorizePlan(4)).toBe("extended");
      expect(categorizePlan(24)).toBe("extended");
    });

    it("should handle edge cases", () => {
      expect(categorizePlan(0)).toBe("extended");
      expect(categorizePlan(-1)).toBe("extended");
      expect(categorizePlan(0.25)).toBe("extended");
    });
  });

  describe("groupPlansByCategory", () => {
    it("should group plans correctly by category", () => {
      const grouped = groupPlansByCategory(mockPlans);

      expect(grouped.monthly).toHaveLength(2);
      expect(grouped.extended).toHaveLength(4);

      // Check monthly plans
      expect(grouped.monthly.map((p) => p.durationInMonths)).toEqual([0.5, 1]);

      // Check extended plans
      expect(grouped.extended.map((p) => p.durationInMonths)).toEqual([
        3, 6, 12, 2,
      ]);
    });

    it("should handle empty array", () => {
      const grouped = groupPlansByCategory([]);

      expect(grouped.monthly).toHaveLength(0);
      expect(grouped.extended).toHaveLength(0);
    });

    it("should handle plans with only one category", () => {
      const monthlyOnlyPlans = mockPlans.filter((p) => p.durationInMonths <= 1);
      const grouped = groupPlansByCategory(monthlyOnlyPlans);

      expect(grouped.monthly).toHaveLength(2);
      expect(grouped.extended).toHaveLength(0);
    });
  });

  describe("getPlanCategories", () => {
    it("should return all category configurations", () => {
      const categories = getPlanCategories();

      expect(categories).toHaveLength(2);
      expect(categories[0].key).toBe("monthly");
      expect(categories[1].key).toBe("extended");
    });

    it("should return categories with correct structure", () => {
      const categories = getPlanCategories();

      categories.forEach((category) => {
        expect(category).toHaveProperty("key");
        expect(category).toHaveProperty("label");
        expect(category).toHaveProperty("description");
        expect(category).toHaveProperty("durations");
        expect(Array.isArray(category.durations)).toBe(true);
      });
    });
  });

  describe("getCategoryInfo", () => {
    it("should return correct info for monthly category", () => {
      const info = getCategoryInfo("monthly");

      expect(info).not.toBeNull();
      expect(info?.key).toBe("monthly");
      expect(info?.label).toBe("Planes Mensuales");
      expect(info?.durations).toEqual([0.5, 1]);
    });

    it("should return correct info for extended category", () => {
      const info = getCategoryInfo("extended");

      expect(info).not.toBeNull();
      expect(info?.key).toBe("extended");
      expect(info?.label).toBe("Planes Extendidos");
      expect(info?.durations).toEqual([3, 6, 12]);
    });

    it("should return null for invalid category", () => {
      const info = getCategoryInfo("invalid" as PlanCategory);
      expect(info).toBeNull();
    });
  });

  describe("getCategoryLabel", () => {
    it("should return correct labels", () => {
      expect(getCategoryLabel("monthly")).toBe("Planes Mensuales");
      expect(getCategoryLabel("extended")).toBe("Planes Extendidos");
    });

    it("should return category key for invalid category", () => {
      expect(getCategoryLabel("invalid" as PlanCategory)).toBe("invalid");
    });
  });

  describe("isDurationInCategory", () => {
    it("should correctly identify monthly durations", () => {
      expect(isDurationInCategory(0.5, "monthly")).toBe(true);
      expect(isDurationInCategory(1, "monthly")).toBe(true);
      expect(isDurationInCategory(3, "monthly")).toBe(false);
    });

    it("should correctly identify extended durations", () => {
      expect(isDurationInCategory(3, "extended")).toBe(true);
      expect(isDurationInCategory(6, "extended")).toBe(true);
      expect(isDurationInCategory(12, "extended")).toBe(true);
      expect(isDurationInCategory(1, "extended")).toBe(false);
    });

    it("should handle unknown durations", () => {
      expect(isDurationInCategory(2, "monthly")).toBe(false);
      expect(isDurationInCategory(2, "extended")).toBe(false);
    });
  });

  describe("filterPlansByCategory", () => {
    it("should filter monthly plans correctly", () => {
      const monthlyPlans = filterPlansByCategory(mockPlans, "monthly");

      expect(monthlyPlans).toHaveLength(2);
      expect(monthlyPlans.map((p) => p.durationInMonths)).toEqual([0.5, 1]);
    });

    it("should filter extended plans correctly", () => {
      const extendedPlans = filterPlansByCategory(mockPlans, "extended");

      expect(extendedPlans).toHaveLength(4);
      expect(extendedPlans.map((p) => p.durationInMonths)).toEqual([
        3, 6, 12, 2,
      ]);
    });

    it("should handle empty array", () => {
      const monthlyPlans = filterPlansByCategory([], "monthly");
      expect(monthlyPlans).toHaveLength(0);
    });
  });

  describe("getPlanCategoryStats", () => {
    it("should calculate correct statistics", () => {
      const stats = getPlanCategoryStats(mockPlans);

      expect(stats.monthly.count).toBe(2);
      expect(stats.monthly.percentage).toBe(33); // 2/6 = 33%

      expect(stats.extended.count).toBe(4);
      expect(stats.extended.percentage).toBe(67); // 4/6 = 67%
    });

    it("should handle empty array", () => {
      const stats = getPlanCategoryStats([]);

      expect(stats.monthly.count).toBe(0);
      expect(stats.monthly.percentage).toBe(0);

      expect(stats.extended.count).toBe(0);
      expect(stats.extended.percentage).toBe(0);
    });

    it("should handle single category", () => {
      const monthlyOnlyPlans = mockPlans.filter((p) => p.durationInMonths <= 1);
      const stats = getPlanCategoryStats(monthlyOnlyPlans);

      expect(stats.monthly.count).toBe(2);
      expect(stats.monthly.percentage).toBe(100);

      expect(stats.extended.count).toBe(0);
      expect(stats.extended.percentage).toBe(0);
    });
  });

  describe("PLAN_CATEGORIES constant", () => {
    it("should have correct structure", () => {
      expect(PLAN_CATEGORIES).toHaveLength(2);

      const monthlyCategory = PLAN_CATEGORIES.find((c) => c.key === "monthly");
      const extendedCategory = PLAN_CATEGORIES.find(
        (c) => c.key === "extended"
      );

      expect(monthlyCategory).toBeDefined();
      expect(extendedCategory).toBeDefined();

      expect(monthlyCategory?.durations).toEqual([0.5, 1]);
      expect(extendedCategory?.durations).toEqual([3, 6, 12]);
    });

    it("should have Spanish labels", () => {
      const monthlyCategory = PLAN_CATEGORIES.find((c) => c.key === "monthly");
      const extendedCategory = PLAN_CATEGORIES.find(
        (c) => c.key === "extended"
      );

      expect(monthlyCategory?.label).toBe("Planes Mensuales");
      expect(extendedCategory?.label).toBe("Planes Extendidos");
    });
  });
});
