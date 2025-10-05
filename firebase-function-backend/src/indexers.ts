import type { DocumentReference, DocumentSnapshot } from 'firebase-admin/firestore';
import { embedGenericDescription, EMBEDDING_DIMENSION } from './ai.js';
import { toVector, serverTimestamp } from './db.js';
import { MissingDescriptionError, EmbeddingDimensionMismatchError } from './types.js';

/**
 * Extracts the genericDescription field from a document's attributes
 *
 * @param doc - Document data (RequestDoc or LostDoc)
 * @returns The trimmed genericDescription, or empty string if not present
 *
 * @example
 * ```ts
 * const desc = packDescription({ attributes: { genericDescription: "Black iPhone" } });
 * // => "Black iPhone"
 * ```
 */
export function packDescription(doc: any): string {
  return (doc?.attributes?.genericDescription || '').trim();
}

/**
 * Ensures that a document has a valid embedding, creating one if necessary.
 *
 * Algorithm:
 * 1. If `data.embedding` exists and `embeddingDim` matches the model dimension, return it immediately
 * 2. Otherwise, read `attributes.genericDescription`
 * 3. Validate it's non-empty (throw MissingDescriptionError if not)
 * 4. Call `embedGenericDescription(text)` to generate the vector
 * 5. Write back: `embedding`, `embeddingDim`, `embeddingAt`
 * 6. Return the generated vector
 *
 * @param ref - Firestore DocumentReference to the document
 * @param data - Current document data (can be from cache or snapshot)
 * @returns Promise resolving to the 768-dimensional embedding array
 * @throws {MissingDescriptionError} if genericDescription is missing or empty
 * @throws {EmbeddingDimensionMismatchError} if existing embedding has wrong dimension
 * @throws {Error} if embedding generation fails
 *
 * @example
 * ```ts
 * const requestRef = db.collection('requests').doc('REQ123');
 * const snap = await requestRef.get();
 * const embedding = await ensureEmbedding(requestRef, snap.data());
 * console.log(embedding.length); // 768
 * ```
 */
export async function ensureEmbedding(
  ref: DocumentReference,
  data: any
): Promise<number[]> {
  // Check if valid embedding already exists
  if (
    data.embedding &&
    Array.isArray(data.embedding) &&
    data.embeddingDim === EMBEDDING_DIMENSION
  ) {
    console.info(`Embedding already exists for ${ref.path}, reusing`);
    return data.embedding;
  }

  // If embedding exists but dimension is wrong, log warning
  if (data.embedding && data.embeddingDim !== EMBEDDING_DIMENSION) {
    console.warn(
      `Embedding dimension mismatch for ${ref.path}: expected ${EMBEDDING_DIMENSION}, got ${data.embeddingDim}. Regenerating...`
    );
  }

  // Extract description
  const description = packDescription(data);

  if (!description || description.length === 0) {
    throw new MissingDescriptionError(ref.parent.id, ref.id);
  }

  console.info(`Generating embedding for ${ref.path} (text length: ${description.length})`);

  // Generate embedding
  const embedding = await embedGenericDescription(description);

  // Validate dimension
  if (embedding.length !== EMBEDDING_DIMENSION) {
    throw new EmbeddingDimensionMismatchError(
      EMBEDDING_DIMENSION,
      embedding.length,
      ref.id
    );
  }

  // Write back to Firestore
  await ref.update({
    embedding: toVector(embedding),
    embeddingDim: EMBEDDING_DIMENSION,
    embeddingAt: serverTimestamp(),
  });

  console.info(`Successfully generated and stored embedding for ${ref.path}`);

  return embedding;
}

/**
 * Batch ensures embeddings for multiple documents
 *
 * @param snapshots - Array of document snapshots
 * @returns Promise resolving to array of embeddings (parallel execution)
 *
 * @example
 * ```ts
 * const snaps = await db.collection('requests').limit(10).get();
 * const embeddings = await ensureEmbeddingsForBatch(snaps.docs);
 * ```
 */
export async function ensureEmbeddingsForBatch(
  snapshots: DocumentSnapshot[]
): Promise<number[][]> {
  return Promise.all(
    snapshots.map((snap) => ensureEmbedding(snap.ref, snap.data()))
  );
}
