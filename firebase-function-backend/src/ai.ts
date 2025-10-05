import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Embedding model configuration
 * Using text-embedding-004 which produces 768-dimensional vectors
 */
export const EMBEDDING_DIMENSION = 768;

/**
 * Initialize Google Generative AI client
 * Uses GOOGLE_GENAI_API_KEY from environment
 */
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');

/**
 * Generates a 768-dimensional embedding vector for the given text using
 * Google's text-embedding-004 model via Genkit.
 *
 * @param text - The text to embed (typically attributes.genericDescription)
 * @returns A Promise resolving to an array of 768 numbers
 * @throws Error if the API call fails or returns invalid data
 *
 * @example
 * ```ts
 * const vector = await embedGenericDescription("Black iPhone 13 with cracked screen");
 * console.log(vector.length); // 768
 * ```
 */
export async function embedGenericDescription(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot embed empty text');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text.trim());

    const embedding = result.embedding.values;

    if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Expected embedding of dimension ${EMBEDDING_DIMENSION}, got ${embedding?.length || 0}`
      );
    }

    return embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
