// src/components/UserProfile.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit3, BarChart3, ChevronRight } from "lucide-react";
import { StatsDrawer } from "./stats-drawer";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import type { FitCenterUserProfile } from "@/lib/types";

export function UserProfile() {
  const { users, updateUser } = useBlackSheepStore();
  // Get the current user (Antonia for demo)
  const currentUser =
    users.find((user) => user.id === "usr_antonia_abc123") || users[0];
  const [userData, setUserData] = useState<FitCenterUserProfile | null>(
    currentUser || null
  );

  // States for editable fields from FitCenterUserProfile
  const [editableFirstName, setEditableFirstName] = useState(
    userData?.firstName || ""
  );
  const [editableLastName, setEditableLastName] = useState(
    userData?.lastName || ""
  );
  const [editableEmail, setEditableEmail] = useState(userData?.email || "");
  const [editablePhone, setEditablePhone] = useState(userData?.phone || "");
  const [editableGender, setEditableGender] = useState(userData?.gender || "");
  const [editableDateOfBirth, setEditableDateOfBirth] = useState(
    userData?.dateOfBirth || ""
  );
  const [editableEmergencyContact, setEditableEmergencyContact] = useState(
    userData?.emergencyContact || ""
  );

  // State for expanded section for editing
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // States for drawer of statistics
  const [isStatsDrawerOpen, setIsStatsDrawerOpen] = useState(false);

  // Update local state when userData changes
  useState(() => {
    if (userData) {
      setEditableFirstName(userData.firstName);
      setEditableLastName(userData.lastName);
      setEditableEmail(userData.email);
      setEditablePhone(userData.phone);
      setEditableGender(userData.gender || "");
      setEditableDateOfBirth(userData.dateOfBirth || "");
      setEditableEmergencyContact(userData.emergencyContact || "");
    }
  });

  // Save function for Name
  const saveNameInfo = () => {
    if (userData) {
      const updatedUser = {
        ...userData,
        firstName: editableFirstName,
        lastName: editableLastName,
      };
      setUserData(updatedUser);
      updateUser(userData.id, updatedUser);
      setExpandedSection(null);
    }
  };

  // Save function for Contact Info
  const saveContactInfo = () => {
    if (userData) {
      const updatedUser = {
        ...userData,
        email: editableEmail,
        phone: editablePhone,
      };
      setUserData(updatedUser);
      updateUser(userData.id, updatedUser);
      setExpandedSection(null);
    }
  };

  // Save function for Personal Info
  const savePersonalInfo = () => {
    if (userData) {
      const updatedUser = {
        ...userData,
        gender: editableGender,
        dateOfBirth: editableDateOfBirth,
      };
      setUserData(updatedUser);
      updateUser(userData.id, updatedUser);
      setExpandedSection(null);
    }
  };

  // Save function for Emergency Contact
  const saveEmergencyContactInfo = () => {
    if (userData) {
      const updatedUser = {
        ...userData,
        emergencyContact: editableEmergencyContact,
      };
      setUserData(updatedUser);
      updateUser(userData.id, updatedUser);
      setExpandedSection(null);
    }
  };

  // Helper for formatting join date from memberSince (ISO 8601 to readable string)
  const formatMemberSince = (isoDateString: string) => {
    return new Date(isoDateString).toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
  };

  // Helper for formatting date of birth (ISO 8601 to readable string)
  const formatDateOfBirth = (isoDateString?: string) => {
    if (!isoDateString) return "No especificado";
    return new Date(isoDateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">No hay usuario activo</h1>
          <p>Por favor, contacta al administrador.</p>
        </div>
      </div>
    );
  }

  // Calculate estimated total hours from total classes (assuming 1 hour per class)
  const estimatedTotalHours =
    userData.membership.centerStats.lifetimeStats.totalClasses;

  return (
    <div className="min-h-screen">
      <div className="py-6 space-y-6 mx-auto">
        {/* Profile picture and stats header */}
        <div className="overflow-hidden">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage
                  src={`/avatars/${userData.avatarId}.png`}
                  alt={`${userData.firstName} ${userData.lastName}`}
                />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {userData.firstName[0]}
                  {userData.lastName[0]}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-white">
                {userData.firstName} {userData.lastName}
              </h2>
              <p className="text-zinc-400">
                Miembro desde{" "}
                {formatMemberSince(userData.membership.centerStats.memberSince)}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 w-full mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {userData.membership.centerStats.lifetimeStats.totalClasses}
                </div>
                <div className="text-xs text-zinc-400">Clases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {userData.membership.centerStats.currentMonth.classesAttended}
                </div>
                <div className="text-xs text-zinc-400">Racha (este mes)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {estimatedTotalHours}h
                </div>
                <div className="text-xs text-zinc-400">Horas</div>
              </div>
            </div>
          </div>
        </div>

        {/* My Stats - Drawer */}
        <div
          className="p-4 bg-zinc-800 cursor-pointer transition-colors flex items-center justify-between rounded-lg"
          onClick={() => setIsStatsDrawerOpen(true)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-white">Mis Estadísticas</div>
              <div className="text-sm text-zinc-400">
                Ver estadísticas detalladas
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white" />
        </div>

        {/* Profile Sections */}
        <div className="space-y-4">
          {/* Name Section */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Nombre</h3>
                <p className="text-zinc-400">
                  {userData.firstName} {userData.lastName}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setExpandedSection(expandedSection === "name" ? null : "name")
                }
                className="text-white hover:bg-white/10"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>

            {expandedSection === "name" && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-white">
                      Nombre
                    </Label>
                    <Input
                      id="firstName"
                      value={editableFirstName}
                      onChange={(e) => setEditableFirstName(e.target.value)}
                      className="mt-1 bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-white">
                      Apellido
                    </Label>
                    <Input
                      id="lastName"
                      value={editableLastName}
                      onChange={(e) => setEditableLastName(e.target.value)}
                      className="mt-1 bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={saveNameInfo}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setExpandedSection(null)}
                    className="border-zinc-600 text-white hover:bg-zinc-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Contact Info Section */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Información de Contacto
                </h3>
                <p className="text-zinc-400">{userData.email}</p>
                <p className="text-zinc-400">{userData.phone}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setExpandedSection(
                    expandedSection === "contact" ? null : "contact"
                  )
                }
                className="text-white hover:bg-white/10"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>

            {expandedSection === "contact" && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={editableEmail}
                    onChange={(e) => setEditableEmail(e.target.value)}
                    className="mt-1 bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-white">
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={editablePhone}
                    onChange={(e) => setEditablePhone(e.target.value)}
                    className="mt-1 bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={saveContactInfo}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setExpandedSection(null)}
                    className="border-zinc-600 text-white hover:bg-zinc-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Personal Info Section */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Información Personal
                </h3>
                <p className="text-zinc-400">
                  Género: {userData.gender || "No especificado"}
                </p>
                <p className="text-zinc-400">
                  Fecha de nacimiento: {formatDateOfBirth(userData.dateOfBirth)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setExpandedSection(
                    expandedSection === "personal" ? null : "personal"
                  )
                }
                className="text-white hover:bg-white/10"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>

            {expandedSection === "personal" && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="gender" className="text-white">
                    Género
                  </Label>
                  <Select
                    value={editableGender}
                    onValueChange={setEditableGender}
                  >
                    <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-600 text-white">
                      <SelectValue placeholder="Selecciona tu género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateOfBirth" className="text-white">
                    Fecha de nacimiento
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={editableDateOfBirth}
                    onChange={(e) => setEditableDateOfBirth(e.target.value)}
                    className="mt-1 bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={savePersonalInfo}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setExpandedSection(null)}
                    className="border-zinc-600 text-white hover:bg-zinc-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Emergency Contact Section */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Contacto de Emergencia
                </h3>
                <p className="text-zinc-400">
                  {userData.emergencyContact || "No especificado"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setExpandedSection(
                    expandedSection === "emergency" ? null : "emergency"
                  )
                }
                className="text-white hover:bg-white/10"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>

            {expandedSection === "emergency" && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="emergencyContact" className="text-white">
                    Contacto de emergencia
                  </Label>
                  <Input
                    id="emergencyContact"
                    value={editableEmergencyContact}
                    onChange={(e) =>
                      setEditableEmergencyContact(e.target.value)
                    }
                    className="mt-1 bg-zinc-800 border-zinc-600 text-white"
                    placeholder="Nombre y teléfono"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={saveEmergencyContactInfo}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setExpandedSection(null)}
                    className="border-zinc-600 text-white hover:bg-zinc-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Drawer */}
      <StatsDrawer
        isOpen={isStatsDrawerOpen}
        onClose={() => setIsStatsDrawerOpen(false)}
        userData={userData}
      />
    </div>
  );
}
