"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

/**
 * Fetches all tasks with due dates from all projects in a workspace
 */
export async function getWorkspaceTasks(workspaceId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "Unauthorized" };
    }

    // For individual workspace
    if (workspaceId === "individual") {
      // Get all projects owned by the user
      const projects = await prisma.project.findMany({
        where: {
          userId,
          workspaceId: null,
        },
        select: {
          id: true,
          name: true,
        },
      });

      // Get all tasks with due dates from these projects
      const tasks = await prisma.task.findMany({
        where: {
          projectId: {
            in: projects.map((project) => project.id),
          },
          dueDate: {
            not: null,
          },
        },
        orderBy: {
          dueDate: "asc",
        },
      });

      // Map tasks to include project name
      const tasksWithProject = tasks.map((task) => {
        const project = projects.find((p) => p.id === task.projectId);
        return {
          ...task,
          projectName: project?.name || "Unknown Project",
        };
      });

      return { data: tasksWithProject };
    }

    // First check if user is a member of the workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!workspaceMember) {
      return { error: "You are not a member of this workspace" };
    }

    // Get all projects in the workspace
    const projects = await prisma.project.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Get all tasks with due dates from these projects
    const tasks = await prisma.task.findMany({
      where: {
        projectId: {
          in: projects.map((project) => project.id),
        },
        dueDate: {
          not: null,
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Map tasks to include project name
    const tasksWithProject = tasks.map((task) => {
      const project = projects.find((p) => p.id === task.projectId);
      return {
        ...task,
        projectName: project?.name || "Unknown Project",
      };
    });

    return { data: tasksWithProject };
  } catch (error) {
    console.error("Error fetching workspace tasks:", error);
    return { error: "Failed to fetch tasks" };
  }
}
