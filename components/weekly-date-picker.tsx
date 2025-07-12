"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";

interface WeeklyDatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  className?: string;
}

export default function WeeklyDatePicker({
  selectedDate,
  onDateSelect,
  className = "",
}: WeeklyDatePickerProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // Get the start of the week (Sunday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0); // Resetear hora
    const day = d.getDay(); // 0 (Domingo) - 6 (Sábado)
    const diff = day === 0 ? -6 : 1 - day; // Si es domingo, retroceder 6 días; si es lunes, 0
    d.setDate(d.getDate() + diff);
    return d;
  };

  // Get array of dates for the current week
  const getWeekDates = (weekStart: Date): Date[] => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Initialize with current week
  useEffect(() => {
    const today = new Date();
    setCurrentWeekStart(getWeekStart(today));
  }, []);

  // Navigate to previous week
  const goToPreviousWeek = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Touch event handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isTransitioning) return;
    currentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || isTransitioning) return;

    const deltaX = currentX.current - startX.current;
    const threshold = 50; // Minimum swipe distance

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        goToPreviousWeek();
      } else {
        goToNextWeek();
      }
    }

    isDragging.current = false;
  };

  const weekDates = getWeekDates(currentWeekStart);
  const dayLabels = ["LUN", "MAR", "MIER", "JUE", "VIE", "SAB", "DOM"];
  const monthNames = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  // Get the month and year for display
  const getMonthYear = () => {
    const firstDate = weekDates[0];
    const lastDate = weekDates[6];

    if (firstDate.getMonth() === lastDate.getMonth()) {
      return `${monthNames[firstDate.getMonth()]} ${firstDate.getFullYear()}`;
    } else {
      // Week spans two months
      return `${monthNames[firstDate.getMonth()]} - ${
        monthNames[lastDate.getMonth()]
      } ${firstDate.getFullYear()}`;
    }
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date: Date): boolean => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className={`bg-white ${className}`}>
      {/* Header */}
      <div className="pb-4  border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg text-zinc-800 mt-1">{getMonthYear()}</p>
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousWeek}
              disabled={isTransitioning}
              className="p-2 rounded-full hover:bg-zinc-100 transition-colors disabled:opacity-50"
              aria-label="Previous week"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6 text-zinc-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNextWeek}
              disabled={isTransitioning}
              className="p-2 rounded-full hover:bg-zinc-100 transition-colors disabled:opacity-50"
              aria-label="Next week"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6 text-zinc-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Week view */}
      <div
        ref={containerRef}
        className=" pt-6 pb-4  select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`grid grid-cols-7 gap-1 md:gap-2 transition-all duration-300 ${
            isTransitioning ? "opacity-50" : "opacity-100"
          }`}
        >
          {weekDates.map((date, index) => {
            const isCurrentDay = isToday(date);
            const isSelectedDay = isSelected(date);

            return (
              <div
                key={date.toISOString()}
                className="flex flex-col items-center"
              >
                {/* Day label */}
                <div className="text-xs font-medium text-zinc-500 mb-2 md:mb-3">
                  {dayLabels[index]}
                </div>

                {/* Date */}
                <button
                  onClick={() => onDateSelect(date)}
                  className={`
                    w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center 
                    text-sm md:text-base font-medium
                    transition-all duration-200 ease-in-out
                    ${
                      isSelectedDay
                        ? "bg-black text-white shadow-md"
                        : isCurrentDay
                        ? "bg-blue-100 text-blue-600"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }
                    active:scale-95
                  `}
                  aria-label={`Select ${date.toLocaleDateString()}`}
                >
                  {date.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
