"use client";

import { useState, useEffect } from "react";
import { ClassSession } from "@/lib/types";
import { format, startOfMonth, endOfMonth } from "date-fns";

/**
 * Hook centralizado para obtener las clases de un mes específico.
 * La lógica de generación o consulta a la BD está encapsulada en la API.
 */
export function useClassSchedule(date: Date) {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const startDate = format(startOfMonth(date), "yyyy-MM-dd");
        const endDate = format(endOfMonth(date), "yyyy-MM-dd");

        const response = await fetch(
          `/api/classes/by-date?startDate=${startDate}&endDate=${endDate}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch classes");
        }

        const data = await response.json();
        setClasses(data.classes);
      } catch (err: any) {
        setError(err.message);
        console.error("Error loading classes:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [date]);

  return {
    classes,
    setClasses,
    isLoading,
    error,
  };
}
