"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { Prisma, WorkspaceRole } from "@/lib/generated/prisma/client";

// Define a type for WorkspaceMember that includes the workspace relation
type WorkspaceMemberWithWorkspace = Prisma.WorkspaceMemberGetPayload<{
  include: { workspace: true };
}>;

const WorkspaceSchema = z.object({
  name: z
    .string()
    .min(3, "Workspace name must be at least 3 characters")
    .max(50, "Workspace name must not exceed 50 characters"),
});

export type WorkspaceInput = z.infer<typeof WorkspaceSchema>;

/**
 * Creates a new workspace (workspace) with the current user as owner
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

    // Create the workspace and add the current user as an owner without using a transaction
    try {
      const workspace = await prisma.workspace.create({
        data: {
          name: validatedData.name,
          createdById: userId,
        },
      });

      // Add the current user as an owner
      await prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: WorkspaceRole.OWNER,
        },
      });

      revalidatePath("/dashboard");
      return { data: workspace };
    } catch (dbError) {
      return {
        error:
          "Database error: " +
          (dbError instanceof Error ? dbError.message : "Unknown error"),
      };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return {
      error:
        "Failed to create workspace: " +
        (error instanceof Error ? error.message : "Unknown error"),
    };
  }
}

/**
 * Fetches all workspaces (workspaces) for the current user
 */
export async function getWorkspaces() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Get all workspaces where the user is a member
    const workspaceMembers = (await prisma.workspaceMember.findMany({
      where: {
        userId,
      },
      include: {
        workspace: true,
      },
      orderBy: {
        workspace: {
          name: "asc",
        },
      },
    })) as WorkspaceMemberWithWorkspace[];

    // Extract the workspaces from the workspace members
    const workspaces = workspaceMembers.map((member) => ({
      ...member.workspace,
      role: member.role,
    }));

    return { data: workspaces };
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return { error: "Failed to fetch workspaces" };
  }
}

/**
 * Fetches a single workspace (workspace) by ID
 */
export async function getWorkspaceById(id: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the user is a member of the workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId,
        },
      },
      include: {
        workspace: true,
      },
    });

    if (!workspaceMember) {
      return { error: "Workspace not found or you don't have access to it" };
    }

    return {
      data: {
        ...workspaceMember.workspace,
        role: workspaceMember.role,
      },
    };
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return { error: "Failed to fetch workspace" };
  }
}

/**
 * Updates an existing workspace.
 * Only owners and admins can update a workspace.
 */
export async function updateWorkspace(id: string, input: WorkspaceInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the user is an owner or admin of the workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId,
        },
      },
    });

    if (!workspaceMember) {
      return { error: "Workspace not found or you don't have access to it" };
    }

    if (
      workspaceMember.role !== WorkspaceRole.OWNER &&
      workspaceMember.role !== WorkspaceRole.ADMIN
    ) {
      return { error: "You don't have permission to update this workspace" };
    }

    const validatedData = WorkspaceSchema.parse(input);

    const workspace = await prisma.workspace.update({
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
 * Deletes a workspace.
 * Only owners can delete a workspace.
 */
export async function deleteWorkspace(id: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the user is an owner of the workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId,
        },
      },
    });

    if (!workspaceMember) {
      return { error: "Workspace not found or you don't have access to it" };
    }

    if (workspaceMember.role !== WorkspaceRole.OWNER) {
      return { error: "Only workspace owners can delete workspaces" };
    }

    await prisma.workspace.delete({
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
 * Adds a member to a workspace (workspace)
 * Only owners and admins can add members
 */
export async function addWorkspaceMember(
  workspaceId: string,
  email: string,
  role: WorkspaceRole = WorkspaceRole.MEMBER
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the user is an owner or admin of the workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!workspaceMember) {
      return { error: "Workspace not found or you don't have access to it" };
    }

    if (
      workspaceMember.role !== WorkspaceRole.OWNER &&
      workspaceMember.role !== WorkspaceRole.ADMIN
    ) {
      return {
        error: "You don't have permission to add members to this workspace",
      };
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Check if the user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return { error: "User is already a member of this workspace" };
    }

    // Add the user as a member
    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId,
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
 * Removes a member from a workspace (workspace)
 * Owners can remove anyone, admins can remove members but not other admins or owners
 */
export async function removeWorkspaceMember(
  workspaceId: string,
  memberId: string
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the user is an owner or admin of the workspace
    const currentMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!currentMember) {
      return { error: "Workspace not found or you don't have access to it" };
    }

    // Get the member to be removed
    const memberToRemove = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToRemove || memberToRemove.workspaceId !== workspaceId) {
      return { error: "Member not found in this workspace" };
    }

    // Check permissions
    if (currentMember.role !== WorkspaceRole.OWNER) {
      // Admins can only remove members
      if (
        currentMember.role === WorkspaceRole.ADMIN &&
        memberToRemove.role !== WorkspaceRole.MEMBER
      ) {
        return { error: "You don't have permission to remove this member" };
      }

      // Members can't remove anyone
      if (currentMember.role === WorkspaceRole.MEMBER) {
        return { error: "You don't have permission to remove members" };
      }
    }

    // Don't allow removing the last owner
    if (memberToRemove.role === WorkspaceRole.OWNER) {
      const ownersCount = await prisma.workspaceMember.count({
        where: {
          workspaceId,
          role: WorkspaceRole.OWNER,
        },
      });

      if (ownersCount <= 1) {
        return { error: "Cannot remove the last owner of the workspace" };
      }
    }

    // Remove the member
    await prisma.workspaceMember.delete({
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
 * Updates a member's role in a workspace (workspace)
 * Only owners can change roles, and there must always be at least one owner
 */
export async function updateWorkspaceMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: WorkspaceRole
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the user is an owner of the workspace
    const currentMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!currentMember) {
      return { error: "Workspace not found or you don't have access to it" };
    }

    if (currentMember.role !== WorkspaceRole.OWNER) {
      return { error: "Only workspace owners can change member roles" };
    }

    // Get the member to update
    const memberToUpdate = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToUpdate || memberToUpdate.workspaceId !== workspaceId) {
      return { error: "Member not found in this workspace" };
    }

    // If changing from owner to another role, ensure there's at least one other owner
    if (
      memberToUpdate.role === WorkspaceRole.OWNER &&
      newRole !== WorkspaceRole.OWNER
    ) {
      const ownersCount = await prisma.workspaceMember.count({
        where: {
          workspaceId,
          role: WorkspaceRole.OWNER,
        },
      });

      if (ownersCount <= 1) {
        return { error: "Cannot change the role of the last owner" };
      }
    }

    // Update the member's role
    const updatedMember = await prisma.workspaceMember.update({
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
 * Gets all members of a workspace (workspace)
 */
export async function getWorkspaceMembers(workspaceId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the user is a member of the workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!workspaceMember) {
      return { error: "Workspace not found or you don't have access to it" };
    }

    // Get all members of the workspace
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
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
      orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
    });

    return { data: members };
  } catch (error) {
    console.error("Error fetching workspace members:", error);
    return { error: "Failed to fetch workspace members" };
  }
}
