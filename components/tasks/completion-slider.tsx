"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/tasks/progress-bar";
import { useTaskChanges } from "@/contexts/task-changes-context";

interface CompletionSliderProps {
  taskId: string;
  initialValue: number;
  onUpdate?: (newValue: number) => void;
}

/**
 * Slider component for updating task completion percentage
 */
export function CompletionSlider({
  taskId,
  initialValue = 0,
  onUpdate,
}: CompletionSliderProps) {
  const [value, setValue] = useState(initialValue);
  const [initialValueState, setInitialValueState] = useState(initialValue);
  const { addChange } = useTaskChanges();
  const [isUpdating, setIsUpdating] = useState(false);

  // Update the initial value if it changes from props
  useEffect(() => {
    setValue(initialValue);
    setInitialValueState(initialValue);
  }, [initialValue]);

  // Get color based on completion percentage
  const getColor = (percentage: number) => {
    if (percentage < 25) return "bg-red-500";
    if (percentage < 50) return "bg-orange-500";
    if (percentage < 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Handle slider value change
  const handleChange = (newValue: number[]) => {
    setValue(newValue[0]);
  };

  // Handle updating the task
  const handleUpdate = async () => {
    if (value === initialValueState) return;

    // Add the change to the pending changes
    addChange(taskId, {
      completionPercentage: value,
      // Set completed status based on completion percentage
      // If value is 100, mark as completed, if less than 100, mark as not completed
      completed: value === 100 ? true : false,
    });

    // Update the local state to reflect the change
    setInitialValueState(value);

    // Call the onUpdate callback if provided
    if (onUpdate) {
      onUpdate(value);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Completion</span>
        <span
          className={cn(
            "text-sm font-medium px-2 py-1 rounded-full text-white",
            getColor(value)
          )}
        >
          {value}%
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-full space-y-2">
          <ProgressBar value={value} indicatorClassName={getColor(value)} />
          <Slider
            defaultValue={[initialValue]}
            max={100}
            step={5}
            className="flex-1"
            onValueChange={handleChange}
            onValueCommit={() => handleUpdate()}
            disabled={isUpdating}
          />
        </div>
      </div>
    </div>
  );
}
