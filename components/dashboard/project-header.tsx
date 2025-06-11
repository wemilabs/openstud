"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProject, getProjectTaskStats } from "@/lib/actions/projects";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  workspaceId: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  workspace?: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

interface TaskStats {
  total: number;
  completed: number;
  avgCompletion: number;
}

interface ProjectHeaderProps {
  projectId: string;
}

/**
 * Project header component that displays project information and progress
 */
export function ProjectHeader({ projectId }: ProjectHeaderProps) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    avgCompletion: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate progress percentage
  const progressPercentage =
    taskStats.total > 0
      ? Math.round((taskStats.completed / taskStats.total) * 100)
      : 0;

  // Fetch project data and task stats
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);

        // Get project details
        const projectResult = await getProject(projectId);

        if (projectResult.error) {
          setError(projectResult.error);
          return;
        }

        if (!projectResult.data) {
          setError("Project data not found");
          return;
        }

        setProject(projectResult.data);

        // Get project task statistics
        const statsResult = await getProjectTaskStats(projectId);
        if (!statsResult.error) {
          setTaskStats({
            total: statsResult.totalTasks || 0,
            completed: statsResult.completedTasks || 0,
            avgCompletion: statsResult.avgCompletionPercentage || 0,
          });
        }
      } catch (err) {
        console.error("Error fetching project data:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to dashboard</span>
              </Link>
            </Button>
            <div className="text-center">
              <h2 className="text-xl font-semibold">Error</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col items-start sm:flex-row sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="size-5" />
              <span className="sr-only">Back to dashboard</span>
            </Link>
          </Button>
          <div>
            {loading ? (
              <>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </>
            ) : (
              <>
                <CardTitle className="text-2xl">{project?.name}</CardTitle>
                {project?.description && (
                  <CardDescription>{project.description}</CardDescription>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-40" />
            </div>
          ) : (
            <>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-sm">
                  <span className="font-medium">{progressPercentage}%</span>
                  <span className="text-muted-foreground">complete</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    <span>{taskStats.completed}</span>
                  </div>
                  <span>/</span>
                  <div className="flex items-center gap-1">
                    <Circle className="size-3" />
                    <span>{taskStats.total}</span>
                  </div>
                </div>
              </div>
              <div className="w-40">
                <Progress value={progressPercentage} className="size-2" />
              </div>
            </>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
