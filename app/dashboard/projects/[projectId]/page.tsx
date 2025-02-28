"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Plus, PlusCircle, ArrowUpDown, Filter } from "lucide-react";
import { TaskCard, Task } from "@/components/dashboard/task-card";
import { createTask, deleteTask, getTasks, updateTask } from "@/actions/tasks";
import { toast } from "sonner";
import {
  TaskFilterDropdown,
  TaskFilterValue,
} from "@/components/dashboard/task-filter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import {
  PriorityLevel,
  TaskPriority,
} from "@/components/dashboard/task-priority";
import { TaskCategory } from "@/components/dashboard/task-category";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { DatePicker } from "@/components/ui/date-picker";
import { CompletionSlider } from "@/components/tasks/completion-slider";

// Sort options
type SortOption = "createdAt" | "dueDate" | "priority" | "title";

/**
 * Default project page that displays tasks
 */
export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [currentFilter, setCurrentFilter] = useState<TaskFilterValue>("all");
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>(undefined);
  const [taskPriority, setTaskPriority] = useState<PriorityLevel | null>(null);
  const [taskCategory, setTaskCategory] = useState<TaskCategory | null>(null);
  const [taskCompletionPercentage, setTaskCompletionPercentage] = useState(0);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskFilterValue>("all");
  const [filterPriority, setFilterPriority] = useState<PriorityLevel | "all">(
    "all"
  );
  const [filterCategory, setFilterCategory] = useState<TaskCategory | "all">(
    "all"
  );
  const [sortBy, setSortBy] = useState<SortOption>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Fetch tasks when the component mounts
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoadingTasks(true);
      try {
        const result = await getTasks(projectId as string);
        if (result.error) {
          toast.error(`Error: ${result.error}`);
          setTasks([]);
        } else if (result.tasks) {
          // Convert the tasks to the correct type
          const typedTasks: Task[] = result.tasks.map((task) => ({
            ...task,
            priority: task.priority as PriorityLevel | null,
            category: task.category as TaskCategory | null,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
          }));
          setTasks(typedTasks);
        } else {
          setTasks([]);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to fetch tasks");
        setTasks([]);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [projectId]);

  // Filter and sort tasks
  useEffect(() => {
    if (tasks.length > 0) {
      const filtered = tasks
        .filter((task) => {
          // Filter by status
          if (currentFilter === "completed") {
            // A task is considered completed only if it's marked as completed OR has 100% completion percentage
            if (!task.completed && task.completionPercentage !== 100)
              return false;
          }
          if (currentFilter === "incomplete") {
            // A task is considered incomplete if it's not marked as completed AND doesn't have 100% completion percentage
            if (task.completed || task.completionPercentage === 100)
              return false;
          }

          // Filter by priority
          if (filterPriority !== "all" && task.priority !== filterPriority)
            return false;

          // Filter by category
          if (filterCategory !== "all" && task.category !== filterCategory)
            return false;

          return true;
        })
        .sort((a, b) => {
          // Sort by selected field
          if (sortBy === "dueDate") {
            // Handle null due dates
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return sortDirection === "asc" ? 1 : -1;
            if (!b.dueDate) return sortDirection === "asc" ? -1 : 1;

            return sortDirection === "asc"
              ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
              : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
          }

          if (sortBy === "priority") {
            // Priority order: urgent > high > medium > low > null
            const priorityOrder = {
              urgent: 4,
              high: 3,
              medium: 2,
              low: 1,
              null: 0,
            };
            const aPriority = a.priority || null;
            const bPriority = b.priority || null;

            return sortDirection === "asc"
              ? (priorityOrder[aPriority as keyof typeof priorityOrder] || 0) -
                  (priorityOrder[bPriority as keyof typeof priorityOrder] || 0)
              : (priorityOrder[bPriority as keyof typeof priorityOrder] || 0) -
                  (priorityOrder[aPriority as keyof typeof priorityOrder] || 0);
          }

          if (sortBy === "title") {
            return sortDirection === "asc"
              ? a.title.localeCompare(b.title)
              : b.title.localeCompare(a.title);
          }

          // Default sort by createdAt
          return sortDirection === "asc"
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      setFilteredTasks(filtered);
    }
  }, [
    tasks,
    currentFilter,
    filterPriority,
    filterCategory,
    sortBy,
    sortDirection,
  ]);

  // Toggle task completion
  const toggleTaskCompletion = async (
    taskId: string,
    currentStatus: boolean
  ) => {
    try {
      const result = await updateTask(taskId, {
        completed: !currentStatus,
        // If marking as complete, set to 100%, otherwise keep at current level
        completionPercentage: !currentStatus ? 100 : undefined,
      });

      if (result.error) {
        toast.error(`Error: ${result.error}`);
        return;
      }

      if (result.data) {
        // Convert the updated task to the correct type
        const updatedTask: Task = {
          ...result.data,
          priority: result.data.priority as PriorityLevel | null,
          category: result.data.category as TaskCategory | null,
          dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
        };

        // Update the tasks list
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
        );

        toast.success(
          updatedTask.completed
            ? "Task marked as completed"
            : "Task marked as incomplete"
        );

        // Force a refresh to ensure all components reflect the changes
        // window.location.reload();
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
      toast.error("Failed to update task status");
    }
  };

  // Calculate task counts for filters
  const taskCounts = {
    all: tasks.length,
    completed: tasks.filter(
      (task) => task.completed || task.completionPercentage === 100
    ).length,
    incomplete: tasks.filter(
      (task) => !task.completed && task.completionPercentage !== 100
    ).length,
  };

  // Create a new task
  const handleCreateTask = async () => {
    if (taskTitle.trim().length < 3) {
      toast.error("Task title must be at least 3 characters");
      return;
    }

    setIsCreatingTask(true);
    try {
      const result = await createTask({
        title: taskTitle,
        description: taskDescription || null,
        dueDate: taskDueDate || null,
        priority: taskPriority,
        category: taskCategory,
        projectId: projectId as string,
        completed: taskCompletionPercentage === 100,
        completionPercentage: taskCompletionPercentage,
      });

      if (result.error) {
        toast.error(`Error: ${result.error}`);
      } else if (result.data) {
        // Add the new task to the list
        const newTask: Task = {
          ...result.data,
          priority: result.data.priority as PriorityLevel | null,
          category: result.data.category as TaskCategory | null,
          dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
          completed: result.data.completed || false,
          completionPercentage: result.data.completionPercentage || 0,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        };

        setTasks([newTask, ...tasks]);

        // Reset form
        setTaskTitle("");
        setTaskDescription("");
        setTaskDueDate(undefined);
        setTaskPriority(null);
        setTaskCategory(null);
        setTaskCompletionPercentage(0);
        setOpenTaskDialog(false);

        toast.success("Task created successfully");

        // Force a refresh to ensure all components reflect the changes
        // window.location.reload();
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleTaskCreationSuccess = (newTask: any) => {
    // Convert the new task to the correct type
    const typedTask: Task = {
      ...newTask,
      priority: newTask.priority as PriorityLevel | null,
      category: newTask.category as TaskCategory | null,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : null,
    };

    // Add the new task to the tasks list
    setTasks((prevTasks) => [typedTask, ...prevTasks]);

    // Reset form
    setTaskTitle("");
    setTaskDescription("");
    setTaskDueDate(undefined);
    setTaskPriority(null);
    setTaskCategory(null);
    setTaskCompletionPercentage(0);
    setOpenTaskDialog(false);
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    try {
      const result = await deleteTask(taskId);

      if (result.error) {
        toast.error(`Error: ${result.error}`);
        return;
      }

      // Remove the task from the list
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      toast.success("Task deleted successfully");

      // Force a refresh to ensure all components reflect the changes
      // window.location.reload();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  // Format date for display
  const formatDate = (date?: Date | null) => {
    if (!date) return null;

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <ProjectHeader projectId={projectId} />
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl">Tasks</CardTitle>
            <CardDescription>
              Manage and track your project tasks
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <TaskFilterDropdown
              currentFilter={filterStatus}
              onFilterChange={setFilterStatus}
              taskCounts={taskCounts}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Priority</span>
                  <span className="sm:hidden">Pri</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <h4 className="mb-2 text-sm font-medium">Priority</h4>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={filterPriority}
                    onChange={(e) =>
                      setFilterPriority(e.target.value as PriorityLevel | "all")
                    }
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Category</span>
                  <span className="sm:hidden">Cat</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <h4 className="mb-2 text-sm font-medium">Category</h4>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={filterCategory}
                    onChange={(e) =>
                      setFilterCategory(e.target.value as TaskCategory | "all")
                    }
                  >
                    <option value="all">All Categories</option>
                    <option value="assignment">Assignment</option>
                    <option value="exam">Exam/Quiz</option>
                    <option value="presentation">Presentation</option>
                    <option value="lab">Lab Work</option>
                    <option value="reading">Reading</option>
                    <option value="project">Project</option>
                    <option value="study">Study Session</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sort</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSortBy("dueDate");
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                  }}
                  className={cn(sortBy === "dueDate" && "font-medium")}
                >
                  Due Date{" "}
                  {sortBy === "dueDate" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSortBy("priority");
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                  }}
                  className={cn(sortBy === "priority" && "font-medium")}
                >
                  Priority{" "}
                  {sortBy === "priority" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSortBy("title");
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                  }}
                  className={cn(sortBy === "title" && "font-medium")}
                >
                  Title{" "}
                  {sortBy === "title" && (sortDirection === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={openTaskDialog} onOpenChange={setOpenTaskDialog}>
              <Button
                size="sm"
                className="h-8 gap-1 ml-auto"
                onClick={() => setOpenTaskDialog(true)}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New Task</span>
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to your project
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter task title"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter task description"
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="due-date">Due Date (optional)</Label>
                    <DatePicker
                      id="due-date"
                      value={taskDueDate}
                      onChange={setTaskDueDate}
                      placeholder="Select a date"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority (optional)</Label>
                    <div className="flex items-center gap-2">
                      <TaskPriority
                        priority={taskPriority}
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
                        category={taskCategory}
                        onCategoryChange={(category) => {
                          console.log("Category changed:", category);
                          setTaskCategory(category);
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 py-2">
                    <Label htmlFor="completion">Completion Percentage</Label>
                    <div className="py-2">
                      <CompletionSlider
                        taskId=""
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
                    onClick={() => setOpenTaskDialog(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateTask}
                    disabled={isCreatingTask || taskTitle.trim().length < 3}
                  >
                    {isCreatingTask ? "Creating..." : "Create Task"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoadingTasks ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-sm text-muted-foreground">
                  Loading tasks...
                </p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No tasks found
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenTaskDialog(true)}
                >
                  Create your first task
                </Button>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={toggleTaskCompletion}
                  onDelete={handleDeleteTask}
                  onUpdate={(updatedTask) => {
                    // Update the task in the list
                    setTasks(
                      tasks.map((t) =>
                        t.id === updatedTask.id ? updatedTask : t
                      )
                    );
                  }}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
