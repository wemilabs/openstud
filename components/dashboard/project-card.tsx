"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/tasks/progress-bar";
import { Folder, ArrowRight, Clock, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteProject } from "@/actions/projects";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectCardProps {
  id: string;
  name: string;
  description?: string | null;
  workspaceId?: string | null;
  userId?: string | null;
  updatedAt: Date;
  taskStats?: {
    total: number;
    completed: number;
    avgCompletionPercentage?: number;
  };
  onProjectDeleted?: () => void;
}

/**
 * Project card component for displaying project information
 */
export function ProjectCard({
  id,
  name,
  description,
  workspaceId,
  updatedAt,
  taskStats,
  onProjectDeleted,
}: ProjectCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate progress percentage based on completed tasks or use average completion percentage
  const progressPercentage =
    taskStats?.avgCompletionPercentage !== undefined
      ? Math.round(Number(taskStats.avgCompletionPercentage))
      : taskStats && taskStats.total > 0
      ? Math.round(
          (Number(taskStats.completed) / Number(taskStats.total)) * 100
        )
      : 0;

  // Navigate to project page
  const navigateToProject = () => {
    router.push(`/dashboard/projects/${id}`);
  };

  // Handle project deletion
  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteProject(id);

      if (result.error) {
        toast.error(`Error: ${result.error}`);
        return;
      }

      toast.success("Project deleted successfully");

      // Call the onProjectDeleted callback if provided
      if (onProjectDeleted) {
        onProjectDeleted();
      } else {
        // Refresh the page if no callback provided
        router.refresh();
      }
    } catch (error) {
      let errorMessage = "Failed to delete project";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Handle delete button click
  const onDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event from triggering
    setShowDeleteConfirm(true);
  };

  return (
    <>
      <Card
        className="hover:border-primary/50 transition-colors cursor-pointer"
        onClick={navigateToProject}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{name}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDeleteClick}
              title="Delete project"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete project</span>
            </Button>
          </div>
          {description && (
            <CardDescription className="line-clamp-2 mt-1">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <Clock className="h-3 w-3 mr-1" />
            <span>Updated {formatDate(updatedAt)}</span>
          </div>
          {taskStats && (
            <div className="space-y-2">
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{progressPercentage}%</span>
                </div>
                <ProgressBar
                  value={progressPercentage}
                  indicatorClassName={
                    progressPercentage < 25
                      ? "bg-red-500"
                      : progressPercentage < 50
                      ? "bg-orange-500"
                      : progressPercentage < 75
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="ghost" size="sm" className="ml-auto gap-1">
            <span>View Project</span>
            <ArrowRight className="size-4" />
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{name}"? This action cannot be
              undone and will delete all tasks associated with this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-destructive dark:text-primary hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
