"use client";

import React from "react";
import type { FitCenterUserProfile } from "@/lib/types";
import { AddStudentModal } from "./add-student-modal";
import { initialMembershipPlans } from "@/lib/mock-data";

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
  if (!student) return null;

  return (
    <AddStudentModal
      onEditStudent={(id, updates) => {
        onEdit({ ...student, ...updates, id });
        onClose();
      }}
      plans={initialMembershipPlans}
      onClose={onClose}
      initialStudent={student}
      onAddStudent={() => {}}
    />
  );
}
