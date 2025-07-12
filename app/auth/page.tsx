"use client";

import { useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import { EmailStep } from "./_components/email-step";
import { CodeStep } from "./_components/code-step";
import { UserFormStep } from "./_components/user-form-step";
import { PlanSelectionStep } from "./_components/plan-selection-step";
import { PaymentMethodStep } from "./_components/payment-method-step";
import { ConfirmationStep } from "./_components/confirmation-step";
import { useAuthReducer } from "./_hooks/use-auth-reducer";

export default function AuthCompletePage() {
  const router = useRouter();
  const { addUser, users } = useBlackSheepStore();
  const { toast } = useToast();

  // Reducer personalizado
  const {
    state,
    setStep,
    setUserExists,
    updateFormData,
    setLoading,
    setError,
    resetState,
    nextStep,
    prevStep,
    totalSteps,
    progressPercentage,
    isLastStep,
    isFirstStep,
    canContinue,
  } = useAuthReducer();

  const { currentStep, userExists, formData, isLoading, error } = state;

  // Persistencia en localStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("authFormData");
      const savedStep = localStorage.getItem("authCurrentStep");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        Object.entries(parsedData).forEach(([key, value]) => {
          updateFormData(key, value as string);
        });
      }
      if (savedStep) {
        const stepNum = parseInt(savedStep, 10);
        if (!isNaN(stepNum) && stepNum > 0) setStep(stepNum);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [setStep, updateFormData]);

  useEffect(() => {
    try {
      localStorage.setItem("authFormData", JSON.stringify(formData));
      localStorage.setItem("authCurrentStep", String(currentStep));
    } catch {
      // Ignore localStorage errors
    }
  }, [formData, currentStep]);

  const clearAuthStorage = () => {
    try {
      localStorage.removeItem("authFormData");
      localStorage.removeItem("authCurrentStep");
    } catch {
      // Ignore localStorage errors
    }
  };

  // Chequear si el usuario existe
  const checkUserExists = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const found = users.find((user) => user.email === email);
      setUserExists(!!found);
      setStep(2);
    } catch {
      setError("Error al verificar el usuario");
      setUserExists(false);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // Continuar con el flujo
  const handleContinue = async () => {
    if (!canContinue()) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (currentStep === 1) {
        await checkUserExists(formData.email);
      } else if (currentStep === 2 && userExists) {
        clearAuthStorage();
        resetState();
        router.push("/app");
      } else if (currentStep < totalSteps) {
        nextStep();
      } else {
        const newUser = {
          id: `usr_${formData.firstName.toLowerCase()}_${Date.now()}`,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          membership: {
            id: `mem_${formData.firstName.toLowerCase()}_${Date.now()}`,
            organizationId: "org_fitcenter_001",
            organizationName: "BlackSheep CrossFit",
            status: "pending" as const, // CRÍTICO: Los nuevos usuarios deben estar pendientes de aprobación
            membershipType: "Básico",
            planId: formData.selectedPlan,
            monthlyPrice: 35000,
            currentPeriodStart: new Date().toISOString().split("T")[0],
            currentPeriodEnd: new Date(
              new Date().setMonth(new Date().getMonth() + 1)
            )
              .toISOString()
              .split("T")[0],
            planConfiguration: {
              maxClassesPerMonth: 8,
              maxBookingsPerDay: 2,
              cancellationHours: 2,
            },
            centerStats: {
              currentMonth: {
                classesContracted: 8,
                classesAttended: 0,
                classesCancelled: 0,
              },
              totalClasses: 0,
              totalHours: 0,
            },
            centerConfig: {
              timezone: "America/Santiago",
              currency: "CLP",
              language: "es",
            },
          },
        };
        addUser(newUser);
        toast({
          title: "¡Cuenta creada exitosamente!",
          description: "Bienvenido a BlackSheep CrossFit",
        });
        clearAuthStorage();
        resetState();
        router.push("/app");
      }
    } catch {
      setError("Error inesperado. Por favor intenta nuevamente.");
      toast({
        title: "Error",
        description: "Error inesperado. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Navegación
  const handleBackClick = () => {
    if (isFirstStep) {
      clearAuthStorage();
      resetState();
      router.push("/");
    } else if (!isLastStep) {
      prevStep();
    }
  };

  // Renderizar el paso actual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <EmailStep
            email={formData.email}
            onEmailChange={(email) => updateFormData("email", email)}
            onContinue={handleContinue}
            isLoading={isLoading}
          />
        );
      case 2:
        if (userExists) {
          return (
            <CodeStep
              email={formData.email}
              code={formData.code}
              onCodeChange={(code) => updateFormData("code", code)}
              onContinue={handleContinue}
              isLoading={isLoading}
            />
          );
        } else {
          return (
            <UserFormStep
              formData={{
                firstName: formData.firstName,
                lastName: formData.lastName,
                gender: formData.gender,
                phone: formData.phone,
              }}
              onFormDataChange={updateFormData}
              onContinue={handleContinue}
              isLoading={isLoading}
            />
          );
        }
      case 3:
        return (
          <PlanSelectionStep
            selectedPlan={formData.selectedPlan}
            onPlanSelect={(planId) => updateFormData("selectedPlan", planId)}
            onContinue={handleContinue}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <PaymentMethodStep
            paymentMethod={formData.paymentMethod}
            onPaymentMethodSelect={(method) =>
              updateFormData("paymentMethod", method)
            }
            onContinue={handleContinue}
            isLoading={isLoading}
          />
        );
      case 5:
        return (
          <ConfirmationStep
            formData={formData}
            onContinue={handleContinue}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg mt-8">
        <div className="flex items-center mb-4">
          <button
            onClick={handleBackClick}
            className="mr-2 p-2 rounded-full hover:bg-gray-100"
            disabled={isFirstStep}
            aria-label="Atrás"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Progress value={progressPercentage} className="flex-1" />
        </div>
        {error && (
          <div className="mb-4 text-red-600 text-sm font-medium">{error}</div>
        )}
        {renderCurrentStep()}
      </div>
    </div>
  );
}
