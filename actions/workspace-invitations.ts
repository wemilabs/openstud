"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { WorkspaceRole } from "@prisma/client";
import { randomBytes } from "crypto";

// Schema for invitation creation validation
const InvitationSchema = z.object({
  role: z.nativeEnum(WorkspaceRole).default(WorkspaceRole.MEMBER),
  expiresInDays: z.number().int().min(1).max(30).default(7),
  maxUses: z
    .union([z.number().int().min(1).max(100), z.literal(null)])
    .default(null),
});

export type InvitationInput = z.infer<typeof InvitationSchema>;

/**
 * Generates a unique invitation token
 */
const generateInvitationToken = (): string => {
  return randomBytes(32).toString("hex");
};

/**
 * Creates a new workspace invitation link that can be shared with multiple users
 * Only owners and admins can create invitations
 */
export async function createWorkspaceInvitation(
  workspaceId: string,
  input: InvitationInput
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Validate input data
    try {
      InvitationSchema.parse(input);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return { error: validationError.errors[0].message };
      }
      return { error: "Invalid input data" };
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
        error: "You don't have permission to invite members to this workspace",
      };
    }

    // Generate token and expiration date
    const token = generateInvitationToken();
    const expires = new Date();
    expires.setDate(expires.getDate() + input.expiresInDays);

    // Create the invitation
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        role: input.role,
        token,
        expires,
        maxUses: input.maxUses,
        usedCount: 0,
        createdBy: userId,
      },
    });

    revalidatePath("/dashboard");
    return {
      data: invitation,
      inviteLink: `${
        process.env.NEXT_PUBLIC_APP_URL! || "http://localhost:3000"
      }/workspaces/invite/${token}`,
    };
  } catch (error) {
    console.error("Error creating workspace invitation:", error);
    return { error: "Failed to create workspace invitation" };
  }
}

/**
 * Gets all pending invitations for a workspace
 * Only owners and admins can view invitations
 */
export async function getWorkspaceInvitations(workspaceId: string) {
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
        error:
          "You don't have permission to view invitations for this workspace",
      };
    }

    // Get all pending invitations
    const invitations = await prisma.workspaceInvitation.findMany({
      where: {
        workspaceId,
        expires: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { data: invitations };
  } catch (error) {
    console.error("Error fetching workspace invitations:", error);
    return { error: "Failed to fetch workspace invitations" };
  }
}

/**
 * Deletes a workspace invitation
 * Only owners and admins can delete invitations
 */
export async function deleteWorkspaceInvitation(invitationId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Get the invitation with workspace info
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: {
        id: invitationId,
      },
      include: {
        workspace: true,
      },
    });

    if (!invitation) {
      return { error: "Invitation not found" };
    }

    // Verify the user is an owner or admin of the workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId,
        },
      },
    });

    if (!workspaceMember) {
      return { error: "You don't have access to this workspace" };
    }

    if (
      workspaceMember.role !== WorkspaceRole.OWNER &&
      workspaceMember.role !== WorkspaceRole.ADMIN
    ) {
      return {
        error:
          "You don't have permission to delete invitations for this workspace",
      };
    }

    // Delete the invitation
    await prisma.workspaceInvitation.delete({
      where: {
        id: invitationId,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting workspace invitation:", error);
    return { error: "Failed to delete workspace invitation" };
  }
}

/**
 * Validates an invitation token and returns the invitation details
 * This is used to check if an invitation is valid before accepting it
 */
export async function validateInvitationToken(token: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "You must be logged in to accept an invitation" };
    }

    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!currentUser || !currentUser.email) {
      return { error: "User profile is incomplete" };
    }

    // Find the invitation
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: {
        token,
      },
      include: {
        workspace: true,
      },
    });

    if (!invitation) {
      return { error: "Invalid invitation link" };
    }

    // Check if the invitation has expired
    if (invitation.expires < new Date()) {
      return { error: "This invitation has expired" };
    }

    // Check if the invitation has been used up
    if (
      invitation.maxUses !== null &&
      invitation.usedCount >= invitation.maxUses
    ) {
      return { error: "This invitation has already been used up" };
    }

    // Check if the user is already a member of the workspace
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId,
        },
      },
    });

    if (existingMember) {
      return { error: "You are already a member of this workspace" };
    }

    return {
      data: {
        invitation,
        workspace: invitation.workspace,
      },
    };
  } catch (error) {
    console.error("Error validating invitation token:", error);
    return { error: "Failed to validate invitation" };
  }
}

/**
 * Accepts a workspace invitation and adds the user as a member
 */
export async function acceptWorkspaceInvitation(token: string) {
  try {
    // First validate the token
    const validation = await validateInvitationToken(token);

    if (validation.error) {
      return { error: validation.error };
    }

    if (!validation.data) {
      return { error: "Invalid invitation data" };
    }

    const { invitation, workspace } = validation.data;
    const session = await auth();
    const userId = session?.user?.id;

    // Increment the used count of the invitation
    await prisma.workspaceInvitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });

    // Add the user as a member with the specified role
    await prisma.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId: userId!,
        role: invitation.role,
      },
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      workspaceId: invitation.workspaceId,
      workspaceName: workspace.name,
    };
  } catch (error) {
    console.error("Error accepting workspace invitation:", error);
    return { error: "Failed to accept workspace invitation" };
  }
}
