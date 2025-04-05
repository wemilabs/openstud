"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  format,
  getDay,
  getDaysInMonth,
  isSameDay,
  isToday,
  startOfMonth,
  subMonths,
} from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CalendarProps {
  className?: string;
  selected?: Date | null;
  onSelect?: (date: Date | undefined) => void;
  mode?: "single" | "range" | "multiple";
  disabled?: (date: Date) => boolean;
  initialFocus?: boolean;
}

function Calendar({ className, selected, onSelect, disabled }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    selected || new Date()
  );

  // Go to previous month
  const handlePreviousMonth = () => {
    setCurrentMonth((prevMonth) => subMonths(prevMonth, 1));
  };

  // Go to next month
  const handleNextMonth = () => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, 1));
  };

  // Handle day selection
  const handleDayClick = (day: Date) => {
    if (onSelect) {
      onSelect(day);
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const daysInMonth = getDaysInMonth(currentMonth);
    const startDay = getDay(monthStart); // 0 for Sunday, 1 for Monday, etc.

    const days = [];

    // Add empty cells for days before the start of the month
    for (let i = 0; i < startDay; i++) {
      days.push(
        <div
          key={`empty-start-${i}`}
          className="h-8 p-0 text-center text-sm relative"
        />
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const isSelectedDay = selected ? isSameDay(date, selected) : false;
      const isDisabled = disabled ? disabled(date) : false;

      days.push(
        <button
          key={`day-${day}`}
          type="button"
          onClick={() => handleDayClick(date)}
          disabled={isDisabled}
          className={cn(
            "h-8 w-8 p-0 mx-auto rounded-full text-sm flex items-center justify-center",
            isSelectedDay && "bg-primary text-primary-foreground font-medium",
            isToday(date) &&
              !isSelectedDay &&
              "bg-accent text-accent-foreground font-medium",
            !isSelectedDay && !isToday(date) && "hover:bg-muted",
            isDisabled &&
              "text-muted-foreground opacity-50 hover:bg-transparent cursor-not-allowed"
          )}
        >
          {day}
        </button>
      );
    }

    // Calculate how many cells we need to fill to complete the grid
    // We want to ensure we have complete weeks (rows of 7)
    const totalCells = days.length;
    const remainingCells = 7 - (totalCells % 7);

    // Only add remaining cells if we need to complete the last row
    if (remainingCells < 7) {
      for (let i = 0; i < remainingCells; i++) {
        days.push(
          <div
            key={`empty-end-${i}`}
            className="h-8 p-0 text-center text-sm relative"
          />
        );
      }
    }

    return days;
  };

  return (
    <div
      className={cn(
        "p-3 w-full bg-background border rounded-md shadow-sm",
        className
      )}
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-1 py-1 mb-2">
        <button
          type="button"
          className="p-1 rounded-full hover:bg-muted flex items-center justify-center"
          onClick={handlePreviousMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <h2 className="text-sm font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </h2>

        <button
          type="button"
          className="p-1 rounded-full hover:bg-muted flex items-center justify-center"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="text-center text-muted-foreground text-xs font-medium py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">{generateCalendarDays()}</div>

      {/* Footer with action buttons */}
      <div className="flex justify-end space-x-2 mt-4 pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect?.(undefined)}
          className="text-xs h-8"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

export { Calendar };
