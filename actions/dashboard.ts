"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Fetches task completion statistics by category for the specified workspace
 * @param workspaceId The ID of the workspace to fetch statistics for. If not provided, fetches for all user's workspaces.
 */
export async function getTaskStatsByCategory(workspaceId?: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return { error: "Unauthorized" };
    }
    
    // Get projects based on workspace filter
    let projectsQuery: any = {
      where: {
        OR: [
          // Individual projects
          {
            userId,
          },
          // Team projects where user is a member
          {
            team: {
              members: {
                some: {
                  userId,
                }
              }
            }
          }
        ]
      },
      select: {
        id: true,
      }
    };
    
    // If a specific workspace is provided, filter projects by that workspace
    if (workspaceId) {
      if (workspaceId === 'individual') {
        // For individual workspace, only include projects with userId
        projectsQuery.where = {
          userId,
          teamId: null
        };
      } else {
        // For team workspace, only include projects with that teamId
        projectsQuery.where = {
          teamId: workspaceId
        };
      }
    }
    
    const userProjects = await prisma.project.findMany(projectsQuery);
    const projectIds = userProjects.map(project => project.id);
    
    // Get task statistics by category with average completion percentage
    const taskStats = await prisma.task.groupBy({
      by: ['category'],
      where: {
        projectId: {
          in: projectIds
        }
      },
      _count: {
        id: true
      },
      _avg: {
        completionPercentage: true
      }
    });
    
    // Transform the data for the chart
    const formattedStats = taskStats.map(stat => ({
      name: stat.category || 'Uncategorized',
      total: Math.round(stat._avg.completionPercentage || 0),
      count: stat._count.id
    }));
    
    return { data: formattedStats };
  } catch (error) {
    console.error("Error fetching task statistics:", error);
    return { error: "Failed to fetch task statistics" };
  }
}

/**
 * Fetches recent activity for the specified workspace
 * @param workspaceId The ID of the workspace to fetch activity for. If not provided, fetches for all user's workspaces.
 */
export async function getRecentActivity(workspaceId?: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return { error: "Unauthorized" };
    }
    
    // Get projects based on workspace filter
    let projectsQuery: any = {
      where: {
        OR: [
          // Individual projects
          {
            userId,
          },
          // Team projects where user is a member
          {
            team: {
              members: {
                some: {
                  userId,
                }
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
      }
    };
    
    // If a specific workspace is provided, filter projects by that workspace
    if (workspaceId) {
      if (workspaceId === 'individual') {
        // For individual workspace, only include projects with userId
        projectsQuery.where = {
          userId,
          teamId: null
        };
      } else {
        // For team workspace, only include projects with that teamId
        projectsQuery.where = {
          teamId: workspaceId
        };
      }
    }
    
    const userProjects = await prisma.project.findMany(projectsQuery);
    const projectIds = userProjects.map(project => project.id);
    const projectNames = userProjects.reduce((acc, project) => {
      acc[project.id] = project.name;
      return acc;
    }, {} as Record<string, string>);
    
    // Get recent tasks with updates
    const recentTasks = await prisma.task.findMany({
      where: {
        projectId: {
          in: projectIds
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        title: true,
        category: true,
        completionPercentage: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
        projectId: true
      }
    });
    
    // Transform the data for the activity feed
    const activities = recentTasks.map(task => {
      // Determine activity type based on task state
      let type: 'created' | 'updated' | 'completed' | 'progress' = 'updated';
      let description = '';
      
      // If created and updated at are close, it's a new task
      const isNewTask = Math.abs(task.createdAt.getTime() - task.updatedAt.getTime()) < 1000 * 60; // 1 minute
      
      if (isNewTask) {
        type = 'created';
        description = `Created task '${task.title}' in ${projectNames[task.projectId]}`;
      } else if (task.completed) {
        type = 'completed';
        description = `Completed task '${task.title}' in ${projectNames[task.projectId]}`;
      } else if (task.completionPercentage > 0) {
        type = 'progress';
        description = `Updated progress to ${task.completionPercentage}% on '${task.title}' in ${projectNames[task.projectId]}`;
      } else {
        description = `Updated task '${task.title}' in ${projectNames[task.projectId]}`;
      }
      
      return {
        id: task.id,
        type,
        description,
        date: task.updatedAt,
        category: task.category,
        projectName: projectNames[task.projectId],
        taskTitle: task.title,
        completionPercentage: task.completionPercentage
      };
    });
    
    return { data: activities };
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return { error: "Failed to fetch recent activity" };
  }
}
