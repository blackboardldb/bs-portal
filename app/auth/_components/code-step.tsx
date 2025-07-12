"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";

interface CodeStepProps {
  email: string;
  code: string;
  onCodeChange: (code: string) => void;
  onContinue: () => void;
  isLoading: boolean;
}

export function CodeStep({
  email,
  code,
  onCodeChange,
  onContinue,
  isLoading,
}: CodeStepProps) {
  const [isValidCode, setIsValidCode] = useState(false);

  const validateCode = (code: string) => {
    return code.length >= 4; // Código mínimo de 4 caracteres
  };

  const handleCodeChange = (value: string) => {
    onCodeChange(value);
    setIsValidCode(validateCode(value));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Ingresa el código.</h2>
        <p className="text-gray-400">
          Enviamos tu codigo de acceso a{" "}
          <span className="text-white">{email}</span>
        </p>
      </div>

      {/* Code Input */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="code" className="text-white">
            Ingresa tu código de acceso
          </Label>
          <Input
            id="code"
            type="text"
            placeholder="123456"
            value={code}
            onChange={(e) =>
              handleCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="mt-2 h-12 bg-gray-800 border-zinc-600 text-white text-center text-xl tracking-widest"
            disabled={isLoading}
            maxLength={6}
          />
        </div>

        <div className="text-center">
          <button className="text-blue-400 hover:text-blue-300 text-sm">
            Reenviar código de acceso
          </button>
        </div>
      </div>

      {/* Continue Button */}
      <Button
        onClick={onContinue}
        disabled={!isValidCode || isLoading}
        className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
      >
        {isLoading ? "Verificando código..." : "Ir a la app"}
      </Button>
    </div>
  );
}
