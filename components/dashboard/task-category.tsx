"use client";

import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, FileText, Presentation, Beaker, Calendar, Lightbulb, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

export type TaskCategory = 
  | "assignment" 
  | "exam" 
  | "presentation" 
  | "lab" 
  | "reading" 
  | "project" 
  | "study" 
  | "other";

// Category configuration with student-focused labels and icons
const categoryConfig: Record<TaskCategory, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  assignment: { 
    label: "Assignment", 
    icon: <FileText className="h-3 w-3" />,
    color: "text-blue-500 border-blue-200",
    bgColor: "bg-blue-50"
  },
  exam: { 
    label: "Exam/Quiz", 
    icon: <Calendar className="h-3 w-3" />,
    color: "text-red-500 border-red-200",
    bgColor: "bg-red-50"
  },
  presentation: { 
    label: "Presentation", 
    icon: <Presentation className="h-3 w-3" />,
    color: "text-amber-500 border-amber-200",
    bgColor: "bg-amber-50"
  },
  lab: { 
    label: "Lab Work", 
    icon: <Beaker className="h-3 w-3" />,
    color: "text-green-500 border-green-200",
    bgColor: "bg-green-50"
  },
  reading: { 
    label: "Reading", 
    icon: <BookOpen className="h-3 w-3" />,
    color: "text-purple-500 border-purple-200",
    bgColor: "bg-purple-50"
  },
  project: { 
    label: "Project", 
    icon: <Lightbulb className="h-3 w-3" />,
    color: "text-indigo-500 border-indigo-200",
    bgColor: "bg-indigo-50"
  },
  study: { 
    label: "Study Session", 
    icon: <GraduationCap className="h-3 w-3" />,
    color: "text-teal-500 border-teal-200",
    bgColor: "bg-teal-50"
  },
  other: { 
    label: "Other", 
    icon: <FileText className="h-3 w-3" />,
    color: "text-gray-500 border-gray-200",
    bgColor: "bg-gray-50"
  },
};

/**
 * Get task category information (label, icon, color)
 * @param category The task category
 * @returns Category information object
 */
export function getTaskCategoryInfo(category: TaskCategory) {
  return categoryConfig[category];
}

interface TaskCategoryProps {
  category?: TaskCategory | null;
  onCategoryChange?: (category: TaskCategory | null) => void;
  disabled?: boolean;
}

/**
 * Task category component for displaying and changing academic task categories
 * Specifically designed for student workflows and academic contexts
 */
export function TaskCategory({ category, onCategoryChange, disabled = false }: TaskCategoryProps) {
  // Get category details
  const getCategoryDetails = (c: TaskCategory | null | undefined) => {
    if (!c) return { label: "No Category", icon: <FileText className="h-3 w-3" />, color: "text-muted-foreground border-muted" };
    return categoryConfig[c];
  };
  
  const currentCategory = getCategoryDetails(category);
  
  // If no onCategoryChange handler is provided, just display the category badge
  if (!onCategoryChange || disabled) {
    return category ? (
      <Badge 
        variant="outline" 
        className={cn("gap-1", currentCategory.color)}
      >
        {currentCategory.icon}
        <span>{currentCategory.label}</span>
      </Badge>
    ) : null;
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge 
          variant="outline" 
          className={cn(
            "cursor-pointer gap-1 hover:bg-muted", 
            currentCategory.color
          )}
        >
          {currentCategory.icon}
          <span>{currentCategory.label}</span>
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          className="gap-2"
          onClick={() => onCategoryChange(null)}
        >
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span>No Category</span>
        </DropdownMenuItem>
        
        {Object.entries(categoryConfig).map(([key, { label, icon, color }]) => (
          <DropdownMenuItem 
            key={key}
            className="gap-2"
            onClick={() => onCategoryChange(key as TaskCategory)}
          >
            <span className={cn("", color.split(' ')[0])}>
              {icon}
            </span>
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Task category badge component for displaying task category in a compact way
 */
export function TaskCategoryBadge({ category }: { category: TaskCategory }) {
  const { label, icon, color, bgColor } = categoryConfig[category];
  
  return (
    <Badge variant="outline" className={cn("px-2 py-0 h-5 text-xs font-normal flex items-center gap-1", color, bgColor)}>
      {icon}
      <span>{label}</span>
    </Badge>
  );
}
