"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Schema for profile update validation
const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscore and dash"
    )
    .optional(),
  bio: z
    .string()
    .min(10, "Bio must be at least 10 characters")
    .max(1000, "Bio must not exceed 1000 characters")
    .optional(),
  school: z
    .string()
    .min(3, "School must be at least 3 characters")
    .max(100, "School must not exceed 100 characters")
    .optional(),
  studentId: z
    .string()
    .min(3, "Student ID must be at least 3 characters")
    .max(100, "Student ID must not exceed 100 characters")
    .optional(),
  schoolEmail: z
    .string()
    .email("Please enter a valid email address")
    .optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Updates the user's profile information.
 *
 * @param {ProfileFormData} formData - The form data containing the user's profile information.
 */
export async function updateProfile(formData: ProfileFormData) {
  try {
    const user = await getCurrentUser();
    if (!user?.email) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate the input data
    const validatedData = profileSchema.safeParse(formData);
    if (!validatedData.success) {
      return {
        success: false,
        error: validatedData.error.errors[0]?.message || "Invalid input",
      };
    }

    // Update the user data
    await prisma.user.update({
      where: { email: user.email },
      data: {
        username: formData.username,
        bio: formData.bio,
        school: formData.school,
        studentId: formData.studentId,
        schoolEmail: formData.schoolEmail,
      },
    });

    // Revalidate the profile page to show updated data
    revalidatePath("/dashboard/profile");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating profile:", error);

    // Check for unique constraint violation
    if (error.code === "P2002" && error.meta?.target?.includes("username")) {
      return { success: false, error: "This username is already taken" };
    }

    return { success: false, error: "Failed to update profile" };
  }
}

/**
 * Resets all user data while keeping the account intact.
 * This deletes all tasks, projects, and user-specific settings.
 */
export async function resetUserData() {
  try {
    const user = await getCurrentUser();
    if (!user?.id || !user?.email) {
      return { success: false, error: "Not authenticated" };
    }

    // Instead of using a transaction which might time out, we'll perform operations sequentially
    // Delete all tasks associated with user's projects
    await prisma.task.deleteMany({
      where: {
        project: {
          userId: user.id,
        },
      },
    });

    // Delete all projects owned directly by the user
    await prisma.project.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Delete all notes in user's courses
    await prisma.note.deleteMany({
      where: {
        course: {
          userId: user.id,
        },
      },
    });

    // Delete all courses
    await prisma.course.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Check if TeamInvitation exists and delete if it does
    try {
      await prisma.teamInvitation.deleteMany({
        where: {
          createdBy: user.id,
        },
      });
    } catch (err) {
      console.log("Note: TeamInvitation deletion skipped or errored");
    }

    // Leave all teams but don't delete teams
    await prisma.teamMember.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Revalidate all relevant paths to refresh the UI
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/teams");
    revalidatePath("/dashboard/projects");
    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard/settings");

    return {
      success: true,
      message:
        "All data has been reset successfully. Your account has been kept intact.",
    };
  } catch (error: any) {
    console.error("Error resetting user data:", error);
    return {
      success: false,
      error: "Failed to reset data. Please try again or contact support.",
    };
  }
}

/**
 * Permanently deletes the user account and all associated data
 * This action cannot be undone
 */
export async function deleteAccount() {
  try {
    const user = await getCurrentUser();
    if (!user?.id || !user?.email) {
      return { success: false, error: "Not authenticated" };
    }

    // Instead of using a transaction, perform operations sequentially
    // Delete all tasks associated with user's projects
    await prisma.task.deleteMany({
      where: {
        createdById: user.id,
      },
    });

    // Delete all projects owned directly by the user
    await prisma.project.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Delete user's courses (will cascade to notes)
    await prisma.course.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Check if TeamInvitation exists and delete if it does
    try {
      await prisma.teamInvitation.deleteMany({
        where: {
          createdBy: user.id,
        },
      });
    } catch (err) {
      console.log("Note: TeamInvitation deletion skipped or errored");
    }

    // Remove from all teams
    await prisma.teamMember.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Delete AI conversations
    await prisma.aIConversation.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Delete account sessions to ensure logout
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Delete user's auth accounts (OAuth connections)
    await prisma.account.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Finally, delete the user account itself
    await prisma.user.delete({
      where: { id: user.id },
    });

    return {
      success: true,
      message:
        "Your account and all associated data have been permanently deleted.",
    };
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      error: "Failed to delete account. Please try again or contact support.",
    };
  }
}
