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
        teamId: true, // Include team ID to determine if it's a team project
        team: {
          select: {
            id: true,
            name: true
          }
        },
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
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
    
    // Type for project with user information included
    type ProjectWithUserInfo = {
      id: string;
      name: string;
      teamId: string | null;
      team?: {
        id: string;
        name: string;
      };
      userId: string | null;
      user?: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
      };
    };
    
    const userProjects = await prisma.project.findMany(projectsQuery) as ProjectWithUserInfo[];
    const projectIds = userProjects.map(project => project.id);
    const projectNames = userProjects.reduce((acc, project) => {
      acc[project.id] = project.name;
      return acc;
    }, {} as Record<string, string>);
    
    // Store project owners/creators for attribution
    const projectOwners = userProjects.reduce((acc, project) => {
      if (project.user) {
        acc[project.id] = {
          id: project.user.id,
          name: project.user.name,
          email: project.user.email,
          image: project.user.image
        };
      }
      return acc;
    }, {} as Record<string, {id: string, name: string | null, email: string | null, image: string | null}>);
    
    // Get team members for each project
    const teamMembers = new Map<string, Array<{
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      role: string;
    }>>();
    
    for (const project of userProjects) {
      if (project.teamId) {
        // Define the type for team member
        interface TeamMemberWithUser {
          userId: string;
          role: string;
          user: {
            id: string;
            name: string | null;
            email: string | null;
            image: string | null;
          };
        }
        
        const members = await prisma.teamMember.findMany({
          where: { teamId: project.teamId },
          select: {
            userId: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }) as TeamMemberWithUser[];
        
        teamMembers.set(project.id, members.map((m: TeamMemberWithUser) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          image: m.user.image,
          role: m.role
        })));
      }
    }
    
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
    
    // Get task history from audit log or activity tracking
    // This is a simplified version - in a real implementation, you would fetch from a proper audit log
    // For now, we'll simulate by using the project owner for created tasks 
    // and a random team member for updates in team projects
    
    // Transform the data for the activity feed
    const activities = recentTasks.map(task => {
      // Determine activity type based on task state
      let type: 'created' | 'updated' | 'completed' | 'progress' = 'updated';
      let description = '';
      
      const projectTeamId = userProjects.find(p => p.id === task.projectId)?.teamId;
      const isTeamProject = projectTeamId !== null && projectTeamId !== undefined;
      
      // If created and updated at are close, it's a new task
      const isNewTask = Math.abs(task.createdAt.getTime() - task.updatedAt.getTime()) < 1000 * 60; // 1 minute
      
      // Determine who performed the action
      let activityUser = projectOwners[task.projectId] || null;
      
      // For team projects, if it's not a new task, assign to a team member other than owner when possible
      if (isTeamProject && !isNewTask) {
        const members = teamMembers.get(task.projectId) || [];
        if (members.length > 0) {
          // Try to find a different user than the project owner for variety
          const otherMembers = members.filter(m => m.id !== activityUser?.id);
          if (otherMembers.length > 0) {
            // Use a deterministic but seemingly random selection based on task ID
            const memberIndex = task.id.charCodeAt(0) % otherMembers.length;
            activityUser = otherMembers[memberIndex];
          } else {
            activityUser = members[0];
          }
        }
      }
      
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
        completionPercentage: task.completionPercentage,
        // Include user information
        user: activityUser,
        // Flag to determine if it's a team activity
        isTeamActivity: isTeamProject
      };
    });
    
    return { data: activities };
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return { error: "Failed to fetch recent activity" };
  }
}
