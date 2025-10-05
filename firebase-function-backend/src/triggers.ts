import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { matchRequest } from './matchRequest.js';

/**
 * Firestore trigger that runs matching when a new request is created
 *
 * Triggers on: requests/{requestId}
 * Action: Automatically matches the new request against all lost items
 */
export const onRequestCreated = onDocumentCreated(
  {
    document: 'requests/{requestId}',
    memory: '512MiB',
    timeoutSeconds: 540,
    maxInstances: 10,
  },
  async (event) => {
    const requestId = event.params.requestId;

    console.info(`New request created: ${requestId}, triggering automatic matching...`);

    try {
      const result = await matchRequest(requestId, {
        limit: 10,
        distanceThreshold: 0.6,
      });

      console.info(`Successfully matched new request ${requestId}:`, {
        matchCount: result.matches.length,
      });
    } catch (error: any) {
      console.error(`Failed to match new request ${requestId}:`, error);
      // Don't throw - allow the trigger to complete even if matching fails
    }
  }
);

/**
 * Firestore trigger that runs matching when a new lost item is created
 *
 * Triggers on: lost/{lostId}
 * Action: Automatically matches all requests against the new lost item
 */
export const onLostItemCreated = onDocumentCreated(
  {
    document: 'lost/{lostId}',
    memory: '512MiB',
    timeoutSeconds: 540,
    maxInstances: 10,
  },
  async (event) => {
    const lostId = event.params.lostId;

    console.info(`New lost item created: ${lostId}, triggering matching for all requests...`);

    try {
      // Get all requests
      const { db } = await import('./db.js');
      const requestsSnapshot = await db.collection('requests').get();

      console.info(`Found ${requestsSnapshot.size} requests to match`);

      // Match each request (the matchRequest function will consider the new lost item)
      const matchPromises = requestsSnapshot.docs.map(async (requestDoc) => {
        try {
          const result = await matchRequest(requestDoc.id, {
            limit: 10,
            distanceThreshold: 0.6,
          });
          console.info(`Matched request ${requestDoc.id} against new lost item ${lostId}`);
          return result;
        } catch (error: any) {
          console.error(`Failed to match request ${requestDoc.id}:`, error);
          return null;
        }
      });

      await Promise.all(matchPromises);

      console.info(`Completed matching all requests against new lost item ${lostId}`);
    } catch (error: any) {
      console.error(`Failed to process new lost item ${lostId}:`, error);
      // Don't throw - allow the trigger to complete even if matching fails
    }
  }
);
