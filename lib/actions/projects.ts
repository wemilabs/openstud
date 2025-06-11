"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma, WorkspaceRole } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";

// Schema for project creation/update validation
const ProjectSchema = z.object({
  name: z
    .string()
    .min(3, "Project name must be at least 3 characters")
    .max(50, "Project name must not exceed 50 characters"),
  description: z.string().optional(),
  workspaceId: z.string().optional(),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;

// Type for project task statistics
export type ProjectTaskStats = {
  id: string;
  totalTasks: number;
  completedTasks: number;
  avgCompletionPercentage: number;
  name?: string;
};

// Type for task aggregate result
type TaskAggregateResult = {
  _avg: {
    completionPercentage: number | null;
  };
};

/**
 * Creates a new project in a workspace (workspace)
 */
export async function createProject(input: ProjectInput) {
  try {
    // Validate input
    const validatedInput = ProjectSchema.safeParse(input);

    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0].message };
    }

    const { name, description, workspaceId } = validatedInput.data;

    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Special handling for individual workspace
    if (workspaceId === "individual") {
      // Create a personal project with null workspaceId
      const project = await prisma.project.create({
        data: {
          name,
          description,
          user: {
            connect: {
              id: userId,
            },
          },
        },
      });

      revalidatePath("/dashboard");
      return { data: project };
    }

    // For workspace workspaces, check if user is a member of the workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    if (!workspaceMember) {
      return { error: "You don't have access to this workspace" };
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        workspace: {
          connect: {
            id: workspaceId,
          },
        },
      },
    });

    revalidatePath("/dashboard");

    return { data: project };
  } catch (error) {
    console.error("Error creating project:", error);
    return { error: "Failed to create project" };
  }
}

/**
 * Fetches all projects for a workspace (workspace)
 */
export async function getProjects(workspaceId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Special handling for individual workspace
    if (workspaceId === "individual") {
      // Get all personal projects for the user
      const projects = await prisma.project.findMany({
        where: {
          workspaceId: null,
          user: {
            id: userId,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      return { data: projects };
    }

    // For workspace workspaces, check if user is a member of the workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    if (!workspaceMember) {
      return { error: "You don't have access to this workspace" };
    }

    // Get all projects for the workspace
    const projects = await prisma.project.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return { data: projects };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { error: "Failed to fetch projects" };
  }
}

/**
 * Fetches a specific project by ID
 */
export async function getProject(projectId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Get the project with its workspace
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        workspace: true,
      },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    // Check if user is a member of the workspace
    let workspaceMember = null;
    if (project.workspaceId) {
      workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: project.workspaceId,
          userId,
        },
      });
    }

    // Special case for individual workspace or if user is a workspace member
    if (!workspaceMember && project.workspaceId !== null) {
      return { error: "You don't have access to this project" };
    }

    // For individual projects, check if the user is the owner
    if (project.workspaceId === null && project.userId !== userId) {
      return { error: "You don't have access to this project" };
    }

    return { data: project };
  } catch (error) {
    console.error("Error fetching project:", error);
    return { error: "Failed to fetch project" };
  }
}

/**
 * Get project task statistics
 */
export async function getProjectTaskStats(projectId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Get the project with its workspace
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        workspace: true,
      },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    // Check if user is a member of the workspace
    let workspaceMember = null;
    if (project.workspaceId) {
      workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: project.workspaceId,
          userId,
        },
      });
    }

    if (!workspaceMember && project.workspaceId !== null) {
      return { error: "You don't have access to this project" };
    }

    if (project.workspaceId === null && project.userId !== userId) {
      return { error: "You don't have access to this project" };
    }

    // Get task statistics using separate queries instead of transaction
    const [totalTasks, completedTasks, avgResult] = await Promise.all([
      prisma.task.count({ where: { projectId } }),
      prisma.task.count({ where: { projectId, completed: true } }),
      prisma.task.aggregate({
        where: { projectId },
        _avg: { completionPercentage: true },
      }) as unknown as Promise<TaskAggregateResult>,
    ]);

    // Safely handle potential undefined/null values
    const avgCompletion = avgResult?._avg?.completionPercentage ?? 0;

    return {
      id: project.id,
      name: project.name,
      totalTasks: Number(totalTasks ?? 0),
      completedTasks: Number(completedTasks ?? 0),
      avgCompletionPercentage: Number(avgCompletion),
    };
  } catch (error) {
    console.error("Error getting project task stats:", error);
    return { error: "Failed to get project task statistics" };
  }
}

