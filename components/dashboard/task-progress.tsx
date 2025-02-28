"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";

interface TaskProgressProps {
  completedCount: number;
  totalCount: number;
}

/**
 * Task progress component for displaying task completion progress
 */
export function TaskProgress({ completedCount, totalCount }: TaskProgressProps) {
  // Calculate progress percentage
  const progressPercentage = totalCount > 0 
    ? Math.round((completedCount / totalCount) * 100) 
    : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{progressPercentage}%</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>{completedCount}</span>
          </div>
          <span>/</span>
          <div className="flex items-center gap-1">
            <Circle className="h-3 w-3" />
            <span>{totalCount}</span>
          </div>
        </div>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
}
