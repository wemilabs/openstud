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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TaskCategory, getTaskCategoryInfo } from "./task-category";
import { PriorityLevel, getTaskPriorityInfo } from "./task-priority";

export type TaskFilterValue = "all" | "completed" | "incomplete";

export interface TaskFilterDropdownProps {
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
}: TaskFilterDropdownProps) {
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

export interface TaskFilterProps {
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  selectedPriorities: string[];
  setSelectedPriorities: React.Dispatch<React.SetStateAction<string[]>>;
}

/**
 * Comprehensive task filter component for filtering by category and priority
 */
export function TaskFilter({
  selectedCategories,
  setSelectedCategories,
  selectedPriorities,
  setSelectedPriorities,
}: TaskFilterProps) {
  // All available categories
  const categories: TaskCategory[] = [
    "assignment",
    "exam",
    "presentation",
    "lab",
    "reading",
    "project",
    "study",
    "other",
  ];

  // All available priorities
  const priorities: PriorityLevel[] = ["low", "medium", "high", "urgent"];

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Toggle priority selection
  const togglePriority = (priority: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedPriorities([]);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filter Tasks</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 px-2 text-xs"
        >
          Clear all
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Categories</h4>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => {
              const categoryInfo = getTaskCategoryInfo(category);
              const isSelected = selectedCategories.includes(category);
              
              return (
                <div
                  key={category}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`category-${category}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleCategory(category)}
                  />
                  <Label
                    htmlFor={`category-${category}`}
                    className="flex items-center text-sm cursor-pointer"
                  >
                    {categoryInfo.icon}
                    <span>{categoryInfo.label}</span>
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-2">Priority</h4>
          <div className="grid grid-cols-2 gap-2">
            {priorities.map((priority) => {
              const priorityInfo = getTaskPriorityInfo(priority);
              const isSelected = selectedPriorities.includes(priority);
              
              return (
                <div
                  key={priority}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`priority-${priority}`}
                    checked={isSelected}
                    onCheckedChange={() => togglePriority(priority)}
                  />
                  <Label
                    htmlFor={`priority-${priority}`}
                    className="flex items-center text-sm cursor-pointer"
                  >
                    <span className={`h-2 w-2 rounded-full ${priorityInfo.color} mr-1.5`} />
                    {priorityInfo.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {(selectedCategories.length > 0 || selectedPriorities.length > 0) && (
        <div className="pt-2">
          <h4 className="text-xs text-muted-foreground mb-2">Active filters:</h4>
          <div className="flex flex-wrap gap-1">
            {selectedCategories.map((category) => {
              const { label } = getTaskCategoryInfo(category as TaskCategory);
              return (
                <Badge
                  key={`cat-${category}`}
                  variant="outline"
                  className="text-xs py-0 h-6"
                >
                  {label}
                  <button
                    className="ml-1 hover:text-destructive"
                    onClick={() => toggleCategory(category)}
                  >
                    ×
                  </button>
                </Badge>
              );
            })}
            {selectedPriorities.map((priority) => {
              const { label } = getTaskPriorityInfo(priority as PriorityLevel);
              return (
                <Badge
                  key={`pri-${priority}`}
                  variant="outline"
                  className="text-xs py-0 h-6"
                >
                  {label}
                  <button
                    className="ml-1 hover:text-destructive"
                    onClick={() => togglePriority(priority)}
                  >
                    ×
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
