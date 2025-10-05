import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { db, toVector, serverTimestamp } from './db.js';
import { ensureEmbedding } from './indexers.js';
import type {
  MatchRequestOptions,
  MatchRequestResult,
  MatchResult,
  MatchDoc,
  RequestDoc,
  LostDoc,
} from './types.js';
import {
  RequestNotFoundError,
  VectorIndexMissingError,
} from './types.js';

/**
 * Converts COSINE distance (range 0..2) to a confidence score (range 0..1)
 *
 * COSINE distance: 0 = identical, 2 = opposite
 * Confidence: 1 = perfect match, 0 = no match
 *
 * @param distance - COSINE distance from Firestore vector search
 * @returns Confidence score between 0 and 1
 *
 * @example
 * ```ts
 * distanceToConfidence(0) // => 1.0 (perfect match)
 * distanceToConfidence(1) // => 0.5 (moderate match)
 * distanceToConfidence(2) // => 0.0 (no match)
 * ```
 */
export function distanceToConfidence(distance: number): number {
  return Math.max(0, 1 - distance / 2);
}

/**
 * Matches a user request against found items using Firestore Vector Search
 *
 * Algorithm:
 * 1. Load the request document and ensure it has an embedding
 * 2. Build a Firestore query on `lost` collection with optional prefilters
 * 3. Execute KNN search using findNearest with COSINE distance
 * 4. Convert distances to confidence scores
 * 5. Delete all existing matches and persist new matches to `requests/{id}/matches/{lostId}` subcollection
 * 6. Return summary with match details
 *
 * @param requestId - ID of the request document to match
 * @param options - Optional parameters for matching
 * @param options.limit - Max number of matches to return (default: 10)
 * @param options.distanceThreshold - Max COSINE distance (default: 0.6)
 * @param options.prefilters - Optional category/campus filters
 * @returns Promise resolving to match results
 * @throws {RequestNotFoundError} if request doesn't exist
 * @throws {MissingDescriptionError} if genericDescription is missing
 * @throws {VectorIndexMissingError} if Firestore vector index is not configured
 *
 * @example
 * ```ts
 * const result = await matchRequest('REQ123', {
 *   limit: 5,
 *   distanceThreshold: 0.6,
 *   prefilters: { category: 'electronics' }
 * });
 * console.log(`Found ${result.matches.length} matches`);
 * ```
 */
export async function matchRequest(
  requestId: string,
  options?: MatchRequestOptions
): Promise<MatchRequestResult> {
  const {
    limit = 10,
    distanceThreshold = 0.6,
    prefilters,
  } = options || {};

  console.info(`Starting match for request ${requestId} with options:`, {
    limit,
    distanceThreshold,
    prefilters,
  });

  // 1. Load request and ensure embedding
  const requestRef = db.collection('requests').doc(requestId);
  const requestSnap = await requestRef.get();

  if (!requestSnap.exists) {
    throw new RequestNotFoundError(requestId);
  }

  const requestData = requestSnap.data() as RequestDoc;
  console.info(`Loaded request ${requestId}, ensuring embedding...`);

  const requestEmbedding = await ensureEmbedding(requestRef, requestData);

  // 2. Build query with prefilters
  let query: FirebaseFirestore.Query = db.collection('lost');

  if (prefilters?.category) {
    console.info(`Applying category filter: ${prefilters.category}`);
    query = query.where('category', '==', prefilters.category);
  }

  if (prefilters?.campus) {
    console.info(`Applying campus filter: ${prefilters.campus}`);
    query = query.where('campus', '==', prefilters.campus);
  }

  // 3. Execute KNN search
  console.info(`Executing vector search with limit=${limit}, threshold=${distanceThreshold}`);

  let vectorQueryResults: QueryDocumentSnapshot[];
  try {
    // Create VectorQuery with COSINE distance and distance result field
    const vectorQuery = query.findNearest('embedding', requestEmbedding as any, {
      limit,
      distanceMeasure: 'COSINE',
      distanceResultField: 'vector_distance',
    } as any);

    const vectorSnap = await vectorQuery.get();
    vectorQueryResults = vectorSnap.docs;

    console.info(`Vector search returned ${vectorQueryResults.length} results`);
  } catch (error: any) {
    // Check if error is due to missing vector index
    if (
      error.message?.includes('index') ||
      error.message?.includes('vector') ||
      error.code === 9 // FAILED_PRECONDITION
    ) {
      console.error('Vector index missing:', error);
      throw new VectorIndexMissingError();
    }
    throw error;
  }

  // 4. Process results and calculate confidence
  const matches: MatchResult[] = vectorQueryResults
    .map((doc, index) => {
      // Get actual distance from the vector search result
      const distance = doc.get('vector_distance') || 0;

      // Apply distance threshold manually
      if (distance > distanceThreshold) {
        console.info(`Filtering out match ${doc.id} with distance ${distance} > threshold ${distanceThreshold}`);
        return null;
      }

      const confidence = distanceToConfidence(distance);

      console.info(`Match found: ${doc.id}, distance: ${distance}, confidence: ${confidence.toFixed(3)}`);

      return {
        lostId: doc.id,
        distance,
        confidence,
        rank: index,
      };
    })
    .filter((match): match is MatchResult => match !== null);

  // 5. Replace all matches: delete existing and add new ones
  console.info(`Replacing all matches with ${matches.length} new matches...`);
  const matchesRef = requestRef.collection('matches');

  // Delete all existing matches first
  const existingMatches = await matchesRef.get();
  if (!existingMatches.empty) {
    console.info(`Deleting ${existingMatches.size} existing matches`);
    const deletePromises = existingMatches.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
  }

  // Add new matches
  if (matches.length > 0) {
    console.info(`Creating ${matches.length} new matches`);
    await Promise.all(
      matches.map(async (match) => {
        const matchDocRef = matchesRef.doc(match.lostId);
        const matchData: MatchDoc = {
          lostRef: db.collection('lost').doc(match.lostId),
          distance: match.distance,
          confidence: match.confidence,
          rank: match.rank,
          status: 'pending',
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any,
        };

        await matchDocRef.set(matchData);
      })
    );
  }

  console.info(`Successfully matched request ${requestId}`);

  return {
    requestId,
    matches,
  };
}
