"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Badge } from "@/components/ui";
import algoliasearch from "algoliasearch/lite";
import {
  InstantSearch,
  SearchBox,
  Hits,
  Configure,
  Highlight,
} from "react-instantsearch";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
);

export default function InventoryPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-white/5">
        <div className="container-custom py-4 flex justify-between items-center">
          <Link href="/" className="text-xl md:text-2xl font-display font-bold tracking-tight hover:text-utaOrange transition-colors">
            MavFind
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="container-custom py-4 space-y-4">
              <Link
                href="/inventory"
                className="block text-sm font-medium text-fg py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse
              </Link>
              <Link
                href="/dashboard/user"
                className="block text-sm font-medium text-muted hover:text-fg transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Reports
              </Link>
              <Link
                href="/auth/signin"
                className="block text-sm font-medium text-muted hover:text-fg transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
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

          <InstantSearch
            searchClient={searchClient}
            indexName={process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME_INVENTORY || "mavfind_lost_items"}
          >
            {/* Search Bar */}
            <div className="mb-12">
              <SearchBox
                placeholder="Search for items..."
                classNames={{
                  root: "w-full",
                  form: "flex flex-col sm:flex-row gap-3",
                  input: "input-base flex-1 text-lg",
                  submit: "btn-primary py-3 px-6 sm:w-auto",
                  reset: "hidden",
                }}
                submitIconComponent={() => <span>Search</span>}
              />
            </div>

            <Configure hitsPerPage={50} />

            {/* Results */}
            <Hits
              hitComponent={({ hit }) => <InventoryHit hit={hit} />}
              classNames={{
                root: "",
                list: "grid md:grid-cols-2 lg:grid-cols-3 gap-6",
                item: "",
              }}
            />
          </InstantSearch>
        </motion.div>
      </div>
    </div>
  );
}

function InventoryHit({ hit }: { hit: any }) {
  const images = hit.images || [];
  const firstImage = images.length > 0 ? images[0] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card-base overflow-hidden hover-lift h-full bg-[#0C2340]/5 border-utaBlue/10"
    >
      {/* Image Section - Always shown */}
      <div className="relative w-full h-48 bg-bgElevated overflow-hidden">
        {firstImage ? (
          <img
            src={firstImage}
            alt={hit.title || "Item image"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center border-b border-border">
            <svg className="w-16 h-16 text-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={hit.type === "lost" ? "success" : "warning"}>
            {hit.type === "lost" ? "Found" : "Reported"}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1 capitalize">
              <Highlight attribute="category" hit={hit} />
            </h3>
            {hit.brand && (
              <p className="text-sm text-muted">
                <Highlight attribute="brand" hit={hit} />
              </p>
            )}
          </div>
        </div>

        <p className="text-muted leading-relaxed mb-4 line-clamp-3">
          <Highlight attribute="description" hit={hit} />
        </p>

        <div className="space-y-1 mb-4">
          {hit.color && (
            <div className="text-sm text-muted">
              <span className="text-fg font-medium">Color:</span>{" "}
              <Highlight attribute="color" hit={hit} />
            </div>
          )}
          {hit.model && (
            <div className="text-sm text-muted">
              <span className="text-fg font-medium">Model:</span>{" "}
              <Highlight attribute="model" hit={hit} />
            </div>
          )}
        </div>

        <div className="text-xs text-muted/70 pt-3 border-t border-white/5">
          {new Date(hit.createdAt).toLocaleDateString()}
        </div>
      </div>
    </motion.div>
  );
}
