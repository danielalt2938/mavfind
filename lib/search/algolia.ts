import algoliasearch, { SearchClient } from "algoliasearch";
import { Request, LostItem, SearchInventoryParams } from "@/types";

let searchClient: SearchClient;
let adminClient: SearchClient;

export function getAlgoliaSearchClient(): SearchClient {
  if (!searchClient) {
    searchClient = algoliasearch(
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "dummy-app-id",
      process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || "dummy-key"
    );
  }
  return searchClient;
}

export function getAlgoliaAdminClient(): SearchClient {
  if (!adminClient) {
    adminClient = algoliasearch(
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "dummy-app-id",
      process.env.ALGOLIA_ADMIN_API_KEY || "dummy-key"
    );
  }
  return adminClient;
}

const INDEX_NAME = process.env.ALGOLIA_INDEX_NAME || "mavfind_items";

// Index a single item (request or lost item)
export async function indexItem(
  item: Request | LostItem,
  type: "request" | "lost"
) {
  const client = getAlgoliaAdminClient();
  const index = client.initIndex(INDEX_NAME);

  const record = {
    objectID: item.id,
    type,
    locationId: item.locationId,
    status: item.status,
    description: item.description,
    category: item.attributes.category,
    brand: item.attributes.brand || "",
    model: item.attributes.model || "",
    color: item.attributes.color || "",
    createdAt: new Date(item.createdAt).getTime(),
    updatedAt: new Date(item.updatedAt).getTime(),
  };

  await index.saveObject(record);
}

// Index multiple items in batch
export async function indexItems(
  items: Array<{ item: Request | LostItem; type: "request" | "lost" }>
) {
  const client = getAlgoliaAdminClient();
  const index = client.initIndex(INDEX_NAME);

  const records = items.map(({ item, type }) => ({
    objectID: item.id,
    type,
    locationId: item.locationId,
    status: item.status,
    description: item.description,
    category: item.attributes.category,
    brand: item.attributes.brand || "",
    model: item.attributes.model || "",
    color: item.attributes.color || "",
    createdAt: new Date(item.createdAt).getTime(),
    updatedAt: new Date(item.updatedAt).getTime(),
  }));

  await index.saveObjects(records);
}

// Delete an item from the index
export async function deleteFromIndex(itemId: string) {
  const client = getAlgoliaAdminClient();
  const index = client.initIndex(INDEX_NAME);
  await index.deleteObject(itemId);
}

// Search the inventory
export async function searchInventory(params: SearchInventoryParams) {
  const client = getAlgoliaSearchClient();
  const index = client.initIndex(INDEX_NAME);

  const { query = "", category, location, page = 0, hitsPerPage = 20 } = params;

  const filters: string[] = [];

  if (category) {
    filters.push(`category:"${category}"`);
  }

  if (location) {
    filters.push(`locationId:"${location}"`);
  }

  const searchParams: any = {
    page,
    hitsPerPage,
  };

  if (filters.length > 0) {
    searchParams.filters = filters.join(" AND ");
  }

  const results = await index.search(query, searchParams);

  return {
    hits: results.hits,
    nbHits: results.nbHits,
    page: results.page,
    nbPages: results.nbPages,
  };
}

// Configure index settings
export async function configureIndexSettings() {
  const client = getAlgoliaAdminClient();
  const index = client.initIndex(INDEX_NAME);

  await index.setSettings({
    searchableAttributes: [
      "description",
      "category",
      "brand",
      "model",
      "color",
    ],
    attributesForFaceting: ["filterOnly(category)", "filterOnly(locationId)"],
    customRanking: ["desc(createdAt)"],
  });
}
