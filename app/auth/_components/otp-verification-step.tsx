"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";

interface OTPVerificationStepProps {
  email: string;
  otp: string;
  onOTPChange: (otp: string) => void;
  onContinue: () => void;
  onResendOTP: () => void;
  isLoading: boolean;
  error?: string;
}

export function OTPVerificationStep({
  email,
  otp,
  onOTPChange,
  onContinue,
  onResendOTP,
  isLoading,
  error,
}: OTPVerificationStepProps) {
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    onResendOTP();
    setTimeout(() => setIsResending(false), 2000);
  };

  const isValidOTP = otp.length === 6 && /^\d{6}$/.test(otp);

  return (
    <div className="space-y-6">
      {/* Header - Mismo diseño que CodeStep */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">
          Verifica tu email para iniciar sesión.
        </h2>
        <p className="text-gray-400">
          Enviamos tu código de verificación a{" "}
          <span className="text-white">{email}</span>
        </p>
      </div>

      {/* OTP Input - Mismo diseño que CodeStep */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="otp" className="text-white">
            Ingresa tu código de verificación
          </Label>
          <Input
            id="otp"
            type="text"
            placeholder="123456"
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              onOTPChange(value);
            }}
            className="mt-2 h-12 bg-gray-800 border-zinc-600 text-white text-center text-xl tracking-widest"
            disabled={isLoading}
            maxLength={6}
            autoComplete="one-time-code"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="text-red-400 text-sm text-center">{error}</div>
        )}

        {/* Resend button - Mismo estilo que CodeStep */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50"
          >
            {isResending
              ? "Reenviando código..."
              : "Reenviar código de verificación"}
          </button>
        </div>
      </div>

      {/* Continue Button - Mismo diseño que CodeStep */}
      <Button
        onClick={onContinue}
        disabled={!isValidOTP || isLoading}
        className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
      >
        {isLoading ? "Verificando código..." : "Crear cuenta"}
      </Button>
    </div>
  );
}
