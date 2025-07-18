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
import { OTPVerificationStep } from "./_components/otp-verification-step";
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

  // Enviar OTP (mock)
  const sendOTP = async (email: string) => {
    // Mock: simular envío de OTP
    const mockOTP = "123456"; // En producción, esto sería generado y enviado por email
    console.log(`📧 Mock OTP enviado a ${email}: ${mockOTP}`);

    // Simular delay de envío
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Código enviado",
      description: `Hemos enviado un código de verificación a ${email}`,
    });
  };

  // Verificar OTP (mock)
  const verifyOTP = async (email: string, otp: string) => {
    // Mock: verificar OTP
    const mockOTP = "123456"; // En producción, esto se verificaría contra el servidor

    if (otp === mockOTP) {
      return true;
    } else {
      throw new Error("Código incorrecto. Intenta nuevamente.");
    }
  };

  // Reenviar OTP
  const handleResendOTP = async () => {
    try {
      await sendOTP(formData.email);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo reenviar el código. Intenta nuevamente.",
        variant: "destructive",
      });
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
      } else if (currentStep === 5) {
        // Paso 5 (Confirmación): Enviar OTP y pasar al paso 6
        await sendOTP(formData.email);
        nextStep();
      } else if (currentStep === 6) {
        // Paso 6 (OTP): Verificar OTP y crear usuario
        const isValidOTP = await verifyOTP(formData.email, formData.otp);
        if (!isValidOTP) {
          throw new Error("Código incorrecto. Intenta nuevamente.");
        }

        // OTP verificado, crear usuario
        // Dentro de handleContinue, en el else final:
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
            status: "pending" as const,
            membershipType: "Básico",
            planId: formData.selectedPlan,
            monthlyPrice: 35000,
            startDate: new Date().toISOString().split("T")[0], // <-- Agregado
            currentPeriodStart: new Date().toISOString().split("T")[0],
            currentPeriodEnd: new Date(
              new Date().setMonth(new Date().getMonth() + 1)
            )
              .toISOString()
              .split("T")[0],
            planConfig: {
              classLimit: 8,
              disciplineAccess: "all" as const,
              allowedDisciplines: [], // Inicialmente, acceso a todas (se actualizará al activar membresía)

              canFreeze: true,
              freezeDurationDays: 7,
              autoRenews: true,
            },
            centerStats: {
              currentMonth: {
                classesAttended: 0,
                classesContracted: 8,
                remainingClasses: 8,
                noShows: 0,
                lastMinuteCancellations: 0,
              },
              totalMonthsActive: 0,
              memberSince: new Date().toISOString().split("T")[0],
              lifetimeStats: {
                totalClasses: 0,
                totalNoShows: 0,
                averageMonthlyAttendance: 0,
                bestMonth: { month: "N/A", year: 0, count: 0 },
              },
            },
            centerConfig: {
              allowCancellation: true,
              cancellationHours: 2,
              maxBookingsPerDay: 2,
              autoWaitlist: true,
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
      } else if (currentStep < totalSteps) {
        // Pasos intermedios (2, 3, 4): continuar al siguiente paso
        nextStep();
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
      case 6:
        return (
          <OTPVerificationStep
            email={formData.email}
            otp={formData.otp}
            onOTPChange={(otp) => updateFormData("otp", otp)}
            onContinue={handleContinue}
            onResendOTP={handleResendOTP}
            isLoading={isLoading}
            error={error}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-black">
      <div className="p-4 w-full sticky top-0 z-10 bg-black/10  backdrop-blur-md  px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBackClick}
            className="mr-2 p-2 rounded-full hover:bg-gray-800"
            disabled={isFirstStep}
            aria-label="Atrás"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <span className="text-sm text-gray-400">
            Paso {currentStep} de {totalSteps}
          </span>
        </div>
        <Progress value={progressPercentage} className="flex-1" />
      </div>

      {error && (
        <div className="mb-4 text-red-600 text-sm font-medium">{error}</div>
      )}
      <div className=" max-w-md w-full mx-auto mt-6 pb-6 flex-1">
        {renderCurrentStep()}
      </div>
    </div>
  );
}
