"use client";

import React from "react";
import type { FitCenterUserProfile } from "@/lib/types";
import { AddStudentModal } from "./add-student-modal";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudentEditModalProps {
  student: FitCenterUserProfile | null;
  onEdit: (student: FitCenterUserProfile) => void;
  onClose: () => void;
}

export function StudentEditModal({
  student,
  onEdit,
  onClose,
}: StudentEditModalProps) {
  const { membershipPlans, approveRenewal, rejectRenewal } =
    useBlackSheepStore();

  if (!student) return null;

  const pendingRenewal = student.membership?.pendingRenewal;
  const requestedPlan = pendingRenewal
    ? membershipPlans.find((p) => p.id === pendingRenewal.requestedPlanId)
    : null;

  const handleApproveRenewal = async () => {
    try {
      await approveRenewal(student.id);
      onClose();
    } catch (error) {
      console.error("Error approving renewal:", error);
    }
  };

  const handleRejectRenewal = async () => {
    try {
      await rejectRenewal(student.id);
      onClose();
    } catch (error) {
      console.error("Error rejecting renewal:", error);
    }
  };

  return (
    <div>
      {/* Modal de edición estándar */}
      <AddStudentModal
        onEditStudent={(id, updates) => {
          onEdit({ ...student, ...updates, id });
          onClose();
        }}
        plans={membershipPlans}
        onClose={onClose}
        initialStudent={student}
        onAddStudent={() => {}}
      />
      {/* Si hay renovación pendiente, mostrar sección especial */}
      {pendingRenewal && (
        <Card className="mt-4 border-yellow-400 border-2">
          <CardHeader>
            <CardTitle>
              <Badge className="bg-yellow-400 text-black mr-2">
                Renovación Pendiente
              </Badge>
              Solicitud de Renovación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <span className="font-semibold">Plan solicitado: </span>
              {requestedPlan
                ? requestedPlan.name
                : pendingRenewal.requestedPlanId}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Método de pago: </span>
              {pendingRenewal.requestedPaymentMethod}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Fecha de solicitud: </span>
              {new Date(pendingRenewal.requestDate).toLocaleString()}
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApproveRenewal}
              >
                Aprobar
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleRejectRenewal}
              >
                Rechazar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
