"use client";

import { Button } from "@/components/ui/button";
import { Banknote, Building2, CreditCard, Check } from "lucide-react";

interface PaymentMethodStepProps {
  paymentMethod: string;
  onPaymentMethodSelect: (method: string) => void;
  onContinue: () => void;
  isLoading: boolean;
}

const PAYMENT_METHODS = [
  {
    id: "cash",
    name: "Contado",
    icon: Banknote,
    description: "Pago único al contado",
    color: "bg-green-500",
  },
  {
    id: "transfer",
    name: "Transferencia",
    icon: Building2,
    description: "Transferencia bancaria",
    color: "bg-blue-500",
  },
  {
    id: "credit",
    name: "Crédito",
    icon: CreditCard,
    description: "Tarjeta de crédito",
    color: "bg-purple-500",
  },
  {
    id: "debit",
    name: "Débito",
    icon: CreditCard,
    description: "Tarjeta de débito",
    color: "bg-orange-500",
  },
];

export function PaymentMethodStep({
  paymentMethod,
  onPaymentMethodSelect,
  onContinue,
  isLoading,
}: PaymentMethodStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Forma de pago</h2>
        <p className="text-gray-400">
          Puedes pagar de forma online (Transferencia) o presencial (debito,
          credito o al contado).
        </p>
      </div>

      {/* Payment Methods Grid */}
      <div className="space-y-4">
        {PAYMENT_METHODS.map((method) => {
          const IconComponent = method.icon;
          return (
            <div
              key={method.id}
              onClick={() => onPaymentMethodSelect(method.id)}
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                paymentMethod === method.id
                  ? "border-green-800 bg-green-950 border-2"
                  : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
              }`}
            >
              {paymentMethod === method.id && (
                <div className="absolute top-6 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 ${method.color} rounded-full flex items-center justify-center`}
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {method.name}
                  </h3>
                  <p className="text-sm text-gray-400">{method.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue Button */}
      <Button
        onClick={onContinue}
        disabled={!paymentMethod || isLoading}
        className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
      >
        {isLoading ? "Procesando..." : "Continuar"}
      </Button>
    </div>
  );
}
