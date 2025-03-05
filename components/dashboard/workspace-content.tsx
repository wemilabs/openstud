"use client";

import { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "@/contexts/workspace-context";
import { INDIVIDUAL_WORKSPACE } from "@/contexts/workspace-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Users, FileText, Calendar, Settings } from "lucide-react";
import { ProjectDialog } from "./project-dialog";
import { ProjectCard } from "./project-card";
import { getProjects, getWorkspaceProjectTaskStats } from "@/actions/projects";
import { toast } from "sonner";

// Project type definition
type Project = {
  id: string;
  name: string;
  description?: string | null;
  teamId?: string | null;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Workspace content component that displays different content based on the selected workspace
 */
export function WorkspaceContent() {
  const { currentWorkspace } = useWorkspace();
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskStats, setTaskStats] = useState<
    Record<
      string,
      {
        total: number;
        completed: number;
        avgCompletionPercentage?: number;
      }
    >
  >({});
  const [isLoading, setIsLoading] = useState(false);

  // Check if this is the individual workspace or a team workspace
  const isIndividual = currentWorkspace.id === INDIVIDUAL_WORKSPACE.id;

  /**
   * Fetch projects and their task statistics for the current workspace
   */
  const fetchProjects = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);

    try {
      const result = await getProjects(currentWorkspace.id);

      if (result.error) {
        toast.error(`Error: ${result.error}`);
        return;
      }

      if (result.data) {
        setProjects(result.data);

        // Fetch task statistics for all projects
        const statsResult = await getWorkspaceProjectTaskStats(
          currentWorkspace.id
        );
        if (statsResult.data) {
          const statsMap: Record<
            string,
            {
              total: number;
              completed: number;
              avgCompletionPercentage?: number;
            }
          > = {};

          statsResult.data.forEach((stat) => {
            statsMap[stat.id] = {
              total: Number(stat.totalTasks),
              completed: Number(stat.completedTasks),
              avgCompletionPercentage:
                stat.avgCompletionPercentage !== undefined
                  ? Number(stat.avgCompletionPercentage)
                  : undefined,
            };
          });

          setTaskStats(statsMap);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch projects");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  // Fetch projects when the workspace changes
  useEffect(() => {
    fetchProjects();
  }, [currentWorkspace, fetchProjects]);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="grid gap-4">
      {/* Workspace header with info and actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl">
              {isIndividual ? "Individual Space" : currentWorkspace.name}
            </CardTitle>
            <CardDescription>
              {isIndividual
                ? "Your personal workspace for individual study and projects"
                : `Collaborative workspace (${currentWorkspace.role.toLowerCase()})`}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            {!isIndividual && (
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Members
              </Button>
            )}
            <Button onClick={() => setOpenProjectDialog(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Project creation dialog */}
      <ProjectDialog
        open={openProjectDialog}
        onOpenChange={setOpenProjectDialog}
        workspaceId={currentWorkspace.id}
        onProjectCreated={() => {
          fetchProjects();
        }}
      />

      {/* Workspace content tabs */}
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          {!isIndividual && (
            <TabsTrigger value="settings">Settings</TabsTrigger>
          )}
        </TabsList>

        {/* Projects tab */}
        <TabsContent value="projects" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>
                {isIndividual
                  ? "Manage your personal projects and assignments"
                  : "Collaborate on team projects and assignments"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Project creation card */}
                <Card
                  className="border-dashed border-2 hover:border-primary/50 cursor-pointer transition-colors"
                  onClick={() => setOpenProjectDialog(true)}
                >
                  <CardContent className="flex flex-col items-center justify-center h-40">
                    <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Create New Project</p>
                  </CardContent>
                </Card>

                {/* Display projects */}
                {isLoading ? (
                  <Card className="h-40">
                    <CardContent className="flex items-center justify-center h-full">
                      <p className="text-sm text-muted-foreground">
                        Loading projects...
                      </p>
                    </CardContent>
                  </Card>
                ) : projects.length > 0 ? (
                  projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      id={project.id}
                      name={project.name}
                      description={project.description}
                      updatedAt={new Date(project.updatedAt)}
                      teamId={project.teamId}
                      taskStats={taskStats[project.id]}
                    />
                  ))
                ) : (
                  <Card className="h-40">
                    <CardContent className="flex flex-col items-center justify-center h-full">
                      <p className="text-sm text-muted-foreground">
                        No projects yet
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setOpenProjectDialog(true)}
                      >
                        Create your first project
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents tab */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                {isIndividual
                  ? "Access your study materials and notes"
                  : "Share and collaborate on documents with your team"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Document upload card */}
                <Card className="border-dashed border-2 hover:border-primary/50 cursor-pointer transition-colors">
                  <CardContent className="flex flex-col items-center justify-center h-40">
                    <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Upload Document</p>
                  </CardContent>
                </Card>

                {/* We'll add actual documents here later */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar tab */}
        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>
                {isIndividual
                  ? "Track your deadlines and schedule"
                  : "Coordinate team schedules and deadlines"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border rounded-md bg-muted/20">
                <div className="text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Calendar view coming soon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings tab (only for team workspaces) */}
        {!isIndividual && (
          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Workspace Settings</CardTitle>
                <CardDescription>
                  Manage workspace settings and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <h3 className="text-sm font-medium">Workspace Name</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{currentWorkspace.name}</p>
                      {currentWorkspace.role === "OWNER" && (
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <h3 className="text-sm font-medium">Your Role</h3>
                    <p className="text-sm">{currentWorkspace.role}</p>
                  </div>

                  {currentWorkspace.role === "OWNER" && (
                    <div className="grid gap-2 pt-4">
                      <Button variant="destructive" size="sm" className="w-fit">
                        Delete Workspace
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
