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
import { Folder, ArrowRight, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProjectCardProps {
  id: string;
  name: string;
  description?: string | null;
  teamId?: string | null;
  userId?: string | null;
  updatedAt: Date;
  taskStats?: {
    total: number;
    completed: number;
    avgCompletionPercentage?: number;
  };
}

/**
 * Project card component for displaying project information
 */
export function ProjectCard({
  id,
  name,
  description,
  updatedAt,
  taskStats,
}: ProjectCardProps) {
  const router = useRouter();

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

  return (
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
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
