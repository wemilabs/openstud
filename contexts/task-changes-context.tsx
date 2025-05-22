"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { updateTask } from "@/lib/actions/tasks";
import { toast } from "sonner";
import { PriorityLevel } from "@/components/dashboard/task-priority";
import { TaskCategory } from "@/components/dashboard/task-category";

// Define the shape of a task change
interface TaskChange {
  taskId: string;
  changes: {
    title?: string;
    description?: string | null;
    completed?: boolean;
    completionPercentage?: number;
    dueDate?: Date | null;
    priority?: PriorityLevel | null;
    category?: TaskCategory | null;
  };
}

// Define the context interface
interface TaskChangesContextType {
  pendingChanges: TaskChange[];
  hasPendingChanges: boolean;
  addChange: (taskId: string, changes: TaskChange["changes"]) => void;
  saveAllChanges: () => Promise<void>;
  discardAllChanges: () => void;
}

// Create the context
const TaskChangesContext = createContext<TaskChangesContextType | undefined>(
  undefined
);

/**
 * Provider component for managing task changes
 */
export function TaskChangesProvider({ children }: { children: ReactNode }) {
  const [pendingChanges, setPendingChanges] = useState<TaskChange[]>([]);

  /**
   * Check if there are any pending changes
   */
  const hasPendingChanges = pendingChanges.length > 0;

  /**
   * Add or update a change for a specific task
   */
  const addChange = useCallback(
    (taskId: string, changes: TaskChange["changes"]) => {
      setPendingChanges((prev) => {
        // Check if we already have changes for this task
        const existingChangeIndex = prev.findIndex(
          (change) => change.taskId === taskId
        );

        if (existingChangeIndex >= 0) {
          // Update existing change
          const newChanges = [...prev];
          newChanges[existingChangeIndex] = {
            taskId,
            changes: {
              ...newChanges[existingChangeIndex].changes,
              ...changes,
            },
          };
          return newChanges;
        } else {
          // Add new change
          return [...prev, { taskId, changes }];
        }
      });
    },
    []
  );

  /**
   * Save all pending changes to the server
   */
  const saveAllChanges = useCallback(async () => {
    if (pendingChanges.length === 0) {
      toast.info("No changes to save");
      return;
    }

    // Show loading toast
    toast.loading(`Saving ${pendingChanges.length} task changes...`);

    try {
      // Process each change sequentially
      for (const change of pendingChanges) {
        await updateTask(change.taskId, change.changes);
      }

      // Clear pending changes after successful save
      setPendingChanges([]);

      // Show success toast
      toast.success("All changes saved successfully");

      // Refresh the page to reflect all changes
      window.location.reload();
    } catch (error) {
      console.error("Error saving task changes:", error);
      toast.error("Failed to save some changes. Please try again.");
    }
  }, [pendingChanges]);

  /**
   * Discard all pending changes
   */
  const discardAllChanges = useCallback(() => {
    setPendingChanges([]);
    toast.info("All changes discarded");
  }, []);

  return (
    <TaskChangesContext.Provider
      value={{
        pendingChanges,
        hasPendingChanges,
        addChange,
        saveAllChanges,
        discardAllChanges,
      }}
    >
      {children}
    </TaskChangesContext.Provider>
  );
}

/**
 * Hook to use the task changes context
 */
export function useTaskChanges() {
  const context = useContext(TaskChangesContext);

  if (context === undefined) {
    throw new Error("useTaskChanges must be used within a TaskChangesProvider");
  }

  return context;
}
