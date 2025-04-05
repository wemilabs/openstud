"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: Date | string | undefined;
  onChange?: (date: Date | undefined) => void;
  selected?: Date | string | undefined;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  selected,
  onSelect,
  placeholder = "Select a date",
  id,
}: DatePickerProps) {
  const parseDate = (date: Date | string | undefined): Date | undefined => {
    if (!date) return undefined;
    return typeof date === "string" ? new Date(date) : date;
  };

  const dateValue = parseDate(value !== undefined ? value : selected);

  const handleDateChange = (newDate: Date | undefined) => {
    if (onChange) onChange(newDate);
    if (onSelect) onSelect(newDate);
  };

  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const datePickerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node) &&
        isCalendarOpen
      ) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  return (
    <div className="relative" ref={datePickerRef}>
      <Button
        id={id}
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !dateValue && "text-muted-foreground"
        )}
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {dateValue ? format(dateValue, "PPP") : placeholder}
      </Button>

      {isCalendarOpen && (
        <div className="absolute top-full left-0 z-[9999] mt-2 rounded-md border bg-popover shadow-md">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(newDate) => {
              handleDateChange(newDate);
              setIsCalendarOpen(false);
            }}
            initialFocus
            className="rounded-md"
          />
        </div>
      )}
    </div>
  );
}
