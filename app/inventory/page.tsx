"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    searchInventory();
  }, []);

  const searchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ query });
      const res = await fetch(`/api/inventory?${params}`);
      const data = await res.json();
      setItems(data.hits || []);
    } catch (error) {
      console.error("Error searching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchInventory();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4 shadow-lg">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            MavFind
          </Link>
          <nav className="space-x-4">
            <Link href="/inventory" className="hover:underline font-semibold">
              Search Inventory
            </Link>
            <Link href="/dashboard/user" className="hover:underline">
              My Reports
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Search Lost & Found Inventory</h1>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for items (e.g., iPhone, blue backpack, keys...)"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-lg"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Search
            </button>
          </div>
        </form>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl">Searching...</div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">
              No items found. Try a different search term.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any) => (
              <div key={item.objectID} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">
                        {item.category}
                      </h3>
                      {item.brand && (
                        <p className="text-sm text-gray-600">{item.brand}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        item.type === "lost"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {item.type === "lost" ? "Found" : "Reported"}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4">{item.description}</p>
                  {item.color && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Color:</span> {item.color}
                    </div>
                  )}
                  {item.model && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Model:</span> {item.model}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-4">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
