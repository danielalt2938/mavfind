import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { matchRequest } from './matchRequest.js';
import { ensureEmbedding } from './indexers.js';

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
        limit: 3,
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
 * Processes requests in batches with concurrent matching limits
 */
async function processRequestsBatch(
  requests: FirebaseFirestore.QueryDocumentSnapshot[],
  lostId: string,
  batchSize: number = 5
): Promise<void> {
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    
    console.info(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} requests)`);
    
    const matchPromises = batch.map(async (requestDoc) => {
      try {
        const result = await matchRequest(requestDoc.id, {
          limit: 3,
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
  }
}

/**
 * Firestore trigger that runs matching when a new lost item is created
 *
 * Triggers on: lost/{lostId}
 * Action: Automatically matches all requests against the new lost item using batch processing
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

    console.info(`New lost item created: ${lostId}, triggering batch matching for all requests...`);

    try {
      const { db } = await import('./db.js');
      
      // Generate embedding for the new lost item first
      console.info(`Generating embedding for new lost item ${lostId}...`);
      const lostRef = db.collection('lost').doc(lostId);
      const lostSnap = await lostRef.get();
      
      if (!lostSnap.exists) {
        console.error(`Lost item ${lostId} not found`);
        return;
      }
      
      const lostData = lostSnap.data();
      await ensureEmbedding(lostRef, lostData);
      console.info(`Successfully generated embedding for lost item ${lostId}`);
      
      // Fetch all requests with safety limit to prevent excessive processing
      const requestsQuery = db.collection('requests')
        .limit(1000); // Safety limit to prevent excessive processing

      const requestsSnapshot = await requestsQuery.get();
      console.info(`Found ${requestsSnapshot.size} requests to match`);

      if (requestsSnapshot.empty) {
        console.info('No requests found, skipping matching');
        return;
      }

      // Process in batches with concurrent limits
      await processRequestsBatch(requestsSnapshot.docs, lostId, 5);

      console.info(`Completed batch matching all requests against new lost item ${lostId}`);
    } catch (error: any) {
      console.error(`Failed to process new lost item ${lostId}:`, error);
      // Don't throw - allow the trigger to complete even if matching fails
    }
  }
);
