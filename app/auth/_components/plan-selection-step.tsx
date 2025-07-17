"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { initialMembershipPlans } from "@/lib/mock-data";
import { groupPlansByCategory, getCategoryInfo } from "@/lib/utils";

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

  // Filter only active plans and group by category
  const activePlans = initialMembershipPlans.filter((plan) => plan.isActive);
  const groupedPlans = groupPlansByCategory(activePlans);

  return (
    <div className="space-y-6">
      <p className="text-2xl text-center text-white mb-6">Selecciona tu plan</p>

      <div className="space-y-8">
        {/* Monthly Plans Category */}
        {groupedPlans.monthly.length > 0 && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                {getCategoryInfo("monthly")?.label}
              </h3>
              <p className="text-sm text-zinc-400 mb-4">
                {getCategoryInfo("monthly")?.description}
              </p>
            </div>
            <div className="grid gap-4">
              {groupedPlans.monthly.map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded p-4 flex items-center justify-between cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? "border-green-800 bg-green-950 border-2"
                      : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
                  }`}
                  onClick={() => onPlanSelect(plan.id)}
                >
                  <div>
                    <div className="font-bold text-white">{plan.name}</div>
                    <div className="text-sm text-zinc-400">
                      {plan.description}
                    </div>
                  </div>
                  <div className="text-lg font-bold inline-flex gap-2 text-white">
                    {formatPrice(plan.price)}
                    {selectedPlan === plan.id && (
                      <CheckCircle className="w-6 h-6 text-green-200" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Separator */}
        {groupedPlans.monthly.length > 0 &&
          groupedPlans.extended.length > 0 && (
            <div className="my-6">
              <div className="border-t border-zinc-700"></div>
            </div>
          )}

        {/* Extended Plans Category */}
        {groupedPlans.extended.length > 0 && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                {getCategoryInfo("extended")?.label}
              </h3>
              <p className="text-sm text-zinc-400 mb-4">
                {getCategoryInfo("extended")?.description}
              </p>
            </div>
            <div className="grid gap-4">
              {groupedPlans.extended.map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded p-4 flex items-center justify-between cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? "border-green-800 bg-green-950 border-2"
                      : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
                  }`}
                  onClick={() => onPlanSelect(plan.id)}
                >
                  <div>
                    <div className="font-bold text-white">{plan.name}</div>
                    <div className="text-sm text-zinc-400">
                      {plan.description}
                    </div>
                  </div>
                  <div className="text-lg font-bold inline-flex gap-2 text-white">
                    {formatPrice(plan.price)}
                    {selectedPlan === plan.id && (
                      <CheckCircle className="w-6 h-6 text-green-200" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <Button
        onClick={onContinue}
        disabled={!selectedPlan || isLoading}
        className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 mt-8"
      >
        {isLoading ? "Seleccionando plan..." : "Continuar"}
      </Button>
    </div>
  );
}
