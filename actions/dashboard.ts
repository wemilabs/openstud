"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Fetches task completion statistics by category for the current user
 */
export async function getTaskStatsByCategory() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return { error: "Unauthorized" };
    }
    
    // Get all projects for the user (both individual and team projects)
    const userProjects = await prisma.project.findMany({
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
    });
    
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
    const chartData = taskStats.map(stat => {
      const category = stat.category || 'other';
      const total = stat._count.id;
      const avgCompletion = Math.round(stat._avg.completionPercentage || 0);
      
      return {
        name: category.charAt(0).toUpperCase() + category.slice(1),
        total: avgCompletion,
      };
    });
    
    return { data: chartData };
  } catch (error) {
    console.error("Error fetching task stats:", error);
    return { error: "Failed to fetch task statistics" };
  }
}

/**
 * Fetches recent activity for the current user
 */
export async function getRecentActivity() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Get all projects the user has access to
    const userProjects = await prisma.project.findMany({
      where: {
        OR: [
          { userId: userId }, // User's own projects
          {
            team: {
              members: {
                some: {
                  userId: userId
                }
              }
            }
          } // Team projects where user is a member
        ]
      },
      select: {
        id: true
      }
    });
    
    const projectIds = userProjects.map(project => project.id);
    
    // Get recent tasks with their project names
    const recentTasks = await prisma.task.findMany({
      where: {
        projectId: {
          in: projectIds
        }
      },
      include: {
        project: {
          select: {
            name: true
          }
        },
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });
    
    // Format the activity data
    const activityData = recentTasks.map(task => {
      // Determine activity type based on task properties
      let activityType = "updated";
      let description = "";
      
      if (new Date(task.createdAt).getTime() === new Date(task.updatedAt).getTime()) {
        activityType = "created";
        description = `Created task "${task.title}" in ${task.project.name}`;
      } else if (task.completed) {
        activityType = "completed";
        description = `Completed task "${task.title}" in ${task.project.name}`;
      } else if (task.completionPercentage > 0) {
        activityType = "progress";
        description = `Updated progress to ${task.completionPercentage}% on "${task.title}" in ${task.project.name}`;
      } else {
        description = `Updated task "${task.title}" in ${task.project.name}`;
      }
      
      return {
        id: task.id,
        type: activityType,
        description,
        date: task.updatedAt,
        category: task.category,
        projectName: task.project.name,
        taskTitle: task.title,
        completionPercentage: task.completionPercentage
      };
    });
    
    return { data: activityData };
  } catch (error) {
    console.error("Error getting recent activity:", error);
    return { error: "Failed to get recent activity" };
  }
}
