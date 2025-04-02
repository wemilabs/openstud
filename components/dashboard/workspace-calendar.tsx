"use client";

import { useState, useEffect, useCallback } from "react";
import { DayPicker, DayProps } from "react-day-picker";
import { format, isEqual, isSameMonth, isToday } from "date-fns";
import { Calendar as CalendarIcon, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TaskCategoryBadge } from "./task-category";
import { TaskPriorityBadge } from "./task-priority";
import { cn } from "@/lib/utils";
import { Task } from "./task-card";
import { TaskFilter } from "./task-filter";
import { getWorkspaceTasks } from "@/actions/workspace-tasks";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Define the task with project information
interface TaskWithProject extends Task {
  projectName: string;
}

interface WorkspaceCalendarProps {
  workspaceId: string;
}

/**
 * Calendar component that displays tasks with due dates from all projects in a workspace
 * Provides filtering by category and priority, and displays task details on hover
 */
export function WorkspaceCalendar({ workspaceId }: WorkspaceCalendarProps) {
  const [month, setMonth] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch tasks from all projects in the workspace
  const fetchWorkspaceTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getWorkspaceTasks(workspaceId);

      if (result.error) {
        toast.error(`Error: ${result.error}`);
        return;
      }

      if (result.data) {
        // Convert date strings to Date objects
        const tasksWithDates = result.data.map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
        }));

        setTasks(tasksWithDates);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks for calendar");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchWorkspaceTasks();
  }, [workspaceId, fetchWorkspaceTasks]);

  // Filter tasks based on selected categories and priorities
  const filteredTasks = tasks.filter((task) => {
    const categoryMatch =
      selectedCategories.length === 0 ||
      (task.category && selectedCategories.includes(task.category));

    const priorityMatch =
      selectedPriorities.length === 0 ||
      (task.priority && selectedPriorities.includes(task.priority));

    return categoryMatch && priorityMatch;
  });

  // Get tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return filteredTasks.filter(
      (task) =>
        task.dueDate &&
        isEqual(
          new Date(task.dueDate).setHours(0, 0, 0, 0),
          new Date(day).setHours(0, 0, 0, 0)
        )
    );
  };

  // Function to render task indicators for a day
  const renderTaskIndicators = (day: Date) => {
    const tasksForDay = getTasksForDay(day);
    if (tasksForDay.length === 0) return null;

    // Group tasks by priority to show different colored indicators
    const urgentTasks = tasksForDay.filter(
      (task) => task.priority === "urgent"
    );
    const highTasks = tasksForDay.filter((task) => task.priority === "high");
    const otherTasks = tasksForDay.filter(
      (task) => !["urgent", "high"].includes(task.priority || "")
    );

    return (
      <div className="absolute bottom-0.5 left-0 right-0 flex justify-center">
        <div className="flex space-x-0.5">
          {urgentTasks.length > 0 && (
            <div className="h-1.5 w-1.5 rounded-full bg-destructive"></div>
          )}
          {highTasks.length > 0 && (
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
          )}
          {otherTasks.length > 0 && (
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
          )}
        </div>
      </div>
    );
  };

  // Function to render task details in a hover card
  const renderTaskDetails = (day: Date) => {
    const tasksForDay = getTasksForDay(day);
    if (tasksForDay.length === 0) return null;

    // Group tasks by priority to show different colored indicators
    const urgentTasks = tasksForDay.filter(
      (task) => task.priority === "urgent"
    );
    // const highTasks = tasksForDay.filter(task => task.priority === 'high');
    // const otherTasks = tasksForDay.filter(task => !['urgent', 'high'].includes(task.priority || ''));

    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div
            className={cn(
              "relative h-9 w-9 p-0 flex items-center justify-center ",
              tasksForDay.length > 0 && "hover:bg-muted/60 rounded-md"
            )}
          >
            <span className="inline-flex items-center justify-center">
              {format(day, "d")}
            </span>
            {renderTaskIndicators(day)}
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-0" side="bottom">
          <div className="p-4 space-y-2 border-b">
            <p className="text-sm font-medium">
              {format(day, "EEEE, MMMM d, yyyy")}
            </p>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-xs">
                {tasksForDay.length}{" "}
                {tasksForDay.length === 1 ? "task" : "tasks"}
              </Badge>
              {urgentTasks.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {urgentTasks.length} urgent
                </Badge>
              )}
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {tasksForDay.map((task) => (
              <div
                key={task.id}
                className="p-3 hover:bg-muted border-b last:border-b-0"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.projectName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {task.category && (
                      <TaskCategoryBadge category={task.category} />
                    )}
                    {task.priority && (
                      <TaskPriorityBadge priority={task.priority} />
                    )}
                  </div>
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="mt-2 w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full",
                      task.completionPercentage === 100
                        ? "bg-green-500"
                        : task.priority === "urgent"
                        ? "bg-destructive"
                        : "bg-primary"
                    )}
                    style={{ width: `${task.completionPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">
            {format(month, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span>Filter</span>
                {(selectedCategories.length > 0 ||
                  selectedPriorities.length > 0) && (
                  <span className="ml-1 rounded-full bg-primary w-5 h-5 text-[10px] flex items-center justify-center text-primary-foreground">
                    {selectedCategories.length + selectedPriorities.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <TaskFilter
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                selectedPriorities={selectedPriorities}
                setSelectedPriorities={setSelectedPriorities}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setMonth(new Date())}
          >
            Today
          </Button>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden bg-card shadow-sm">
        <DayPicker
          mode="single"
          showOutsideDays
          month={month}
          onMonthChange={setMonth}
          modifiers={{
            hasTask: (date) => getTasksForDay(date).length > 0,
          }}
          modifiersClassNames={{
            hasTask: "font-medium",
          }}
          className="mx-auto w-full"
          classNames={{
            months: "flex justify-center",
            month: "space-y-4 w-full",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button:
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex justify-center w-full",
            head_cell:
              "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem] flex items-center justify-center",
            row: "flex justify-center w-full mt-2",
            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 h-10 w-10 flex items-center justify-center",
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-center",
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground font-bold",
            day_outside: "text-muted-foreground bg-muted/20",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle:
              "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
          components={{
            Day: ({ date, displayMonth, ...props }: DayProps) => {
              // Return early if date is undefined
              if (!date) return <div {...props} />;

              const isOutsideMonth = !isSameMonth(date, displayMonth);
              const isTodayDate = isToday(date);
              const hasTask = getTasksForDay(date).length > 0;

              return (
                <div {...props}>
                  {hasTask && !isOutsideMonth ? (
                    renderTaskDetails(date)
                  ) : (
                    <div
                      className={cn(
                        "relative h-9 w-9 p-0 flex items-center justify-center",
                        isTodayDate &&
                          "rounded-full bg-primary text-primary-foreground",
                        isOutsideMonth &&
                          "text-muted-foreground opacity-70 bg-muted/20"
                      )}
                    >
                      <span className="inline-flex items-center justify-center">
                        {format(date, "d")}
                      </span>
                      {renderTaskIndicators(date)}
                    </div>
                  )}
                </div>
              );
            },
          }}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-20 space-y-2 bg-muted/30 rounded-md p-4">
          <p className="text-sm text-muted-foreground">
            No tasks with due dates found
          </p>
          {(selectedCategories.length > 0 || selectedPriorities.length > 0) && (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setSelectedCategories([]);
                setSelectedPriorities([]);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing {filteredTasks.length}{" "}
            {filteredTasks.length === 1 ? "task" : "tasks"}
          </p>
          {(selectedCategories.length > 0 || selectedPriorities.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategories([]);
                setSelectedPriorities([]);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
