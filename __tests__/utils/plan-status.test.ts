import {
  getPlanStatus,
  canUserRegisterForClasses,
  getPlanExpirationReason,
  doesPlanNeedRenewal,
  getDaysUntilPlanExpiration,
} from "@/lib/utils";

// Mock user data for testing
const createMockUser = (overrides: any = {}) => ({
  id: "test-user-1",
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  phone: "+56912345678",
  membership: {
    id: "mem-test-1",
    organizationId: "org-test-1",
    organizationName: "Test Gym",
    status: "active",
    membershipType: "Premium",
    planId: "plan-premium-1",
    monthlyPrice: 35000,
    startDate: "2025-01-01",
    currentPeriodStart: "2025-01-01",
    currentPeriodEnd: "2025-01-31",
    planConfig: {
      classLimit: 12,
      disciplineAccess: "all" as const,
      allowedDisciplines: [],
      canFreeze: true,
      freezeDurationDays: 30,
      autoRenews: false,
    },
    centerStats: {
      currentMonth: {
        classesAttended: 5,
        classesContracted: 12,
        remainingClasses: 7,
        noShows: 0,
        lastMinuteCancellations: 0,
      },
      totalMonthsActive: 3,
      memberSince: "2024-10-01",
      lifetimeStats: {
        totalClasses: 35,
        totalNoShows: 2,
        averageMonthlyAttendance: 11.7,
        bestMonth: {
          month: "December",
          year: 2024,
          count: 15,
        },
      },
    },
    centerConfig: {
      allowCancellation: true,
      cancellationHours: 6,
      maxBookingsPerDay: 3,
      autoWaitlist: true,
    },
    ...overrides,
  },
});

