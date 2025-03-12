"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

// Schema for task creation/update validation
const TaskSchema = z.object({
  title: z
    .string()
    .min(3, "Task title must be at least 3 characters")
    .max(100, "Task title must not exceed 100 characters"),
  description: z.string().optional().nullable(),
  completed: z.boolean().optional().default(false),
  completionPercentage: z.number().min(0).max(100).optional().default(0),
  dueDate: z.date().optional().nullable(),
  projectId: z.string(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().nullable(),
  category: z.enum([
    "assignment", 
    "exam", 
    "presentation", 
    "lab", 
    "reading", 
    "project", 
    "study", 
    "other"
  ]).optional().nullable(),
});

export type TaskInput = z.infer<typeof TaskSchema>;

/**
 * Creates a new task in a project
 */
export async function createTask(input: TaskInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    console.log("Creating task with user ID:", userId);

    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Validate input data
    try {
      const validatedData = TaskSchema.parse(input);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return { error: validationError.errors[0].message };
      }
      return { error: "Invalid input data" };
    }
    
    const validatedData = TaskSchema.parse(input);

    // Get the project to check if user has access
    const project = await prisma.project.findUnique({
      where: {
        id: validatedData.projectId,
      },
      include: {
        team: true,
      },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    // Special case for individual workspace
    if (project.teamId === null) {
      // Check if the user is the owner of the project
      if (project.userId !== userId) {
        return { error: "You don't have access to this project" };
      }
      
      // Create task directly
      const task = await prisma.task.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          completed: validatedData.completed,
          completionPercentage: validatedData.completionPercentage,
          dueDate: validatedData.dueDate,
          projectId: validatedData.projectId,
          priority: validatedData.priority,
          category: validatedData.category,
          createdById: userId, // Store who created the task
        },
      });
      
      revalidatePath(`/dashboard/projects/${validatedData.projectId}`);
      return { data: task };
    }

    // Check if user is a member of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: project.teamId,
          userId,
        },
      },
    });

    if (!teamMember) {
      return { error: "You are not a member of this project's workspace" };
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        completed: validatedData.completed,
        completionPercentage: validatedData.completionPercentage,
        dueDate: validatedData.dueDate,
        projectId: validatedData.projectId,
        priority: validatedData.priority,
        category: validatedData.category,
        createdById: userId, // Add user ID to track who created the task in team projects
      },
    });
    
    revalidatePath(`/dashboard/projects/${validatedData.projectId}`);
    return { data: task };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create task: " + (error instanceof Error ? error.message : "Unknown error") };
  }
}

/**
 * Updates an existing task
 */
export async function updateTask(taskId: string, input: Partial<TaskInput>) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Get the task with project and team info
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!task) {
      return { error: "Task not found" };
    }
    
    // Check if user is the task creator
    if (task.createdById && task.createdById !== userId) {
      return { error: "Only the task creator can edit this task" };
    }

    // Special case for individual workspace
    if (task.project.teamId === null) {
      // Check if the user is the owner of the project
      if (task.project.userId !== userId) {
        return { error: "You don't have access to this project" };
      }
      
      // Update task directly
      const updatedTask = await prisma.task.update({
        where: {
          id: taskId,
        },
        data: {
          title: input.title,
          description: input.description,
          completed: input.completed,
          completionPercentage: input.completionPercentage,
          dueDate: input.dueDate,
          priority: input.priority,
          category: input.category,
        },
      });
      
      revalidatePath(`/dashboard/projects/${task.projectId}`);
      return { data: updatedTask };
    }

    // Check if user is a member of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: task.project.teamId,
          userId,
        },
      },
    });

    if (!teamMember) {
      return { error: "You are not a member of this task's workspace" };
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        title: input.title,
        description: input.description,
        completed: input.completed,
        completionPercentage: input.completionPercentage,
        dueDate: input.dueDate,
        priority: input.priority,
        category: input.category,
      },
    });
    
    revalidatePath(`/dashboard/projects/${task.projectId}`);
    return { data: updatedTask };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update task: " + (error instanceof Error ? error.message : "Unknown error") };
  }
}

/**
 * Deletes a task
 */
export async function deleteTask(taskId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Get the task with project and team info
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!task) {
      return { error: "Task not found" };
    }

    // Special case for individual workspace
    if (task.project.teamId === null) {
      // Check if the user is the owner of the project
      if (task.project.userId !== userId) {
        return { error: "You don't have access to this project" };
      }
      
      // Project owner can delete any task
      const deletedTask = await prisma.task.delete({
        where: {
          id: taskId,
        },
      });
      
      revalidatePath(`/dashboard/projects/${task.projectId}`);
      return { data: deletedTask };
    }

    // For team workspace
    // Check if user is a member of the team with appropriate role
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: task.project.teamId,
          userId,
        },
      },
    });

    if (!teamMember) {
      return { error: "You are not a member of this project's workspace" };
    }

    // Check if user is either:
    // 1. The task creator
    // 2. Team owner/admin who can delete any task
    const isTaskCreator = task.createdById === userId;
    const isTeamOwnerOrAdmin = ['OWNER', 'ADMIN'].includes(teamMember.role);
    
    if (!isTaskCreator && !isTeamOwnerOrAdmin) {
      return { error: "Only task creators and workspace owners/admins can delete tasks" };
    }

    // Delete the task
    const deletedTask = await prisma.task.delete({
      where: {
        id: taskId,
      },
    });
    
    revalidatePath(`/dashboard/projects/${task.projectId}`);
    return { data: deletedTask };
  } catch (error) {
    return { error: "Failed to delete task: " + (error instanceof Error ? error.message : "Unknown error") };
  }
}

/**
 * Fetches all tasks for a project
 */
export async function getTasks(projectId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return { error: "Unauthorized" };
    }
    
    // Check if the project exists and user has access
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
    
    // Check if user has access to the team/workspace
    let hasAccess = false;
    
    // For individual projects (no teamId)
    if (project.teamId === null) {
      // Check if the user is the owner of the project
      hasAccess = project.userId === userId;
    } else {
      // For team projects, check if user is a team member
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: project.teamId,
            userId,
          },
        },
      });
      
      hasAccess = !!teamMember;
    }
    
    if (!hasAccess) {
      return { error: "You don't have access to this project" };
    }
    
    // Fetch tasks for the project
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return { tasks };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return { error: "Failed to fetch tasks" };
  }
}
