import { algoliasearch } from "algoliasearch";

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
);

interface SearchParams {
  query: string;
  category?: string;
  location?: string;
  page?: number;
  hitsPerPage?: number;
}

export async function searchInventory({
  query,
  category,
  location,
  page = 0,
  hitsPerPage = 20,
}: SearchParams) {
  const filters: string[] = [];

  if (category) {
    filters.push(`category:"${category}"`);
  }

  if (location) {
    filters.push(`location:"${location}"`);
  }

  const searchParams: any = {
    page,
    hitsPerPage,
  };

  if (filters.length > 0) {
    searchParams.filters = filters.join(" AND ");
  }

  const results = await client.searchSingleIndex({
    indexName: process.env.ALGOLIA_INDEX_NAME!,
    searchParams: {
      query,
      ...searchParams,
    },
  });
  
  return results;
}
