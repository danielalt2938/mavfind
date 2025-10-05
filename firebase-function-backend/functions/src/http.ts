import { onRequest } from 'firebase-functions/v2/https';
import type { Request, Response } from 'firebase-functions/v2/https';
import { matchRequest } from '../../src/matchRequest.js';
import type { MatchRequestOptions } from '../../src/types.js';
import {
  RequestNotFoundError,
  MissingDescriptionError,
  EmbeddingDimensionMismatchError,
  VectorIndexMissingError,
} from '../../src/types.js';

/**
 * Validates the request body for matchRequest endpoint
 */
function validateMatchRequestBody(body: any): {
  valid: boolean;
  error?: string;
  requestId?: string;
  options?: MatchRequestOptions;
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  if (!body.requestId || typeof body.requestId !== 'string') {
    return { valid: false, error: 'requestId is required and must be a string' };
  }

  const options: MatchRequestOptions = {};

  if (body.limit !== undefined) {
    if (typeof body.limit !== 'number' || body.limit < 1 || body.limit > 100) {
      return { valid: false, error: 'limit must be a number between 1 and 100' };
    }
    options.limit = body.limit;
  }

  if (body.distanceThreshold !== undefined) {
    if (
      typeof body.distanceThreshold !== 'number' ||
      body.distanceThreshold < 0 ||
      body.distanceThreshold > 2
    ) {
      return {
        valid: false,
        error: 'distanceThreshold must be a number between 0 and 2',
      };
    }
    options.distanceThreshold = body.distanceThreshold;
  }

  if (body.prefilters !== undefined) {
    if (typeof body.prefilters !== 'object') {
      return { valid: false, error: 'prefilters must be an object' };
    }

    options.prefilters = {};

    if (body.prefilters.category !== undefined) {
      if (typeof body.prefilters.category !== 'string') {
        return { valid: false, error: 'prefilters.category must be a string' };
      }
      options.prefilters.category = body.prefilters.category;
    }

    if (body.prefilters.campus !== undefined) {
      if (typeof body.prefilters.campus !== 'string') {
        return { valid: false, error: 'prefilters.campus must be a string' };
      }
      options.prefilters.campus = body.prefilters.campus;
    }
  }

  return {
    valid: true,
    requestId: body.requestId,
    options,
  };
}

/**
 * HTTP Cloud Function to match a user request against found items
 *
 * Method: POST
 * Content-Type: application/json
 *
 * Body:
 * ```json
 * {
 *   "requestId": "REQ123",
 *   "limit": 5,
 *   "distanceThreshold": 0.6,
 *   "prefilters": {
 *     "category": "electronics",
 *     "campus": "UTA"
 *   }
 * }
 * ```
 *
 * Response:
 * ```json
 * {
 *   "ok": true,
 *   "requestId": "REQ123",
 *   "matches": [
 *     {
 *       "lostId": "LOST456",
 *       "distance": 0.32,
 *       "confidence": 0.84,
 *       "rank": 0
 *     }
 *   ]
 * }
 * ```
 *
 * @example
 * ```bash
 * curl -X POST https://us-central1-myproject.cloudfunctions.net/matchRequestHttp \
 *   -H "Content-Type: application/json" \
 *   -d '{"requestId":"REQ123","limit":5}'
 * ```
 */
export const matchRequestHttp = onRequest(
  {
    cors: true, // Enable CORS for development (configure for production)
    memory: '512MiB',
    timeoutSeconds: 540,
    maxInstances: 10,
  },
  async (req: Request, res: Response) => {
    const startTime = Date.now();

    // Set CORS headers manually for more control
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
      console.warn(`Invalid method: ${req.method}`);
      res.status(405).json({
        ok: false,
        error: 'Method not allowed. Use POST.',
      });
      return;
    }

    try {
      console.info('Received matchRequest HTTP call', {
        body: req.body,
        headers: req.headers,
      });

      // Validate input
      const validation = validateMatchRequestBody(req.body);
      if (!validation.valid) {
        console.warn('Validation failed:', validation.error);
        res.status(400).json({
          ok: false,
          error: validation.error,
        });
        return;
      }

      const { requestId, options } = validation;

      console.info(`Processing match for requestId=${requestId}`, options);

      // Call core matching logic
      const result = await matchRequest(requestId!, options);

      const duration = Date.now() - startTime;
      console.info(`Match completed in ${duration}ms`, {
        requestId,
        matchCount: result.matches.length,
      });

      // Return success response
      res.status(200).json({
        ok: true,
        ...result,
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Handle known errors with appropriate status codes
      if (error instanceof RequestNotFoundError) {
        console.warn('Request not found:', error.message);
        res.status(404).json({
          ok: false,
          error: error.message,
          errorType: 'RequestNotFoundError',
          duration,
        });
        return;
      }

      if (error instanceof MissingDescriptionError) {
        console.warn('Missing description:', error.message);
        res.status(400).json({
          ok: false,
          error: error.message,
          errorType: 'MissingDescriptionError',
          duration,
        });
        return;
      }

      if (error instanceof EmbeddingDimensionMismatchError) {
        console.error('Embedding dimension mismatch:', error.message);
        res.status(500).json({
          ok: false,
          error: error.message,
          errorType: 'EmbeddingDimensionMismatchError',
          duration,
        });
        return;
      }

      if (error instanceof VectorIndexMissingError) {
        console.error('Vector index missing:', error.message);
        res.status(503).json({
          ok: false,
          error: error.message,
          errorType: 'VectorIndexMissingError',
          hint: 'Create the Firestore vector index and try again',
          duration,
        });
        return;
      }

      // Unknown error
      console.error('Unexpected error in matchRequestHttp:', error);
      res.status(500).json({
        ok: false,
        error: 'Internal server error',
        message: error.message || String(error),
        duration,
      });
    }
  }
);
