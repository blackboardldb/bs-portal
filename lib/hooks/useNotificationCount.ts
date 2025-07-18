import { useMemo } from "react";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { initialUsers } from "@/lib/mock-data";

export function useNotificationCount() {
  const { classSessions } = useBlackSheepStore();

  const notificationCount = useMemo(() => {
    // Usar siempre initialUsers para notificaciones (independiente de paginación)
    const allUsers = initialUsers;

    if (!allUsers || allUsers.length === 0) {
      return 0;
    }

    let count = 0;

    // Usuarios pendientes de aprobación (nuevos registros)
    const pendingUsers = allUsers.filter(
      (user) => user.membership?.status === "pending"
    );
    count += pendingUsers.length;

    // Usuarios con renovaciones pendientes
    const renewalUsers = allUsers.filter(
      (user) =>
        user.membership?.pendingRenewal &&
        user.membership.pendingRenewal.status === "pending"
    );
    count += renewalUsers.length;

    // Clases canceladas recientes (últimas 3)
    const cancelledClasses =
      classSessions?.filter((cls) => cls.status === "cancelled").slice(0, 3) ||
      [];
    if (cancelledClasses.length > 0) {
      count += 1; // Contamos las clases canceladas como 1 notificación grupal
    }

    return count;
  }, [classSessions]); // Solo depende de classSessions, no de users

  return notificationCount;
}