/**
 * Get task statistics for all projects in a workspace
 */
export async function getWorkspaceProjectTaskStats(
  workspaceId: string
): Promise<{ data?: ProjectTaskStats[]; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Special handling for individual workspace
    if (workspaceId === "individual") {
      // Get all personal projects for the user
      const projects = await prisma.project.findMany({
        where: {
          workspaceId: null,
          user: {
            id: userId,
          },
        },
        select: {
          id: true,
        },
      });

      // Get task statistics for each project
      const projectIds = projects.map((p) => p.id);

      if (projectIds.length === 0) {
        return { data: [] };
      }

      // Get task counts for all projects
      const projectStats = await prisma.$queryRaw`
        SELECT 
          p.id, 
          COUNT(t.id) as "totalTasks", 
          COUNT(CASE WHEN t.completed = true THEN 1 END) as "completedTasks",
          COALESCE(AVG(t."completionPercentage"), 0) as "avgCompletionPercentage"
        FROM "Project" p
        LEFT JOIN "Task" t ON p.id = t."projectId"
        WHERE p.id IN (${Prisma.join(projectIds)})
        GROUP BY p.id
      `;

      // Convert BigInt values to numbers
      const formattedStats = Array.isArray(projectStats)
        ? projectStats.map((stat: any) => ({
            id: stat.id,
            totalTasks: Number(stat.totalTasks),
            completedTasks: Number(stat.completedTasks),
            avgCompletionPercentage: Number(stat.avgCompletionPercentage),
          }))
        : [];

      return { data: formattedStats };
    }

    // For workspace workspaces, check if user is a member of the workspace
    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
      include: {
        members: {
          where: {
            userId,
          },
        },
      },
    });

    if (!workspace) {
      return { error: "Workspace not found" };
    }

    if (workspace.members.length === 0) {
      return { error: "You don't have access to this workspace" };
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

    if (!projects.length) {
      return { data: [] };
    }

    // Get task stats for each project
    const projectStats = await Promise.all(
      projects.map(async (project) => {
        const [totalTasks, completedTasks, avgResult] = await Promise.all([
          prisma.task.count({ where: { projectId: project.id } }),
          prisma.task.count({
            where: { projectId: project.id, completed: true },
          }),
          prisma.task.aggregate({
            where: { projectId: project.id },
            _avg: { completionPercentage: true },
          }) as unknown as Promise<TaskAggregateResult>,
        ]);

        // Safely handle potential undefined/null values
        const avgCompletion = avgResult?._avg?.completionPercentage ?? 0;

        return {
          id: project.id,
          name: project.name,
          totalTasks: Number(totalTasks ?? 0),
          completedTasks: Number(completedTasks ?? 0),
          avgCompletionPercentage: Number(avgCompletion),
        };
      })
    );

    return { data: Array.isArray(projectStats) ? projectStats : [] };
  } catch (error) {
    console.error("Error getting workspace project task stats:", error);
    return { error: "Failed to get workspace project task statistics" };
  }
}

/**
 * Deletes a project by ID
 */
export async function deleteProject(projectId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Get the project with its workspace
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        workspace: true,
      },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    // For individual projects, check if the user is the owner
    if (project.workspaceId === null && project.userId !== userId) {
      return { error: "You don't have permission to delete this project" };
    }

    // For workspace projects, check if user is a workspace member with appropriate permissions
    if (project.workspaceId) {
      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: project.workspaceId,
          userId,
        },
      });

      if (!workspaceMember) {
        return { error: "You don't have access to this workspace" };
      }

      // Implement role-based permission check
      // Only allow owners and admins to delete projects
      if (
        workspaceMember.role !== WorkspaceRole.OWNER &&
        workspaceMember.role !== WorkspaceRole.ADMIN
      ) {
        return { error: "You don't have permission to delete this project" };
      }
    }

    // Delete all tasks associated with the project first
    await prisma.task.deleteMany({
      where: {
        projectId,
      },
    });

    // Delete the project
    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { error: "Failed to delete project" };
  }
}
