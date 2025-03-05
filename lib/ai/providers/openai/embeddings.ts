/**
 * OpenAI Embeddings Implementation
 * 
 * Handles generating vector embeddings using OpenAI's API
 */

import { openai } from './index';
import { aiConfig } from '../../config';

/**
 * Generate embeddings for a text using OpenAI
 * 
 * @param text The text to generate embeddings for
 * @returns An array of numbers representing the embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: aiConfig.modelConfig.embeddingModel,
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Generate embeddings for multiple texts using OpenAI
 * 
 * @param texts Array of texts to generate embeddings for
 * @returns Array of embedding vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: aiConfig.modelConfig.embeddingModel,
      input: texts,
      encoding_format: 'float',
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
}

/**
 * Calculate cosine similarity between two vectors
 * 
 * @param a First vector
 * @param b Second vector
 * @returns Cosine similarity score (between -1 and 1)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
