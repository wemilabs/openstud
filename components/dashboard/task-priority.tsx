"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export type PriorityLevel = "low" | "medium" | "high" | "urgent";

// Priority configuration
const priorityConfig: Record<
  PriorityLevel,
  { label: string; color: string; bgColor: string }
> = {
  low: {
    label: "Low",
    color: "text-green-500",
    bgColor: "bg-green-100",
  },
  medium: {
    label: "Medium",
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  high: {
    label: "High",
    color: "text-amber-500",
    bgColor: "bg-amber-100",
  },
  urgent: {
    label: "Urgent",
    color: "text-red-500",
    bgColor: "bg-red-100",
  },
};

/**
 * Get task priority information (label, color)
 * @param priority The task priority level
 * @returns Priority information object
 */
export function getTaskPriorityInfo(priority: PriorityLevel) {
  return priorityConfig[priority];
}

interface TaskPriorityProps {
  priority?: PriorityLevel | null;
  onPriorityChange?: (priority: PriorityLevel | null) => void;
  disabled?: boolean;
}

/**
 * Task priority component for displaying and changing task priority
 */
export function TaskPriority({
  priority,
  onPriorityChange,
  disabled = false,
}: TaskPriorityProps) {
  // Get priority details
  const getPriorityDetails = (p: PriorityLevel | null | undefined) => {
    if (!p) return { label: "No Priority", color: "text-muted-foreground" };
    return priorityConfig[p];
  };

  const currentPriority = getPriorityDetails(priority);

  // If no onPriorityChange handler is provided, just display the priority badge
  if (!onPriorityChange || disabled) {
    return priority ? (
      <Badge variant="outline" className={cn("gap-1", currentPriority.color)}>
        <Flag className="h-3 w-3" />
        <span>{currentPriority.label}</span>
      </Badge>
    ) : null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge
          variant="outline"
          className={cn(" gap-1 hover:bg-muted", currentPriority.color)}
        >
          <Flag className="h-3 w-3" />
          <span>{currentPriority.label}</span>
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="gap-2"
          onClick={() => onPriorityChange(null)}
        >
          <Flag className="h-3 w-3 text-muted-foreground" />
          <span>No Priority</span>
        </DropdownMenuItem>

        {Object.entries(priorityConfig).map(([key, { label, color }]) => (
          <DropdownMenuItem
            key={key}
            className="gap-2"
            onClick={() => onPriorityChange(key as PriorityLevel)}
          >
            <Flag className={cn("h-3 w-3", color)} />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Task priority badge component for displaying task priority in a compact way
 */
export function TaskPriorityBadge({ priority }: { priority: PriorityLevel }) {
  const { label, color, bgColor } = priorityConfig[priority];

  return (
    <Badge
      variant="outline"
      className={cn("px-2 py-0 h-5 text-xs font-normal", color, bgColor)}
    >
      {label}
    </Badge>
  );
}
