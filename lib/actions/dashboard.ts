"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

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

          {
            workspace: {
              members: {
                some: {
                  userId,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    };

    // If a specific workspace is provided, filter projects by that workspace
    if (workspaceId) {
      if (workspaceId === "individual") {
        // For individual workspace, only include projects with userId
        projectsQuery.where = {
          userId,
          workspaceId: null,
        };
      } else {
        // For workspace workspace, only include projects with that workspaceId
        projectsQuery.where = {
          workspaceId,
        };
      }
    }

    const userProjects = await prisma.project.findMany(projectsQuery);
    const projectIds = userProjects.map((project) => project.id);

    // Get task statistics by category with average completion percentage
    const taskStats = await prisma.task.groupBy({
      by: ["category"],
      where: {
        projectId: {
          in: projectIds,
        },
      },
      _count: {
        id: true,
      },
      _avg: {
        completionPercentage: true,
      },
    });

    // Transform the data for the chart
    const formattedStats = taskStats.map((stat) => ({
      name: stat.category || "Uncategorized",
      total: Math.round(stat._avg.completionPercentage || 0),
      count: stat._count.id,
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
          {
            userId,
          },
          {
            workspace: {
              members: {
                some: {
                  userId,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        workspaceId: true,
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    };

    // If a specific workspace is provided, filter projects by that workspace
    if (workspaceId) {
      if (workspaceId === "individual") {
        // For individual workspace, only include projects with userId
        projectsQuery.where = {
          userId,
          workspaceId: null,
        };
      } else {
        // For workspace workspace, only include projects with that workspaceId
        projectsQuery.where = {
          workspaceId: workspaceId,
        };
      }
    }

    type ProjectWithUserInfo = {
      id: string;
      name: string;
      workspaceId: string | null;
      workspace?: {
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

    const userProjects = (await prisma.project.findMany(
      projectsQuery
    )) as ProjectWithUserInfo[];
    const projectIds = userProjects.map((project) => project.id);
    const projectNames = userProjects.reduce((acc, project) => {
      acc[project.id] = project.name;
      return acc;
    }, {} as Record<string, string>);

    // Create a map of project owners for future reference
    const projectOwners = userProjects.reduce((acc, project) => {
      if (project.user) {
        acc[project.id] = {
          id: project.user.id,
          name: project.user.name,
          email: project.user.email,
          image: project.user.image,
        };
      }
      return acc;
    }, {} as Record<string, { id: string; name: string | null; email: string | null; image: string | null }>);

    // Get workspace members for each project to ensure we have current user info
    const workspaceUsers = new Map<
      string,
      {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
      }
    >();

    // Get all workspace members for projects we have access to
    for (const project of userProjects) {
      if (project.workspaceId) {
        const members = await prisma.workspaceMember.findMany({
          where: { workspaceId: project.workspaceId },
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        });

        for (const member of members) {
          if (member.user) {
            workspaceUsers.set(member.userId, {
              id: member.user.id,
              name: member.user.name,
              email: member.user.email,
              image: member.user.image,
            });
          }
        }
      }
    }

    // Get recent tasks with updates - include createdById and creator info
    const recentTasks = await prisma.task.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // // Debug - Check if createdBy information is being fetched correctly
    // console.log(
    //   "Tasks with creator info:",
    //   JSON.stringify(
    //     recentTasks.map((task) => ({
    //       id: task.id,
    //       title: task.title,
    //       createdById: task.createdById,
    //       createdBy: task.createdBy,
    //       hasUser: !!task.createdBy,
    //       userName: task.createdBy?.name,
    //       userEmail: task.createdBy?.email,
    //     })),
    //     null,
    //     2
    //   )
    // );

    // // Debug the full task data from prisma
    // console.log("Raw task data:", JSON.stringify(recentTasks[0], null, 2));

    // Transform the data for the activity feed using the task creator information
    const activities = recentTasks.map((task) => {
      // Determine activity type based on task state
      let type: "created" | "updated" | "completed" | "progress" = "updated";
      let description = "";

      const projectWorkspaceId = userProjects.find(
        (p) => p.id === task.projectId
      )?.workspaceId;
      const isWorkspaceProject =
        projectWorkspaceId !== null && projectWorkspaceId !== undefined;

      // If created and updated at are close, it's a new task
      const isNewTask =
        Math.abs(task.createdAt.getTime() - task.updatedAt.getTime()) <
        1000 * 60;

      // Get a user object to show from various sources
      // 1. From the task's createdBy relation if it exists
      let activityUser = task.createdBy || null;

      // 2. Fallback to project owner if no creator info
      if (!activityUser && projectOwners[task.projectId]) {
        activityUser = projectOwners[task.projectId];

        // For logging only
        console.log(
          `Task ${task.id} has no creator, using project owner: ${
            activityUser?.name || "unknown"
          }`
        );
      }

      // 3. Create a placeholder user object if we still don't have one
      if (!activityUser) {
        activityUser = {
          id: "system",
          name: session?.user?.name || "System", // Use the current user's name for legacy tasks
          email: session?.user?.email || null,
          image: session?.user?.image || null,
        };
      }

      if (isNewTask) {
        type = "created";
        description = `Created task '${task.title}' in ${
          projectNames[task.projectId]
        }`;
      } else if (task.completed) {
        type = "completed";
        description = `Completed task '${task.title}' in ${
          projectNames[task.projectId]
        }`;
      } else if (task.completionPercentage > 0) {
        type = "progress";
        description = `Updated progress to ${task.completionPercentage}% on '${
          task.title
        }' in ${projectNames[task.projectId]}`;
      } else {
        description = `Updated task '${task.title}' in ${
          projectNames[task.projectId]
        }`;
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
        user: activityUser,
        isWorkspaceActivity: isWorkspaceProject,
      };
    });

    return { data: activities };
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return { error: "Failed to fetch recent activity" };
  }
}
