/**
 * Embedding Service
 *
 * Service for generating and managing vector embeddings for semantic search and similarity
 */

import * as GrokProvider from "../providers/grok/embeddings";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Define types for our embedding operations
type EmbeddingVector = number[];

// Extend the Prisma types to handle the vector field
interface NoteWithEmbedding {
  id: string;
  title: string;
  content: string | null;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
  embedding: {
    id: string;
    noteId: string;
    embedding: any;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

export interface EmbeddingOptions {
  dimensions?: number;
  normalizeVectors?: boolean;
}

/**
 * Generate an embedding for text
 *
 * @param text Text to generate embedding for
 * @param options Optional parameters
 * @returns The embedding vector
 */
export async function generateEmbedding(
  text: string,
  options: EmbeddingOptions = {}
): Promise<number[]> {
  // Sanitize the input - remove excess whitespace
  text = text.trim().replace(/\s+/g, " ");

  // Skip empty text or very short inputs
  if (!text || text.length < 3) {
    return [];
  }

  return GrokProvider.generateEmbedding(text);
}

/**
 * Generate embeddings for a note and store in the database
 *
 * @param noteId The note ID
 * @returns The created embedding record
 */
export async function generateAndStoreNoteEmbedding(noteId: string) {
  // Get the note
  const note = await prisma.note.findUnique({
    where: { id: noteId },
  });

  if (!note) {
    throw new Error(`Note with ID ${noteId} not found`);
  }

  // Generate embedding for the note content
  // If content is null, use the title instead
  const textToEmbed = note.content || note.title;
  const embedding = await generateEmbedding(textToEmbed);

  try {
    // Store the embedding using raw SQL since Prisma doesn't fully support vector types
    // First check if an embedding already exists
    const existingEmbedding = await prisma.noteEmbedding.findUnique({
      where: { noteId },
    });

    if (existingEmbedding) {
      // Use Prisma's executeRaw to update the embedding
      await prisma.$executeRaw`
        UPDATE "NoteEmbedding"
        SET "embedding" = ${embedding}::vector, "updatedAt" = ${new Date()}
        WHERE "noteId" = ${noteId}
      `;

      return prisma.noteEmbedding.findUnique({
        where: { noteId },
      });
    } else {
      // Create a new embedding record using raw SQL
      const id = crypto.randomUUID();
      const now = new Date();

      await prisma.$executeRaw`
        INSERT INTO "NoteEmbedding" ("id", "noteId", "embedding", "createdAt", "updatedAt")
        VALUES (${id}, ${noteId}, ${embedding}::vector, ${now}, ${now})
      `;

      return prisma.noteEmbedding.findUnique({
        where: { id },
      });
    }
  } catch (error) {
    console.error("Error storing embedding:", error);
    throw new Error("Failed to store embedding");
  }
}

/**
 * Find similar notes based on a query text
 *
 * @param queryText The query text to find similar notes for
 * @param userId The user ID to restrict the search to their notes
 * @param limit Maximum number of results to return
 * @returns Array of notes with similarity scores
 */
export async function findSimilarNotes(
  queryText: string,
  userId: string,
  limit: number = 5
) {
  // Generate embedding for the query text
  const queryEmbedding = await generateEmbedding(queryText);

  try {
    // Get all courses for the user
    const courses = await prisma.course.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });

    const courseIds = courses.map((course) => course.id);

    // Use a raw query to find similar notes using vector similarity
    // This is a placeholder - in a real implementation, you would use
    // the database's vector similarity search capabilities
    const notes = (await prisma.note.findMany({
      where: {
        courseId: {
          in: courseIds,
        },
      },
      include: {
        embedding: true,
      },
    })) as unknown as NoteWithEmbedding[];

    // Filter notes that have embeddings
    const notesWithEmbeddings = notes.filter((note) => note.embedding !== null);

    // Calculate similarity scores in JavaScript (fallback)
    const notesWithScores = notesWithEmbeddings.map((note) => {
      // We've already filtered out notes without embeddings
      const noteEmbedding = note.embedding!;

      const similarity = GrokProvider.cosineSimilarity(
        queryEmbedding,
        (noteEmbedding.embedding as unknown as EmbeddingVector) || []
      );

      return {
        ...note,
        similarity,
      };
    });

    // Sort by similarity (highest first) and limit results
    return notesWithScores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch (error) {
    console.error("Error finding similar notes:", error);
    throw new Error("Failed to find similar notes");
  }
}
