/**
 * Script to configure Algolia indices with proper facets for filtering
 * Run with: npx tsx scripts/configure-algolia.ts
 */

import algoliasearch from 'algoliasearch';

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_API_KEY = process.env.ALGOLIA_ADMIN_API_KEY; // You need to add this to .env
const INVENTORY_INDEX = process.env.ALGOLIA_INDEX_NAME_INVENTORY || 'mavfind_lost_items';
const REQUEST_INDEX = process.env.ALGOLIA_INDEX_NAME_REQUEST || 'mavfind_lost_items_requests';

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_ALGOLIA_APP_ID');
  console.error('   - ALGOLIA_ADMIN_API_KEY (you need to add this to .env)');
  console.error('\n📝 Get your Admin API Key from: https://www.algolia.com/account/api-keys/');
  process.exit(1);
}

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);

async function configureIndex(indexName: string) {
  console.log(`\n🔧 Configuring index: ${indexName}`);

  const index = client.initIndex(indexName);

  try {
    // Configure index settings
    await index.setSettings({
      // Attributes for faceting (filtering)
      attributesForFaceting: [
        'searchable(category)',
        'searchable(lostOrFound)',
        'searchable(status)',
        'searchable(locationId)',
        'searchable(attributes.category)',
        'createdAt',
      ],

      // Searchable attributes
      searchableAttributes: [
        'title',
        'description',
        'genericDescription',
        'category',
        'attributes.category',
        'attributes.brand',
        'attributes.model',
        'attributes.color',
        'attributes.distinguishingFeatures',
      ],

      // Attributes to retrieve
      attributesToRetrieve: [
        'objectID',
        'title',
        'description',
        'genericDescription',
        'category',
        'subcategory',
        'lostOrFound',
        'status',
        'locationId',
        'images',
        'createdAt',
        'attributes',
        'location',
        'times',
      ],

      // Custom ranking
      customRanking: [
        'desc(createdAt)',
      ],

      // Enable typo tolerance
      typoTolerance: true,

      // Pagination
      hitsPerPage: 50,
    });

    console.log(`✅ Successfully configured ${indexName}`);
    console.log(`   - Facets: category, lostOrFound, status, locationId`);
    console.log(`   - Searchable: title, description, category, attributes`);

  } catch (error) {
    console.error(`❌ Error configuring ${indexName}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Algolia configuration...\n');
  console.log(`App ID: ${ALGOLIA_APP_ID}`);

  try {
    // Configure both indices
    await configureIndex(INVENTORY_INDEX);
    await configureIndex(REQUEST_INDEX);

    console.log('\n✨ All indices configured successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Your Algolia indices now have proper facets configured');
    console.log('   2. Make sure your Firebase functions are syncing data to Algolia');
    console.log('   3. Test the filters in your admin dashboard');

  } catch (error) {
    console.error('\n❌ Configuration failed:', error);
    process.exit(1);
  }
}

main();
