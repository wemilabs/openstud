"use client";

import { useState, useEffect, useCallback } from "react";
import {
  format,
  isEqual,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  const getTasksForDay = useCallback(
    (day: Date | any) => {
      // Ensure we're working with a proper Date object
      const dateToCheck = day instanceof Date ? day : new Date();

      return filteredTasks.filter(
        (task) =>
          task.dueDate &&
          isEqual(
            new Date(task.dueDate).setHours(0, 0, 0, 0),
            new Date(dateToCheck).setHours(0, 0, 0, 0)
          )
      );
    },
    [filteredTasks]
  );

  // Function to render task indicators for a day
  const renderTaskIndicators = useCallback(
    (day: Date | any) => {
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
    },
    [getTasksForDay]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">
            {month.toLocaleString("default", { month: "long" })}{" "}
            {month.getFullYear()}
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

      <div className="border rounded-md overflow-hidden bg-card shadow-sm p-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMonth(subMonths(month, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h2 className="text-lg font-medium">{format(month, "MMMM yyyy")}</h2>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {(() => {
            // Get all days in the current month
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const startDate = monthStart;
            const endDate = monthEnd;

            // Get all days in the interval
            const days = eachDayOfInterval({ start: startDate, end: endDate });

            // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
            const startDay = getDay(monthStart);

            // Create an array to hold all calendar cells
            const calendarCells = [];

            // Add empty cells for days before the start of the month
            for (let i = 0; i < startDay; i++) {
              calendarCells.push(
                <div
                  key={`empty-start-${i}`}
                  className="h-12 text-center text-muted-foreground/40"
                >
                  {/* Empty cell */}
                </div>
              );
            }

            // Add cells for each day of the month
            days.forEach((day) => {
              const hasTask = getTasksForDay(day).length > 0;
              const isTodayDate = isToday(day);

              calendarCells.push(
                <div key={day.toISOString()} className="h-12 relative">
                  {hasTask ? (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div
                          className={cn(
                            "h-full w-full flex items-center justify-center rounded-md cursor-pointer",
                            isTodayDate
                              ? "bg-primary text-primary-foreground font-bold"
                              : "hover:bg-muted/60"
                          )}
                        >
                          <span>{format(day, "d")}</span>
                          {renderTaskIndicators(day)}
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 p-0" side="bottom">
                        <div className="p-4 space-y-2 border-b">
                          <p className="text-sm font-medium">
                            {day.toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs">
                              {getTasksForDay(day).length}{" "}
                              {getTasksForDay(day).length === 1
                                ? "task"
                                : "tasks"}
                            </Badge>
                            {getTasksForDay(day).filter(
                              (task) => task.priority === "urgent"
                            ).length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {
                                  getTasksForDay(day).filter(
                                    (task) => task.priority === "urgent"
                                  ).length
                                }{" "}
                                urgent
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {getTasksForDay(day).map((task) => (
                            <div
                              key={task.id}
                              className="p-3 hover:bg-muted border-b last:border-b-0"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium">
                                    {task.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {task.projectName}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end space-y-1">
                                  {task.category && (
                                    <TaskCategoryBadge
                                      category={task.category}
                                    />
                                  )}
                                  {task.priority && (
                                    <TaskPriorityBadge
                                      priority={task.priority}
                                    />
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
                                  style={{
                                    width: `${task.completionPercentage}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  ) : (
                    <div
                      className={cn(
                        "h-full w-full flex items-center justify-center",
                        isTodayDate &&
                          "bg-accent text-accent-foreground font-bold rounded-md"
                      )}
                    >
                      <span>{format(day, "d")}</span>
                    </div>
                  )}
                </div>
              );
            });

            // Calculate how many cells we need to fill the last row
            const totalCells = calendarCells.length;
            const rowSize = 7;
            const rowsNeeded = Math.ceil(totalCells / rowSize);
            const cellsNeeded = rowsNeeded * rowSize;
            const emptyCellsToAdd = cellsNeeded - totalCells;

            // Add empty cells for days after the end of the month
            for (let i = 0; i < emptyCellsToAdd; i++) {
              calendarCells.push(
                <div
                  key={`empty-end-${i}`}
                  className="h-12 text-center text-muted-foreground/40"
                >
                  {/* Empty cell */}
                </div>
              );
            }

            return calendarCells;
          })()}
        </div>
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
