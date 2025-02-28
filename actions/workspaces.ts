"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { TeamRole } from "@prisma/client";

// Schema for workspace (team) creation/update validation
const WorkspaceSchema = z.object({
  name: z
    .string()
    .min(3, "Workspace name must be at least 3 characters")
    .max(50, "Workspace name must not exceed 50 characters"),
});

export type WorkspaceInput = z.infer<typeof WorkspaceSchema>;

/**
 * Creates a new workspace (team) with the current user as owner
 */
export async function createWorkspace(input: WorkspaceInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return { error: "Unauthorized" };
    }

    try {
      const validatedData = WorkspaceSchema.parse(input);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return { error: validationError.errors[0].message };
      }
      return { error: "Invalid input data" };
    }
    
    const validatedData = WorkspaceSchema.parse(input);

    // Create the team and add the current user as an owner without using a transaction
    try {
      // Create the team
      const team = await prisma.team.create({
        data: {
          name: validatedData.name,
        },
      });

      // Add the current user as an owner
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId,
          role: TeamRole.OWNER,
        },
      });
      
      revalidatePath("/dashboard");
      return { data: team };
    } catch (dbError) {
      return { error: "Database error: " + (dbError instanceof Error ? dbError.message : "Unknown error") };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create workspace: " + (error instanceof Error ? error.message : "Unknown error") };
  }
}

/**
 * Fetches all workspaces (teams) for the current user
 */
export async function getWorkspaces() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Get all teams where the user is a member
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        userId,
      },
      include: {
        team: true,
      },
      orderBy: {
        team: {
          name: "asc",
        },
      },
    });

    // Extract the teams from the team members
    const workspaces = teamMembers.map((member) => ({
      ...member.team,
      role: member.role,
    }));

    return { data: workspaces };
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return { error: "Failed to fetch workspaces" };
  }
}

/**
 * Fetches a single workspace (team) by ID
 */
export async function getWorkspaceById(id: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the user is a member of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
      include: {
        team: true,
      },
    });

    if (!teamMember) {
      return { error: "Workspace not found or you don't have access to it" };
    }

    return { 
      data: {
        ...teamMember.team,
        role: teamMember.role,
      }
    };
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return { error: "Failed to fetch workspace" };
  }
}

/**
 * Updates an existing workspace (team)
 * Only owners and admins can update a workspace
 */
export async function updateWorkspace(id: string, input: WorkspaceInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the user is an owner or admin of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
    });

    if (!teamMember) {
      return { error: "Workspace not found or you don't have access to it" };
    }

    if (teamMember.role !== TeamRole.OWNER && teamMember.role !== TeamRole.ADMIN) {
      return { error: "You don't have permission to update this workspace" };
    }

    const validatedData = WorkspaceSchema.parse(input);

    const workspace = await prisma.team.update({
      where: { id },
      data: validatedData,
    });

    revalidatePath("/dashboard");
    return { data: workspace };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Error updating workspace:", error);
    return { error: "Failed to update workspace" };
  }
}

/**
 * Deletes a workspace (team)
 * Only owners can delete a workspace
 */
export async function deleteWorkspace(id: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the user is an owner of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
    });

    if (!teamMember) {
      return { error: "Workspace not found or you don't have access to it" };
    }

    if (teamMember.role !== TeamRole.OWNER) {
      return { error: "Only workspace owners can delete workspaces" };
    }

    await prisma.team.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return { error: "Failed to delete workspace" };
  }
}

/**
 * Adds a member to a workspace (team)
 * Only owners and admins can add members
 */
export async function addWorkspaceMember(teamId: string, email: string, role: TeamRole = TeamRole.MEMBER) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the user is an owner or admin of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!teamMember) {
      return { error: "Workspace not found or you don't have access to it" };
    }

    if (teamMember.role !== TeamRole.OWNER && teamMember.role !== TeamRole.ADMIN) {
      return { error: "You don't have permission to add members to this workspace" };
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Check if the user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return { error: "User is already a member of this workspace" };
    }

    // Add the user as a member
    const newMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: user.id,
        role,
      },
    });

    revalidatePath("/dashboard");
    return { data: newMember };
  } catch (error) {
    console.error("Error adding workspace member:", error);
    return { error: "Failed to add workspace member" };
  }
}

/**
 * Removes a member from a workspace (team)
 * Owners can remove anyone, admins can remove members but not other admins or owners
 */
export async function removeWorkspaceMember(teamId: string, memberId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the user is an owner or admin of the team
    const currentMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!currentMember) {
      return { error: "Workspace not found or you don't have access to it" };
    }

    // Get the member to be removed
    const memberToRemove = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToRemove || memberToRemove.teamId !== teamId) {
      return { error: "Member not found in this workspace" };
    }

    // Check permissions
    if (currentMember.role !== TeamRole.OWNER) {
      // Admins can only remove members
      if (currentMember.role === TeamRole.ADMIN && memberToRemove.role !== TeamRole.MEMBER) {
        return { error: "You don't have permission to remove this member" };
      }
      
      // Members can't remove anyone
      if (currentMember.role === TeamRole.MEMBER) {
        return { error: "You don't have permission to remove members" };
      }
    }

    // Don't allow removing the last owner
    if (memberToRemove.role === TeamRole.OWNER) {
      const ownersCount = await prisma.teamMember.count({
        where: {
          teamId,
          role: TeamRole.OWNER,
        },
      });

      if (ownersCount <= 1) {
        return { error: "Cannot remove the last owner of the workspace" };
      }
    }

    // Remove the member
    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error removing workspace member:", error);
    return { error: "Failed to remove workspace member" };
  }
}

/**
 * Updates a member's role in a workspace (team)
 * Only owners can change roles, and there must always be at least one owner
 */
export async function updateWorkspaceMemberRole(teamId: string, memberId: string, newRole: TeamRole) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the user is an owner of the team
    const currentMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!currentMember) {
      return { error: "Workspace not found or you don't have access to it" };
    }

    if (currentMember.role !== TeamRole.OWNER) {
      return { error: "Only workspace owners can change member roles" };
    }

    // Get the member to update
    const memberToUpdate = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToUpdate || memberToUpdate.teamId !== teamId) {
      return { error: "Member not found in this workspace" };
    }

    // If changing from owner to another role, ensure there's at least one other owner
    if (memberToUpdate.role === TeamRole.OWNER && newRole !== TeamRole.OWNER) {
      const ownersCount = await prisma.teamMember.count({
        where: {
          teamId,
          role: TeamRole.OWNER,
        },
      });

      if (ownersCount <= 1) {
        return { error: "Cannot change the role of the last owner" };
      }
    }

    // Update the member's role
    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role: newRole },
    });

    revalidatePath("/dashboard");
    return { data: updatedMember };
  } catch (error) {
    console.error("Error updating workspace member role:", error);
    return { error: "Failed to update workspace member role" };
  }
}

/**
 * Gets all members of a workspace (team)
 */
export async function getWorkspaceMembers(teamId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the user is a member of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!teamMember) {
      return { error: "Workspace not found or you don't have access to it" };
    }

    // Get all members of the team
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // Owners first, then admins, then members
        { user: { name: "asc" } }, // Alphabetical by name within each role
      ],
    });

    return { data: members };
  } catch (error) {
    console.error("Error fetching workspace members:", error);
    return { error: "Failed to fetch workspace members" };
  }
}
