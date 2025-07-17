import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { getPlanStatus } from "@/lib/utils";
import RenewPlanPage from "@/app/app/renovar-plan/page";
import { HomePage } from "@/components/HomePage";
import { Toaster } from "@/components/ui/toaster";

// Mock Next.js router
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock toast
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock data
const mockUser = {
  id: "usr_test_123",
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  phone: "+56912345678",
  membership: {
    id: "mem-test-1",
    organizationId: "org-test-1",
    organizationName: "Test Gym",
    status: "active" as const,
    membershipType: "Básico",
    planId: "plan-basic-1",
    monthlyPrice: 25000,
    startDate: "2025-01-01",
    currentPeriodStart: "2025-01-01",
    currentPeriodEnd: "2025-01-15", // Expired
    planConfig: {
      classLimit: 8,
      disciplineAccess: "all" as const,
      allowedDisciplines: [],
      canFreeze: true,
      freezeDurationDays: 30,
      autoRenews: false,
    },
    centerStats: {
      currentMonth: {
        classesAttended: 6,
        classesContracted: 8,
        remainingClasses: 2,
        noShows: 0,
        lastMinuteCancellations: 0,
      },
      totalMonthsActive: 2,
      memberSince: "2024-11-01",
      lifetimeStats: {
        totalClasses: 20,
        totalNoShows: 1,
        averageMonthlyAttendance: 7.5,
        bestMonth: {
          month: "December",
          year: 2024,
          count: 8,
        },
      },
    },
    centerConfig: {
      allowCancellation: true,
      cancellationHours: 6,
      maxBookingsPerDay: 3,
      autoWaitlist: true,
    },
  },
};

const mockPlans = [
  {
    id: "plan-basic-1",
    organizationId: "org-test-1",
    name: "Básico",
    description: "Plan básico con 8 clases",
    price: 25000,
    durationInMonths: 1,
    classLimit: 8,
    disciplineAccess: "all" as const,
    allowedDisciplines: [],
    canFreeze: true,
    freezeDurationDays: 30,
    autoRenews: false,
    isActive: true,
  },
  {
    id: "plan-premium-1",
    organizationId: "org-test-1",
    name: "Premium",
    description: "Plan premium con 15 clases",
    price: 35000,
    durationInMonths: 1,
    classLimit: 15,
    disciplineAccess: "all" as const,
    allowedDisciplines: [],
    canFreeze: true,
    freezeDurationDays: 30,
    autoRenews: false,
    isActive: true,
  },
];

// Mock store
const mockStore = {
  users: [mockUser],
  membershipPlans: mockPlans,
  requestPlanRenewal: jest.fn(),
  isLoading: false,
  error: null,
};

jest.mock("@/lib/blacksheep-store", () => ({
  useBlackSheepStore: () => mockStore,
}));

