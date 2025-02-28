"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateTask } from "@/actions/tasks";
import {
  TaskPriority,
  PriorityLevel,
  TaskPriorityBadge,
} from "@/components/dashboard/task-priority";
import {
  TaskCategory,
  TaskCategoryBadge,
} from "@/components/dashboard/task-category";
import { DatePicker } from "@/components/ui/date-picker";
import { CompletionSlider } from "@/components/tasks/completion-slider";

// Task type definition
export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  completionPercentage: number;
  dueDate: Date | null;
  priority: PriorityLevel | null;
  category: TaskCategory | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string, currentStatus: boolean) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onUpdate?: (updatedTask: Task) => void;
}

/**
 * Task card component for displaying and managing a task
 */
export function TaskCard({
  task,
  onToggleComplete,
  onDelete,
  onUpdate,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingCompletion, setIsUpdatingCompletion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [taskTitle, setTaskTitle] = useState(task.title);
  const [taskDescription, setTaskDescription] = useState(
    task.description || ""
  );
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>(
    task.dueDate ? new Date(task.dueDate) : undefined
  );
  const [taskPriority, setTaskPriority] = useState<PriorityLevel | null>(
    task.priority
  );
  const [taskCategory, setTaskCategory] = useState<TaskCategory | null>(
    task.category
  );
  const [taskCompletionPercentage, setTaskCompletionPercentage] =
    useState<number>(task.completionPercentage);

  // Format date for display
  const formatDate = (date?: Date | null) => {
    if (!date) return null;

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Handle task update
  const handleUpdateTask = async () => {
    if (taskTitle.trim().length < 3) {
      toast.error("Task title must be at least 3 characters");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateTask(task.id, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        dueDate: taskDueDate || null,
        priority: taskPriority,
        category: taskCategory,
        completionPercentage: taskCompletionPercentage,
        // Set completed status based on completion percentage
        completed: taskCompletionPercentage === 100 ? true : undefined,
      });

      if (result.error) {
        toast.error(`Error: ${result.error}`);
        return;
      }

      if (result.data) {
        // Convert the updated task to the correct type
        const updatedTask: Task = {
          ...task, // Keep existing fields
          ...result.data, // Update with new data
          priority: result.data.priority as PriorityLevel | null,
          category: result.data.category as TaskCategory | null,
          dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
          // Ensure we maintain the correct types for dates
          createdAt: new Date(result.data.createdAt || task.createdAt),
          updatedAt: new Date(result.data.updatedAt || task.updatedAt),
        };

        if (onUpdate) {
          onUpdate(updatedTask);
        }
        setOpenEditDialog(false);
        toast.success("Task updated successfully");

        // Force a refresh to ensure all components reflect the changes
        // window.location.reload();
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle task completion toggle
  const handleToggleCompletion = async () => {
    if (!onToggleComplete) return;

    setIsUpdatingCompletion(true);
    try {
      onToggleComplete(task.id, task.completed);
    } finally {
      setIsUpdatingCompletion(false);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.id);
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
      setOpenDeleteDialog(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleCompletion}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>
          <div className="w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={
                  task.completed ? "line-through text-muted-foreground" : ""
                }
              >
                {task.title}
              </span>
              {task.priority && (
                <TaskPriorityBadge priority={task.priority as PriorityLevel} />
              )}
              {task.category && (
                <TaskCategoryBadge category={task.category as TaskCategory} />
              )}
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {task.description}
              </p>
            )}
            {/* Add completion percentage slider */}
            <div className="mt-2 max-w-xs">
              <CompletionSlider
                taskId={task.id}
                initialValue={task.completionPercentage}
                onUpdate={(newValue) => {
                  // Update local state if needed
                  if (onUpdate && task) {
                    onUpdate({
                      ...task,
                      completionPercentage: newValue,
                      completed: newValue === 100,
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-8 sm:ml-0">
          {task.dueDate && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 mr-1" /> {formatDate(task.dueDate)}
            </div>
          )}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setOpenEditDialog(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={() => setOpenDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Task edit dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateTask();
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Task Title</Label>
                <Input
                  id="edit-title"
                  placeholder="Enter task title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (optional)</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter task description"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-due-date">Due Date (optional)</Label>
                <DatePicker
                  id="edit-due-date"
                  value={taskDueDate ? new Date(taskDueDate) : undefined}
                  onChange={setTaskDueDate}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority (optional)</Label>
                <div className="flex items-center gap-2">
                  <TaskPriority
                    priority={taskPriority as PriorityLevel | null}
                    onPriorityChange={(priority) => {
                      console.log("Priority changed:", priority);
                      setTaskPriority(priority);
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category (optional)</Label>
                <div className="flex items-center gap-2">
                  <TaskCategory
                    category={taskCategory as TaskCategory | null}
                    onCategoryChange={(category) => {
                      console.log("Category changed:", category);
                      setTaskCategory(category);
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="completion-percentage">
                  Completion Percentage
                </Label>
                <div className="flex items-center gap-2">
                  <CompletionSlider
                    taskId={task.id}
                    initialValue={taskCompletionPercentage}
                    onUpdate={(newValue) => {
                      setTaskCompletionPercentage(newValue);
                    }}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setOpenEditDialog(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating || !taskTitle.trim()}>
                {isUpdating ? "Updating..." : "Update Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task delete dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setOpenDeleteDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteTask}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Delete Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
