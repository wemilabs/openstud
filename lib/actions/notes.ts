"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";

// Schema for note creation/update validation
const NoteSchema = z.object({
  title: z
    .string()
    .min(3, "Note title must be at least 3 characters")
    .max(100, "Note title must not exceed 100 characters"),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(10000, "Content must not exceed 10000 characters")
    .optional()
    .nullable(),
  courseId: z.string().min(1, "Course ID is required"),
});

export type NoteInput = z.infer<typeof NoteSchema>;

/**
 * Creates a new note for a course
 */
export async function createNote(input: NoteInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const validatedData = NoteSchema.parse(input);

    // Verify the user owns the course
    const course = await prisma.course.findUnique({
      where: {
        id: validatedData.courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return { error: "Course not found or you don't have access to it" };
    }

    const note = await prisma.note.create({
      data: validatedData,
    });

    revalidatePath(`/dashboard/courses/${course.id}`);
    return { data: note };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Error creating note:", error);
    return { error: "Failed to create note" };
  }
}

/**
 * Fetches all notes for a specific course
 */
export async function getNotesByCourseId(courseId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Verify the user owns the course
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return { error: "Course not found or you don't have access to it" };
    }

    const notes = await prisma.note.findMany({
      where: {
        courseId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { data: notes };
  } catch (error) {
    console.error("Error fetching notes:", error);
    return { error: "Failed to fetch notes" };
  }
}

/**
 * Fetches a single note by ID
 */
export async function getNoteById(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const note = await prisma.note.findUnique({
      where: {
        id,
      },
      include: {
        course: true,
      },
    });

    if (!note) {
      return { error: "Note not found" };
    }

    // Verify the user owns the course
    if (note.course.userId !== session.user.id) {
      return { error: "You don't have access to this note" };
    }

    return { data: note };
  } catch (error) {
    console.error("Error fetching note:", error);
    return { error: "Failed to fetch note" };
  }
}

/**
 * Updates an existing note
 */
export async function updateNote(
  id: string,
  input: Omit<NoteInput, "courseId">
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Validate input
    const validatedData = z
      .object({
        title: NoteSchema.shape.title,
        content: NoteSchema.shape.content,
      })
      .parse(input);

    // Get the note with course information
    const existingNote = await prisma.note.findUnique({
      where: {
        id,
      },
      include: {
        course: true,
      },
    });

    if (!existingNote) {
      return { error: "Note not found" };
    }

    // Verify the user owns the course
    if (existingNote.course.userId !== session.user.id) {
      return { error: "You don't have access to this note" };
    }

    const note = await prisma.note.update({
      where: {
        id,
      },
      data: validatedData,
    });

    revalidatePath(`/dashboard/courses/${existingNote.courseId}`);
    return { data: note };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Error updating note:", error);
    return { error: "Failed to update note" };
  }
}

/**
 * Deletes a note
 */
export async function deleteNote(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Get the note with course information
    const note = await prisma.note.findUnique({
      where: {
        id,
      },
      include: {
        course: true,
      },
    });

    if (!note) {
      return { error: "Note not found" };
    }

    // Verify the user owns the course
    if (note.course.userId !== session.user.id) {
      return { error: "You don't have access to this note" };
    }

    await prisma.note.delete({
      where: {
        id,
      },
    });

    revalidatePath(`/dashboard/courses/${note.courseId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting note:", error);
    return { error: "Failed to delete note" };
  }
}
