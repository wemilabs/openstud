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
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscore and dash")
    .optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Update the current user's profile information
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
      return { success: false, error: validatedData.error.errors[0]?.message || "Invalid input" };
    }

    // Update the user data
    await prisma.user.update({
      where: { email: user.email },
      data: {
        username: formData.username,
      },
    });

    // Revalidate the profile page to show updated data
    revalidatePath("/dashboard/profile");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    
    // Check for unique constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return { success: false, error: "This username is already taken" };
    }
    
    return { success: false, error: "Failed to update profile" };
  }
}