describe("Renewal Workflow Integration Tests", () => {
  const mockCurrentDate = new Date("2025-01-16T10:00:00Z");

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.requestPlanRenewal.mockClear();
  });

  describe("Plan Status Detection", () => {
    it("should detect expired plan correctly", () => {
      const status = getPlanStatus(mockUser);
      expect(status).toBe("expired");
    });

    it("should detect pending plan correctly", () => {
      const userWithPendingRenewal = {
        ...mockUser,
        membership: {
          ...mockUser.membership,
          pendingRenewal: {
            id: "renewal-1",
            requestedPlanId: "plan-premium-1",
            requestedPaymentMethod: "contado" as const,
            requestDate: "2025-01-15T10:00:00Z",
            status: "pending" as const,
            requestedBy: "usr_test_123",
          },
        },
      };

      const status = getPlanStatus(userWithPendingRenewal);
      expect(status).toBe("pending");
    });
  });

  describe("HomePage Component Integration", () => {
    const homePageProps = {
      userProfile: mockUser,
      membershipType: "Básico",
      monthlyPrice: 25000,
      currentMonthStats: mockUser.membership.centerStats.currentMonth,
      progressPercentage: 75,
      formattedPeriodStart: "01 de enero",
      formattedPeriodEnd: "15 de enero",
      registeredClasses: [],
    };

    it("should show renewal button for expired plan", () => {
      render(<HomePage {...homePageProps} />);

      expect(screen.getByText("Renovar")).toBeInTheDocument();
      expect(screen.getByText(/Expiró el/)).toBeInTheDocument();
    });

    it("should show pending status for pending renewal", () => {
      const userWithPending = {
        ...mockUser,
        membership: {
          ...mockUser.membership,
          pendingRenewal: {
            status: "pending" as const,
            requestDate: "2025-01-15T10:00:00Z",
          },
        },
      };

      render(<HomePage {...homePageProps} userProfile={userWithPending} />);

      expect(screen.getByText("Pendiente validación")).toBeInTheDocument();
      expect(
        screen.getByText(/Tu solicitud de renovación está siendo revisada/)
      ).toBeInTheDocument();
    });
  });

  describe("Renewal Page Integration", () => {
    it("should render renewal page with plans and payment methods", () => {
      render(
        <>
          <RenewPlanPage />
          <Toaster />
        </>
      );

      expect(screen.getByText("Renovar Membresía")).toBeInTheDocument();
      expect(screen.getByText("1. Elige tu Plan")).toBeInTheDocument();
      expect(screen.getByText("2. Elige tu Forma de Pago")).toBeInTheDocument();
    });

    it("should show current plan by default", () => {
      render(
        <>
          <RenewPlanPage />
          <Toaster />
        </>
      );

      expect(screen.getByText("Básico")).toBeInTheDocument();
      expect(screen.getByText("$25.000 / mes")).toBeInTheDocument();
    });

    it("should allow plan selection", async () => {
      render(
        <>
          <RenewPlanPage />
          <Toaster />
        </>
      );

      // Click "Cambiar plan" button
      const changeButton = screen.getByText("Cambiar plan");
      fireEvent.click(changeButton);

      // Should show plan options
      await waitFor(() => {
        expect(screen.getByText("Premium")).toBeInTheDocument();
        expect(
          screen.getByText("Plan premium con 15 clases")
        ).toBeInTheDocument();
      });
    });

    it("should show payment method options", () => {
      render(
        <>
          <RenewPlanPage />
          <Toaster />
        </>
      );

      expect(screen.getByText("Contado")).toBeInTheDocument();
      expect(screen.getByText("Transferencia")).toBeInTheDocument();
      expect(screen.getByText("Débito")).toBeInTheDocument();
      expect(screen.getByText("Crédito")).toBeInTheDocument();
    });

    it("should disable submit button when no payment method selected", () => {
      render(
        <>
          <RenewPlanPage />
          <Toaster />
        </>
      );

      const submitButton = screen.getByText("Solicitar Renovación");
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when plan and payment method selected", async () => {
      render(
        <>
          <RenewPlanPage />
          <Toaster />
        </>
      );

      // Select payment method
      const contadoOption = screen.getByLabelText("Contado");
      fireEvent.click(contadoOption);

      await waitFor(() => {
        const submitButton = screen.getByText("Solicitar Renovación");
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("Complete Renewal Workflow", () => {
    it("should complete full renewal process", async () => {
      mockStore.requestPlanRenewal.mockResolvedValue(undefined);

      render(
        <>
          <RenewPlanPage />
          <Toaster />
        </>
      );

      // Select payment method
      const contadoOption = screen.getByLabelText("Contado");
      fireEvent.click(contadoOption);

      // Submit renewal
      const submitButton = screen.getByText("Solicitar Renovación");
      fireEvent.click(submitButton);

      // Should call requestPlanRenewal
      await waitFor(() => {
        expect(mockStore.requestPlanRenewal).toHaveBeenCalledWith(
          "usr_test_123",
          "plan-basic-1",
          "contado"
        );
      });

      // Should redirect to app
      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith("/app");
        },
        { timeout: 2000 }
      );
    });

    it("should handle renewal errors gracefully", async () => {
      const errorMessage = "Network error";
      mockStore.requestPlanRenewal.mockRejectedValue(new Error(errorMessage));

      render(
        <>
          <RenewPlanPage />
          <Toaster />
        </>
      );

      // Select payment method
      const contadoOption = screen.getByLabelText("Contado");
      fireEvent.click(contadoOption);

      // Submit renewal
      const submitButton = screen.getByText("Solicitar Renovación");
      fireEvent.click(submitButton);

      // Should handle error
      await waitFor(() => {
        expect(mockStore.requestPlanRenewal).toHaveBeenCalled();
      });

      // Should not redirect on error
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should validate required fields before submission", async () => {
      render(
        <>
          <RenewPlanPage />
          <Toaster />
        </>
      );

      // Try to submit without selecting payment method
      const submitButton = screen.getByText("Solicitar Renovación");
      expect(submitButton).toBeDisabled();

      // Should not call requestPlanRenewal
      expect(mockStore.requestPlanRenewal).not.toHaveBeenCalled();
    });
  });

  describe("State Transitions", () => {
    it("should transition from expired to pending after renewal", async () => {
      // Initial state: expired
      expect(getPlanStatus(mockUser)).toBe("expired");

      // Mock successful renewal
      mockStore.requestPlanRenewal.mockImplementation(
        async (userId, planId, paymentMethod) => {
          // Simulate store update
          const renewalRequest = {
            id: "renewal-123",
            requestedPlanId: planId,
            requestedPaymentMethod: paymentMethod,
            requestDate: new Date().toISOString(),
            status: "pending" as const,
            requestedBy: userId,
          };

          // Update mock user
          mockUser.membership.pendingRenewal = renewalRequest;
        }
      );

      render(
        <>
          <RenewPlanPage />
          <Toaster />
        </>
      );

      // Complete renewal process
      const contadoOption = screen.getByLabelText("Contado");
      fireEvent.click(contadoOption);

      const submitButton = screen.getByText("Solicitar Renovación");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockStore.requestPlanRenewal).toHaveBeenCalled();
      });

      // After renewal, status should be pending
      expect(getPlanStatus(mockUser)).toBe("pending");
    });
  });

  describe("Error Scenarios", () => {
    it("should handle missing user gracefully", () => {
      const storeWithoutUser = {
        ...mockStore,
        users: [],
      };

      jest.mocked(useBlackSheepStore).mockReturnValue(storeWithoutUser);

      render(
        <>
          <RenewPlanPage />
          <Toaster />
        </>
      );

      // Should still render but with disabled state
      const submitButton = screen.getByText("Solicitar Renovación");
      expect(submitButton).toBeDisabled();
    });

    it("should handle missing plans gracefully", () => {
      const storeWithoutPlans = {
        ...mockStore,
        membershipPlans: [],
      };

      jest.mocked(useBlackSheepStore).mockReturnValue(storeWithoutPlans);

      render(
        <>
          <RenewPlanPage />
          <Toaster />
        </>
      );

      // Should render but show no plans available
      expect(screen.getByText("Renovar Membresía")).toBeInTheDocument();
    });

    it("should handle store loading state", () => {
      const loadingStore = {
        ...mockStore,
        isLoading: true,
      };

      jest.mocked(useBlackSheepStore).mockReturnValue(loadingStore);

      render(
        <>
          <RenewPlanPage />
          <Toaster />
        </>
      );

      // Submit button should show loading state
      const submitButton = screen.getByText("Solicitar Renovación");
      expect(submitButton).toBeDisabled();
    });
  });
});
