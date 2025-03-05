"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle2, Circle, Filter } from "lucide-react";

export type TaskFilterValue = "all" | "completed" | "incomplete";

export interface TaskFilterProps {
  currentFilter: TaskFilterValue;
  onFilterChange: (filter: TaskFilterValue) => void;
  taskCounts?: {
    all: number;
    completed: number;
    incomplete: number;
  };
}

/**
 * Task filter dropdown component for filtering tasks by completion status
 */
export function TaskFilterDropdown({
  currentFilter,
  onFilterChange,
  taskCounts = { all: 0, completed: 0, incomplete: 0 },
}: TaskFilterProps) {
  // Filter options
  const filters: Record<TaskFilterValue, { label: string; icon: React.ReactNode }> = {
    all: {
      label: "All Tasks",
      icon: <Filter className="h-4 w-4" />,
    },
    completed: {
      label: "Completed",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    incomplete: {
      label: "Incomplete",
      icon: <Circle className="h-4 w-4" />,
    },
  };

  const currentFilterOption = filters[currentFilter];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          {currentFilterOption.icon}
          <span>{currentFilterOption.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(filters).map(([key, { label, icon }]) => (
          <DropdownMenuItem
            key={key}
            className="flex items-center gap-2"
            onClick={() => onFilterChange(key as TaskFilterValue)}
          >
            {icon}
            <span>{label}</span>
            {taskCounts && (
              <span className="ml-auto text-xs text-muted-foreground">
                {taskCounts[key as keyof typeof taskCounts]}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
