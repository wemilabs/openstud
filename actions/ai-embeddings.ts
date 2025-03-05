"use server";

import { auth } from "@/lib/auth";
import { generateAndStoreNoteEmbedding, findSimilarNotes } from "@/lib/ai";
import { revalidatePath } from "next/cache";

/**
 * Generate and store embeddings for a note
 *
 * @param noteId The note ID
 * @returns Success or error message
 */
export async function generateEmbeddingForNote(noteId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be logged in to generate embeddings");
  }

  try {
    await generateAndStoreNoteEmbedding(noteId);
    revalidatePath("/dashboard/courses");
    return { success: true };
  } catch (error) {
    console.error("Error in generateEmbeddingForNote:", error);
    return { error: "Failed to generate embedding for note" };
  }
}

/**
 * Find notes similar to a query text
 *
 * @param queryText The query text to find similar notes for
 * @param limit Maximum number of results to return
 * @returns Array of similar notes with similarity scores
 */
export async function findSimilarNotesForQuery(
  queryText: string,
  limit: number = 5
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be logged in to search notes");
  }

  try {
    const similarNotes = await findSimilarNotes(
      queryText,
      session.user.id,
      limit
    );

    return { notes: similarNotes };
  } catch (error) {
    console.error("Error in findSimilarNotesForQuery:", error);
    return { error: "Failed to find similar notes" };
  }
}
