"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma, TeamRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

// Schema for project creation/update validation
const ProjectSchema = z.object({
  name: z
    .string()
    .min(3, "Project name must be at least 3 characters")
    .max(50, "Project name must not exceed 50 characters"),
  description: z.string().optional(),
  teamId: z.string().optional(),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;

/**
 * Creates a new project in a workspace (team)
 */
export async function createProject(input: ProjectInput) {
  try {
    // Validate input
    const validatedInput = ProjectSchema.safeParse(input);
    
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0].message };
    }
    
    const { name, description, teamId } = validatedInput.data;
    
    const session = await auth();
    
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }
    
    const userId = session.user.id;
    
    // Special handling for individual workspace
    if (teamId === "individual") {
      // Create a personal project with null teamId
      const project = await prisma.project.create({
        data: {
          name,
          description,
          user: {
            connect: {
              id: userId
            }
          }
          // No teamId for personal projects
        },
      });
      
      revalidatePath("/dashboard");
      return { data: project };
    }
    
    // For team workspaces, check if user is a member of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });
    
    if (!teamMember) {
      return { error: "You don't have access to this team" };
    }
    
    // Create the project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        team: {
          connect: {
            id: teamId
          }
        }
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
 * Fetches all projects for a workspace (team)
 */
export async function getProjects(teamId: string) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }
    
    const userId = session.user.id;
    
    // Special handling for individual workspace
    if (teamId === "individual") {
      // Get all personal projects for the user
      const projects = await prisma.project.findMany({
        where: {
          teamId: null,
          user: {
            id: userId
          }
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
      
      return { data: projects };
    }
    
    // For team workspaces, check if user is a member of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });
    
    if (!teamMember) {
      return { error: "You don't have access to this team" };
    }
    
    // Get all projects for the team
    const projects = await prisma.project.findMany({
      where: {
        teamId,
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
    
    // Get the project with its team
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        team: true,
      },
    });
    
    if (!project) {
      return { error: "Project not found" };
    }
    
    // Check if user is a member of the team
    let teamMember = null;
    if (project.teamId) {
      teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: project.teamId,
          userId,
        },
      });
    }
    
    // Special case for individual workspace or if user is a team member
    if (!teamMember && project.teamId !== null) {
      return { error: "You don't have access to this project" };
    }
    
    // For individual projects, check if the user is the owner
    if (project.teamId === null && project.userId !== userId) {
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
    
    // Get the project with its team
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        team: true,
      },
    });
    
    if (!project) {
      return { error: "Project not found" };
    }
    
    // Check if user is a member of the team
    let teamMember = null;
    if (project.teamId) {
      teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: project.teamId,
          userId,
        },
      });
    }
    
    if (!teamMember && project.teamId !== null) {
      return { error: "You don't have access to this project" };
    }
    
    if (project.teamId === null && project.userId !== userId) {
      return { error: "You don't have access to this project" };
    }
    
    // Get task statistics
    const taskStats = await prisma.$transaction([
      prisma.task.count({ where: { projectId } }),
      prisma.task.count({ where: { projectId, completed: true } }),
    ]);
    
    return { 
      data: {
        total: taskStats[0],
        completed: taskStats[1],
      }
    };
  } catch (error) {
    console.error("Error getting project task stats:", error);
    return { error: "Failed to get project task statistics" };
  }
}

/**
 * Type for project task statistics
 */
export type ProjectTaskStats = {
  id: string;
  totalTasks: number;
  completedTasks: number;
  avgCompletionPercentage: number;
  name?: string;
};

/**
 * Get task statistics for all projects in a workspace
 */
export async function getWorkspaceProjectTaskStats(workspaceId: string): Promise<{ data?: ProjectTaskStats[]; error?: string }> {
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
          teamId: null,
          user: {
            id: userId
          }
        },
        select: {
          id: true,
        },
      });
      
      // Get task statistics for each project
      const projectIds = projects.map(p => p.id);
      
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
            avgCompletionPercentage: Number(stat.avgCompletionPercentage)
          }))
        : [];
      
      return { data: formattedStats };
    }
    
    // For team workspaces, check if user is a member of the team
    const team = await prisma.team.findUnique({
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
    
    if (!team) {
      return { error: "Team not found" };
    }
    
    if (team.members.length === 0) {
      return { error: "You don't have access to this team" };
    }
    
    // Get all projects in the workspace
    const projects = await prisma.project.findMany({
      where: {
        teamId: workspaceId,
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
        const taskStats = await prisma.$transaction([
          prisma.task.count({ where: { projectId: project.id } }),
          prisma.task.count({ where: { projectId: project.id, completed: true } }),
          prisma.task.aggregate({
            where: { projectId: project.id },
            _avg: { completionPercentage: true }
          })
        ]);
        
        return {
          id: project.id,
          name: project.name,
          totalTasks: Number(taskStats[0]),
          completedTasks: Number(taskStats[1]),
          avgCompletionPercentage: Number(taskStats[2]._avg.completionPercentage || 0)
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
    
    // Get the project with its team
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        team: true,
      },
    });
    
    if (!project) {
      return { error: "Project not found" };
    }
    
    // For individual projects, check if the user is the owner
    if (project.teamId === null && project.userId !== userId) {
      return { error: "You don't have permission to delete this project" };
    }
    
    // For team projects, check if user is a team member with appropriate permissions
    if (project.teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: project.teamId,
          userId,
        },
      });
      
      if (!teamMember) {
        return { error: "You don't have access to this team" };
      }
      
      // Implement role-based permission check
      // Only allow owners and admins to delete projects
      if (teamMember.role !== TeamRole.OWNER && teamMember.role !== TeamRole.ADMIN) {
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
