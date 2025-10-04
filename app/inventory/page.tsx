"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Badge } from "@/components/ui";

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
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-white/5">
        <div className="container-custom py-5 flex justify-between items-center">
          <Link href="/" className="text-2xl font-display font-bold tracking-tight hover:text-utaOrange transition-colors">
            MavFind
          </Link>
          <nav className="flex items-center gap-8">
            <Link href="/inventory" className="text-base font-medium text-fg">
              Browse
            </Link>
            <Link href="/dashboard/user" className="text-base font-medium text-muted hover:text-fg transition-colors">
              My Reports
            </Link>
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm" className="text-base">Sign In</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container-custom section-padding pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Browse inventory.
          </h1>
          <p className="text-lg text-muted mb-8">
            Search our collection of found items across all locations.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-12">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for items..."
                className="input-base flex-1 text-lg"
              />
              <Button type="submit" size="lg" className="sm:w-auto">
                Search
              </Button>
            </div>
          </form>

          {/* Results */}
          {loading ? (
            <div className="text-center py-20">
              <div className="text-lg text-muted">Looking around...</div>
            </div>
          ) : items.length === 0 ? (
            <div className="card-base p-12 text-center">
              <p className="text-lg text-muted">
                No matches—yet.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item: any, idx: number) => (
                <motion.div
                  key={item.objectID}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                >
                  <div className="card-base p-6 hover-lift h-full bg-[#0C2340]/5 border-utaBlue/10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1 capitalize">
                          {item.category}
                        </h3>
                        {item.brand && (
                          <p className="text-sm text-muted">{item.brand}</p>
                        )}
                      </div>
                      <Badge variant={item.type === "lost" ? "success" : "warning"}>
                        {item.type === "lost" ? "Found" : "Reported"}
                      </Badge>
                    </div>

                    <p className="text-muted leading-relaxed mb-4 line-clamp-3">
                      {item.description}
                    </p>

                    <div className="space-y-1 mb-4">
                      {item.color && (
                        <div className="text-sm text-muted">
                          <span className="text-fg font-medium">Color:</span> {item.color}
                        </div>
                      )}
                      {item.model && (
                        <div className="text-sm text-muted">
                          <span className="text-fg font-medium">Model:</span> {item.model}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted/70 pt-3 border-t border-white/5">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
