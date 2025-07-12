"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface EmailStepProps {
  email: string;
  onEmailChange: (email: string) => void;
  onContinue: () => void;
  isLoading: boolean;
}

export function EmailStep({
  email,
  onEmailChange,
  onContinue,
  isLoading,
}: EmailStepProps) {
  const [isValidEmail, setIsValidEmail] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    onEmailChange(value);
    setIsValidEmail(validateEmail(value));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto">
          <Search className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Ingresa tu email</h2>
        <p className="text-gray-400">Verificaremos si ya tienes cuenta</p>
      </div>

      {/* Email Input */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-white">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className="mt-2 h-12 bg-gray-800 border-zinc-600 text-white"
            disabled={isLoading}
          />
        </div>

        {/* Tip */}
        <div className="bg-gray-800 p-4 rounded-lg border border-zinc-700">
          <p className="text-sm text-gray-300">
            💡 <strong>Tip:</strong> Prueba con{" "}
            <button
              onClick={() => handleEmailChange("registrado@mail.com")}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              registrado@mail.com
            </button>{" "}
            para ver el flujo de usuario existente
          </p>
        </div>
      </div>

      {/* Continue Button */}
      <Button
        onClick={onContinue}
        disabled={!isValidEmail || isLoading}
        className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
      >
        {isLoading ? "Verificando..." : "Verificar email"}
      </Button>
    </div>
  );
}