describe("Plan Status Logic", () => {
  // Mock current date for consistent testing
  const mockCurrentDate = new Date("2025-01-16T10:00:00Z");

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe("getPlanStatus", () => {
    it("should return 'expired' for user without membership", () => {
      const user = { id: "test", firstName: "Test" };
      expect(getPlanStatus(user)).toBe("expired");
    });

    it("should return 'pending' when user has pending renewal", () => {
      const user = createMockUser({
        pendingRenewal: {
          id: "renewal-1",
          requestedPlanId: "plan-premium-1",
          requestedPaymentMethod: "contado",
          requestDate: "2025-01-15T10:00:00Z",
          status: "pending",
          requestedBy: "test-user-1",
        },
      });
      expect(getPlanStatus(user)).toBe("pending");
    });

    it("should return 'pending' when membership status is pending", () => {
      const user = createMockUser({
        status: "pending",
      });
      expect(getPlanStatus(user)).toBe("pending");
    });

    it("should return 'expired' when plan end date has passed", () => {
      const user = createMockUser({
        currentPeriodEnd: "2025-01-15", // Past date
      });
      expect(getPlanStatus(user)).toBe("expired");
    });

    it("should return 'expired' when no classes remaining", () => {
      const user = createMockUser({
        currentPeriodEnd: "2025-01-31", // Future date
        centerStats: {
          currentMonth: {
            classesAttended: 12,
            classesContracted: 12,
            remainingClasses: 0, // No classes left
            noShows: 0,
            lastMinuteCancellations: 0,
          },
        },
      });
      expect(getPlanStatus(user)).toBe("expired");
    });

    it("should return 'active' for valid active plan", () => {
      const user = createMockUser({
        currentPeriodEnd: "2025-01-31", // Future date
        centerStats: {
          currentMonth: {
            classesAttended: 5,
            classesContracted: 12,
            remainingClasses: 7, // Classes available
            noShows: 0,
            lastMinuteCancellations: 0,
          },
        },
      });
      expect(getPlanStatus(user)).toBe("active");
    });

    it("should handle invalid end date gracefully", () => {
      const user = createMockUser({
        currentPeriodEnd: "invalid-date",
      });
      expect(getPlanStatus(user)).toBe("expired");
    });
  });

  describe("canUserRegisterForClasses", () => {
    it("should return true for active plan", () => {
      const user = createMockUser();
      expect(canUserRegisterForClasses(user)).toBe(true);
    });

    it("should return false for expired plan", () => {
      const user = createMockUser({
        currentPeriodEnd: "2025-01-15", // Past date
      });
      expect(canUserRegisterForClasses(user)).toBe(false);
    });

    it("should return false for pending plan", () => {
      const user = createMockUser({
        pendingRenewal: {
          status: "pending",
          requestDate: "2025-01-15T10:00:00Z",
        },
      });
      expect(canUserRegisterForClasses(user)).toBe(false);
    });

    it("should return false for user without membership", () => {
      const user = { id: "test", firstName: "Test" };
      expect(canUserRegisterForClasses(user)).toBe(false);
    });
  });

  describe("getPlanExpirationReason", () => {
    it("should return null for active plan", () => {
      const user = createMockUser();
      expect(getPlanExpirationReason(user)).toBeNull();
    });

    it("should return 'Sin membresía' for user without membership", () => {
      const user = { id: "test", firstName: "Test" };
      expect(getPlanExpirationReason(user)).toBe("Sin membresía");
    });

    it("should return date expiration reason", () => {
      const user = createMockUser({
        currentPeriodEnd: "2025-01-15", // Past date
        centerStats: {
          currentMonth: {
            remainingClasses: 5, // Still has classes
          },
        },
      });
      expect(getPlanExpirationReason(user)).toBe("Plan expirado por fecha");
    });

    it("should return classes exhausted reason", () => {
      const user = createMockUser({
        currentPeriodEnd: "2025-01-31", // Future date
        centerStats: {
          currentMonth: {
            remainingClasses: 0, // No classes left
          },
        },
      });
      expect(getPlanExpirationReason(user)).toBe("Sin clases disponibles");
    });

    it("should return null for pending plan", () => {
      const user = createMockUser({
        pendingRenewal: {
          status: "pending",
        },
      });
      expect(getPlanExpirationReason(user)).toBeNull();
    });
  });

  describe("doesPlanNeedRenewal", () => {
    it("should return true for expired plan", () => {
      const user = createMockUser({
        currentPeriodEnd: "2025-01-15", // Past date
      });
      expect(doesPlanNeedRenewal(user)).toBe(true);
    });

    it("should return false for active plan", () => {
      const user = createMockUser();
      expect(doesPlanNeedRenewal(user)).toBe(false);
    });

    it("should return false for pending plan", () => {
      const user = createMockUser({
        pendingRenewal: {
          status: "pending",
        },
      });
      expect(doesPlanNeedRenewal(user)).toBe(false);
    });
  });

  describe("getDaysUntilPlanExpiration", () => {
    it("should return correct days for future expiration", () => {
      const user = createMockUser({
        currentPeriodEnd: "2025-01-31", // 15 days from mock current date
      });
      expect(getDaysUntilPlanExpiration(user)).toBe(15);
    });

    it("should return negative days for past expiration", () => {
      const user = createMockUser({
        currentPeriodEnd: "2025-01-10", // 6 days before mock current date
      });
      expect(getDaysUntilPlanExpiration(user)).toBe(-6);
    });

    it("should return -1 for user without membership", () => {
      const user = { id: "test", firstName: "Test" };
      expect(getDaysUntilPlanExpiration(user)).toBe(-1);
    });

    it("should return -1 for invalid date", () => {
      const user = createMockUser({
        currentPeriodEnd: "invalid-date",
      });
      expect(getDaysUntilPlanExpiration(user)).toBe(-1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined remainingClasses", () => {
      const user = createMockUser({
        centerStats: {
          currentMonth: {
            classesAttended: 5,
            classesContracted: 12,
            // remainingClasses is undefined
            noShows: 0,
            lastMinuteCancellations: 0,
          },
        },
      });
      expect(getPlanStatus(user)).toBe("expired"); // Should default to 0
    });

    it("should handle null user gracefully", () => {
      expect(getPlanStatus(null)).toBe("expired");
      expect(canUserRegisterForClasses(null)).toBe(false);
      expect(getPlanExpirationReason(null)).toBe("Sin membresía");
    });

    it("should handle user with null membership", () => {
      const user = { id: "test", firstName: "Test", membership: null };
      expect(getPlanStatus(user)).toBe("expired");
      expect(canUserRegisterForClasses(user)).toBe(false);
    });
  });
});
