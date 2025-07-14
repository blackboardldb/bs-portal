// src/components/UserProfile.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
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
import type { FitCenterUserProfile, MembershipStatus } from "@/lib/types";
import { SkeletonUserProfile } from "@/components/ui/skeleton";
import {
  MEMBERSHIP_STATUS_LABELS,
  MEMBERSHIP_STATUS_COLORS,
} from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function UserProfile() {
  const { users, fetchUsers, updateUser } = useBlackSheepStore();

  // Cargar datos y seleccionar usuario de forma segura
  useEffect(() => {
    if (users.length === 0) {
      fetchUsers();
    }
  }, [users, fetchUsers]);

  const currentUser = useMemo(
    () => users.find((user) => user.id === "usr_antonia_abc123"),
    [users]
  );

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

  // Sincronizar el estado del formulario cuando currentUser (desde el store) cambia
  useEffect(() => {
    if (currentUser) {
      setUserData(currentUser);
      setEditableFirstName(currentUser.firstName);
      setEditableLastName(currentUser.lastName);
      setEditableEmail(currentUser.email);
      setEditablePhone(currentUser.phone || "");
      setEditableGender(currentUser.gender || "");
      setEditableDateOfBirth(currentUser.dateOfBirth || "");
      setEditableEmergencyContact(currentUser.emergencyContact || "");
    }
  }, [currentUser]);

  // Save function for Name
  const saveNameInfo = () => {
    if (userData) {
      const updatedUser = {
        ...userData,
        firstName: editableFirstName,
        lastName: editableLastName,
      };
      setUserData(updatedUser);
      updateUser(updatedUser);
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
      updateUser(updatedUser);
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
      updateUser(updatedUser);
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
      updateUser(updatedUser);
      setExpandedSection(null);
    }
  };

  // Helper for formatting join date from memberSince (ISO 8601 to readable string)
  const formatMemberSince = (isoDateString: string) => {
    return format(new Date(isoDateString), "MMMM yyyy", { locale: es });
  };

  // Helper for formatting date of birth (ISO 8601 to readable string)
  const formatDateOfBirth = (isoDateString?: string) => {
    if (!isoDateString) return "No especificado";
    return format(new Date(isoDateString), "d 'de' MMMM yyyy", { locale: es });
  };

  // Mostrar un esqueleto de carga mientras se obtienen los datos
  if (!currentUser || !userData) {
    return <SkeletonUserProfile />;
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

        {/* Membership Plan Section */}
        <div className="bg-white/5 rounded-lg p-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Mi Plan</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Plan:</span>
                <span className="font-medium text-white">
                  {userData.membership.membershipType}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Estado:</span>
                <span
                  className="font-semibold"
                  style={{
                    color:
                      MEMBERSHIP_STATUS_COLORS[userData.membership.status] ||
                      "#fff",
                  }}
                >
                  {MEMBERSHIP_STATUS_LABELS[userData.membership.status] ||
                    "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Periodo:</span>
                <span className="text-white">
                  {format(
                    new Date(userData.membership.currentPeriodStart),
                    "dd/MM/yy",
                    { locale: es }
                  )}{" "}
                  -{" "}
                  {format(
                    new Date(userData.membership.currentPeriodEnd),
                    "dd/MM/yy",
                    { locale: es }
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Clases del plan:</span>
                <span className="text-white">
                  {userData.membership.planConfig.classLimit === 0
                    ? "Ilimitadas"
                    : `${userData.membership.planConfig.classLimit} al mes`}
                </span>
              </div>
            </div>
          </div>
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
