import type { DocumentReference, Timestamp } from 'firebase-admin/firestore';

/**
 * Document stored in the `requests` collection
 */
export interface RequestDoc {
  id: string;
  userId: string;
  category?: string;
  campus?: string;
  attributes?: {
    genericDescription?: string;
    brand?: string;
    model?: string;
    color?: string;
    [key: string]: any;
  };
  embedding?: number[];
  embeddingDim?: number;
  embeddingAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: any;
}

/**
 * Document stored in the `lost` (found items) collection
 */
export interface LostDoc {
  id: string;
  category?: string;
  campus?: string;
  attributes?: {
    genericDescription?: string;
    brand?: string;
    model?: string;
    color?: string;
    [key: string]: any;
  };
  embedding?: number[];
  embeddingDim?: number;
  embeddingAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: any;
}

/**
 * Match document stored under requests/{id}/matches/{lostId}
 */
export interface MatchDoc {
  lostRef: DocumentReference;
  distance: number;
  confidence: number;
  rank: number;
  status: MatchStatus;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Match status enum
 */
export type MatchStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Match result returned from matchRequest
 */
export interface MatchResult {
  lostId: string;
  distance: number;
  confidence: number;
  rank: number;
}

/**
 * Response from matchRequest function
 */
export interface MatchRequestResult {
  requestId: string;
  matches: MatchResult[];
}

/**
 * Options for matchRequest function
 */
export interface MatchRequestOptions {
  limit?: number;
  distanceThreshold?: number;
  prefilters?: {
    category?: string;
    campus?: string;
  };
}

/**
 * Custom error types
 */
export class RequestNotFoundError extends Error {
  constructor(requestId: string) {
    super(`Request with ID '${requestId}' not found`);
    this.name = 'RequestNotFoundError';
  }
}

export class MissingDescriptionError extends Error {
  constructor(docType: string, docId: string) {
    super(
      `Document ${docType}/${docId} is missing attributes.genericDescription or it is empty`
    );
    this.name = 'MissingDescriptionError';
  }
}

export class EmbeddingDimensionMismatchError extends Error {
  constructor(expected: number, actual: number, docId: string) {
    super(
      `Embedding dimension mismatch for ${docId}: expected ${expected}, got ${actual}`
    );
    this.name = 'EmbeddingDimensionMismatchError';
  }
}

export class VectorIndexMissingError extends Error {
  constructor() {
    super(
      `Firestore vector index is missing. Please create an index on the 'lost' collection with field 'embedding', dimension 768, and COSINE distance measure. ` +
        `Run: gcloud firestore indexes composite create --collection-group=lost --field-config field-path=embedding,vector-config='{"dimension":768,"flat": "{}"}' --database=(default)`
    );
    this.name = 'VectorIndexMissingError';
  }
}
