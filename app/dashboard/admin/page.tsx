"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import algoliasearch from "algoliasearch/lite";
import {
  InstantSearch,
  SearchBox,
  Hits,
  Configure,
  RefinementList,
  ClearRefinements,
} from "react-instantsearch";
import ImageWithLoader from "@/components/ImageWithLoader";
import { Fragment } from "react";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
);

// Helper function to format time ago
function getTimeAgo(timestamp: string | number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export default function AdminDashboard() {
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [selectedLocation, setSelectedLocation] =
    useState<string>("university_center");
  const [activeTab, setActiveTab] = useState<"requests" | "inventory">(
    "requests"
  );
  const [showAddItemForm, setShowAddItemForm] = useState(false);

  // Data states
  const [requests, setRequests] = useState<any[]>([]);
  const [foundItems, setFoundItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Image modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openImageModal = (images: string[], startIndex: number = 0) => {
    setModalImages(images);
    setCurrentImageIndex(startIndex);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setModalImages([]);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % modalImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + modalImages.length) % modalImages.length
    );
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/auth/signin");
      } else if (userRole !== "admin") {
        router.replace("/dashboard/user");
      }
    }
  }, [authLoading, user, userRole, router]);

  useEffect(() => {
    if (user && userRole === "admin" && selectedLocation) {
      fetchData();
    }
  }, [user, userRole, selectedLocation]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch requests, found items, and stats in parallel
      const [requestsRes, itemsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/requests`, { headers }), // Fetch all requests
        fetch(`/api/admin/lost/items`, { headers }), // Fetch all inventory items
        fetch(`/api/admin/stats?locationId=${selectedLocation}`, { headers }),
      ]);

      const [requestsData, itemsData, statsData] = await Promise.all([
        requestsRes.json(),
        itemsRes.json(),
        statsRes.json(),
      ]);

      setRequests(requestsData.requests || []);
      setFoundItems(itemsData.items || []);
      setStats(statsData.stats || {});
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/requests/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        fetchData(); // Refresh data
      } else {
        alert("Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Error approving request");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/requests/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        fetchData(); // Refresh data
      } else {
        alert("Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Error rejecting request");
    }
  };

  const handleUpdateItemStatus = async (itemId: string, status: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/lost/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId, status }),
      });

      if (res.ok) {
        fetchData(); // Refresh data
      } else {
        alert("Failed to update item status");
      }
    } catch (error) {
      console.error("Error updating item status:", error);
      alert("Error updating item status");
    }
  };

  // Show loading during auth check or while fetching data
  if (
    authLoading ||
    !user ||
    userRole !== "admin" ||
    (user && userRole === "admin" && loading)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {/* Spinner */}
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-border border-t-utaOrange"></div>
            {/* Inner pulse effect */}
            <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 border-4 border-utaOrange/20"></div>
          </div>
          <p className="text-sm text-muted font-medium animate-pulse">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5">
        <div className="container-custom py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-xl md:text-2xl font-display font-bold tracking-tight hover:text-utaOrange transition-colors"
          >
            MavFind
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <Link
                href="/inventory"
                className="text-sm font-medium text-muted hover:text-fg transition-colors"
              >
                Browse Items
              </Link>
              <Link
                href="/dashboard/admin"
                className="text-sm font-medium text-fg"
              >
                Admin Panel
              </Link>
            </nav>
            <div className="flex items-center gap-3 pl-6 border-l border-border">
              <span className="text-xs text-muted">{user?.email}</span>
              <span className="text-xs bg-utaOrange text-white px-2.5 py-1 rounded-md font-bold">
                ADMIN
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-muted hover:text-fg transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
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
                className="block text-sm font-medium text-muted hover:text-fg transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Items
              </Link>
              <Link
                href="/dashboard/admin"
                className="block text-sm font-medium text-fg py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Panel
              </Link>
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-utaOrange text-white px-2.5 py-1 rounded-md font-bold">
                    ADMIN
                  </span>
                  <span className="text-xs text-muted truncate">
                    {user?.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="w-full text-left text-sm font-medium text-muted hover:text-fg transition-colors py-2 px-3 rounded-lg hover:bg-white/5"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="container-custom pt-24 md:pt-32 pb-20 px-4 md:px-6">
        {/* Page Title & Location */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-2 md:mb-3">
            Admin Dashboard
          </h1>
          <p className="text-base md:text-xl text-muted mb-6 md:mb-8">
            Manage lost & found inventory, review submissions, and help students
            reclaim their belongings.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-muted mb-2">
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="input-base w-full"
              >
                <option value="university_center">University Center</option>
                <option value="central_library">Central Library</option>
              </select>
            </div>
            <button
              onClick={() => setShowAddItemForm(true)}
              className="btn-primary px-6 py-3 rounded-2xl whitespace-nowrap"
            >
              + Add Found Item
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-6 py-3 rounded-2xl font-medium transition-all ${
              activeTab === "requests"
                ? "bg-fg text-bg"
                : "bg-bgElevated text-muted hover:text-fg hover:bg-white/10"
            }`}
          >
            Requests
            <span className="ml-2 opacity-60">({requests.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-6 py-3 rounded-2xl font-medium transition-all ${
              activeTab === "inventory"
                ? "bg-fg text-bg"
                : "bg-bgElevated text-muted hover:text-fg hover:bg-white/10"
            }`}
          >
            Inventory
            <span className="ml-2 opacity-60">({foundItems.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="card-base overflow-hidden">
          {activeTab === "requests" ? (
            <InstantSearch
              searchClient={searchClient}
              indexName={
                process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME_REQUEST ||
                "mavfind_lost_items_requests"
              }
            >
              <div className="p-6 space-y-6">
                {/* Search Header */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">Search Requests</h3>
                    <p className="text-sm text-muted">
                      Find and manage lost item requests with powerful search
                      and filters
                    </p>
                  </div>
                </div>

                {/* Enhanced Search Box */}
                <div className="relative group">
                  <SearchBox
                    placeholder="Search by title, description, category, color, brand..."
                    classNames={{
                      root: "w-full",
                      form: "relative",
                      input:
                        "input-base w-full pl-14 pr-12 py-4 text-lg rounded-2xl border-2 border-border hover:border-utaOrange/30 focus:border-utaOrange transition-all shadow-lg",
                      submit:
                        "absolute left-5 top-1/2 -translate-y-1/2 text-muted group-hover:text-utaOrange transition-colors",
                      reset:
                        "absolute right-5 top-1/2 -translate-y-1/2 text-muted hover:text-utaOrange transition-colors",
                      loadingIndicator:
                        "absolute right-5 top-1/2 -translate-y-1/2",
                    }}
                  />
                  <div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-b from-utaOrange/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity rounded-b-2xl"></div>
                </div>

                {/* Enhanced Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-bgElevated rounded-2xl border border-border">
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-3">
                      Category
                    </label>
                    <RefinementList
                      attribute="category"
                      limit={10}
                      showMore={true}
                      classNames={{
                        root: "space-y-2",
                        list: "space-y-2",
                        item: "flex items-center gap-2 text-sm",
                        label:
                          "flex items-center gap-2 cursor-pointer hover:text-utaOrange transition-colors w-full",
                        checkbox:
                          "w-4 h-4 rounded border-2 border-border checked:bg-utaOrange checked:border-utaOrange",
                        count:
                          "ml-auto text-xs px-2 py-0.5 rounded-full bg-bgElevated text-muted font-medium",
                        showMore: "text-xs text-utaOrange hover:underline mt-2",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-3">
                      Lost/Found
                    </label>
                    <RefinementList
                      attribute="lostOrFound"
                      classNames={{
                        root: "space-y-2",
                        list: "space-y-2",
                        item: "flex items-center gap-2 text-sm",
                        label:
                          "flex items-center gap-2 cursor-pointer hover:text-utaOrange transition-colors w-full",
                        checkbox:
                          "w-4 h-4 rounded border-2 border-border checked:bg-utaOrange checked:border-utaOrange",
                        count:
                          "ml-auto text-xs px-2 py-0.5 rounded-full bg-bgElevated text-muted font-medium",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-3">
                      Status
                    </label>
                    <RefinementList
                      attribute="status"
                      classNames={{
                        root: "space-y-2",
                        list: "space-y-2",
                        item: "flex items-center gap-2 text-sm",
                        label:
                          "flex items-center gap-2 cursor-pointer hover:text-utaOrange transition-colors w-full",
                        checkbox:
                          "w-4 h-4 rounded border-2 border-border checked:bg-utaOrange checked:border-utaOrange",
                        count:
                          "ml-auto text-xs px-2 py-0.5 rounded-full bg-bgElevated text-muted font-medium",
                      }}
                    />
                  </div>

                  <div className="flex flex-col justify-between">
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-3">
                      Actions
                    </label>
                    <ClearRefinements
                      classNames={{
                        root: "w-full",
                        button:
                          "btn-secondary w-full py-2.5 rounded-xl text-sm font-semibold hover:bg-utaOrange hover:text-white transition-all",
                        disabledButton: "opacity-50 cursor-not-allowed",
                      }}
                      translations={{
                        resetButtonText: "Clear Filters",
                      }}
                    />
                  </div>
                </div>
              </div>

              <Configure hitsPerPage={50} />

              {/* Results - Card Grid */}
              <div className="p-6 pt-0">
                <Hits
                  hitComponent={({ hit }) => (
                    <RequestHitComponent
                      hit={hit}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onImageClick={openImageModal}
                    />
                  )}
                  classNames={{
                    root: "",
                    list: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
                    item: "",
                  }}
                />
              </div>
            </InstantSearch>
          ) : (
            <InstantSearch
              searchClient={searchClient}
              indexName={
                process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME_INVENTORY ||
                "mavfind_lost_items"
              }
            >
              <div className="p-6 space-y-6">
                {/* Search Header */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">
                      Search Inventory
                    </h3>
                    <p className="text-sm text-muted">
                      Find and manage found items with powerful search and
                      filters
                    </p>
                  </div>
                </div>

                {/* Enhanced Search Box */}
                <div className="relative group">
                  <SearchBox
                    placeholder="Search by title, description, category, color, brand..."
                    classNames={{
                      root: "w-full",
                      form: "relative",
                      input:
                        "input-base w-full pl-14 pr-12 py-4 text-lg rounded-2xl border-2 border-border hover:border-utaOrange/30 focus:border-utaOrange transition-all shadow-lg",
                      submit:
                        "absolute left-5 top-1/2 -translate-y-1/2 text-muted group-hover:text-utaOrange transition-colors",
                      reset:
                        "absolute right-5 top-1/2 -translate-y-1/2 text-muted hover:text-utaOrange transition-colors",
                      loadingIndicator:
                        "absolute right-5 top-1/2 -translate-y-1/2",
                    }}
                  />
                  <div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-b from-utaOrange/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity rounded-b-2xl"></div>
                </div>

                {/* Enhanced Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-bgElevated rounded-2xl border border-border">
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-3">
                      Category
                    </label>
                    <RefinementList
                      attribute="category"
                      limit={10}
                      showMore={true}
                      classNames={{
                        root: "space-y-2",
                        list: "space-y-2",
                        item: "flex items-center gap-2 text-sm",
                        label:
                          "flex items-center gap-2 cursor-pointer hover:text-utaOrange transition-colors w-full",
                        checkbox:
                          "w-4 h-4 rounded border-2 border-border checked:bg-utaOrange checked:border-utaOrange",
                        count:
                          "ml-auto text-xs px-2 py-0.5 rounded-full bg-bgElevated text-muted font-medium",
                        showMore: "text-xs text-utaOrange hover:underline mt-2",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-3">
                      Lost/Found
                    </label>
                    <RefinementList
                      attribute="lostOrFound"
                      classNames={{
                        root: "space-y-2",
                        list: "space-y-2",
                        item: "flex items-center gap-2 text-sm",
                        label:
                          "flex items-center gap-2 cursor-pointer hover:text-utaOrange transition-colors w-full",
                        checkbox:
                          "w-4 h-4 rounded border-2 border-border checked:bg-utaOrange checked:border-utaOrange",
                        count:
                          "ml-auto text-xs px-2 py-0.5 rounded-full bg-bgElevated text-muted font-medium",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-3">
                      Location
                    </label>
                    <RefinementList
                      attribute="locationId"
                      classNames={{
                        root: "space-y-2",
                        list: "space-y-2",
                        item: "flex items-center gap-2 text-sm",
                        label:
                          "flex items-center gap-2 cursor-pointer hover:text-utaOrange transition-colors w-full",
                        checkbox:
                          "w-4 h-4 rounded border-2 border-border checked:bg-utaOrange checked:border-utaOrange",
                        count:
                          "ml-auto text-xs px-2 py-0.5 rounded-full bg-bgElevated text-muted font-medium",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-3">
                      Status
                    </label>
                    <RefinementList
                      attribute="status"
                      classNames={{
                        root: "space-y-2",
                        list: "space-y-2",
                        item: "flex items-center gap-2 text-sm",
                        label:
                          "flex items-center gap-2 cursor-pointer hover:text-utaOrange transition-colors w-full",
                        checkbox:
                          "w-4 h-4 rounded border-2 border-border checked:bg-utaOrange checked:border-utaOrange",
                        count:
                          "ml-auto text-xs px-2 py-0.5 rounded-full bg-bgElevated text-muted font-medium",
                      }}
                    />
                  </div>

                  <div className="flex flex-col justify-between">
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-3">
                      Actions
                    </label>
                    <ClearRefinements
                      classNames={{
                        root: "w-full",
                        button:
                          "btn-secondary w-full py-2.5 rounded-xl text-sm font-semibold hover:bg-utaOrange hover:text-white transition-all",
                        disabledButton: "opacity-50 cursor-not-allowed",
                      }}
                      translations={{
                        resetButtonText: "Clear Filters",
                      }}
                    />
                  </div>
                </div>
              </div>

              <Configure hitsPerPage={50} />

              {/* Results - Card Grid */}
              <div className="p-6 pt-0">
                <Hits
                  hitComponent={({ hit }) => (
                    <InventoryHitComponent
                      hit={hit}
                      onUpdateStatus={handleUpdateItemStatus}
                      onImageClick={openImageModal}
                    />
                  )}
                  classNames={{
                    root: "",
                    list: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
                    item: "",
                  }}
                />
              </div>
            </InstantSearch>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && (
        <ImageModal
          images={modalImages}
          currentIndex={currentImageIndex}
          onClose={closeImageModal}
          onNext={nextImage}
          onPrev={prevImage}
        />
      )}

      {/* Add Item Form Modal */}
      {showAddItemForm && (
        <AddFoundItemForm
          selectedLocation={selectedLocation}
          onClose={() => setShowAddItemForm(false)}
          onSuccess={() => {
            setShowAddItemForm(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// Hit components for Algolia search - Card format
function RequestHitComponent({
  hit,
  onApprove,
  onReject,
  onImageClick,
}: {
  hit: any;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onImageClick: (images: string[], index: number) => void;
}) {
  const images = hit.images || [];
  const firstImage = images.length > 0 ? images[0] : null;
  const description = hit.genericDescription || "";
  const truncatedDesc =
    description.length > 100
      ? description.substring(0, 100) + "..."
      : description;
  const timeAgo = getTimeAgo(hit.createdAt);

  return (
    <div className="card-base overflow-hidden hover-lift group">
      {/* Image */}
      <div
        className="relative w-full h-36 bg-bgElevated overflow-hidden cursor-pointer"
        onClick={() => images.length > 0 && onImageClick(images, 0)}
      >
        {firstImage ? (
          <img
            src={firstImage}
            alt={hit.title || "Request image"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center border-b border-border">
            <svg
              className="w-12 h-12 text-muted/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {/* Status Badge & Image Count */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <StatusBadge status={hit.status} />
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {images.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <div>
          <label className="text-[10px] uppercase tracking-wider font-bold text-muted/70 mb-0.5 block">
            Title
          </label>
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
            {hit.title || "Untitled Request"}
          </h3>
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] uppercase tracking-wider font-bold text-muted/70 mb-0.5 block">
            Description
          </label>
          <p className="text-xs text-muted line-clamp-2 min-h-[2.25rem]">
            {truncatedDesc || "No description"}
          </p>
        </div>

        {/* Category & Time */}
        <div className="pt-2 border-t border-border space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted/70">
              Category
            </label>
            <span className="text-xs px-2 py-0.5 rounded-md bg-utaOrange/10 text-utaOrange font-semibold capitalize">
              {hit.category || hit.attributes?.category || "Unknown"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted/70">
              Added
            </label>
            <span className="text-xs text-muted font-medium">{timeAgo}</span>
          </div>
        </div>

        {/* Actions */}
        {hit.status === "submitted" && (
          <div className="flex gap-1.5 pt-2">
            <button
              onClick={() => onApprove(hit.objectID)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white font-semibold transition-all text-xs"
            >
              Approve
            </button>
            <button
              onClick={() => onReject(hit.objectID)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white font-semibold transition-all text-xs"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryHitComponent({
  hit,
  onUpdateStatus,
  onImageClick,
}: {
  hit: any;
  onUpdateStatus: (id: string, status: string) => void;
  onImageClick: (images: string[], index: number) => void;
}) {
  const images = hit.images || [];
  const firstImage = images.length > 0 ? images[0] : null;
  const description = hit.genericDescription || "";
  const truncatedDesc =
    description.length > 100
      ? description.substring(0, 100) + "..."
      : description;
  const timeAgo = getTimeAgo(hit.createdAt);

  return (
    <div className="card-base overflow-hidden hover-lift group">
      {/* Image */}
      <div
        className="relative w-full h-36 bg-bgElevated overflow-hidden cursor-pointer"
        onClick={() => images.length > 0 && onImageClick(images, 0)}
      >
        {firstImage ? (
          <img
            src={firstImage}
            alt={hit.title || "Item image"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center border-b border-border">
            <svg
              className="w-12 h-12 text-muted/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {/* Status Badge & Image Count */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <ItemStatusBadge status={hit.status} />
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {images.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <div>
          <label className="text-[10px] uppercase tracking-wider font-bold text-muted/70 mb-0.5 block">
            Title
          </label>
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
            {hit.title || "Untitled Item"}
          </h3>
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] uppercase tracking-wider font-bold text-muted/70 mb-0.5 block">
            Description
          </label>
          <p className="text-xs text-muted line-clamp-2 min-h-[2.25rem]">
            {truncatedDesc || "No description"}
          </p>
        </div>

        {/* Category & Time */}
        <div className="pt-2 border-t border-border space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted/70">
              Category
            </label>
            <span className="text-xs px-2 py-0.5 rounded-md bg-utaOrange/10 text-utaOrange font-semibold capitalize">
              {hit.category || hit.attributes?.category || "Unknown"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted/70">
              Added
            </label>
            <span className="text-xs text-muted font-medium">{timeAgo}</span>
          </div>
        </div>

        {/* Status Update */}
        <div className="pt-2">
          <label className="text-[10px] uppercase tracking-wider font-bold text-muted/70 mb-1.5 block">
            Status
          </label>
          <select
            value={hit.status}
            onChange={(e) => onUpdateStatus(hit.objectID, e.target.value)}
            className="input-base w-full py-1.5 px-3 text-xs font-medium"
          >
            <option value="found">Found</option>
            <option value="claimed">Claimed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: any = {
    submitted: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    under_review: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    approved: "bg-green-500/10 text-green-600 border-green-500/20",
    rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
        variants[status] || "bg-white/10 text-muted border-white/10"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function ItemStatusBadge({ status }: { status: string }) {
  const variants: any = {
    found: "bg-green-500/10 text-green-600 border-green-500/20",
    claimed: "bg-utaOrange/10 text-utaOrange border-utaOrange/20",
    archived: "bg-white/10 text-muted border-white/10",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
        variants[status] || "bg-white/10 text-muted border-white/10"
      }`}
    >
      {status}
    </span>
  );
}

