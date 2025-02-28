"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { updateTask } from "@/actions/tasks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/tasks/progress-bar";

interface CompletionSliderProps {
  taskId: string;
  initialValue: number;
  onUpdate?: (newValue: number) => void;
}

/**
 * A slider component for updating task completion percentage
 */
export function CompletionSlider({
  taskId,
  initialValue = 0,
  onUpdate,
}: CompletionSliderProps) {
  const [value, setValue] = useState(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get color based on completion percentage
  const getColor = (percentage: number) => {
    if (percentage < 25) return "bg-red-500";
    if (percentage < 50) return "bg-orange-500";
    if (percentage < 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Handle slider change
  const handleChange = (newValue: number[]) => {
    setValue(newValue[0]);
  };

  // Handle updating the task
  const handleUpdate = async () => {
    if (value === initialValue) return;

    setIsUpdating(true);

    try {
      // Update the task with the new completion percentage
      // Also mark as completed if percentage is 100%
      const result = await updateTask(taskId, {
        completionPercentage: value,
        completed: value === 100 ? true : undefined,
      });

      if (result.error) {
        toast.error(`Error: ${result.error}`);
        return;
      }

      // Update the initial value to the new value
      setValue(value);

      // Show success message
      toast.success("Task progress updated");

      // Call the onUpdate callback if provided
      if (onUpdate) {
        // Pass the updated task data from the result
        onUpdate(value);

        // Force a page refresh to ensure all components reflect the changes
        // window.location.reload();
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task progress");
    } finally {
      setIsUpdating(false);
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
