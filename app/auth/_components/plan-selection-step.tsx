"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { initialMembershipPlans } from "@/lib/mock-data";

interface PlanSelectionStepProps {
  selectedPlan: string;
  onPlanSelect: (planId: string) => void;
  onContinue: () => void;
  isLoading: boolean;
}

export function PlanSelectionStep({
  selectedPlan,
  onPlanSelect,
  onContinue,
  isLoading,
}: PlanSelectionStepProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-4">
      <p className="text-2xl text-center text-white mb-4">Selecciona tu plan</p>

      <div className="grid gap-4">
        {initialMembershipPlans.map((plan) => {
          const price = plan.price;
          return (
            <div
              key={plan.id}
              className={`border rounded p-4 flex items-center justify-between ${
                selectedPlan === plan.id
                  ? "border-green-800 bg-green-950 border-2"
                  : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
              }`}
              onClick={() => onPlanSelect(plan.id)}
            >
              <div>
                <div className="font-bold text-white">{plan.name}</div>
                <div className="text-sm text-zinc-400">{plan.description}</div>
              </div>
              <div className="text-lg font-bold inline-flex gap-2 text-white">
                {formatPrice(price)}
                {selectedPlan === plan.id && (
                  <CheckCircle className="w-6 h-6 text-green-200" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue Button */}
      <Button
        onClick={onContinue}
        disabled={!selectedPlan || isLoading}
        className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
      >
        {isLoading ? "Seleccionando plan..." : "Continuar"}
      </Button>
    </div>
  );
}
