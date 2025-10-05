#!/usr/bin/env node
/**
 * Backfill embeddings for all documents in `requests` and `lost` collections
 *
 * Usage:
 *   npm run build && node dist/scripts/backfill-embeddings.js
 *   npm run build && node dist/scripts/backfill-embeddings.js --dry-run
 *   npm run build && node dist/scripts/backfill-embeddings.js --collection=lost --limit=50
 *
 * Options:
 *   --dry-run           - Only log what would be done, don't write
 *   --collection=NAME   - Only process 'requests' or 'lost' (default: both)
 *   --limit=N           - Process at most N documents per collection
 *   --concurrency=N     - Max concurrent embedding requests (default: 5)
 */

import PQueue from 'p-queue';
import { db } from '../src/db.js';
import { ensureEmbedding, packDescription } from '../src/indexers.js';
import type { DocumentSnapshot } from 'firebase-admin/firestore';

interface BackfillOptions {
  dryRun: boolean;
  collections: string[];
  limit?: number;
  concurrency: number;
}

/**
 * Parse command-line arguments
 */
function parseArgs(): BackfillOptions {
  const args = process.argv.slice(2);
  const options: BackfillOptions = {
    dryRun: false,
    collections: ['requests', 'lost'],
    concurrency: 5,
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--collection=')) {
      const collection = arg.split('=')[1];
      if (!['requests', 'lost'].includes(collection)) {
        console.error(`Invalid collection: ${collection}. Use 'requests' or 'lost'.`);
        process.exit(1);
      }
      options.collections = [collection];
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
      if (isNaN(options.limit) || options.limit < 1) {
        console.error('Invalid limit. Must be a positive integer.');
        process.exit(1);
      }
    } else if (arg.startsWith('--concurrency=')) {
      options.concurrency = parseInt(arg.split('=')[1], 10);
      if (isNaN(options.concurrency) || options.concurrency < 1) {
        console.error('Invalid concurrency. Must be a positive integer.');
        process.exit(1);
      }
    } else {
      console.error(`Unknown argument: ${arg}`);
      console.error(
        'Usage: node backfill-embeddings.js [--dry-run] [--collection=NAME] [--limit=N] [--concurrency=N]'
      );
      process.exit(1);
    }
  }

  return options;
}

/**
 * Process a single document: ensure it has an embedding
 */
async function processDocument(
  snap: DocumentSnapshot,
  dryRun: boolean
): Promise<{ success: boolean; skipped: boolean; error?: string }> {
  const data = snap.data();
  if (!data) {
    return { success: false, skipped: true, error: 'No data' };
  }

  // Check if embedding already exists
  if (data.embedding && data.embeddingDim === 768) {
    console.log(`  ✓ ${snap.ref.path} - already has embedding`);
    return { success: true, skipped: true };
  }

  // Check if description exists
  const description = packDescription(data);
  if (!description || description.length === 0) {
    console.warn(`  ⚠ ${snap.ref.path} - no description, skipping`);
    return { success: false, skipped: true, error: 'No description' };
  }

  if (dryRun) {
    console.log(`  [DRY RUN] Would generate embedding for ${snap.ref.path}`);
    return { success: true, skipped: false };
  }

  try {
    await ensureEmbedding(snap.ref, data);
    console.log(`  ✓ ${snap.ref.path} - embedding generated`);
    return { success: true, skipped: false };
  } catch (error: any) {
    console.error(`  ✗ ${snap.ref.path} - error: ${error.message}`);
    return { success: false, skipped: false, error: error.message };
  }
}

/**
 * Backfill embeddings for a single collection
 */
async function backfillCollection(
  collectionName: string,
  options: BackfillOptions
): Promise<void> {
  console.log(`\n📦 Processing collection: ${collectionName}`);

  let query: FirebaseFirestore.Query = db.collection(collectionName);

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const snapshot = await query.get();
  console.log(`Found ${snapshot.docs.length} documents`);

  if (snapshot.empty) {
    console.log('No documents to process');
    return;
  }

  // Process documents with concurrency control
  const queue = new PQueue({ concurrency: options.concurrency });
  const results = {
    total: snapshot.docs.length,
    success: 0,
    skipped: 0,
    failed: 0,
  };

  const tasks = snapshot.docs.map((doc) =>
    queue.add(async () => {
      const result = await processDocument(doc, options.dryRun);
      if (result.success && !result.skipped) {
        results.success++;
      } else if (result.skipped) {
        results.skipped++;
      } else {
        results.failed++;
      }
    })
  );

  await Promise.all(tasks);

  console.log(`\n✅ ${collectionName} completed:`);
  console.log(`   Total: ${results.total}`);
  console.log(`   Success: ${results.success}`);
  console.log(`   Skipped: ${results.skipped}`);
  console.log(`   Failed: ${results.failed}`);
}

/**
 * Main entry point
 */
async function main() {
  const options = parseArgs();

  console.log('🚀 Backfill Embeddings Script');
  console.log('Options:', options);

  if (options.dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  const startTime = Date.now();

  try {
    for (const collection of options.collections) {
      await backfillCollection(collection, options);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n🎉 All done in ${duration}s`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
