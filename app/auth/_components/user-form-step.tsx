"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFormStepProps {
  formData: {
    firstName: string;
    lastName: string;
    gender: string;
    phone: string;
  };
  onFormDataChange: (field: string, value: string) => void;
  onContinue: () => void;
  isLoading: boolean;
}

export function UserFormStep({
  formData,
  onFormDataChange,
  onContinue,
  isLoading,
}: UserFormStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "El nombre es requerido";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "El apellido es requerido";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Ingresa un número de teléfono válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      onContinue();
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    onFormDataChange(field, value);
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const isFormValid =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.phone.trim() &&
    Object.keys(errors).length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Usuario nuevo</h2>
        <p className="text-gray-400">Completa tus datos para continuar</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="text-white">
              Nombre
            </Label>
            <Input
              id="firstName"
              placeholder="Juan"
              value={formData.firstName}
              onChange={(e) => handleFieldChange("firstName", e.target.value)}
              className="mt-2 h-12 bg-gray-800 border-zinc-600 text-white"
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-white">
              Apellidos
            </Label>
            <Input
              id="lastName"
              placeholder="Pérez"
              value={formData.lastName}
              onChange={(e) => handleFieldChange("lastName", e.target.value)}
              className="mt-2 h-12 bg-gray-800 border-zinc-600 text-white"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <Label className="text-white">Sexo</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => handleFieldChange("gender", value)}
            disabled={isLoading}
          >
            <SelectTrigger className="mt-2 h-12 bg-gray-800 border-zinc-600 text-white">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="femenino">Femenino</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="phone" className="text-white">
            Teléfono
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+56 9 1234 5678"
            value={formData.phone}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
            className="mt-2 h-12 bg-gray-800 border-zinc-600 text-white"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!isFormValid || isLoading}
        className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
      >
        {isLoading ? "Continuando..." : "Continuar"}
      </Button>
    </div>
  );
}