// Image Modal Component
function ImageModal({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Arrow key navigation
  useEffect(() => {
    const handleArrow = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleArrow);
    return () => window.removeEventListener("keydown", handleArrow);
  }, [onNext, onPrev]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[110] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
        aria-label="Close"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-semibold">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Previous Button */}
      {images.length > 1 && (
        <button
          onClick={onPrev}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-[110] p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 hidden md:flex items-center justify-center"
          aria-label="Previous image"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Next Button */}
      {images.length > 1 && (
        <button
          onClick={onNext}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-[110] p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 hidden md:flex items-center justify-center"
          aria-label="Next image"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Image Container */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 md:p-8"
        onClick={onClose}
      >
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Mobile Navigation Buttons */}
      {images.length > 1 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] flex gap-3 md:hidden">
          <button
            onClick={onPrev}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            aria-label="Previous image"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={onNext}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            aria-label="Next image"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Thumbnails (optional, for more than 2 images) */}
      {images.length > 2 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] hidden md:flex gap-2 max-w-xl overflow-x-auto p-2 rounded-xl bg-black/50 backdrop-blur-md">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                const diff = idx - currentIndex;
                if (diff > 0) {
                  for (let i = 0; i < diff; i++) onNext();
                } else if (diff < 0) {
                  for (let i = 0; i < Math.abs(diff); i++) onPrev();
                }
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? "border-utaOrange scale-110"
                  : "border-white/20 hover:border-white/40 opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddFoundItemForm({
  selectedLocation,
  onClose,
  onSuccess,
}: {
  selectedLocation: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [location, setLocation] = useState(selectedLocation);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);

      // Process each file, converting HEIC to JPEG if needed
      for (const file of filesArray) {
        let processedFile = file;

        // Check if file is HEIC/HEIF and convert to JPEG
        if (
          file.type === "image/heic" ||
          file.type === "image/heif" ||
          file.name.toLowerCase().endsWith(".heic") ||
          file.name.toLowerCase().endsWith(".heif")
        ) {
          try {
            const heic2any = (await import("heic2any")).default;
            const convertedBlob = await heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: 0.9,
            });

            const blob = Array.isArray(convertedBlob)
              ? convertedBlob[0]
              : convertedBlob;
            processedFile = new File(
              [blob],
              file.name.replace(/\.heic$/i, ".jpg"),
              {
                type: "image/jpeg",
              }
            );
          } catch (error) {
            console.error("Error converting HEIC:", error);
            alert(
              "Error converting HEIC image. Please try a different format."
            );
            continue;
          }
        }

        setImages((prev) => [...prev, processedFile]);

        // Generate preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(processedFile);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            setDescription((prev) => {
              const separator = prev ? " " : "";
              return prev + separator + data.text;
            });
          } else {
            alert("Failed to transcribe audio");
          }
        } catch (error) {
          console.error("Transcription error:", error);
          alert("Error transcribing audio");
        } finally {
          setIsTranscribing(false);
        }

        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);

      (window as any).currentRecorder = mediaRecorder;

      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 30000);
    } catch (error) {
      console.error("Microphone access denied:", error);
      alert("Microphone access required for voice input");
    }
  };

  const stopRecording = () => {
    const recorder = (window as any).currentRecorder;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
    setIsRecording(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = await user?.getIdToken();
      const formData = new FormData();
      formData.append("locationId", location);
      formData.append("description", description);
      images.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/admin/lost", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        onSuccess();
      } else {
        alert("Error adding found item");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error adding found item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card-base max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto relative shadow-2xl">
        {/* Loading Overlay */}
        {submitting && (
          <div className="absolute inset-0 bg-bg/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-utaOrange border-t-transparent mx-auto mb-6"></div>
              <h3 className="text-xl font-bold mb-2">Processing item...</h3>
              <p className="text-sm text-muted max-w-sm">
                We're analyzing your submission with AI to categorize and match
                the item.
              </p>
            </div>
          </div>
        )}

        <h2 className="text-3xl font-bold mb-6 tracking-tight">
          Add Found Item
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-muted mb-3">
              Office Location <span className="text-utaOrange">*</span>
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="input-base w-full"
            >
              <option value="university_center">University Center</option>
              <option value="central_library">Central Library</option>
            </select>
            <p className="text-xs text-muted mt-2">
              Select the office where this item is currently stored
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-3">
              Description <span className="text-utaOrange">*</span>
            </label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="input-base w-full pr-14"
                placeholder="Describe the found item in detail..."
                disabled={isRecording}
              />
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`absolute right-3 top-3 p-3 rounded-xl transition-all duration-300 ${
                  isRecording
                    ? "bg-red-500 text-white scale-110 shadow-lg shadow-red-500/50"
                    : "bg-bgElevated hover:bg-utaOrange/20 text-muted hover:text-fg hover:scale-105"
                }`}
                title={isRecording ? "Stop recording" : "Record description"}
              >
                {isRecording ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>

            {isRecording && (
              <div className="mt-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </div>
                    <span className="text-sm text-red-400 font-medium">
                      Recording...
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors underline"
                  >
                    Stop
                  </button>
                </div>
                <div className="flex items-center justify-center gap-1 h-12">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.05}s`,
                        animationDuration: `${0.5 + Math.random() * 0.5}s`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-center text-muted mt-2">
                  Speak clearly into your microphone
                </p>
              </div>
            )}

            {isTranscribing && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                  <span className="text-sm text-blue-400 font-medium">
                    Transcribing audio...
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-3">
              Images (optional)
            </label>

            <div className="relative">
              <input
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={handleImageChange}
                id="admin-image-upload"
                className="hidden"
              />
              <label
                htmlFor="admin-image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border hover:border-utaOrange/50 rounded-xl cursor-pointer transition-all hover:bg-bgElevated group"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <svg
                    className="w-10 h-10 text-muted group-hover:text-utaOrange transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted group-hover:text-fg transition-colors">
                      Click to upload images
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Supports JPG, PNG, HEIC, HEIF
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted">
                    {imagePreviews.length}{" "}
                    {imagePreviews.length === 1 ? "image" : "images"} selected
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setImages([]);
                      setImagePreviews([]);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <ImageWithLoader
                      key={index}
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      onRemove={() => removeImage(index)}
                      showRemoveButton={true}
                      label={`Image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-primary py-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Adding..." : "Add to Inventory"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary py-3 rounded-2xl"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
