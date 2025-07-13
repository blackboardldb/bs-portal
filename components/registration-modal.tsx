// src/components/registration-modal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Clock, User, Clock3, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatTimeLocal } from "@/lib/utils";

interface FormattedClassItem {
  id: string;
  dateTime: string;
  name: string;
  instructor: string;
  duration: string;
  alumnRegistred: string;
  isRegistered: boolean;
  formattedDayLabel: string;
  formattedTime: string;
}

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  classItem: FormattedClassItem | null;
  onConfirm: () => void;
}

export default function RegistrationModal({
  isOpen,
  onClose,
  classItem,
  onConfirm,
}: RegistrationModalProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!classItem || !isOpen) return null;

  const handleConfirm = () => {
    setIsConfirmed(true);
    onConfirm();
    // Cierra el modal y reinicia el estado después de un breve retraso
    setTimeout(() => {
      setIsConfirmed(false);
      onClose();
    }, 10000); // Muestra el mensaje por 10 segundos
  };

  const handleClose = () => {
    setIsConfirmed(false); // Siempre reinicia el estado de confirmación al cerrar
    onClose();
  };

  // Formatear la hora desde classItem.dateTime
  const formattedTime = classItem.dateTime
    ? formatTimeLocal(classItem.dateTime)
    : "Hora no disponible";

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(newOpenState) => {
        // Asegura que handleClose solo se llama al intentar cerrar
        if (!newOpenState) handleClose();
      }}
    >
      <DrawerContent className="sm:max-w-xl w-full mx-auto text-center">
        <DrawerHeader>
          <DrawerTitle className="text-lg text-center">
            {isConfirmed ? "" : "Vas a reservar la siguiente clase"}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4">
          {!isConfirmed ? (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {classItem.name}
                </h3>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-base font-medium text-blue-600">
                      {formattedTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Instructor: {classItem.instructor}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock3 className="w-3.5 h-3.5 text-gray-500" />
                      <span>{classItem.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                      <span>{classItem.alumnRegistred}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <span className="text-7xl">💪</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ¡Clase reservada!
                  </h3>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {classItem.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formattedTime} con {classItem.instructor}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-700">
                    Llega con 10 minutos de anticipación. Puedes cancelar hasta
                    45 minutos antes del inicio.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <DrawerFooter>
          {!isConfirmed ? (
            <>
              <Button onClick={handleConfirm}>Confirmar reserva</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </>
          ) : (
            <DrawerClose asChild>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleClose}
              >
                Cerrar
              </Button>
            </DrawerClose>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
