"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

/**
 * Custom progress bar component with customizable indicator styling
 */
export function ProgressBar({
  value,
  className,
  indicatorClassName,
}: ProgressBarProps) {
  // Ensure value is between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));
  
  // Get color based on completion percentage
  const getIndicatorColor = (percentage: number) => {
    if (indicatorClassName) return indicatorClassName;
    
    if (percentage < 25) return "bg-red-500";
    if (percentage < 50) return "bg-orange-500";
    if (percentage < 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div
      className={cn(
        "bg-gray-200 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
    >
      <div
        className={cn(
          "h-full transition-all",
          getIndicatorColor(clampedValue)
        )}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
