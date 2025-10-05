import admin from 'firebase-admin';
import type { FieldValue } from 'firebase-admin/firestore';

/**
 * Initialize Firebase Admin SDK
 * Uses Application Default Credentials (ADC) in production
 */
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Firestore database instance
 */
export const db = admin.firestore();

/**
 * Wraps a numeric array as a Firestore Vector field value
 *
 * @param values - Array of numbers representing the embedding vector
 * @returns FieldValue suitable for writing to Firestore vector field
 *
 * @example
 * ```ts
 * const embedding = [0.1, 0.2, 0.3, ...];
 * await docRef.update({
 *   embedding: toVector(embedding),
 *   embeddingDim: embedding.length
 * });
 * ```
 */
export function toVector(values: number[]): FieldValue {
  return admin.firestore.FieldValue.vector(values);
}

/**
 * Server timestamp helper
 */
export const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp();

export default admin;
